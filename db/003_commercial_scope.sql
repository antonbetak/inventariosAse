BEGIN;
-- Persist classification independently of mutable names. No ledger rows are removed.
ALTER TABLE insumo ADD COLUMN es_prueba boolean NOT NULL DEFAULT false;
ALTER TABLE producto ADD COLUMN es_prueba boolean NOT NULL DEFAULT false;
ALTER TABLE movimiento ADD COLUMN es_prueba boolean NOT NULL DEFAULT false;
ALTER TABLE produccion ADD COLUMN es_prueba boolean NOT NULL DEFAULT false;
ALTER TABLE venta ADD COLUMN es_prueba boolean NOT NULL DEFAULT false;
ALTER TABLE historial_valor ADD COLUMN alcance_comercial boolean NOT NULL DEFAULT false;
UPDATE insumo SET es_prueba=true WHERE position('PRUEBA_PREVIEW' in upper(nombre))>0;
UPDATE producto SET es_prueba=true WHERE position('PRUEBA_PREVIEW' in upper(nombre))>0;
UPDATE produccion p SET es_prueba=true WHERE EXISTS(SELECT 1 FROM producto i WHERE i.id=p.producto_id AND i.es_prueba) OR EXISTS(SELECT 1 FROM produccion_insumo pi JOIN insumo i ON i.id=pi.insumo_id WHERE pi.produccion_id=p.id AND i.es_prueba);
UPDATE venta v SET es_prueba=true FROM producto p WHERE p.id=v.producto_id AND p.es_prueba;
UPDATE movimiento m SET es_prueba=true WHERE EXISTS(SELECT 1 FROM insumo i WHERE i.id=m.insumo_id AND i.es_prueba) OR EXISTS(SELECT 1 FROM producto p WHERE p.id=m.producto_id AND p.es_prueba) OR EXISTS(SELECT 1 FROM produccion p WHERE p.es_prueba AND p.fecha=m.fecha AND p.user_id=m.user_id);
INSERT INTO schema_migration(version) VALUES('003');
COMMIT;
