import test from 'node:test';
import assert from 'node:assert/strict';
import {reportsService} from '../src/services/reportsService.js';
test('Reportes distinguen salidas, reorden SQL y unidades monetarias',async()=>{
 const input={rawMaterials:[{nombre:'Insumo',stock_actual:10,stock_minimo:1,costo_unidad:2,consumo_promedio:100,punto_reorden:9,merma_mensual:.1,unidad_medida:'pza'}],finishedProducts:[{cantidad:3,precioVenta:10}],movements:[{tipo:'entrada',fecha:'2026-01-01',valor:10},{tipo:'salida',fecha:'2026-01-02',valor:4}],history:[]};
 const r=await reportsService.getSummary(input);assert.equal(r.totalValue,50);assert.equal(r.insumos[0].punto_reorden,9);assert.equal(r.insumos[0].enRiesgo,false);assert.equal(r.resumenSalidas.valor,4);assert.equal(r.resumenSalidas.registros,1);assert.deepEqual(r.history,[]);assert.equal(input.rawMaterials[0].punto_reorden,9);
});
test('Un inventario vacío no genera histórico ni movimientos artificiales',async()=>{
 const r=await reportsService.getSummary({rawMaterials:[],finishedProducts:[],movements:[],history:[]});assert.equal(r.totalValue,0);assert.deepEqual(r.activity,[]);assert.deepEqual(r.history,[]);
});
