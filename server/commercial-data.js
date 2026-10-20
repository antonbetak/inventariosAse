import {transaction} from './db.js';
import {numeric,fail,validDate} from './security.js';
export async function saveCommercialData(input,user) {
  if(user.rol!=='admin')fail('Se requiere administrador.',403);
  return transaction(async c=>{
    await c.query('SELECT pg_advisory_xact_lock(735241)');
    if(input.kind==='loss-date') {
      validDate(input.fecha);
      const r=await c.query('UPDATE merma_registro SET fecha=$1::date WHERE id=$2 RETURNING id',[input.fecha,numeric(input.id,'Muestra',{positive:true,integer:true})]);
      if(!r.rowCount)fail('Muestra no encontrada.',404);
    } else if(input.kind==='recipe') {
      const id=numeric(input.id,'Producto',{positive:true,integer:true});
      const p=(await c.query('SELECT * FROM producto WHERE id=$1 AND activo FOR UPDATE',[id])).rows[0];if(!p)fail('Producto no encontrado.',404);
      if(!Array.isArray(input.insumos)||!input.insumos.length||input.insumos.length>100)fail('Captura los insumos reales por unidad del producto.');
      const seen=new Set();
      for(const item of input.insumos){
        const rawId=numeric(item.id,'Insumo',{positive:true,integer:true});
        if(seen.has(rawId))fail('La receta contiene insumos duplicados.');seen.add(rawId);
        const raw=(await c.query('SELECT i.*,u.abreviatura FROM insumo i JOIN unidad_medida u ON u.id=i.unidad_id WHERE i.id=$1 AND activo',[rawId])).rows[0];
        if(!raw||raw.abreviatura==='s/d')fail('Valida la unidad de cada insumo antes de guardar la receta.');
        if(raw.es_prueba!==p.es_prueba)fail('La receta debe usar insumos del mismo ámbito que el producto.');
        numeric(item.cantidadUsada,'Cantidad por unidad',{positive:true});
      }
      await c.query('DELETE FROM producto_insumo WHERE producto_id=$1',[id]);
      for(const item of input.insumos)await c.query('INSERT INTO producto_insumo(producto_id,insumo_id,cantidad_p_unidad) VALUES($1,$2,$3)',[id,item.id,item.cantidadUsada]);
      await c.query('UPDATE producto SET receta_validada=true WHERE id=$1',[id]);
    } else fail('Tipo de dato inválido.');
    return {ok:true};
  });
}
