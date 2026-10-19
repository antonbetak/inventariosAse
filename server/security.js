import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export function passwordHash(password) {
  if(typeof password!=='string'||password.length<12||password.length>256) throw new Error('La contraseña debe tener entre 12 y 256 caracteres.');
  const salt=randomBytes(16).toString('hex');return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;
}
export function verifyPassword(password,hash) {
  if(typeof password!=='string'||password.length>256)return false;
  const [salt,digest]=hash.split(':');const actual=scryptSync(password,salt,64);const expected=Buffer.from(digest,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
export function numeric(value,label,{positive=false,integer=false}={}) {
  if(!['string','number'].includes(typeof value)||(typeof value==='string'&&!value.trim())||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>1e9||(positive&&Number(value)<.000001)||(integer&&!Number.isInteger(Number(value))))fail(`${label}: cantidad no válida.`);
  return Number(value);
}
export function required(value,label,max=120){if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail(`${label}: texto no válido.`);return value.trim();}
export function checkOrigin(req) {
  const expected=process.env.APP_ORIGIN;
  if(!expected)fail('APP_ORIGIN no está configurado.',503);
  if(req.headers.origin!==expected)fail('Origen no permitido.',403);
}
