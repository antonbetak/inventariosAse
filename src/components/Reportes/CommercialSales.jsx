import {useState} from 'react';
import {commercialSales} from '../../services/commercial.js';
import {downloadReport} from '../../utils/downloadReport.js';
import {GlassCard} from '../ui/GlassCard';
import {GlassButton} from '../ui/GlassButton';
import {DataTable} from '../ui/DataTable';
import {money} from '../../utils/inventoryDisplay';
export function CommercialSales({snapshot}) {
  const [options,setOptions]=useState({from:'',to:'',origin:'all',includeTests:false,productId:''});
  const result=commercialSales(snapshot.sales,options);
  const change=e=>setOptions({...options,[e.target.name]:e.target.type==='checkbox'?e.target.checked:e.target.value});
  const rows=result.rows.map(s=>({Periodo:s.periodo,Producto:s.nombre,Origen:s.origen==='historico'?'Excel Hoja3':'Operación',Ámbito:s.es_prueba?'Prueba':'Comercial',Unidades:s.unidades,'Precio unitario':s.precio_unitario,Ingreso:s.ingreso,'ID fuente':s.importacion_id??s.id}));
  return <GlassCard className="table-panel commercial-panel">
    <h2>Ingresos por periodo y origen</h2>
    <div className="form-grid inventory-form">
      <label>Desde<input aria-label="Desde" type="month" name="from" value={options.from} onChange={change}/></label>
      <label>Hasta<input aria-label="Hasta" type="month" name="to" value={options.to} onChange={change}/></label>
      <label>Producto<select aria-label="Producto" name="productId" value={options.productId} onChange={change}><option value="">Todos</option>{[...new Map(snapshot.sales.map(s=>[s.producto_id,s.nombre])).entries()].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Origen<select aria-label="Origen" name="origin" value={options.origin} onChange={change}><option value="all">Todos, separados</option><option value="historico">Excel Hoja3</option><option value="operacion">Operaciones</option></select></label>
      <label><input type="checkbox" name="includeTests" checked={options.includeTests} onChange={change}/> Incluir pruebas para validación</label>
    </div>
    <p>Ingresos históricos: {money(result.historicalTotal)} · Ingresos de operaciones: {money(result.operationalTotal)}. {options.includeTests?'Incluye pruebas.':'Pruebas excluidas.'}</p>
    {result.overlap&&<p role="status" className="form-info">Hay operaciones en meses y productos con histórico importado. Requieren conciliación antes de sumar ambos orígenes.</p>}
    <p className="form-info">Utilidad pendiente de calcular: faltan costos de insumos validados, recetas reales y costos de producción. Las proyecciones julio–diciembre se muestran aparte y no forman parte de estos ingresos.</p>
    <GlassButton onClick={()=>downloadReport(rows,'ingresos_sanate')} disabled={!rows.length}>Exportar ingresos filtrados</GlassButton>
    <DataTable label="Ingresos trazables" headers={['Periodo','Producto','Origen','Ámbito','Unidades','Precio','Ingreso','Referencia']}>
      {result.rows.map(s=><tr key={`${s.origen}-${s.id}`}><td>{s.periodo}</td><td>{s.nombre}</td><td>{s.origen==='historico'?'Excel · Hoja3':'Operación'}</td><td>{s.es_prueba?'Prueba':'Comercial'}</td><td>{s.unidades}</td><td>{money(s.precio_unitario)}</td><td>{money(s.ingreso)}</td><td>{s.importacion_id??s.id}</td></tr>)}
    </DataTable>
    {!result.rows.length&&<p>Sin ventas en el periodo seleccionado.</p>}
  </GlassCard>;
}
