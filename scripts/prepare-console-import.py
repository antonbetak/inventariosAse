"""Generate a private, atomic SQL import for the Neon SQL editor when TCP is unavailable."""
import json,sys
from pathlib import Path
d=json.loads(Path(sys.argv[1]).read_text())
payload=json.dumps(d,ensure_ascii=False).replace('$payload$','')
sql='''DO $import$
DECLARE d jsonb := $payload$PAYLOAD$payload$::jsonb; import_id text; unit_id integer; r jsonb; new_id integer;
BEGIN
 PERFORM pg_advisory_xact_lock(735241);
 import_id := 'excel-'||(d->>'hash')||'-'||(d->>'anio');
 IF EXISTS(SELECT 1 FROM importacion WHERE id=import_id) THEN RAISE NOTICE 'Archivo ya importado; sin cambios'; RETURN; END IF;
 IF EXISTS(SELECT 1 FROM importacion) THEN RAISE EXCEPTION 'Otra importación requiere conciliación'; END IF;
 INSERT INTO importacion VALUES(import_id,d->>'hash',(d->>'anio')::int,now());
 INSERT INTO unidad_medida(nombre,abreviatura) VALUES('Unidad pendiente de validar','s/d') RETURNING id INTO unit_id;
 FOR r IN SELECT value FROM jsonb_array_elements(d->'insumos') LOOP
  INSERT INTO insumo(nombre,unidad_id,consumo_prom,periodo_consumo) VALUES(r->>'nombre',unit_id,(r->>'demanda')::numeric,'diario') RETURNING id INTO new_id;
  INSERT INTO parametro_inventario VALUES(new_id,(r->>'demanda')::numeric,(r->>'entrega')::numeric,.95,.15,(r->>'revision')::numeric,(r->>'stock')::numeric);
 END LOOP;
 FOR r IN SELECT value FROM jsonb_array_elements(d->'mermas') LOOP
  INSERT INTO merma_registro(insumo_id,cantidad_inicial,cantidad_final,periodo_fuente,importacion_id) SELECT id,(r->>'inicial')::numeric,(r->>'final')::numeric,'Hoja2 filas 48–49, sin fecha',import_id FROM insumo WHERE nombre=r->>'nombre';
 END LOOP;
 FOR r IN SELECT value FROM jsonb_array_elements(d->'productos') LOOP
  INSERT INTO producto(nombre,litros_unidad,precio_venta) VALUES(r->>'nombre',(r->>'litros')::numeric,(r->>'precio')::numeric);
 END LOOP;
 FOR r IN SELECT value FROM jsonb_array_elements(d->'ventas') LOOP
  INSERT INTO venta_mensual(producto_id,anio,mes,unidades,precio_unitario,ingreso,importacion_id) SELECT id,(d->>'anio')::int,(r->>'mes')::int,(r->>'unidades')::int,(r->>'precio')::numeric,(r->>'ingreso')::numeric,import_id FROM producto WHERE nombre=r->>'nombre';
 END LOOP;
 FOR r IN SELECT value FROM jsonb_array_elements(d->'proyecciones') LOOP
  INSERT INTO proyeccion_semanal VALUES((d->>'anio')::int,(r->>'semana')::int,(r->>'garrafon')::int,(r->>'botella1')::int,(r->>'botella500')::int,(r->>'agua_neta')::numeric,(r->>'agua_disponible')::numeric,(r->>'agua_con_merma')::numeric,(r->>'litros_extra')::numeric,(r->>'litros_merma')::numeric,(r->>'costo_merma')::numeric,(r->>'yield_pct')::numeric,import_id);
 END LOOP;
 INSERT INTO fuente_celda SELECT import_id,x.hoja,x.celda,x.valor,x.formula FROM jsonb_to_recordset(d->'celdas') x(hoja text,celda text,valor text,formula text);
 IF (SELECT sum(ingreso) FROM venta_mensual WHERE importacion_id=import_id) <> (d->'resumen'->>'ingresos')::numeric THEN RAISE EXCEPTION 'No concilia ingreso histórico'; END IF;
 IF (SELECT count(*) FROM insumo)<>17 OR (SELECT count(*) FROM venta_mensual)<>18 OR (SELECT count(*) FROM proyeccion_semanal)<>24 THEN RAISE EXCEPTION 'No concilian cantidades'; END IF;
END $import$;
SELECT (SELECT count(*) FROM insumo) insumos,(SELECT count(*) FROM producto) productos,(SELECT count(*) FROM venta_mensual) ventas,(SELECT sum(ingreso) FROM venta_mensual) ingresos,(SELECT count(*) FROM proyeccion_semanal) semanas,(SELECT count(*) FROM fuente_celda) celdas;
'''.replace('PAYLOAD',payload)
Path(sys.argv[2]).write_text(sql)
print('SQL privado preparado; no incluir en Git.')
