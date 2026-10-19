-- Execute only in development. Every test mutation is reverted by its subtransaction.
DO $verify$
DECLARE before_stock numeric; test_id integer; caught boolean;
BEGIN
 SELECT insumo_id,inventario_actual INTO test_id,before_stock FROM parametro_inventario ORDER BY insumo_id LIMIT 1;
 caught:=false;
 BEGIN UPDATE parametro_inventario SET inventario_actual=-1 WHERE insumo_id=test_id; EXCEPTION WHEN check_violation THEN caught:=true; END;
 IF NOT caught THEN RAISE EXCEPTION 'Negative stock accepted'; END IF;
 caught:=false;
 BEGIN INSERT INTO producto_insumo VALUES(-999,-999,1); EXCEPTION WHEN foreign_key_violation THEN caught:=true; END;
 IF NOT caught THEN RAISE EXCEPTION 'Orphan relation accepted'; END IF;
 caught:=false;
 BEGIN INSERT INTO venta_mensual(producto_id,anio,mes,unidades,precio_unitario,ingreso) SELECT producto_id,anio,mes,unidades,precio_unitario,ingreso FROM venta_mensual LIMIT 1; EXCEPTION WHEN unique_violation THEN caught:=true; END;
 IF NOT caught THEN RAISE EXCEPTION 'Duplicate monthly sale accepted'; END IF;
 IF (SELECT inventario_actual FROM parametro_inventario WHERE insumo_id=test_id)<>before_stock THEN RAISE EXCEPTION 'Failed operation changed stock'; END IF;
 IF (SELECT sum(ingreso) FROM venta_mensual)<>(SELECT valor::numeric FROM fuente_celda WHERE hoja='Hoja3' AND celda='N12' LIMIT 1) THEN RAISE EXCEPTION 'Historical total mismatch'; END IF;
 IF abs((SELECT sum(costo_merma) FROM proyeccion_semanal)-(SELECT valor::numeric FROM fuente_celda WHERE hoja='Hoja3' AND celda='D72' LIMIT 1))>.00001 THEN RAISE EXCEPTION 'Projected loss cost mismatch'; END IF;
END $verify$;
SELECT 'PASS: constraints, rollback, sales and projection reconciliation' verification,
 (SELECT count(*) FROM insumo) insumos,(SELECT count(*) FROM merma_registro) mermas,
 (SELECT sum(ingreso) FROM venta_mensual) ingreso_historico,
 (SELECT round(sum(litros_extra),4) FROM proyeccion_semanal) extra_proyectado;
