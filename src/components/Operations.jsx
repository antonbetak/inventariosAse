import {OperationalRecords} from './OperationalRecords';
import {CommercialSales} from './Reportes/CommercialSales';
import {CommercialData} from './CommercialData';
import {useState} from 'react';
import {inventoryService} from '../services/inventoryService';
import {GlassCard} from './ui/GlassCard';
import {GlassButton} from './ui/GlassButton';
import {PageHeader} from './ui/PageHeader';
export function Operations({snapshot,onSaved}) {
 const [mode,setMode]=useState('venta'),[product,setProduct]=useState(''),[quantity,setQuantity]=useState(''),[used,setUsed]=useState({}),[useRecipe,setUseRecipe]=useState(true),[extraCost,setExtraCost]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const submit=async e=>{e.preventDefault();setBusy(true);setMessage('');try{
   if(mode==='venta')await inventoryService.registerSale(product,{unidades:quantity});
   else await inventoryService.registerProduction(product,{quantity,useRecipe,costo_adicional:extraCost,insumos:Object.entries(used).filter(([,q])=>q!==''&&Number(q)>0).map(([id,q])=>({id,cantidadUsada:q}))});
   setQuantity('');setUsed({});setMessage('Operación guardada.');onSaved();
 }catch(e){setMessage(e.message);onSaved();}finally{setBusy(false);}};
 return <div className="space-y-4"><PageHeader title="Ventas y producción" description="Registra operaciones y consulta el histórico importado."/>
 <GlassCard><form className="inventory-form space-y-4" onSubmit={submit}><fieldset disabled={busy} className="form-fields">
 <label>Operación<select aria-label="Operación" value={mode} onChange={e=>setMode(e.target.value)}><option value="venta">Venta</option><option value="produccion">Producción</option></select></label>
 <label>Producto<select aria-label="Producto" required value={product} onChange={e=>setProduct(e.target.value)}><option value="">Selecciona un producto</option>{snapshot.finishedProducts.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.es_prueba?"[Prueba]":""} · {p.stock_pendiente ? "existencias por confirmar" : `${p.cantidad} disponibles`}</option>)}</select></label>
 <label>Unidades<input aria-label="Unidades" required type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
 {mode==='produccion'&&<><label><input type="checkbox" checked={useRecipe} onChange={e=>setUseRecipe(e.target.checked)}/> Usar receta validada (calculada en el servidor)</label><label>Costo adicional del lote (MXN; vacío = pendiente)<input aria-label="Costo adicional del lote (MXN; vacío = pendiente)" type="number" min="0" step="0.01" value={extraCost} onChange={e=>setExtraCost(e.target.value)}/></label><p>Captura el consumo real del lote en la unidad de cada insumo. Las unidades marcadas s/d deben validarse antes de producir.</p>{!useRecipe&&snapshot.rawMaterials.filter(i=>Boolean(i.es_prueba)===Boolean(snapshot.finishedProducts.find(p=>p.id===product)?.es_prueba)).map(i=><label key={i.id}>{i.nombre} ({i.unidad_medida}; disponible {i.stock_actual})<input aria-label={`Consumo de ${i.nombre}`} type="number" min="0" step="any" value={used[i.id]??''} onChange={e=>setUsed({...used,[i.id]:e.target.value})}/></label>)}</>}
 <GlassButton type="submit" disabled={busy}>{busy?'Guardando…':'Guardar operación'}</GlassButton></fieldset><p role="status">{message}</p></form></GlassCard>
 <OperationalRecords snapshot={snapshot} onSaved={onSaved}/>
 <CommercialData snapshot={snapshot} onSaved={onSaved}/>
 <CommercialSales snapshot={snapshot}/>
 <GlassCard><h2>Planeación julio–diciembre</h2><p>Proyección del Excel; estas cantidades no son ventas ni producción realizadas.</p><div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Año / semana del semestre</th><th>Agua requerida (L)</th><th>Extra con merma (L)</th><th>Rendimiento (%)</th><th>Costo de merma</th></tr></thead><tbody>{snapshot.projections.map(p=><tr key={`${p.anio}-${p.semana}`}><td>{p.anio} / {p.semana}</td><td>{Number(p.agua_con_merma).toFixed(2)}</td><td>{Number(p.litros_extra).toFixed(2)}</td><td>{Number(p.yield_pct).toFixed(2)}</td><td>${Number(p.costo_merma).toFixed(2)}</td></tr>)}</tbody></table></div></GlassCard></div>;
}
