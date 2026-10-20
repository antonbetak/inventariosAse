import {readFile} from 'node:fs/promises';
import {database} from '../server/db.js';
try{process.loadEnvFile('.env.local');}catch{/* CI environment */}
const url=new URL(process.env.DATABASE_URL??'http://missing');
if(process.env.DATABASE_BRANCH!=='development'||url.hostname!==process.env.EXPECTED_DATABASE_HOST)throw new Error('Migración bloqueada: exige development y host explícitamente validado.');
const db=database();
try {
  const exists=await db.query("SELECT to_regclass('public.schema_migration') present");
  if(!exists.rows[0].present)await db.query(await readFile(new URL('../db/001_schema.sql',import.meta.url),'utf8'));
  const versions=await db.query('SELECT version FROM schema_migration');
  if(!versions.rows.some(r=>r.version==='002'))await db.query(await readFile(new URL('../db/002_fields.sql',import.meta.url),'utf8'));
  if(!versions.rows.some(r=>r.version==='003'))await db.query(await readFile(new URL('../db/003_commercial_scope.sql',import.meta.url),'utf8'));
  if(!versions.rows.some(r=>r.version==='004'))await db.query(await readFile(new URL('../db/004_delivery.sql',import.meta.url),'utf8'));
  if(!versions.rows.some(r=>r.version==='005'))await db.query(await readFile(new URL('../db/005_cost_precision.sql',import.meta.url),'utf8'));
  console.log('Esquema 005 listo.');
}finally{await db.end();}
