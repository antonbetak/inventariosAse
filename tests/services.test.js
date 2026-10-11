import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../src/services/authService.js';
import { inventoryService } from '../src/services/inventoryService.js';
import { reportsService } from '../src/services/reportsService.js';
import { STORAGE_KEYS } from '../src/services/storage.js';
import { toCSV } from '../src/utils/downloadReport.js';
class MemoryStorage {
 constructor(){this.data=new Map();}
 getItem(key){return this.data.get(key)??null;}
 setItem(key,value){this.data.set(key,String(value));}
 removeItem(key){this.data.delete(key);}
}
beforeEach(()=>{globalThis.localStorage=new MemoryStorage();globalThis.window=new EventTarget();});
const raw={nombre:'Insumo de prueba',categoria:'Ingredientes',stock_actual:10,stock_minimo:2,costo_unidad:5,unidad_medida:'kg'};
const product={nombre:'Producto de prueba',categoria:'Higiene',cantidad:4,stock_minimo:1,precioVenta:20,unidad:'pzas',insumos:[]};
test('mock session accepts both users, persists without password, rejects invalid login and logs out',async()=>{
 assert.equal(await authService.getSession(),null);
 await assert.rejects(authService.login('admin','bad'));
 await authService.login('admin','admin123');assert.equal((await authService.getSession()).email,'admin@sanate.mx');
 assert.ok(!localStorage.getItem(STORAGE_KEYS.session).includes('admin123'));
 await authService.logout();assert.equal(await authService.getSession(),null);
 await authService.login('admin@sanate.mx','admin123');assert.equal((await authService.getSession()).rol,'Administrador');
});
test('central seeds are cloned, persistent, and never duplicated after reads',async()=>{
 const snapshot=await inventoryService.getSnapshot();assert.equal(snapshot.rawMaterials.length,18);assert.equal(snapshot.finishedProducts.length,16);assert.equal(snapshot.history.length,90);
 snapshot.rawMaterials[0].nombre='Changed outside service';assert.notEqual((await inventoryService.getRawMaterials())[0].nombre,snapshot.rawMaterials[0].nombre);
 assert.equal((await inventoryService.getSnapshot()).movements.length,18);
});
test('raw material CRUD and entries persist and emit change notifications',async()=>{
 let events=0;const stop=inventoryService.subscribe(()=>events++);
 const item=await inventoryService.createRawMaterial(raw);
 await inventoryService.updateRawMaterial(item.id,{nombre:'Editado',stock_actual:0,costo_unidad:0});
 await inventoryService.registerRawMaterialEntry(item.id,2.5);
 assert.equal((await inventoryService.getRawMaterials()).find(i=>i.id===item.id).stock_actual,2.5);
 await inventoryService.deleteRawMaterial(item.id);assert.ok(!(await inventoryService.getRawMaterials()).some(i=>i.id===item.id));assert.equal(events,4);stop();
});
test('invalid values are rejected without mutation',async()=>{
 const before=await inventoryService.getSnapshot();
 await assert.rejects(inventoryService.createRawMaterial({...raw,stock_actual:-2}));
 await assert.rejects(inventoryService.createRawMaterial({...raw,nombre:' '}));
 await assert.rejects(inventoryService.registerRawMaterialEntry('raw-1',0));
 await assert.rejects(inventoryService.createFinishedProduct({...product,precioVenta:Infinity}));
 assert.deepEqual(await inventoryService.getSnapshot(),before);
});
test('production checks aggregated usage atomically and never oversells',async()=>{
 const before=await inventoryService.getSnapshot();
 await assert.rejects(inventoryService.createFinishedProduct({...product,insumos:[{id:'raw-1',cantidadUsada:300},{id:'raw-1',cantidadUsada:200}]}),/Stock insuficiente/);
 assert.deepEqual(await inventoryService.getSnapshot(),before);
 const item=await inventoryService.createFinishedProduct({...product,insumos:[{id:'raw-1',cantidadUsada:2},{id:'raw-1',cantidadUsada:3}]});
 assert.equal((await inventoryService.getRawMaterials()).find(i=>i.id==='raw-1').stock_actual,475);
 await inventoryService.updateFinishedProduct(item.id,{cantidad:8,nombre:'Editado'});
 assert.equal((await inventoryService.getFinishedProducts()).find(i=>i.id===item.id).cantidad,8);
 await inventoryService.deleteFinishedProduct(item.id);
 assert.equal((await inventoryService.getRawMaterials()).find(i=>i.id==='raw-1').stock_actual,475);
});
test('automatic recipe resolves from central demo definitions',async()=>{
 const recipe=await inventoryService.getRecipe('Gel antibacterial 500 ml',10);
 assert.equal(recipe.find(i=>i.id==='raw-1').cantidadUsada,3.5);
 await assert.rejects(inventoryService.getRecipe('Unknown',1));
});
test('reports and latest historical sample reflect CRUD changes',async()=>{
 await inventoryService.createRawMaterial(raw);const snapshot=await inventoryService.getSnapshot();const report=await reportsService.getSummary(snapshot);
 assert.equal(report.insumos.length,19);assert.equal(report.totalValue,report.rawValue+report.productValue);
 assert.equal(snapshot.history.at(-1).total,report.totalValue);
 assert.equal((await reportsService.getExportRows(snapshot)).length,19);
});
test('CSV preserves quotes, accents, zeroes, and neutralizes spreadsheet formulas',()=>{
 const csv=toCSV([{Nombre:'Aloe, "premium"',Stock:0,Nota:'=SUM(A1)'}]);
 assert.ok(csv.includes('"Aloe, ""premium"""'));assert.ok(csv.includes('"0"'));assert.ok(csv.includes('"\'=SUM(A1)"'));assert.equal(toCSV([]),'');
});
test('corrupt data is never silently replaced by demo seeds',async()=>{
 localStorage.setItem(STORAGE_KEYS.inventory,'broken');await assert.rejects(inventoryService.getSnapshot(),/no se pueden leer/);assert.equal(localStorage.getItem(STORAGE_KEYS.inventory),'broken');
});
test('storage write failures surface without partially changing persisted inventory',async()=>{
 const before=await inventoryService.getSnapshot();localStorage.setItem=()=>{throw new Error('quota');};
 await assert.rejects(inventoryService.createRawMaterial(raw),/No se pudo guardar/);assert.deepEqual(await inventoryService.getSnapshot(),before);
});
