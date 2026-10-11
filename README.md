# Sanaté Inventarios 2.0

Frontend React con dark mode, paneles glass y navegación responsive. Esta versión utiliza **datos ilustrativos y una sesión mock local**, sin servidor ni base de datos conectados.

## Ejecutar

```sh
npm install
npm run dev
```

Credenciales demo: **admin@sanate.mx** o **admin**, contraseña **admin123**.

```sh
npm run test
npm run lint
npm run build
```

## Funciones de la demo

- Sesión persistente y cierre de sesión.
- 18 materias primas y 16 productos iniciales; crear, editar, borrar, buscar y filtrar.
- Entrada de materia prima y producción con consumo de insumos opcional, manual o mediante recetas ilustrativas.
- Dashboard con valor actual, alertas, distribución de stock, movimientos y 90 días de histórico sintético.
- Panel de productividad compartido por Dashboard, Materia Prima, Producto Terminado y Reportes. Permanece montado al cambiar de sección, conservando mes, selección y tareas.
- Calendario mensual navegable, selección de día y agenda de recordatorios.
- Desde 1200 px: columna derecha fija (310–330 px) con scroll interno. En tablet/móvil: panel desplegable debajo del contenido, sin posición fija.
- Checklist con prioridades, progreso y creación, finalización y eliminación de tareas persistentes.
- Reportes de reorden, merma y valor de movimientos; exportación CSV de todo el inventario de materia prima.
- Cambios persistidos en este navegador; el borrado conserva el historial de movimientos. Editar o borrar productos no vuelve a consumir ni repone insumos automáticamente.

## Arquitectura para la futura API

```text
Componentes React → servicios asíncronos → API REST futura → SQL
                                      ↘ almacenamiento mock actual
```

| Capa | Responsabilidad |
| --- | --- |
| `src/data/mockInventory.js` | Catálogos demo, movimientos iniciales y recetas por unidad |
| `src/data/mockReports.js` | Serie histórica ilustrativa, con 90 días hasta el 10 de octubre de 2026 |
| `src/data/mockDashboard.js` | Eventos relativos al día de primera apertura y tareas iniciales |
| `src/services/dashboardService.js` | Lectura y cambios de tareas con persistencia independiente del inventario |
| `src/data/mockUsers.js` | Usuario y credenciales de demostración |
| `src/services/authService.js` | `getSession`, `login`, `logout` |
| `src/services/inventoryService.js` | Lectura, CRUD, entradas y producción; valida cantidades y disponibilidad antes de guardar |
| `src/services/reportsService.js` | Resúmenes, reorden, histórico, actividad y filas exportables |
| `src/services/storage.js` | Claves, versión, inicialización y persistencia local |
| `src/hooks/useInventory.js` | Carga, actualización después del CRUD y sincronización de inventario entre pestañas |

Para conectar el backend, sustituir las implementaciones de los servicios por peticiones HTTP manteniendo sus contratos de retorno y errores. Los DTO usan identificadores de texto y fechas ISO. La capa de API deberá aplicar autenticación real, autorización, validación y transacciones de stock; React no debe contener drivers ni credenciales SQL. Las rutas siguientes son una propuesta de contrato, **no endpoints implementados**:

- `POST /api/session`, `GET /api/session`, `DELETE /api/session`
- `GET/POST /api/raw-materials`, `PATCH/DELETE /api/raw-materials/:id`
- `POST /api/raw-materials/:id/entries`
- `GET/POST /api/finished-products`, `PATCH/DELETE /api/finished-products/:id`
- `GET /api/reports/summary`, `GET /api/reports/export`

La sesión actual es una simulación local, sin verificación de servidor. La contraseña no se guarda en la sesión persistida; las credenciales demo forman parte del frontend.

## Persistencia

Claves centralizadas en `STORAGE_KEYS`:

- `sanate_mock_session`: sesión mock.
- `sanate_inventory_demo_v1`: materias primas, productos, movimientos e histórico en un único documento versionado. Una sola escritura evita guardar parcialmente una receta cuando el almacenamiento falla.
- `sanate_active_tab`: navegación.
- `sanate_dashboard_demo_v1`: eventos y tareas; se inicializan una sola vez y no se regeneran cada mes. Las tareas se sincronizan entre pestañas.

Los datos se inicializan solamente si no existe inventario guardado. No se mezclan ni se borran claves de versiones anteriores. Los datos corruptos muestran un error y no se reemplazan automáticamente. Para reiniciar intencionalmente la demo, eliminar solo `sanate_inventory_demo_v1` desde las herramientas del navegador y recargar; esta acción descarta los cambios demo locales.

Los movimientos iniciales y la evolución anterior son ilustrativos, no un libro contable reconstruido. El último punto de valor se actualiza con las operaciones locales. El valor de producto terminado se calcula como cantidad × precio de venta; el de materia prima, stock × costo por unidad. Las unidades físicas distintas no se comparan en la gráfica de movimientos: se usa MXN.

## Identidad visual

Se reutiliza el logo original `src/assets/Logo.png`, con una copia en `public/sanate-logo.png` para el favicon. El logo original utiliza teal y azul marino; el acento claro de la interfaz es **#74C7EE**, centralizado en `--accent-primary`, junto con sus tokens de hover y fondo suave en `src/index.css`. El PNG ya contiene transparencia: se retiró la placa blanca CSS y se usa un filtro de brillo suave para hacer legible el azul marino en fondos oscuros, conservando el asset original. La interfaz no muestra banners de demostración ni credenciales; los servicios y el almacenamiento mock se mantienen internamente. El login presenta ondas de agua animadas mediante transform y opacidad; respeta `prefers-reduced-motion`. Se conservan AppShell, sidebar colapsable, navegación móvil, componentes UI glass, modales accesibles y animaciones breves.

La capa Liquid Glass comparte los tokens `--glass-fill`, `--glass-edge`, `--glass-shadow`, `--glass-control` y `--glass-active`. Usa blur estable por nivel, superficies anidadas sin blur, microinteracciones cortas y movimiento reducido. Dashboard y Reportes se cargan por separado; sus gráficas están aisladas de cambios de formularios y filtros. La auditoría, medición local, límites y comparación de bundles están en [docs/PERFORMANCE.md](docs/PERFORMANCE.md).
