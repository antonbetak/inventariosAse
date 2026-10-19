import pg from 'pg';
let pool;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('Falta configurar DATABASE_URL en el servidor.');
  const url=new URL(process.env.DATABASE_URL);url.searchParams.set('sslmode','verify-full');
  return pool ??= new pg.Pool({connectionString:url.toString(),max:3,connectionTimeoutMillis:15000,idleTimeoutMillis:10000});
}
export async function transaction(fn) {
  const c=await database().connect();
  try { await c.query('BEGIN'); const result=await fn(c); await c.query('COMMIT'); return result; }
  catch(e) {await c.query('ROLLBACK');throw e;}
  finally {c.release();}
}
export async function captureHistory(c) {
  await c.query(`INSERT INTO historial_valor(fecha,materia_prima,producto_terminado)
    SELECT current_date,coalesce((SELECT sum(p.inventario_actual*i.precio_presentacion/i.cantidad_presentacion) FROM insumo i JOIN parametro_inventario p ON p.insumo_id=i.id WHERE i.activo),0),coalesce((SELECT sum(cantidad*precio_venta) FROM producto WHERE activo),0)
    ON CONFLICT(fecha) DO UPDATE SET materia_prima=excluded.materia_prima,producto_terminado=excluded.producto_terminado`);
}
