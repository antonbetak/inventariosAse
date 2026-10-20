# Sanaté Inventarios 2.0

Aplicación de inventario, producción, ventas y agenda: React → API Node del mismo origen → PostgreSQL de Neon. La interfaz Liquid Glass conserva navegación de escritorio y móvil. No usa mocks como almacenamiento.

## Tecnologías y arquitectura

- React 19, Vite 7, Tailwind CSS 4, Recharts y Lucide.
- API Node en `api/index.js`; SQL parametrizado mediante `pg`, TLS con certificado verificado.
- Sesiones PostgreSQL de ocho horas, cookies HttpOnly/SameSite y Secure en Vercel, contraseñas scrypt, validación de Origin y límite persistente de intentos.
- Las mutaciones de stock, movimientos y consumos comparten transacción y bloqueo. Los catálogos se archivan sin borrar operaciones.
- Vercel sirve React y una función API. `__route` conserva las rutas anidadas. El build no migra ni importa datos.

## Instalación local

Requiere Node 22 o superior y npm. Ejecuta en el checkout de `feat/postgres-neon`:

```sh
npm ci
cp .env.example .env.local
```

Configura las variables privadas del servidor:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL de development; nunca usar prefijo `VITE_` |
| `APP_ORIGIN` | Origen exacto del frontend; local `http://localhost:5173`, Preview HTTPS sin barra final |
| `DATABASE_BRANCH` | `development`, guarda para scripts de migración y QA |
| `EXPECTED_DATABASE_HOST` | Host development validado independientemente; debe coincidir con la conexión |

No imprimas ni versiones `.env.local`, credenciales, Excel ni archivos de `private/`.

```sh
npm run api:dev
# En otra terminal:
npm run dev
```

El servidor local de Vite envía `/api` a `127.0.0.1:3001`.

## Base de datos

Las migraciones 001–005 se ejecutan explícitamente mediante `npm run db:migrate`, exclusivamente con las guardas development/host verificadas. Las versiones aplicadas se consultan en `schema_migration`; no se repiten ni se ejecutan en el build. La 004 añade confirmación explícita de stock, evidencia de valuación, costos por lote, gastos y merma operativa. Conserva las celdas fuente y las ventas históricas. La 005 amplía costos unitarios y de lote a seis decimales para evitar redondeos silenciosos; precios de venta y gastos admiten centavos.

La importación privada utiliza solamente Hoja2 y Hoja3. **La base existente ya está importada: no volver a importarla como parte del arranque o despliegue.** El importador es transaccional e idempotente para archivo/año; un archivo distinto exige conciliación. La auditoría independiente puede ejecutarse sin modificar el Excel:

```sh
python3 scripts/audit-sales.py private/reference.xlsx private/sales-audit.json
```

Para una instalación nueva, un administrador se crea mediante `npm run db:create-user -- private/new-user.json` (email, nombre y password de 12–256 caracteres). El script elimina ese archivo tras un alta exitosa. No existe registro público ni credencial demo. No ejecutar ese flujo para restablecer al administrador existente.

## Manual básico

