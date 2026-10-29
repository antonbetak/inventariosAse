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
test('Una versión nueva se detecta sin recargar formularios ni confundir errores de red',async()=>{
 const {checkDeploymentVersion}=await import('../src/services/deploymentRecovery.js');
 assert.equal(await checkDeploymentVersion('old',async()=>({ok:true,json:async()=>({id:'new'})})),true);
 assert.equal(await checkDeploymentVersion('same',async()=>({ok:true,json:async()=>({id:'same'})})),false);
 assert.equal(await checkDeploymentVersion('old',async()=>({ok:false})),false);
 await assert.rejects(checkDeploymentVersion('old',async()=>{throw Error('offline');}));
});
