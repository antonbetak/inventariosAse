BEGIN;
-- Unit costs (for example fractions of a peso per litre) must not round to cents.
-- Preserve the existing view definition while widening its underlying column.
DO $migration$
DECLARE view_definition text;
BEGIN
 SELECT pg_get_viewdef('inventario_reorden'::regclass,true) INTO view_definition;
 DROP VIEW inventario_reorden;
 ALTER TABLE insumo ALTER COLUMN precio_presentacion TYPE numeric(18,6);
 EXECUTE 'CREATE VIEW inventario_reorden AS ' || view_definition;
END $migration$;
ALTER TABLE produccion ALTER COLUMN costo_insumos TYPE numeric(18,6);
ALTER TABLE produccion ALTER COLUMN costo_adicional TYPE numeric(18,6);
ALTER TABLE movimiento ALTER COLUMN valor TYPE numeric(18,6);
INSERT INTO schema_migration(version) VALUES('005');
COMMIT;
