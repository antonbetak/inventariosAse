# Entrega técnica — Sanaté 2.0

Fecha de validación: 20 de octubre de 2026. Rama autorizada: `feat/postgres-neon`. Entorno SQL: Neon **development**. Este documento distingue funcionalidad implementada, evidencia ejecutada e información que debe aportar el negocio.

## Módulos entregados

| Módulo | Comportamiento implementado |
|---|---|
| Autenticación | Login por correo, errores de credenciales, logout, sesiones independientes, caducidad y limpieza del cliente |
| Dashboard y estadísticas | Indicadores comerciales sin pruebas, históricos separados, valuaciones pendientes explícitas y proyecciones identificadas |
| Materia prima | Alta, edición, baja lógica, unidades, costos pendientes, entradas, ajustes y búsqueda/filtros |
| Producto terminado | Catálogo, precio de venta, conteo explícito, estado por confirmar, ajustes y baja lógica |
| Producción y recetas | Recetas validadas en servidor o consumos reales manuales, consumo atómico, stock producido y costo del lote |
| Ventas | Descuento atómico, ingreso registrado y control concurrente de existencias |
| Mermas | Captura real con fecha/motivo y descuento de stock; muestras importadas sin fecha conservadas aparte |
| Gastos y costos | Gastos fechados, costos adicionales de lote, filtros, exportación y totales no calculables si faltan costos |
| Reportes y CSV | Filtros por periodo/producto/origen, referencias trazables, exclusión de pruebas y marcación de solapamientos |
| Calendario y agenda | Navegación mensual y CRUD de recordatorios por usuario con fecha/hora |
| Tareas | Alta, edición, completar y eliminar, persistencia SQL y aislamiento por usuario |
| Configuración/usuarios | No hay módulo de administración en la interfaz. Alta inicial por script privado; no existe registro público |

## Correcciones de este cierre

- Confirmación de stock persistente en `producto.stock_confirmado`; archivar o editar metadatos no confirma un conteo desconocido.
- Cantidades de producto enteras y no negativas; ninguna producción, venta o merma puede usar existencias sin confirmar.
- Consumo por receta calculado dentro de la transacción SQL, sin confiar en consumos manipulados por el cliente. Cambiar unidades invalida recetas dependientes.
- Costos de insumos de lote capturados al producir; los costos desconocidos quedan NULL y no se recalculan retroactivamente con precios nuevos.
- Agenda con escrituras reales, edición de tareas, fecha/hora validadas y autorización por propietario.
- Costos y muestras desconocidas ya no se presentan como ceros confirmados. Las gráficas omiten valuaciones sin evidencia suficiente.
- Pantalla de recuperación ante errores de render, recarga acotada para imports fallidos, detección de versión nueva sin descartar formularios y mensaje recuperable ante fallo de red.
- Manejo de conexiones SQL inactivas interrumpidas y preservación del error original si una conexión cerrada impide ejecutar rollback.
- Lockfile corregido para incluir PostgreSQL y reproducir la instalación con `npm ci`; dependencias actualizadas dentro de rangos compatibles.

## Base de datos y privacidad

Migraciones aplicadas: **001, 002, 003, 004 y 005**, exclusivamente en development. La 004 incorpora confirmación de stock, evidencia de valor, costos por producción, gastos y merma operativa con FK a su movimiento. La 005 amplía la precisión de costos fraccionarios sin redondear precios unitarios a centavos. No migra durante el build ni reimporta el Excel.

Se conservan las ventas históricas, referencias de importación y las celdas originales. La auditoría monetaria y todos los resultados comerciales detallados permanecen en `private/`, excluidos del repositorio. Las fixtures se clasifican como pruebas; sus operaciones no se borran para ocultar diferencias. Los usuarios temporales de QA se desactivan al terminar.

No se hace merge ni force push, no se promueve a producción y no se modifica Neon production. El otro proyecto Vercel no se modifica manualmente; su conexión Git existente puede generar un Preview automático.

