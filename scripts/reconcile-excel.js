// Explicit reconciliation of an existing database. Does not reimport sales,
// projections, loss samples, or test records. Defaults to a read-only preview.
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {database,transaction,captureHistory} from '../server/db.js';
import {numeric} from '../server/security.js';
try {process.loadEnvFile('.env.local');} catch {/* Host-provided environment. */}
if(process.env.DATABASE_BRANCH!=='development'||new URL(process.env.DATABASE_URL).hostname!==process.env.EXPECTED_DATABASE_HOST)throw Error('Host y rama no coinciden.');
const input=JSON.parse(await readFile(process.argv[2],'utf8'));
const apply=process.argv.includes('--apply');
if(!input.id||!/^[a-f0-9]{64}$/.test(input.hash)||!input.criterio||!input.insumos?.length)throw Error('Conciliación incompleta.');
try {
  const result=await transaction(async c=>{
    if(!apply)await c.query('SET TRANSACTION READ ONLY');
    else await c.query('SELECT pg_advisory_xact_lock(735241)');
    if((await c.query('SELECT id FROM conciliacion_excel WHERE id=$1',[input.id])).rowCount)return {sinCambios:true};
    const before={insumos:[],productos:[]},after={insumos:[],productos:[]};
    const admin=(await c.query("SELECT id FROM app_user WHERE activo AND rol='admin' ORDER BY email LIMIT 1")).rows[0];
    if(!admin)throw Error('Falta administrador para registrar ajustes.');
    for(const item of input.insumos){
      const old=(await c.query(`SELECT i.*,u.abreviatura unidad,p.inventario_actual,p.stock_minimo_manual FROM insumo i JOIN parametro_inventario p ON p.insumo_id=i.id JOIN unidad_medida u ON u.id=i.unidad_id WHERE i.nombre=$1 AND i.activo AND NOT i.es_prueba ${apply?'FOR UPDATE OF i,p':''}`,[item.nombre])).rows;
      if(old.length!==1)throw Error(`Insumo no único: ${item.nombre}`);
      const row=old[0];before.insumos.push(row);
      if(Number(row.inventario_actual)!==Number(item.stock_esperado))throw Error(`Stock cambió desde la revisión: ${item.nombre}`);
      const qty=numeric(item.stock_actual,'Stock'),minimum=numeric(item.stock_seguridad,'Seguridad'),price=numeric(item.precio_presentacion,'Precio',{scale:2}),size=numeric(item.cantidad_presentacion,'Presentación',{positive:true});
      const next={id:row.id,nombre:row.nombre,stock_actual:qty,stock_seguridad:minimum,precio_presentacion:price,cantidad_presentacion:size,unidad:item.unidad,fuente:item.fuente};after.insumos.push(next);
      if(!apply)continue;
      const unit=(await c.query('INSERT INTO unidad_medida(nombre,abreviatura) VALUES($1,$1) ON CONFLICT(nombre) DO UPDATE SET nombre=excluded.nombre RETURNING id',[item.unidad])).rows[0];
      await c.query('UPDATE insumo SET precio_presentacion=$1,cantidad_presentacion=$2,unidad_id=$3,costo_pendiente=false,descripcion=$4 WHERE id=$5',[price,size,unit.id,item.descripcion,row.id]);
      await c.query('UPDATE parametro_inventario SET inventario_actual=$1,stock_minimo_manual=$2 WHERE insumo_id=$3',[qty,minimum,row.id]);
      if(qty!==Number(row.inventario_actual))await c.query("INSERT INTO movimiento(id,insumo_id,nombre,tipo,entidad,cantidad,unidad,valor,descripcion,user_id,es_prueba,valor_conocido) VALUES($1,$2,$3,'ajuste','materia',$4,$5,$6,$7,$8,false,true)",[randomUUID(),row.id,row.nombre,qty-Number(row.inventario_actual),item.unidad,(qty-Number(row.inventario_actual))*price/size,'Conciliación de existencias con Excel y usuario',admin.id]);
    }
    for(const item of input.productos??[]){
      const rows=(await c.query(`SELECT * FROM producto WHERE nombre=$1 AND activo AND NOT es_prueba ${apply?'FOR UPDATE':''}`,[item.nombre])).rows;
      if(rows.length!==1)throw Error(`Producto no único: ${item.nombre}`);
      const row=rows[0];before.productos.push(row);
      if(Number(row.cantidad)!==Number(item.stock_esperado))throw Error(`Stock cambió: ${item.nombre}`);
      const qty=numeric(item.cantidad,'Existencias de producto',{integer:true});after.productos.push({id:row.id,nombre:row.nombre,cantidad:qty,stock_confirmado:true});
      if(apply){await c.query('UPDATE producto SET cantidad=$1,stock_confirmado=true WHERE id=$2',[qty,row.id]);await c.query("INSERT INTO movimiento(id,producto_id,nombre,tipo,entidad,cantidad,unidad,valor,descripcion,user_id,es_prueba,valor_conocido) VALUES($1,$2,$3,'ajuste','producto',$4,$5,$6,'Conteo inicial confirmado por el usuario',$7,false,true)",[randomUUID(),row.id,row.nombre,qty-Number(row.cantidad),row.unidad,(qty-Number(row.cantidad))*Number(row.precio_venta),admin.id]);}
    }
    if(apply){await c.query('INSERT INTO conciliacion_excel(id,archivo_hash,criterio,antes,despues) VALUES($1,$2,$3,$4,$5)',[input.id,input.hash,input.criterio,JSON.stringify(before),JSON.stringify(after)]);await captureHistory(c);}
    return {aplicado:apply,insumos:after.insumos.length,productos:after.productos.length,detalle:after};
  });
  console.log(JSON.stringify(result));
}finally{await database().end();}
