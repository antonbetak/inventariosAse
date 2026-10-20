import {useState} from 'react';
import {api} from '../services/api';
import {GlassCard} from './ui/GlassCard';
import {GlassButton} from './ui/GlassButton';
export function CommercialData({snapshot,onSaved}) {
 const [product,setProduct]=useState(''),[used,setUsed]=useState({}),[sample,setSample]=useState(''),[date,setDate]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const save=async input=>{setBusy(true);setMessage('');try{await api('commercial-data','POST',input);setMessage('Datos validados guardados.');onSaved();}catch(e){setMessage(e.message);}finally{setBusy(false);}};
 return <GlassCard><h2>Completar datos comerciales</h2><p>Costos y unidades: edita Materia prima. Conteo físico: edita Producto terminado. Captura aquí recetas validadas por unidad y fechas reales de las muestras; los datos fuente del Excel se conservan.</p>
 <form className="inventory-form space-y-4" onSubmit={e=>{e.preventDefault();save({kind:'recipe',id:product,insumos:Object.entries(used).filter(([,q])=>q!==''&&Number(q)>0).map(([id,cantidadUsada])=>({id,cantidadUsada}))});}}><fieldset className="form-fields" disabled={busy}>
 <label>Producto para receta<select aria-label="Producto para receta" required value={product} onChange={e=>{setProduct(e.target.value);setUsed(Object.fromEntries((snapshot.finishedProducts.find(p=>p.id===e.target.value)?.insumos??[]).map(i=>[i.id,String(i.cantidadUsada)])));}}><option value="">Selecciona</option>{snapshot.finishedProducts.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.receta_validada?'· Receta validada':''}</option>)}</select></label>
 {product&&<><p>Cantidades consumidas por una unidad de producto. Al guardar se reemplaza la receta anterior; no se modifica el stock.</p>{snapshot.rawMaterials.filter(i=>Boolean(i.es_prueba)===Boolean(snapshot.finishedProducts.find(p=>p.id===product)?.es_prueba)).map(i=><label key={i.id}>{i.nombre} · {i.unidad_medida}<input type="number" min="0" step="0.0001" value={used[i.id]??''} onChange={e=>setUsed({...used,[i.id]:e.target.value})}/></label>)}</>}
 <GlassButton type="submit" disabled={busy||!product}>Guardar receta validada</GlassButton></fieldset></form>
 <form className="inventory-form space-y-4" onSubmit={e=>{e.preventDefault();save({kind:'loss-date',id:sample,fecha:date});}}><fieldset className="form-fields" disabled={busy}>
 <label>Muestra de merma<select aria-label="Muestra de merma" required value={sample} onChange={e=>{setSample(e.target.value);setDate(snapshot.lossSamples.find(s=>String(s.id)===e.target.value)?.fecha??'');}}><option value="">Selecciona</option>{(snapshot.lossSamples??[]).map(s=><option key={s.id} value={s.id}>{s.nombre} · {s.fecha??'Fecha pendiente'}</option>)}</select></label>
 <label>Fecha real de la muestra<input aria-label="Fecha real de la muestra" required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><GlassButton type="submit" disabled={busy}>Guardar fecha confirmada</GlassButton></fieldset></form><p role="status">{message}</p></GlassCard>;
}
