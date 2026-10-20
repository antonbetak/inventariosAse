BEGIN;
ALTER TABLE producto ADD COLUMN stock_confirmado boolean NOT NULL DEFAULT true;
UPDATE producto p SET stock_confirmado=false WHERE EXISTS(SELECT 1 FROM venta_mensual v WHERE v.producto_id=p.id) AND NOT EXISTS(SELECT 1 FROM movimiento m WHERE m.producto_id=p.id);
ALTER TABLE movimiento ADD COLUMN valor_conocido boolean NOT NULL DEFAULT false;
-- Earlier entries did not retain enough valuation evidence to certify their cost.
ALTER TABLE produccion ADD COLUMN costo_insumos numeric(18,4) CHECK(costo_insumos>=0);
ALTER TABLE produccion ADD COLUMN costo_adicional numeric(18,4) CHECK(costo_adicional>=0);
CREATE TABLE gasto_operativo (
 id uuid PRIMARY KEY, fecha date NOT NULL, concepto varchar(200) NOT NULL,
 importe numeric(14,2) NOT NULL CHECK(importe>0), es_prueba boolean NOT NULL DEFAULT false,
 user_id uuid NOT NULL REFERENCES app_user(id), creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE merma_operativa (
 id uuid PRIMARY KEY, movimiento_id uuid UNIQUE NOT NULL REFERENCES movimiento(id),
 fecha date NOT NULL, motivo varchar(200) NOT NULL, user_id uuid NOT NULL REFERENCES app_user(id)
);
INSERT INTO schema_migration(version) VALUES('004');
COMMIT;
