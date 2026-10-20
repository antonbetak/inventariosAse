import {randomBytes,randomUUID} from 'node:crypto';
import {database} from '../server/db.js';
import {hashToken,verifyPassword,checkOrigin,fail,required} from '../server/security.js';
import {apiPath} from '../server/api-path.js';
import {snapshot,mutateInventory,recipe} from '../server/inventory.js';
const cookieName=process.env.NODE_ENV==='production'?'__Host-sanate':'sanate_session';
const tokenOf=req=>(req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1)??'';
const cookie=(token,age)=>`${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${process.env.NODE_ENV==='production'?'; Secure':''}`;
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
  try {
    const path=apiPath(req);
    const method=req.method;
    if(!['GET','POST','PATCH','DELETE'].includes(method))return send(405,{error:'Método no permitido.'});
    if(method!=='GET')checkOrigin(req);
    let body=req.body??{};
    if(typeof body==='string'){if(Buffer.byteLength(body)>65536)fail('Solicitud demasiado grande.',413);try{body=JSON.parse(body);}catch{fail('JSON inválido.');}}
    if(!body||typeof body!=='object'||Array.isArray(body))fail('Solicitud inválida.');
    if(Buffer.byteLength(JSON.stringify(body))>65536)fail('Solicitud demasiado grande.',413);
    const db=database();
    if(path[0]==='session'&&method==='POST'){
      const email=required(body.username,'Usuario',254).toLowerCase();
      // Persistent per-IP rate limits also work across serverless instances.
      const ip=hashToken(String(req.headers['x-forwarded-for']??req.socket?.remoteAddress??'unknown').split(',')[0]);
      const limit=(await db.query(`INSERT INTO login_attempt(ip_hash,intentos) VALUES($1,1) ON CONFLICT(ip_hash) DO UPDATE SET intentos=CASE WHEN login_attempt.inicio<now()-interval '15 minutes' THEN 1 ELSE login_attempt.intentos+1 END,inicio=CASE WHEN login_attempt.inicio<now()-interval '15 minutes' THEN now() ELSE login_attempt.inicio END RETURNING intentos`,[ip])).rows[0];
      if(limit.intentos>10)fail('Demasiados intentos. Espera 15 minutos.',429);
      const u=(await db.query('SELECT * FROM app_user WHERE email=$1 AND activo',[email])).rows[0];
      const dummy='00000000000000000000000000000000:'+ '00'.repeat(64);
      if(!verifyPassword(body.password,u?.password_hash??dummy)||!u)fail('Usuario o contraseña incorrectos.',401);
      const token=randomBytes(32).toString('hex');await db.query("INSERT INTO app_session(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[hashToken(token),u.id]);await db.query('DELETE FROM login_attempt WHERE ip_hash=$1',[ip]);res.setHeader('Set-Cookie',cookie(token,28800));return send(200,{id:u.id,nombre:u.nombre,email:u.email,rol:u.rol});
    }
    const u=(await db.query('SELECT u.id,u.nombre,u.email,u.rol FROM app_session s JOIN app_user u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.activo',[hashToken(tokenOf(req))])).rows[0];
    if(path[0]==='session'&&method==='GET')return send(200,u??null);
    if(!u)fail('Inicia sesión para continuar.',401);
    if(path[0]==='session'&&method==='DELETE'){await db.query('DELETE FROM app_session WHERE token_hash=$1',[hashToken(tokenOf(req))]);res.setHeader('Set-Cookie',cookie('',0));return send(200,{ok:true});}
    if(path[0]==='inventory'&&method==='GET')return send(200,await snapshot());
    if(path[0]==='recipe'&&method==='POST')return send(200,await recipe(body.name,body.quantity));
    if(['raw-materials','finished-products'].includes(path[0])){
      const kind=path[0]==='raw-materials'?'raw':'product';
      const action=method==='DELETE'?'delete':path[2]==='entries'?'entry':path[2]==='sales'?'sale':path[2]==='production'?'production':'save';
      if(!['POST','PATCH','DELETE'].includes(method)||path.length>3||(path[2]&&!['entries','sales','production'].includes(path[2]))||(path[2]&&method!=='POST')||(action==='entry'&&kind!=='raw')||(['sale','production'].includes(action)&&kind!=='product')||(method!=='POST'&&!path[1]))fail('Ruta inválida.',404);
      if(path[1]&&!/^\d+$/.test(path[1]))fail('Identificador inválido.');
      return send(200,await mutateInventory(kind,path[1],action,body,u));
    }
    if(path[0]==='planner'){
      if(method==='POST')await db.query('INSERT INTO tarea(id,user_id,title,priority) VALUES($1,$2,$3,$4)',[randomUUID(),u.id,required(body.title,'Tarea',120),['Alta','Media','Baja'].includes(body.priority)?body.priority:'Media']);
      if(method==='PATCH')await db.query('UPDATE tarea SET completed=NOT completed WHERE id=$1 AND user_id=$2',[path[1],u.id]);
      if(method==='DELETE')await db.query('DELETE FROM tarea WHERE id=$1 AND user_id=$2',[path[1],u.id]);
      const tasks=(await db.query('SELECT id,title,priority,completed FROM tarea WHERE user_id=$1 ORDER BY title',[u.id])).rows;
      const events=(await db.query('SELECT id,title,date::text,time,tipo FROM evento WHERE user_id=$1 ORDER BY date,time',[u.id])).rows;return send(200,{version:1,tasks,events});
    }
    return send(404,{error:'Ruta no encontrada.'});
  }catch(e){
    const status=e.status??(['23505','23514','22P02','22003','23503'].includes(e.code)?400:503);
    send(status,{error:e.status?e.message:status===400?'Datos inválidos, relación no disponible o nombre duplicado.':'No se pudo completar la operación. Verifica el servidor y la conexión SQL.'});
  }
}
