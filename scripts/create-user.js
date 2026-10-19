import {randomUUID} from 'node:crypto';
import {readFile,unlink} from 'node:fs/promises';
import {database} from '../server/db.js';
import {passwordHash} from '../server/security.js';
try{process.loadEnvFile('.env.local');}catch{/* CI environment */}
if(process.env.DATABASE_BRANCH!=='development'||new URL(process.env.DATABASE_URL).hostname!==process.env.EXPECTED_DATABASE_HOST)throw new Error('Solo development.');
// Credentials come from a private JSON file; never use a password in argv or shell history.
const path=process.argv[2];if(!path)throw new Error('Indica archivo JSON privado con email, nombre, password.');
const input=JSON.parse(await readFile(path,'utf8'));const db=database();
try{await db.query('INSERT INTO app_user(id,email,nombre,password_hash) VALUES($1,$2,$3,$4)',[randomUUID(),input.email.trim().toLowerCase(),input.nombre,passwordHash(input.password)]);await unlink(path);console.log('Usuario creado; archivo temporal eliminado.');}finally{await db.end();}
