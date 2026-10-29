BEGIN;
ALTER TABLE insumo ADD COLUMN proveedor varchar(120) NOT NULL DEFAULT '';
ALTER TABLE parametro_inventario ADD COLUMN stock_minimo_manual numeric(12,6) CHECK(stock_minimo_manual>=0);
INSERT INTO schema_migration(version) VALUES('002');
COMMIT;
