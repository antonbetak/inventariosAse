import {readFile} from 'node:fs/promises';
import {database,transaction} from '../server/db.js';
try{process.loadEnvFile('.env.local');}catch{/* CI environment */}
if(process.env.DATABASE_BRANCH!=='development'||new URL(process.env.DATABASE_URL).hostname!==process.env.EXPECTED_DATABASE_HOST)throw new Error('Importación bloqueada: solo development en el host validado.');
const data=JSON.parse(await readFile(process.argv[2],'utf8'));
const importId=`excel-${data.hash}-${data.anio}`;
try{
 const result=await transaction(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(735241)');
  if((await c.query('SELECT id FROM importacion WHERE id=$1',[importId])).rowCount)return 'Este archivo y año ya fueron importados. Sin cambios.';
  // Never overwrite stock or business data on a subsequent import of a changed source workbook.
  if((await c.query('SELECT id FROM importacion LIMIT 1')).rowCount)throw new Error('Ya existe una importación diferente. Requiere conciliación explícita.');
  await c.query('INSERT INTO importacion(id,archivo_hash,anio) VALUES($1,$2,$3)',[importId,data.hash,data.anio]);
  const unit=(await c.query("INSERT INTO unidad_medida(nombre,abreviatura) VALUES('Unidad pendiente de validar','s/d') RETURNING id")).rows[0].id;
  const ids=new Map();
  for(const i of data.insumos){const id=(await c.query('INSERT INTO insumo(nombre,unidad_id,consumo_prom,periodo_consumo) VALUES($1,$2,$3,\'diario\') RETURNING id',[i.nombre,unit,i.demanda])).rows[0].id;ids.set(i.nombre,id);await c.query('INSERT INTO parametro_inventario(insumo_id,demanda_diaria,tiempo_entrega_dias,nivel_servicio,pct_desv_demanda,tiempo_revision_dias,inventario_actual) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,i.demanda,i.entrega,i.nivel,i.desv,i.revision,i.stock]);}
  for(const m of data.mermas)await c.query('INSERT INTO merma_registro(insumo_id,cantidad_inicial,cantidad_final,periodo_fuente,importacion_id) VALUES($1,$2,$3,$4,$5)',[ids.get(m.nombre),m.inicial,m.final,'Hoja2 filas 48–49, sin fecha',importId]);
  const products=new Map();
  for(const p of data.productos){const id=(await c.query('INSERT INTO producto(nombre,litros_unidad,precio_venta) VALUES($1,$2,$3) RETURNING id',[p.nombre,p.litros,p.precio])).rows[0].id;products.set(p.nombre,id);}
  for(const s of data.ventas)await c.query('INSERT INTO venta_mensual(producto_id,anio,mes,unidades,precio_unitario,ingreso,importacion_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[products.get(s.nombre),data.anio,s.mes,s.unidades,s.precio,s.ingreso,importId]);
  for(const p of data.proyecciones)await c.query('INSERT INTO proyeccion_semanal VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[data.anio,p.semana,p.garrafon,p.botella1,p.botella500,p.agua_neta,p.agua_disponible,p.agua_con_merma,p.litros_extra,p.litros_merma,p.costo_merma,p.yield_pct,importId]);
  for(const cell of data.celdas)await c.query('INSERT INTO fuente_celda VALUES($1,$2,$3,$4,$5)',[importId,cell.hoja,cell.celda,cell.valor,cell.formula]);
  const totals=(await c.query('SELECT sum(ingreso)::text total FROM venta_mensual WHERE importacion_id=$1',[importId])).rows[0];
  if(Number(totals.total)!==Number(data.resumen.ingresos))throw new Error('No concilia el importe de ventas. Se revierte la importación.');
  return {importId,total:totals.total,insumos:ids.size,ventas:data.ventas.length,proyecciones:data.proyecciones.length};
 });console.log(result);
}finally{await database().end();}
