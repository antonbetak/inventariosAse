import test from 'node:test';
import assert from 'node:assert/strict';
import {productDto} from '../server/product-dto.js';
import {sortProducts,stockStatus,dateLabel} from '../src/utils/inventoryDisplay.js';

test('Productos SQL sin fecha ni conteo físico se pueden listar sin fabricar existencias',()=>{
  const rows=[{id:2,nombre:'Producto B',cantidad:'0.000000',precio_venta:'12.00',stock_minimo:'0',stock_pendiente:true},{id:1,nombre:'Producto A',cantidad:'3',precio_venta:'10',stock_minimo:'1',creado_en:new Date('2026-01-02T12:00:00Z')}];
  const products=rows.map(productDto);
  assert.deepEqual(sortProducts(products).map(p=>p.id),['1','2']);
  assert.equal(dateLabel(products[0].creadoEn),'Sin fecha registrada');
  assert.equal(stockStatus({...products[0],stock_actual:products[0].cantidad}),'Por confirmar');
  assert.equal(products[1].cantidad,3);
  assert.equal(products[1].creadoEn,'2026-01-02T12:00:00.000Z');
  assert.deepEqual(products[0].insumos,[]);
  assert.equal(stockStatus({stock_actual:0,stock_pendiente:false}),'Crítico');
});
