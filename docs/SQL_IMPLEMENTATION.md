# Sanaté SQL: implementación y validación

## Entorno

- Origen local auditado: `/Users/anton/Documents/inventariosAse`, rama `sanate-2.0`, commit `5b6e3b3`.
- Copia aislada: `/Users/anton/Documents/Codex/2026-10-19/new-chat-2/sanate`, rama `feat/postgres-neon`.
- Neon: proyecto Sanaté; rama de pruebas `development` (`br-autumn-glitter-b5zhhqxp`), hija de `production`, sin caducidad automática.
- No se modificó la base `production`, ni se desplegó ni se enviaron cambios al repositorio remoto.
- La conexión se guardó en `.env.local`, ignorado por Git, con permisos 0600. El backend fuerza verificación de certificado TLS. React no recibe la conexión.

## Arquitectura

React → servicios HTTP del mismo origen → API Node para Vercel → PostgreSQL.

La API implementa sesión, inventario, CRUD de insumos y productos, entradas, ventas, producción, recetas validadas y tareas. Las sesiones usan cookies HttpOnly/SameSite, tokens aleatorios cuyo hash se guarda en PostgreSQL y caducidad de 8 horas. Las contraseñas usan scrypt y sal aleatoria. Hay límites persistentes de intentos de login, comprobación de Origin en escrituras y validación de cantidades. Las consultas usan parámetros. Los errores públicos no incluyen SQL ni credenciales.

Las operaciones de inventario se serializan con un bloqueo transaccional y comprueban disponibilidad bajo bloqueo de filas. Consumo de insumos, producción, ventas y movimientos se confirman juntos; un error revierte el conjunto. Las bajas son lógicas y conservan historial. Se mantiene el diseño, los componentes y la navegación responsiva, con una sección adicional de operaciones.

## Modelo y ajustes explícitos

Se crearon las diez tablas del modelo: configuracion, unidad_medida, nivel_servicio, insumo, parametro_inventario, producto, producto_insumo, merma_registro, venta_mensual y pedido_pipa. Se añadieron tablas de operaciones, sesiones, usuarios, tareas, eventos, importación, celdas fuente, proyecciones y valor diario.

El modelo marca `litros_base` como FK sin identificar una clave de destino. Se conserva como cantidad numérica y su configuración base en `configuracion`, en vez de inventar una referencia. Las cantidades de pipas admiten decimales para no truncar los resultados del Excel. `semana` de las proyecciones es la semana relativa del semestre (1–24), no la semana ISO del año.

Se amplió la precisión de demanda diaria y de las muestras de merma para conservar la información de origen. El costo de presentación admite NULL y las mermas admiten fecha NULL: las hojas solicitadas no aportan esos datos. Estos ajustes evitan inventar precios y fechas. El proveedor y el mínimo manual son extensiones de la interfaz actual.

## Datos de las hojas 2 y 3

El usuario confirmó 2026 como año. La extracción conserva las 1,416 celdas no vacías, sus valores y fórmulas, además del SHA-256 del Excel. El importador concilia los ingresos con Decimal y valida cantidades y costos de merma. La importación completa es transaccional e idempotente para el mismo archivo y año; un archivo distinto exige conciliación, no sobrescribe existencias.

| Información | Resultado |
|---|---:|
| Insumos y parámetros de inventario | 17 |
| Productos | 3 |
| Ventas mensuales reales enero–junio | 18 |
| Muestras de merma sin fecha | 8 |
| Semanas de planeación julio–diciembre | 24 |
| Ingresos históricos | [importe conciliado; ver informe privado] |
| Costo proyectado de merma de agua | [importe conciliado; ver informe privado] |
| Litros extra proyectados con merma | [litros conciliados; ver informe privado] |

Los datos de julio–diciembre son proyecciones y no aumentan las ventas, la producción ni el inventario real. El stock de insumos se toma de Hoja2 fila 35. El Excel no indica existencias de producto terminado; se inicializan en cero, no a partir de ventas históricas. No se fabrican movimientos históricos ni se reconstruye una gráfica de valuación a partir de ventas.

La fórmula de reorden usa d·L + z·(d·σ)·√L; el pedido sugerido usa d·(T+L) + z·(d·σ)·√(T+L) − I, limitado a cero. Se conserva precisión antes de presentar. Las cifras redondeadas del Excel quedan en las celdas fuente. Las fórmulas de pedido del Excel (por ejemplo G31 y M31) suman σ·√(T+L) sin multiplicarlo por z; la recomendación SQL incluye z para que el nivel de servicio tenga efecto. Por ello no se presenta como idéntica al pedido calculado por Excel. Ambas referencias se conservan para revisión. El cálculo de merma del agua conserva el supuesto explícito del Excel; no prueba una pérdida real del proceso.

## Pendientes de información comercial

- Costos y unidades de los 17 insumos: las hojas 2 y 3 no contienen un catálogo completo. Se muestran como pendientes, con una advertencia de valuación parcial. Costo cero en la presentación es un importe aún desconocido, no una compra gratuita.
- Recetas reales: no hay una matriz producto–insumo validada en estas hojas. No se cargaron recetas inventadas. La producción permite capturar consumos reales del lote; las unidades deben validarse antes de operar.
- Fechas de las ocho muestras de merma y existencias físicas de producto terminado.
- Administrador inicial creado en development mediante el mecanismo privado y una contraseña definida por el usuario. No se reutilizan las credenciales demo.

