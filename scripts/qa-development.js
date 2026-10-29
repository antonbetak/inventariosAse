// Explicit integration checks: development only. Fixtures remain classified as tests.
import assert from 'node:assert/strict';
import {database} from '../server/db.js';
import {snapshot,mutateInventory,recipe} from '../server/inventory.js';
import {saveCommercialData} from '../server/commercial-data.js';
import {reportsService} from '../src/services/reportsService.js';
try{process.loadEnvFile('.env.local');}catch{/* environment */}
if(process.env.DATABASE_BRANCH!=='development'||new URL(process.env.DATABASE_URL).hostname!==process.env.EXPECTED_DATABASE_HOST)throw Error('Development guard failed');
const db=database();const results=[];const pass=name=>results.push(name);
try{
 const user=(await db.query('SELECT id,rol FROM app_user WHERE activo AND rol=$1 LIMIT 1',['admin'])).rows[0];assert.ok(user);
 const initial=await snapshot();const baseline=await reportsService.getSummary(initial);
 const suffix=Date.now();
 const raw=await mutateInventory('raw',null,'save',{nombre:`QA_COMERCIAL_INSUMO_${suffix}`,categoria:'Validación',stock_actual:10,stock_minimo:0,costo_unidad:'',unidad_medida:'pzas',es_prueba:true},user);
 let s=await snapshot();assert.ok(s.rawMaterials.find(r=>r.id===raw.id).costo_pendiente);assert.equal(s.rawMaterials.find(r=>r.id===raw.id).costo_unidad,null);pass('Costo vacío se conserva desconocido');
 const product=await mutateInventory('product',null,'save',{nombre:`QA_COMERCIAL_PRODUCTO_${suffix}`,categoria:'Validación',cantidad:0,precioVenta:7,unidad:'unidades',es_prueba:true},user);
 await mutateInventory('product',product.id,'production',{quantity:1,insumos:[{id:raw.id,cantidadUsada:2}]},user);
 s=await snapshot();assert.equal(s.rawMaterials.find(r=>r.id===raw.id).stock_actual,8);assert.equal(s.finishedProducts.find(r=>r.id===product.id).cantidad,1);pass('Producción descuenta consumo real y clasifica movimientos');
 const unchanged=async()=>{const r=await db.query('SELECT (SELECT count(*) FROM movimiento) m,(SELECT count(*) FROM produccion) p,(SELECT count(*) FROM produccion_insumo) pi,(SELECT count(*) FROM venta) v');return JSON.stringify(r.rows);};
 const before=await unchanged();await assert.rejects(mutateInventory('product',product.id,'production',{quantity:1,insumos:[{id:raw.id,cantidadUsada:999999}]},user),/insuficiente/);assert.equal(await unchanged(),before);assert.equal((await snapshot()).rawMaterials.find(r=>r.id===raw.id).stock_actual,8);pass('Rollback completo ante consumo insuficiente');
 const concurrent=await Promise.allSettled([mutateInventory('product',product.id,'sale',{unidades:1},user),mutateInventory('product',product.id,'sale',{unidades:1},user)]);assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);assert.equal(concurrent.filter(r=>r.status==='rejected').length,1);assert.equal((await snapshot()).finishedProducts.find(r=>r.id===product.id).cantidad,0);pass('Dos ventas concurrentes: una aceptada, sin sobreventa');
 await saveCommercialData({kind:'recipe',id:product.id,insumos:[{id:raw.id,cantidadUsada:2}]},user);assert.equal((await recipe(`QA_COMERCIAL_PRODUCTO_${suffix}`,3))[0].cantidadUsada,6);pass('Receta validada persiste y escala por cantidad');
 await assert.rejects(saveCommercialData({kind:'loss-date',id:1,fecha:'2026-02-30'},user),/fecha real/);pass('Fecha imposible rechazada');
 const pending=initial.finishedProducts.find(p=>p.stock_pendiente);if(pending){await mutateInventory('product',pending.id,'save',{...pending,cantidad:''},user);assert.equal((await snapshot()).finishedProducts.find(p=>p.id===pending.id).stock_pendiente,true);await assert.rejects(mutateInventory('product',pending.id,'sale',{unidades:1},user),/existencias físicas/);pass('Editar sin conteo conserva desconocido y bloquea venta');}
 const final=await reportsService.getSummary(await snapshot());assert.equal(final.sales.operationalTotal,baseline.sales.operationalTotal);assert.equal(final.rawValue,baseline.rawValue);assert.equal(final.productValue,baseline.productValue);assert.equal(final.activity.some(m=>m.es_prueba),false);pass('Pruebas excluidas de ventas, valuación y actividad comerciales');
 await mutateInventory('raw',raw.id,'save',{...(await snapshot()).rawMaterials.find(r=>r.id===raw.id),nombre:`QA_RENOMBRADO_${suffix}`,costo_unidad:''},user);assert.equal((await snapshot()).rawMaterials.find(r=>r.id===raw.id).es_prueba,true);pass('Renombrar conserva clasificación');
 console.log(JSON.stringify({passed:results.length,results},null,2));
}finally{await db.end();}
