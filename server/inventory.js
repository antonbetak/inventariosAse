import {randomUUID} from 'node:crypto';
import {database,transaction,captureHistory} from './db.js';
import {numeric,required,fail} from './security.js';
import {productDto} from './product-dto.js';
export async function snapshot() {
  return transaction(async c=>{
    await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const raw=await c.query(`SELECT r.*,i2.es_prueba,i2.proveedor,p2.stock_minimo_manual,coalesce(m.merma,0) merma_mensual FROM inventario_reorden r JOIN insumo i2 ON i2.id=r.id JOIN parametro_inventario p2 ON p2.insumo_id=r.id LEFT JOIN LATERAL (SELECT (cantidad_inicial-cantidad_final)/cantidad_inicial merma FROM merma_registro WHERE insumo_id=r.id ORDER BY fecha DESC NULLS LAST,id DESC LIMIT 1) m ON true WHERE r.activo ORDER BY r.nombre`);
    const products=await c.query(`SELECT p.*,(SELECT min(fecha) FROM movimiento WHERE producto_id=p.id) creado_en,(EXISTS(SELECT 1 FROM venta_mensual WHERE producto_id=p.id) AND NOT EXISTS(SELECT 1 FROM movimiento WHERE producto_id=p.id)) stock_pendiente,coalesce((SELECT json_agg(json_build_object('id',i.id::text,'nombre',i.nombre,'cantidadUsada',pi.cantidad_p_unidad::float8,'unidad',u.abreviatura)) FROM producto_insumo pi JOIN insumo i ON i.id=pi.insumo_id JOIN unidad_medida u ON u.id=i.unidad_id WHERE pi.producto_id=p.id),'[]'::json) insumos FROM producto p WHERE activo ORDER BY nombre`);
    const movements=await c.query(`SELECT es_prueba,id,coalesce(insumo_id,producto_id)::text "registroId",nombre,tipo,entidad,cantidad::float8,unidad,valor::float8,to_char(fecha AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') fecha,descripcion FROM movimiento ORDER BY fecha DESC LIMIT 5000`);
    const history=await c.query(`SELECT fecha::text, materia_prima::float8 "materiaPrima",producto_terminado::float8 "productoTerminado",(materia_prima+producto_terminado)::float8 total FROM historial_valor WHERE alcance_comercial ORDER BY fecha`);
    const sales=await c.query(`SELECT v.id,p.nombre,v.producto_id::text,v.anio,v.mes,v.unidades,v.ingreso::float8 ingreso,v.precio_unitario::float8 precio_unitario,v.importacion_id,false es_prueba,'historico' origen FROM venta_mensual v JOIN producto p ON p.id=v.producto_id`);
    const current=await c.query(`SELECT v.id::text,p.nombre,v.producto_id::text,extract(year FROM v.fecha AT TIME ZONE 'America/Mexico_City')::int anio,extract(month FROM v.fecha AT TIME ZONE 'America/Mexico_City')::int mes,v.unidades,(v.unidades*v.precio_unitario)::float8 ingreso,v.precio_unitario::float8 precio_unitario,v.es_prueba,'operacion' origen FROM venta v JOIN producto p ON p.id=v.producto_id ORDER BY fecha DESC`);
    const losses=await c.query('SELECT m.id,m.insumo_id::text,i.nombre,m.fecha::text,m.periodo_fuente FROM merma_registro m JOIN insumo i ON i.id=m.insumo_id ORDER BY m.id');
    const projections=await c.query('SELECT * FROM proyeccion_semanal ORDER BY anio,semana');
    return {rawMaterials:raw.rows.map(r=>({es_prueba:r.es_prueba,id:String(r.id),nombre:r.nombre,categoria:r.categoria,unidad_medida:r.unidad_medida,stock_actual:Number(r.inventario_actual),stock_minimo:Number(r.stock_minimo_manual??r.stock_seguridad),costo_unidad:r.precio_presentacion==null?null:Number(r.precio_presentacion)/Number(r.cantidad_presentacion),costo_pendiente:r.costo_pendiente,consumo_promedio:Number(r.demanda_diaria),merma_mensual:Number(r.merma_mensual),punto_reorden:Number(r.demanda_diaria)*Number(r.tiempo_entrega_dias)+Number(r.stock_minimo_manual??r.stock_seguridad),pedido_sugerido:Number(r.pedido_sugerido),proveedor:r.proveedor,descripcion:r.descripcion??''})),finishedProducts:products.rows.map(productDto),movements:movements.rows,history:history.rows,sales:[...sales.rows,...current.rows],projections:projections.rows,lossSamples:losses.rows};
  });
}
async function movement(c,user,item,{entity,type,quantity,description}) {
  await c.query(`INSERT INTO movimiento(id,insumo_id,producto_id,nombre,tipo,entidad,cantidad,unidad,valor,descripcion,user_id,es_prueba) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[randomUUID(),entity==='materia'?item.id:null,entity==='producto'?item.id:null,item.nombre,type,entity,quantity,item.unidad??item.unidad_medida??'unidades',quantity*Number(item.precio_venta??item.costo_unidad??0),description,user.id,Boolean(item.es_prueba)]);
}
export async function mutateInventory(kind,id,action,input,user) {
  return transaction(async c=>{
    // Serialize catalog and stock mutations; every stock check and ledger write shares this transaction.
    await c.query("SELECT pg_advisory_xact_lock(735241)");
    const raw=kind==='raw';let item;
    if(id){item=(await c.query(raw?'SELECT i.*,p.inventario_actual,u.abreviatura unidad_medida,i.precio_presentacion/i.cantidad_presentacion costo_unidad FROM insumo i JOIN parametro_inventario p ON p.insumo_id=i.id JOIN unidad_medida u ON u.id=i.unidad_id WHERE i.id=$1 AND activo FOR UPDATE OF i,p':'SELECT * FROM producto WHERE id=$1 AND activo FOR UPDATE',[id])).rows[0];if(!item)fail('El registro no existe.',404);}
    if(!raw&&['sale','production'].includes(action)) {
      const pending=(await c.query('SELECT EXISTS(SELECT 1 FROM venta_mensual WHERE producto_id=$1) AND NOT EXISTS(SELECT 1 FROM movimiento WHERE producto_id=$1) AS pending',[id])).rows[0].pending;
      if(pending)fail('Confirma primero las existencias físicas del producto en Producto terminado. El Excel no indica su stock actual.');
    }
    if(action==='delete') {if(user.rol!=='admin')fail('Se requiere administrador.',403);await c.query(raw?'UPDATE insumo SET activo=false WHERE id=$1':'UPDATE producto SET activo=false WHERE id=$1',[id]);await movement(c,user,item,{entity:raw?'materia':'producto',type:'eliminación',quantity:-Number(raw?item.inventario_actual:item.cantidad),description:'Registro archivado'});}
    else if(action==='entry') {if(item.unidad_medida==='s/d')fail('Valida primero la unidad de medida del insumo.');const q=numeric(input.quantity,'Entrada',{positive:true});await c.query('UPDATE parametro_inventario SET inventario_actual=inventario_actual+$1 WHERE insumo_id=$2',[q,id]);await movement(c,user,item,{entity:'materia',type:'entrada',quantity:q,description:'Entrada de materia prima'});}
    else if(action==='production') {
      const qty=numeric(input.quantity,'Producción',{positive:true,integer:true});
      const used=new Map();for(const i of input.insumos??[]){const q=numeric(i.cantidadUsada,'Insumo',{positive:true});used.set(String(i.id),(used.get(String(i.id))??0)+q);}
      if(!used.size)fail('Registra los insumos reales de la producción.');
      const productionId=randomUUID();await c.query('INSERT INTO produccion(id,producto_id,cantidad,user_id,es_prueba) VALUES($1,$2,$3,$4,$5)',[productionId,id,qty,user.id,Boolean(item?.es_prueba??input.es_prueba===true)]);
      for(const [rawId,q] of [...used].sort()) {
        const r=(await c.query('SELECT i.*,p.inventario_actual,u.abreviatura unidad_medida,i.precio_presentacion/i.cantidad_presentacion costo_unidad FROM insumo i JOIN parametro_inventario p ON p.insumo_id=i.id JOIN unidad_medida u ON u.id=i.unidad_id WHERE i.id=$1 AND activo FOR UPDATE OF p',[rawId])).rows[0];
        if(!r||Number(r.inventario_actual)<q)fail('Stock de insumos insuficiente.');if(Boolean(r.es_prueba)!==Boolean(item?.es_prueba??input.es_prueba===true))fail('Usa insumos y productos del mismo ámbito: comercial o prueba.');if(r.unidad_medida==='s/d')fail('Valida las unidades de los insumos antes de producir.');
        await c.query('UPDATE parametro_inventario SET inventario_actual=inventario_actual-$1 WHERE insumo_id=$2',[q,rawId]);
        await c.query('INSERT INTO produccion_insumo VALUES($1,$2,$3)',[productionId,rawId,q]);
        await movement(c,user,r,{entity:'materia',type:'salida',quantity:q,description:`Producción: ${item.nombre}`});
      }
      await c.query('UPDATE producto SET cantidad=cantidad+$1 WHERE id=$2',[qty,id]);
      await movement(c,user,item,{entity:'producto',type:'entrada',quantity:qty,description:'Producción registrada'});
    }
    else if(action==='sale') {const q=numeric(input.unidades,'Unidades',{positive:true,integer:true});if(q>Number(item.cantidad))fail('Stock insuficiente.');const price=numeric(input.precio_unitario??item.precio_venta,'Precio');await c.query('UPDATE producto SET cantidad=cantidad-$1 WHERE id=$2',[q,id]);await c.query('INSERT INTO venta(id,producto_id,unidades,precio_unitario,fecha,user_id,es_prueba) VALUES($1,$2,$3,$4,now(),$5,$6)',[randomUUID(),id,q,price,user.id,Boolean(item.es_prueba)]);await movement(c,user,{...item,precio_venta:price},{entity:'producto',type:'salida',quantity:q,description:'Venta registrada'});}
    else {
      const name=required(input.nombre,'Nombre',raw?80:50),category=required(input.categoria,'Categoría'),qty=!raw&&item&&(input.cantidad==null||input.cantidad==='')?Number(item.cantidad):numeric(raw?input.stock_actual:input.cantidad,'Existencia'),price=raw&&(input.costo_unidad==null||input.costo_unidad==='')?null:numeric(raw?input.costo_unidad:input.precioVenta,'Precio');
      if(raw){
        const unit=required(input.unidad_medida,'Unidad',10);const u=(await c.query('INSERT INTO unidad_medida(nombre,abreviatura) VALUES($1,$1) ON CONFLICT(nombre) DO UPDATE SET nombre=excluded.nombre RETURNING id',[unit])).rows[0];
        if(id){await c.query('UPDATE insumo SET nombre=$1,categoria=$2,unidad_id=$3,precio_presentacion=$4::numeric*cantidad_presentacion,costo_pendiente=$7,descripcion=$5 WHERE id=$6',[name,category,u.id,price,String(input.descripcion??'').slice(0,200),id,price==null||unit==='s/d']);await c.query('UPDATE parametro_inventario SET inventario_actual=$1,demanda_diaria=$2 WHERE insumo_id=$3',[qty,numeric(input.consumo_promedio??0,'Demanda'),id]);}
        else {id=(await c.query('INSERT INTO insumo(nombre,categoria,unidad_id,precio_presentacion,costo_pendiente) VALUES($1,$2,$3,$4,$5) RETURNING id',[name,category,u.id,price,price==null||unit==='s/d'])).rows[0].id;await c.query('INSERT INTO parametro_inventario(insumo_id,demanda_diaria,tiempo_entrega_dias,inventario_actual) VALUES($1,$2,2,$3)',[id,numeric(input.consumo_promedio??0,'Demanda'),qty]);}
        await c.query('UPDATE insumo SET proveedor=$1 WHERE id=$2',[String(input.proveedor??"").slice(0,120),id]);
        await c.query('UPDATE parametro_inventario SET stock_minimo_manual=$1 WHERE insumo_id=$2',[numeric(input.stock_minimo??0,"Mínimo"),id]);
        await movement(c,user,{id,nombre:name,es_prueba:item?.es_prueba??input.es_prueba===true,unidad_medida:unit,costo_unidad:price},{entity:'materia',type:item?'ajuste':'entrada',quantity:qty-Number(item?.inventario_actual??0),description:item?'Ajuste de materia prima':'Existencias iniciales'});
      } else {
        const unit=required(input.unidad,'Unidad',30);const minimum=numeric(input.stock_minimo??0,'Mínimo');
        if(id)await c.query('UPDATE producto SET nombre=$1,categoria=$2,unidad=$3,cantidad=$4,precio_venta=$5,stock_minimo=$6,descripcion=$7 WHERE id=$8',[name,category,unit,qty,price,minimum,String(input.descripcion??'').slice(0,600),id]);
        else {id=(await c.query('INSERT INTO producto(nombre,categoria,unidad,cantidad,precio_venta,stock_minimo,descripcion) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',[name,category,unit,qty,price,minimum,String(input.descripcion??'').slice(0,600)])).rows[0].id;
          const used=new Map();for(const i of input.insumos??[]){const q=numeric(i.cantidadUsada,'Insumo',{positive:true});used.set(String(i.id),(used.get(String(i.id))??0)+q);}
          const productionId=randomUUID();if(used.size){if(!qty)fail('Producción debe ser mayor a cero.');await c.query('INSERT INTO produccion(id,producto_id,cantidad,user_id,es_prueba) VALUES($1,$2,$3,$4,$5)',[productionId,id,qty,user.id,Boolean(item?.es_prueba??input.es_prueba===true)]);}
          for(const [rawId,q] of [...used].sort()){const r=(await c.query('SELECT i.*,p.inventario_actual,u.abreviatura unidad_medida,i.precio_presentacion/i.cantidad_presentacion costo_unidad FROM insumo i JOIN parametro_inventario p ON p.insumo_id=i.id JOIN unidad_medida u ON u.id=i.unidad_id WHERE i.id=$1 AND activo FOR UPDATE OF p',[rawId])).rows[0];if(!r||Number(r.inventario_actual)<q)fail('Stock de insumos insuficiente.');if(Boolean(r.es_prueba)!==Boolean(item?.es_prueba??input.es_prueba===true))fail('Usa insumos y productos del mismo ámbito: comercial o prueba.');if(r.unidad_medida==='s/d')fail('Valida las unidades de los insumos antes de producir.');await c.query('UPDATE parametro_inventario SET inventario_actual=inventario_actual-$1 WHERE insumo_id=$2',[q,rawId]);await c.query('INSERT INTO produccion_insumo VALUES($1,$2,$3)',[productionId,rawId,q]);await movement(c,user,r,{entity:'materia',type:'salida',quantity:q,description:`Producción: ${name}`});}
        }
        if(!item||(input.cantidad!=null&&input.cantidad!==''))await movement(c,user,{id,nombre:name,es_prueba:item?.es_prueba??input.es_prueba===true,unidad:unit,precio_venta:price},{entity:'producto',type:item?'ajuste':'entrada',quantity:qty-Number(item?.cantidad??0),description:item?'Ajuste de producto':'Producto registrado'});
      }
    }
    if(action==='save'&&!item&&input.es_prueba===true){await c.query(raw?'UPDATE insumo SET es_prueba=true WHERE id=$1':'UPDATE producto SET es_prueba=true WHERE id=$1',[id]);if(!raw)await c.query('UPDATE produccion SET es_prueba=true WHERE producto_id=$1',[id]);await c.query(raw?'UPDATE movimiento SET es_prueba=true WHERE insumo_id=$1':'UPDATE movimiento SET es_prueba=true WHERE producto_id=$1',[id]);}
    await captureHistory(c);return {id:String(id)};
  });
}
export async function recipe(name,quantity){const q=numeric(quantity,'Cantidad',{positive:true});const rows=(await database().query('SELECT i.id::text,i.nombre,(pi.cantidad_p_unidad*$2)::float8 "cantidadUsada",u.abreviatura unidad FROM producto p JOIN producto_insumo pi ON pi.producto_id=p.id JOIN insumo i ON i.id=pi.insumo_id JOIN unidad_medida u ON u.id=i.unidad_id WHERE p.nombre=$1 AND p.receta_validada AND p.activo AND i.activo',[name,q])).rows;if(!rows.length)fail('Este producto aún no tiene una receta validada. Captura los insumos reales.');return rows;}