1. **Login:** utiliza el correo registrado. Cerrar sesión revoca esa sesión; la caducidad devuelve al login y limpia datos del cliente.
2. **Materia prima:** crea o edita nombre, unidad, proveedor, stock y costo. Costo vacío significa pendiente; cero explícito significa costo confirmado de cero. La unidad `s/d` bloquea entradas, consumo y merma hasta validarla. Registrar entrada suma stock; editar stock registra ajuste.
3. **Producto terminado:** captura presentación, precio de venta y existencias. Los productos importados sin conteo siguen “Por confirmar”. Deja su cantidad vacía al editar otros campos; escribe el conteo físico real para confirmarlos. Las cantidades de productos son unidades enteras.
4. **Recetas:** en Operaciones → Completar datos comerciales, selecciona producto e insumos por una unidad de producto. Guardar reemplaza la receta y valida unidades/ámbito; no consume stock. Cambiar la unidad de un insumo invalida sus recetas para revisión.
5. **Producción:** selecciona producto, unidades y receta validada. El servidor calcula el consumo; no confía en cantidades de receta enviadas por el cliente. También permite consumo real manual, identificado explícitamente. La operación consume insumos y aumenta producto en la misma transacción.
6. **Costos de lote:** el costo de insumos se captura con los datos disponibles al producir. El costo adicional puede capturarse en producción o completarse posteriormente por un administrador. Un costo faltante mantiene el total “No calculable”. El costo de insumos pendiente puede completarse con respaldo real del lote y auditoría de la corrección; el costo conocido al producir no se sobrescribe ni se reconstruye con precios nuevos.
7. **Venta:** selecciona producto y unidades. Descuenta stock y registra ingreso a precio de venta. El servidor rechaza stock insuficiente y protege solicitudes concurrentes.
8. **Merma operativa:** registra fecha, inventario, cantidad y motivo. Descuenta stock y conserva un movimiento enlazado; no reemplaza las muestras del Excel. Las fechas reales de muestras históricas se completan aparte por un administrador.
9. **Gastos:** captura fecha, concepto e importe. Los registros filtrados se pueden exportar; ausencia de registros no prueba gasto real de cero.
10. **Reportes:** filtra ingresos por mes, producto y origen. Históricos y operaciones permanecen separados; un solapamiento exige conciliación. La exportación de ingresos respeta exactamente los filtros. El CSV de inventario incluye el catálogo comercial completo y conserva costos pendientes.
11. **Agenda:** navega meses y selecciona un día para agregar, editar o eliminar recordatorios. Las tareas permiten alta, edición, completar y eliminar. Cada usuario consulta sus propios recordatorios y tareas; en móvil abre “Agenda y tareas”.

Las bajas de catálogo requieren administrador. Las recetas, fechas de muestras y costos posteriores de lote también requieren administrador. No hay un módulo de configuración o administración de usuarios en la interfaz.

## Definiciones comerciales

- Ingresos históricos, ingresos de operaciones y proyecciones son conceptos separados.
- Los ingresos no son utilidad. La utilidad permanece pendiente hasta contar con costos y cobertura comercial suficientes; esta entrega no implementa un libro contable completo ni costo de ventas por lote.
- El stock de productos a precio de venta no es costo contable. Los costos y stocks desconocidos se muestran pendientes, no como ceros confirmados.
- La clasificación persistente `es_prueba` no cambia al renombrar. Indicadores y reportes excluyen pruebas por defecto; los controles explícitos permiten validarlas. No se permite producción entre ámbitos distintos.
- Las muestras sin fecha no se presentan como merma mensual real. Las proyecciones nunca suman ventas ni producción.

## Verificación

```sh
npm ci
npm test
npm run lint
npm run build
npm audit
```

Pruebas explícitas contra development (crean fixtures de prueba y conservan sus operaciones):

```sh
node scripts/qa-development.js
node scripts/qa-http-development.js
node scripts/qa-delivery-development.js
npx playwright install chromium webkit
node scripts/qa-browser.js
```

El QA de navegador sirve temporalmente el build y la API en loopback, usa PostgreSQL development y un usuario temporal que se desactiva al terminar; no utiliza la contraseña del administrador. Sus capturas/resultados se guardan en `private/browser-qa/`. Exige un build previo. Comprueba Chromium de escritorio/tablet/Android y WebKit de iPhone, además de red, sesión y módulos fallidos. Los tamaños emulados no sustituyen pruebas sobre teléfonos físicos.

## Preview y entrega

Proyecto autorizado: `sanate-inventarios-2`, rama `feat/postgres-neon`.

https://sanate-inventarios-2-git-feat-postg-294cb7-antonbetaks-projects.vercel.app

Configura conexión development y APP_ORIGIN privado igual al alias exacto. Conserva las protecciones Vercel. Después de cada push, verifica Ready, commit, alias, API y persistencia; un build exitoso no basta. La conexión Git también puede activar un Preview del otro proyecto; no manipular su configuración.

Hay recuperación acotada de imports fallidos, una pantalla de error con recarga y aviso de versión nueva que permite guardar formularios antes de actualizar. Una operación con respuesta de red incierta debe comprobarse antes de repetirla; no se reenvían mutaciones automáticamente.

Consulta [ENTREGA_FINAL](docs/ENTREGA_FINAL.md) para evidencia y límites, y [SQL_IMPLEMENTATION](docs/SQL_IMPLEMENTATION.md) para evolución técnica. Producción requiere autorización separada: no se hace merge, promoción ni migración de production en este flujo.