## Evidencia y límites

Aplicación de `001_schema.sql` en SQL Editor de Neon: 33 sentencias, COMMIT exitoso. Importación SQL atómica: DO y SELECT exitosos; consulta confirmó 17/3/18/24/1416 y [importe conciliado; ver informe privado]. Se aplicó también la extensión `002_fields.sql`.

`db/verify.sql` ejecutado en Neon: PASS para stock no negativo, integridad referencial, unicidad de ventas mensuales, rollback de operaciones inválidas y conciliación de ventas y costo proyectado de merma. Los cambios de prueba se revierten en subtransacciones.

Build de producción completado correctamente (2,330 módulos); lint sin errores.

Pruebas automatizadas locales: 10/10 de seguridad, contraseñas, validación numérica, CSRF, métodos HTTP, tamaño/JSON, reportes, rutas API, productos sin fecha y caducidad de sesión. Lint y build correctos. Las pruebas contra la Preview se describen abajo; el build por sí solo no valida PostgreSQL.

## Despliegue Preview

Preview de la rama `feat/postgres-neon`: https://sanate-inventarios-2-git-feat-postg-294cb7-antonbetaks-projects.vercel.app

Proyecto Vercel `sanate-inventarios-2`, conexión privada a Neon development y APP_ORIGIN igual al origen exacto del alias. Las migraciones no se ejecutan durante el build. Se mantiene la protección de Vercel. Producción exige autorización explícita; no se ha modificado.

No incluir Excel, JSON de importación, SQL con datos comerciales, archivos de acceso ni `.env.local` en commits, PR o directorios públicos.

## Corrección de Preview: catálogo y existencias

Se corrigió el contrato de productos para que la tabla acepte productos SQL sin fecha. La fecha mostrada es la del primer movimiento registrado, cuando existe; no se inventa una fecha de alta. Los productos importados con histórico de ventas y sin movimientos de inventario se muestran con existencias por confirmar, se excluyen de la valuación confirmada y requieren un conteo físico antes de vender o producir. Editar y guardar una cantidad explícita registra ese conteo como ajuste.

La fila 35 de Hoja2 es la fuente del stock de insumos. Las muestras de merma (filas 48–49) son observaciones sin fecha y no sustituyen ese inventario. Los totales semanales de Producto Terminado de Hoja3 son parte de la planeación julio–diciembre, no un conteo físico actual. Esta corrección no cambia cantidades importadas ni ejecuta migraciones.

Preview configurada con conexión development privada y APP_ORIGIN igual al alias de la rama. Se confirmó en logs GET /api/session 200, inventario sin sesión 401 y credenciales incorrectas 401. Primer administrador creado por mecanismo privado con contraseña definida por el usuario. Producción no se modificó.

La Preview reveló que la función con nombre `[...path].js` no atendía rutas anidadas en este despliegue Vercel. Se sustituyó por una entrada `api/index.js` y un rewrite explícito de `/api/:path*`, manteniendo las mismas comprobaciones de sesión y Origin. Se verifican las rutas con identificador después del despliegue; una consulta inicial exitosa no valida las operaciones de escritura.

## Pruebas reales de Preview

En la Preview de la rama, con registros identificados PRUEBA_PREVIEW, se completaron alta y edición desde React, entrada, producción con consumo de insumos y venta. Se rechazaron producción y venta con existencias insuficientes. Para probar concurrencia se retuvo temporalmente el mismo bloqueo transaccional en development y se enviaron dos ventas desde dos pestañas con una sola unidad disponible: ambas quedaron simultáneamente en curso; una se guardó, la otra se rechazó y el stock final fue cero. No se debilitó ninguna protección del navegador. Después de un rechazo se refresca el snapshot para evitar mostrar una existencia anterior a otra venta.

La sesión persistió después de recargar y en otra pestaña. La conciliación de solo lectura confirmó 17/17 existencias importadas y 1,416/1,416 valores y fórmulas fuente sin diferencias. El Excel adjunto de nuevo es idéntico al original importado. Las pruebas locales son 10/10, con lint y build correctos. Los registros sintéticos quedan identificados en development y no se confunden con el Excel. Esto no valida todavía el cierre de sesión ni una segunda autenticación independiente, ni sustituye la confirmación comercial de unidades, costos y conteos físicos.


## Caducidad de sesión y formularios móviles

Una respuesta 401 de una API protegida elimina el usuario y los datos en memoria y devuelve al login. Un intento de login incorrecto no dispara esa transición. Se añadió una prueba automatizada del evento y su limpieza. El formulario limita sus columnas y controles al ancho disponible para que nombres largos de productos no ensanchen la pantalla móvil; la validación visual final de este ajuste requiere una sesión activa.

Los registros PRUEBA_PREVIEW permanecen en development y sus operaciones se incluyen en los agregados de esta base de prueba. No se deben interpretar esos agregados como cifras comerciales conciliadas. Las filas históricas originales se conservaron.
