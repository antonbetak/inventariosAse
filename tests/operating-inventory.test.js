import test from 'node:test';
import assert from 'node:assert/strict';
import {commercialSnapshot} from '../src/services/commercialSnapshot.js';
import {stockStatus} from '../src/utils/inventoryDisplay.js';

test('QA inventory cannot appear in product pickers, costs, movements or losses', () => {
  const fixture = {id:'2',es_prueba:true};
  const operating = {id:'1',es_prueba:false};
  const snapshot = Object.fromEntries(['rawMaterials','finishedProducts','movements','sales','expenses','batches','actualLosses'].map(key=>[key,[operating,fixture]]));
  snapshot.lossSamples=[{id:'a',insumo_id:'1'},{id:'b',insumo_id:'2'}];
  snapshot.projections=[{semana:1}];
  const result=commercialSnapshot(snapshot);
  for(const key of ['rawMaterials','finishedProducts','movements','sales','expenses','batches','actualLosses'])assert.deepEqual(result[key],[operating]);
  assert.deepEqual(result.lossSamples,[{id:'a',insumo_id:'1'}]);
  assert.deepEqual(result.projections,snapshot.projections);
  assert.equal(snapshot.rawMaterials.length,2);
});

test('Alerts compare actual stock to safety stock, not the suggested order', () => {
  assert.equal(stockStatus({stock_actual:2,stock_minimo:.285942,pedido_sugerido:52}),'Disponible');
  assert.equal(stockStatus({stock_actual:2,stock_minimo:2}),'Bajo');
  assert.equal(stockStatus({stock_actual:0,stock_minimo:0}),'Crítico');
  assert.equal(stockStatus({stock_actual:0,stock_pendiente:true}),null);
});
