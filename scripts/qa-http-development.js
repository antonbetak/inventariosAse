// Real HTTP -> API -> development PostgreSQL. Never reads the administrator password.
import {createServer} from 'node:http';
import {randomBytes,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import handler from '../api/index.js';
import {database} from '../server/db.js';
import {passwordHash} from '../server/security.js';
try{process.loadEnvFile('.env.local');}catch{/* environment */}
if(process.env.DATABASE_BRANCH!=='development'||new URL(process.env.DATABASE_URL).hostname!==process.env.EXPECTED_DATABASE_HOST)throw Error('Development guard failed');
const db=database(),id=randomUUID(),username=`qa-${id}@example.invalid`,password=randomBytes(24).toString('hex'),results=[];
const server=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;req.body=body||undefined;await handler(req,res);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/api/`;
const call=async(path,method='GET',body,cookie='',origin=process.env.APP_ORIGIN)=>{const r=await fetch(url+path,{method,headers:{origin,cookie,'content-type':'application/json','x-forwarded-for':id},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};};
const pass=name=>results.push(name);
try{
 await db.query('INSERT INTO app_user(id,email,nombre,password_hash,rol) VALUES($1,$2,$3,$4,$5)',[id,username,'QA sesión temporal',passwordHash(password),'operador']);
 assert.equal((await call('inventory')).status,401);pass('Inventario protegido sin sesión');
 assert.equal((await call('session','POST',{username,password},'','https://invalid.example')).status,403);pass('Origin ajeno rechazado');
 assert.equal((await call('session','POST',{username,password:'incorrecta'})).status,401);pass('Credenciales incorrectas rechazadas');
 const first=await call('session','POST',{username,password});assert.equal(first.status,200);assert.match(first.cookie,/HttpOnly/);assert.match(first.cookie,/SameSite=Strict/);const cookie1=first.cookie.split(';')[0];pass('Login real y cookie HttpOnly SameSite');
 const second=await call('session','POST',{username,password});assert.equal(second.status,200);const cookie2=second.cookie.split(';')[0];assert.notEqual(cookie1,cookie2);pass('Segunda autenticación independiente');
 assert.equal((await call('session','GET',null,cookie1)).data.id,id);assert.equal((await call('inventory','GET',null,cookie2)).status,200);pass('Sesión persistente y consulta SQL desde HTTP');
 assert.equal((await call('session','DELETE',{},cookie1)).status,200);assert.equal((await call('inventory','GET',null,cookie1)).status,401);assert.equal((await call('inventory','GET',null,cookie2)).status,200);pass('Logout revoca solo su sesión');
 const raw=await call('raw-materials','POST',{nombre:`QA_HTTP_${id}`,categoria:'Validación',stock_actual:0,stock_minimo:0,costo_unidad:'',unidad_medida:'pzas',es_prueba:true},cookie2);assert.equal(raw.status,200);
 assert.equal((await call(`?__route=raw-materials/${raw.data.id}/entries`,'POST',{quantity:2},cookie2)).status,200);assert.equal((await call('inventory','GET',null,cookie2)).data.rawMaterials.find(r=>r.id===raw.data.id).stock_actual,2);pass('CRUD y ruta anidada __route persisten entrada');
 const task=await call('planner','POST',{title:`QA_HTTP_${id}`,priority:'Baja'},cookie2);assert.equal(task.status,200);const t=task.data.tasks.find(t=>t.title===`QA_HTTP_${id}`);assert.ok(t);assert.equal((await call(`planner/${t.id}`,'PATCH',{},cookie2)).data.tasks.find(x=>x.id===t.id).completed,true);pass('Agenda crea y completa tarea persistida');
 assert.equal((await call('commercial-data','POST',{kind:'recipe',id:1,insumos:[]},cookie2)).status,403);pass('Validación comercial reservada a administrador');
 await db.query('UPDATE app_session SET expires_at=now()-interval \'1 second\' WHERE user_id=$1',[id]);assert.equal((await call('inventory','GET',null,cookie2)).status,401);pass('Caducidad real rechaza acceso');
 console.log(JSON.stringify({passed:results.length,results},null,2));
}finally{
 await db.query('DELETE FROM app_session WHERE user_id=$1',[id]);await db.query('UPDATE app_user SET activo=false WHERE id=$1',[id]);await new Promise(resolve=>server.close(resolve));await db.end();
}