## Pruebas y reproducción

| Verificación | Evidencia |
|---|---|
| Instalación limpia | `npm ci` ejecutado correctamente con el lockfile corregido |
| Pruebas unitarias/contratos | `npm test`: 18/18 pruebas de cálculos, clasificación, fechas, rutas, seguridad, sesión y recuperación |
| Integración de inventario SQL | `scripts/qa-development.js`: 9/9; consumo, stock, rollback, concurrencia, recetas, desconocidos y exclusión de pruebas |
| Integración HTTP | `scripts/qa-http-development.js`: 12/12, incluidas cookies Secure de producción y rate limit; sesión, cookies, Origin, CRUD, rutas anidadas, tareas y caducidad |
| Integración del cierre | `scripts/qa-delivery-development.js`: 14/14 comprobaciones de recetas autoritativas, costos, merma, gastos, calendario, tareas, autorización e integridad fuente |
| Navegadores reales | `scripts/qa-browser.js`; resultados y capturas en `private/browser-qa/`. La secuencia final ejecutada incluye 21 comprobaciones; el resultado y sus límites deben acompañar el smoke de Preview |
| Calidad y dependencias | Lint y build correctos; `npm audit` sin vulnerabilidades reportadas en el lockfile verificado |

Los scripts de integración exigen DATABASE_BRANCH=development y coincidencia exacta con EXPECTED_DATABASE_HOST. La prueba de navegador usa el build real, API real y SQL development en un servidor temporal de loopback, con un usuario independiente. No modifica ni necesita la contraseña del administrador.

## Seguridad

Sesiones aleatorias almacenadas como hash; contraseñas scrypt con sal. Cookies HttpOnly/SameSite=Strict y Secure en Vercel. Origin exacto en escrituras, límite de login persistente, parámetros SQL, TLS verify-full, errores públicos sin SQL ni credenciales y operaciones de stock transaccionales bajo bloqueo. Bajas, recetas, fechas de muestras y costos de lote posteriores exigen administrador. Eventos y tareas comprueban al propietario. No se crean endpoints públicos de administración o pruebas.

El QA de red no reenvía mutaciones: una respuesta incierta exige comprobar stock y movimientos antes de repetir. Esta entrega no incorpora claves de idempotencia ni operación sin conexión.

## Procedimiento de despliegue

1. Ejecutar instalación limpia, tests, integraciones, QA de navegador, lint y build.
2. Revisar diff, archivos ignorados y patrones de credenciales; versionar solamente fuentes, pruebas y documentación.
3. Commit y push normal a la rama autorizada.
4. Confirmar en Vercel Ready/Preview, SHA y alias exactos de `sanate-inventarios-2`.
5. Probar la aplicación protegida, rutas API y persistencia SQL desde el alias. Revisar logs sin mostrar secretos.

Alias de la rama:
https://sanate-inventarios-2-git-feat-postg-294cb7-antonbetaks-projects.vercel.app

## Datos comerciales pendientes y límites

- Costos y unidades comerciales validados de los insumos importados.
- Conteos físicos reales de productos importados; no se deducen de ventas o proyecciones.
- Recetas comerciales reales y fechas de las muestras de merma.
- Gastos y costos adicionales de producción reales, con cobertura suficiente del periodo.

Los formularios permiten completar esos datos progresivamente. El sistema no implementa contabilidad completa, costo de ventas por lote ni utilidad certificada: registrar algunos gastos o costos no prueba que todos estén capturados. El stock a precio de venta se identifica expresamente y no se usa como costo contable.

La emulación de tamaños y motores no equivale a prueba sobre teléfonos físicos. Las pruebas locales, incluso con navegadores reales y SQL, no sustituyen el smoke de la Preview protegida. Cualquier prueba esencial sin evidencia o error crítico abierto debe constar en el informe final; no se declara aprobación total por un build exitoso.
