import {randomUUID} from 'node:crypto';
import {transaction,captureHistory} from './db.js';
import {numeric,required,validDate,fail} from './security.js';
export async function operationalData(input,user){
 return transaction(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(735241)');
  if(input.kind==='expense'){
   const id=randomUUID();await c.query('INSERT INTO gasto_operativo(id,fecha,concepto,importe,es_prueba,user_id) VALUES($1,$2,$3,$4,$5,$6)',[id,validDate(input.fecha),required(input.concepto,'Concepto',200),numeric(input.importe,'Importe',{positive:true,scale:2}),input.es_prueba===true,user.id]);return {id};
  }
  if(input.kind==='batch-cost'){
   if(user.rol!=='admin')fail('Se requiere administrador.',403);
   const cost=input.costo_adicional==null||input.costo_adicional===''?null:numeric(input.costo_adicional,'Costo adicional');
   const batch=(await c.query('SELECT b.*,p.nombre,p.unidad FROM produccion b JOIN producto p ON p.id=b.producto_id WHERE b.id=$1 FOR UPDATE OF b',[input.id])).rows[0];if(!batch)fail('Lote no encontrado.',404);
   const material=batch.costo_insumos==null?(input.costo_insumos==null||input.costo_insumos===''?null:numeric(input.costo_insumos,'Costo real de insumos')):Number(batch.costo_insumos);
   await c.query('UPDATE produccion SET costo_insumos=$1,costo_adicional=$2 WHERE id=$3',[material,cost,input.id]);
   const description=`Costos documentados de lote ${input.id}: insumos ${batch.costo_insumos??'pendiente'} → ${material??'pendiente'}; adicional ${batch.costo_adicional??'pendiente'} → ${cost??'pendiente'}`;
   await c.query(`INSERT INTO movimiento(id,producto_id,nombre,tipo,entidad,cantidad,unidad,valor,descripcion,user_id,es_prueba,valor_conocido) VALUES($1,$2,$3,'ajuste','producto',0,$4,0,$5,$6,$7,true)`,[randomUUID(),batch.producto_id,batch.nombre,batch.unidad,description,user.id,batch.es_prueba]);return {id:batch.id};
  }
  if(input.kind!=='loss')fail('Operación inválida.');
  const raw=input.entity==='raw';if(!raw&&input.entity!=='product')fail('Selecciona insumo o producto.');
  const id=numeric(input.id,'Registro',{positive:true,integer:true}),q=numeric(input.quantity,'Merma',{positive:true,integer:!raw});
  const date=validDate(input.fecha),reason=required(input.motivo,'Motivo',200);
  const item=(await c.query(raw?'SELECT i.*,p.inventario_actual,u.abreviatura unidad,i.precio_presentacion/i.cantidad_presentacion costo_unidad FROM insumo i JOIN parametro_inventario p ON p.insumo_id=i.id JOIN unidad_medida u ON u.id=i.unidad_id WHERE i.id=$1 AND i.activo FOR UPDATE OF i,p':'SELECT * FROM producto WHERE id=$1 AND activo FOR UPDATE',[id])).rows[0];
  if(!item)fail('Registro no encontrado.',404);
  if(!raw&&!item.stock_confirmado)fail('Confirma el conteo físico antes de registrar merma.');
  if(raw&&item.unidad==='s/d')fail('Valida la unidad antes de registrar merma.');
  if(q>Number(raw?item.inventario_actual:item.cantidad))fail('Stock insuficiente para registrar merma.');
  await c.query(raw?'UPDATE parametro_inventario SET inventario_actual=inventario_actual-$1 WHERE insumo_id=$2':'UPDATE producto SET cantidad=cantidad-$1 WHERE id=$2',[q,id]);
  const mid=randomUUID(),lossId=randomUUID(),known=!raw||(item.costo_unidad!=null&&!item.costo_pendiente);
  await c.query(`INSERT INTO movimiento(id,insumo_id,producto_id,nombre,tipo,entidad,cantidad,unidad,valor,descripcion,user_id,es_prueba,valor_conocido) VALUES($1,$2,$3,$4,'salida',$5,$6,$7,$8,$9,$10,$11,$12)`,[mid,raw?id:null,raw?null:id,item.nombre,raw?'materia':'producto',q,item.unidad,q*Number(raw?item.costo_unidad??0:item.precio_venta),`Merma: ${reason}`,user.id,item.es_prueba,known]);
  await c.query('INSERT INTO merma_operativa(id,movimiento_id,fecha,motivo,user_id) VALUES($1,$2,$3,$4,$5)',[lossId,mid,date,reason,user.id]);await captureHistory(c);return {id:lossId};
 });
}
