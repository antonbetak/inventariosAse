import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordHash,verifyPassword,hashToken,numeric,checkOrigin} from '../server/security.js';
import handler from '../api/index.js';
test('Contraseñas: sal aleatoria, verificación y rechazo de credenciales incorrectas',()=>{
 const a=passwordHash('test-password-8392'),b=passwordHash('test-password-8392');assert.notEqual(a,b);assert.ok(verifyPassword('test-password-8392',a));assert.equal(verifyPassword('incorrecta',a),false);assert.equal(verifyPassword('x'.repeat(257),a),false);assert.throws(()=>passwordHash('corta'));assert.equal(hashToken('session').length,64);
});
test('Cantidades inválidas no se convierten silenciosamente en stock',()=>{
 for(const value of ['',null,undefined,true,[],{},'  ',-1,Infinity,'NaN'])assert.throws(()=>numeric(value,'Stock'));
 assert.equal(numeric('1.25','Stock'),1.25);assert.throws(()=>numeric(.001,'Importe',{scale:2}));assert.equal(numeric(.236,'Costo'),.236);assert.throws(()=>numeric(1.5,'Venta',{integer:true}));assert.throws(()=>numeric(0,'Entrada',{positive:true}));
});
test('CSRF: exige el origen exacto configurado',()=>{
 process.env.APP_ORIGIN='https://sanate.example';checkOrigin({headers:{origin:'https://sanate.example'}});for(const origin of [undefined,'null','https://evil.example','https://sanate.example.evil.test'])assert.throws(()=>checkOrigin({headers:{origin}}));
});
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},end(s){this.body=JSON.parse(s);}};}
test('La API rechaza métodos y orígenes inválidos antes de consultar SQL',async()=>{
 const a=response();await handler({url:'/api/inventory',method:'PUT',headers:{}},a);assert.equal(a.statusCode,405);
 const b=response();await handler({url:'/api/session',method:'POST',headers:{origin:'https://evil.example'}},b);assert.equal(b.statusCode,403);assert.equal(b.headers['Cache-Control'],'no-store');
});
test('La API rechaza JSON malformado y cuerpos excesivos',async()=>{
 process.env.APP_ORIGIN='https://sanate.example';
 for(const [body,status] of [['{',400],['x'.repeat(65537),413]]){const r=response();await handler({url:'/api/session',method:'POST',headers:{origin:'https://sanate.example'},body},r);assert.equal(r.statusCode,status);}
});
