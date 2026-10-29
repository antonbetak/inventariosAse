BEGIN;
CREATE TABLE conciliacion_excel (
  id text PRIMARY KEY,
  archivo_hash text NOT NULL,
  criterio text NOT NULL,
  antes jsonb NOT NULL,
  despues jsonb NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
INSERT INTO schema_migration(version) VALUES('006');
COMMIT;
