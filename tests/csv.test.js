import test from 'node:test';import assert from 'node:assert/strict';import {toCSV} from '../src/utils/downloadReport.js';
test('CSV protege fórmulas y conserva comillas y saltos de línea en nombres editables',()=>{
 const csv=toCSV([{Nombre:'=HYPERLINK("bad")',Nota:'línea uno\nlínea dos',Costo:'Pendiente'}]);
 assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));assert.ok(csv.includes('"línea uno\nlínea dos"'));assert.ok(csv.includes('"Pendiente"'));assert.equal(toCSV([]),'');
});
