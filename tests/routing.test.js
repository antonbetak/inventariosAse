import test from 'node:test';
import assert from 'node:assert/strict';
import {apiPath} from '../server/api-path.js';

test('Las rutas Vercel conservan identificadores y acciones de inventario',()=>{
  for (const route of ['session','inventory','raw-materials/18','raw-materials/18/entries','finished-products/4/sales','finished-products/4/production','planner/task-id']) {
    const expected=route.split('/');
    assert.deepEqual(apiPath({url:`/api/${route}`}),expected);
    assert.deepEqual(apiPath({url:`/api?__route=${encodeURIComponent(route)}`}),expected);
    assert.deepEqual(apiPath({url:'/api',query:{__route:route}}),expected);
  }
});
