import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverDeployment} from '../src/services/deploymentRecovery.js';
test('Un módulo de un despliegue anterior recarga una vez, sin bucle',()=>{
 const values=new Map();let reloads=0,prevented=0;
 const browser={sessionStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},location:{reload:()=>reloads++}};
 const event={preventDefault:()=>prevented++};
 recoverDeployment(event,browser);recoverDeployment(event,browser);
 assert.equal(reloads,1);assert.equal(prevented,1);
});
test('Sin almacenamiento para limitar recargas conserva el error original',()=>{
 let reloads=0;
 recoverDeployment({preventDefault:()=>assert.fail('No ocultar error')},{sessionStorage:{getItem:()=>{throw Error('disabled');}},location:{reload:()=>reloads++}});
 assert.equal(reloads,0);
});
