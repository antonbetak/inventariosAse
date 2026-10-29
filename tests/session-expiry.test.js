import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../src/services/api.js';
import {authService} from '../src/services/authService.js';

test('Una sesión caducada notifica al cliente y conserva el estado HTTP',async t=>{
  const originalFetch=globalThis.fetch, originalWindow=globalThis.window;
  globalThis.window=new EventTarget();
  globalThis.fetch=async()=>({ok:false,status:401,json:async()=>({error:'Inicia sesión para continuar.'})});
  t.after(()=>{globalThis.fetch=originalFetch;globalThis.window=originalWindow;});
  let expired=0;
  const unsubscribe=authService.onSessionExpired(()=>expired++);
  await assert.rejects(api('inventory'),e=>e.status===401);
  assert.equal(expired,1);
  await assert.rejects(authService.login('invalid@example.test','invalid-password'),e=>e.status===401);
  assert.equal(expired,1,'El rechazo de un login no es una caducidad de sesión');
  unsubscribe();
  await assert.rejects(api('planner'),e=>e.status===401);
  assert.equal(expired,1,'El listener se elimina al desmontar');
});
