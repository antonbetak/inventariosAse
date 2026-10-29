import test from 'node:test';
import assert from 'node:assert/strict';
import {commercialSales} from '../src/services/commercial.js';
import {reportsService} from '../src/services/reportsService.js';
const sale=(id,origen,mes,ingreso,extra={})=>({id,producto_id:'a',nombre:'Producto',anio:2026,mes,ingreso,unidades:1,origen,...extra});
test('Separa ingresos de origen, excluye pruebas por clasificación estable y detecta solapamiento',()=>{
 const sales=[sale(1,'historico',1,120),sale(2,'operacion',2,30),sale(3,'operacion',2,99,{es_prueba:true,nombre:'Renombrado'})];
 const r=commercialSales(sales);assert.equal(r.historicalTotal,120);assert.equal(r.operationalTotal,30);assert.equal(r.total,150);assert.equal(r.rows.length,2);
 assert.equal(commercialSales(sales,{includeTests:true}).operationalTotal,129);
 const overlap=commercialSales([...sales,sale(4,'operacion',1,10)]);assert.equal(overlap.total,null);assert.equal(overlap.overlap,true);
});
test('Los filtros de meses incluyen límites, año y origen; no incorporan proyecciones',()=>{
 const sales=[sale(1,'historico',1,120),sale(2,'operacion',2,30),sale(3,'historico',2,40,{anio:2025})];
 const r=commercialSales(sales,{from:'2026-02',to:'2026-02',origin:'operacion'});assert.equal(r.rows.length,1);assert.equal(r.total,30);
 assert.equal(commercialSales(sales,{from:'2026-03',to:'2026-01'}).rows.length,0);
 assert.equal(commercialSales(sales,{productId:'missing'}).rows.length,0);
 assert.equal(commercialSales([sale(4,'operacion',2,.1),sale(5,'operacion',2,.2)]).total,.3);
});
test('Valuaciones y exportaciones conservan costos y stock desconocidos; pruebas fuera por defecto',async()=>{
 const snapshot={rawMaterials:[{id:'1',nombre:'Pendiente',stock_actual:5,costo_unidad:null,costo_pendiente:true},{id:'2',nombre:'Con costo',stock_actual:2,costo_unidad:3},{id:'3',nombre:'Renombrado',stock_actual:10,costo_unidad:10,es_prueba:true}],finishedProducts:[{cantidad:20,precioVenta:30,stock_pendiente:true},{cantidad:2,precioVenta:5},{cantidad:9,precioVenta:10,es_prueba:true}],movements:[{es_prueba:true,fecha:'2026-01-01',tipo:'salida',valor:90}],history:[],projections:[{costo_merma:1000}]};
 const r=await reportsService.getSummary(snapshot);assert.equal(r.rawValue,6);assert.equal(r.productValue,10);assert.equal(r.insumos.length,2);assert.equal(r.activity.length,0);assert.equal(r.salesTotal,0);
 const rows=await reportsService.getExportRows(snapshot);assert.equal(rows[0]['Costo unidad'],'Pendiente');assert.equal(rows[0]['Valor en inventario'],'Pendiente');assert.equal((await reportsService.getSummary(snapshot,{includeTests:true})).rawValue,106);
});
