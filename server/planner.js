import {randomUUID} from 'node:crypto';
import {database} from './db.js';
import {required,validDate,fail} from './security.js';
export async function planner(path,method,input,user){
 const db=database(),event=path[1]==='events',id=event?path[2]:path[1];
 if(path.length>(event?3:2)||!['GET','POST','PATCH','DELETE'].includes(method)||(method==='GET'&&path.length!==1)||(method==='POST'&&id)||(['PATCH','DELETE'].includes(method)&&!id))fail('Ruta inválida.',404);
 if(id&&!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))fail('Identificador inválido.');
 if(method==='POST'||(method==='PATCH'&&(event||input.title!==undefined))){
  const title=required(input.title,event?'Recordatorio':'Tarea',120);
  if(event){const date=validDate(input.date);const time=input.time??'';if(time!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))fail('Hora inválida.');
   const values=[title,date,time,user.id];
   if(method==='POST')await db.query('INSERT INTO evento(title,date,time,user_id,id) VALUES($1,$2,$3,$4,$5)',[...values,randomUUID()]);
   else {const r=await db.query('UPDATE evento SET title=$1,date=$2,time=$3 WHERE user_id=$4 AND id=$5 RETURNING id',[...values,id]);if(!r.rowCount)fail('Recordatorio no encontrado.',404);}
  }else{
   if(!['Alta','Media','Baja'].includes(input.priority??'Media'))fail('Prioridad inválida.');
   if(method==='POST')await db.query('INSERT INTO tarea(id,user_id,title,priority) VALUES($1,$2,$3,$4)',[randomUUID(),user.id,title,input.priority??'Media']);
   else {const r=await db.query('UPDATE tarea SET title=$1,priority=$2 WHERE id=$3 AND user_id=$4 RETURNING id',[title,input.priority??'Media',id,user.id]);if(!r.rowCount)fail('Tarea no encontrada.',404);}
  }
 }else if(method==='PATCH'){
  const r=await db.query('UPDATE tarea SET completed=NOT completed WHERE id=$1 AND user_id=$2 RETURNING id',[id,user.id]);if(!r.rowCount)fail('Tarea no encontrada.',404);
 }else if(method==='DELETE'){
  const r=await db.query(event?'DELETE FROM evento WHERE id=$1 AND user_id=$2 RETURNING id':'DELETE FROM tarea WHERE id=$1 AND user_id=$2 RETURNING id',[id,user.id]);if(!r.rowCount)fail('Registro no encontrado.',404);
 }
 const tasks=(await db.query('SELECT id,title,priority,completed FROM tarea WHERE user_id=$1 ORDER BY title',[user.id])).rows;
 const events=(await db.query('SELECT id,title,date::text,time,tipo category FROM evento WHERE user_id=$1 ORDER BY date,time',[user.id])).rows;return {version:1,tasks,events};
}
