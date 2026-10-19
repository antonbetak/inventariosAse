# Sanaté Inventarios 2.0 — PostgreSQL

React + API Node + PostgreSQL en Neon. La aplicación ya no usa Firebase ni mocks como almacenamiento. Conserva la interfaz de Sanaté y añade operaciones de ventas y producción.

## Desarrollo

Requiere Node 22 o superior.

```sh
npm ci
cp .env.example .env.local
```

Configura DATABASE_URL con la conexión de la rama development y APP_ORIGIN con el origen del frontend. Nunca uses el prefijo VITE_ para la conexión.

```sh
npm run db:migrate
npm run api:dev
# En otra terminal:
npm run dev
```

## Importación privada

```sh
python3 scripts/extract_excel.py private/reference.xlsx 2026 private/import.json
npm run db:import -- private/import.json
```

La importación es atómica; repetir el mismo archivo y año no duplica datos. Un archivo distinto exige conciliación. Ante falta de TCP, `scripts/prepare-console-import.py` genera SQL privado equivalente para el SQL Editor de development. No versionar ese archivo.

## Primer administrador

Crear un JSON privado con email, nombre y password (mínimo 12 caracteres). Ejecutar:

```sh
npm run db:create-user -- private/new-user.json
```

El comando elimina el archivo tras un alta exitosa. No hay contraseñas demo ni alta pública.

## Verificación

```sh
npm test
npm run lint
npm run build
```

Ejecuta `db/verify.sql` exclusivamente en development para comprobar restricciones y conciliación. Para la validación completa hay que probar también login, recarga, persistencia, producción y concurrencia contra la base.

## Vercel

La configuración incluye build y API. Configura DATABASE_URL y APP_ORIGIN como variables privadas del servidor. Usa development en Preview. Las migraciones no se ejecutan al hacer build. Producción requiere autorización previa.

Consulta [el informe de implementación](docs/SQL_IMPLEMENTATION.md) para evidencia, decisiones del modelo, datos importados y límites de validación. Faltan costos/unidades y recetas comerciales en las hojas de origen; la interfaz advierte que la valuación es parcial. Las proyecciones no se contabilizan como ventas reales.
