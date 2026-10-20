import test from 'node:test';import assert from 'node:assert/strict';import {validDate} from '../server/security.js';
test('Fechas reales sin fabricar fechas para muestras desconocidas',()=>{assert.equal(validDate('2024-02-29'),'2024-02-29');for(const d of ['',null,undefined,'2026-02-30','2026-13-01','20/10/2026'])assert.throws(()=>validDate(d));});
