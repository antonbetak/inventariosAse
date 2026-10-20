import {useState} from 'react';
import {inventoryService} from '../services/inventoryService';
import {GlassCard} from './ui/GlassCard';
import {GlassButton} from './ui/GlassButton';
import {PageHeader} from './ui/PageHeader';
export function Operations({snapshot,onSaved}) {
 const [mode,setMode]=useState('venta'),[product,setProduct]=useState(''),[quantity,setQuantity]=useState(''),[used,setUsed]=useState({}),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const submit=async e=>{e.preventDefault();setBusy(true);setMessage('');try{
   if(mode==='venta')await inventoryService.registerSale(product,{unidades:quantity});
   else await inventoryService.registerProduction(product,{quantity,insumos:Object.entries(used).filter(([,q])=>q!==''&&Number(q)>0).map(([id,q])=>({id,cantidadUsada:q}))});
   setQuantity('');setUsed({});setMessage('Operación guardada.');onSaved();
 }catch(e){setMessage(e.message);onSaved();}finally{setBusy(false);}};
 return <div className="space-y-4"><PageHeader title="Ventas y producción" description="Registra operaciones y consulta el histórico importado."/>
 <GlassCard><form className="inventory-form space-y-4" onSubmit={submit}><fieldset disabled={busy} className="form-fields">
 <label>Operación<select value={mode} onChange={e=>setMode(e.target.value)}><option value="venta">Venta</option><option value="produccion">Producción</option></select></label>
 <label>Producto<select required value={product} onChange={e=>setProduct(e.target.value)}><option value="">Selecciona un producto</option>{snapshot.finishedProducts.map(p=><option key={p.id} value={p.id}>{p.nombre} · {p.stock_pendiente ? "existencias por confirmar" : `${p.cantidad} disponibles`}</option>)}</select></label>
 <label>Unidades<input required type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
 {mode==='produccion'&&<><p>Captura el consumo real del lote en la unidad de cada insumo. Las unidades marcadas s/d deben validarse antes de producir.</p>{snapshot.rawMaterials.map(i=><label key={i.id}>{i.nombre} ({i.unidad_medida}; disponible {i.stock_actual})<input aria-label={`Consumo de ${i.nombre}`} type="number" min="0" step="any" value={used[i.id]??''} onChange={e=>setUsed({...used,[i.id]:e.target.value})}/></label>)}</>}
 <GlassButton type="submit" disabled={busy}>{busy?'Guardando…':'Guardar operación'}</GlassButton></fieldset><p role="status">{message}</p></form></GlassCard>
 <GlassCard><h2>Histórico de ventas</h2><div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Periodo</th><th>Producto</th><th>Unidades</th><th>Ingresos</th><th>Origen</th></tr></thead><tbody>{snapshot.sales.map((s,index)=><tr key={`${s.origen}-${index}`}><td>{s.mes}/{s.anio}</td><td>{s.nombre}</td><td>{s.unidades}</td><td>{Number(s.ingreso).toLocaleString('es-MX',{style:'currency',currency:'MXN'})}</td><td>{s.origen==='historico'?'Excel':'Operación'}</td></tr>)}</tbody></table></div></GlassCard>
 <GlassCard><h2>Planeación julio–diciembre</h2><p>Proyección del Excel; estas cantidades no son ventas ni producción realizadas.</p><div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Año / semana del semestre</th><th>Agua requerida (L)</th><th>Extra con merma (L)</th><th>Rendimiento (%)</th><th>Costo de merma</th></tr></thead><tbody>{snapshot.projections.map(p=><tr key={`${p.anio}-${p.semana}`}><td>{p.anio} / {p.semana}</td><td>{Number(p.agua_con_merma).toFixed(2)}</td><td>{Number(p.litros_extra).toFixed(2)}</td><td>{Number(p.yield_pct).toFixed(2)}</td><td>${Number(p.costo_merma).toFixed(2)}</td></tr>)}</tbody></table></div></GlassCard></div>;
}
