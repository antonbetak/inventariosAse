# Performance y fluidez

Pasada sobre el diseño Liquid Glass existente. No cambia servicios, claves de almacenamiento ni operaciones de inventario.

## Auditoría previa

- Sidebar: transición de `width`; contenido: transición de `margin-left`. El colapso disparaba múltiples layouts, incluyendo el redimensionado de Recharts.
- Controles: interpolación de `box-shadow` y gradientes; skeleton: animación de `background-position`; barra de progreso: transición de `width`.
- Blur de 24 px en el shell/login, 12 px en cards, además de blur fullscreen en el overlay de modal y blur anidado en elementos del hero.
- Ondas del login con dos animaciones infinitas.
- Planner renderizado por actualizaciones del padre. Calendario construía fechas, etiquetas y búsquedas por día al escribir una tarea.
- Selección del rango de gráfica renderizaba todo Dashboard. Reportes renderizaba gráficas al buscar, filtrar o exportar. Las gráficas animaban geometría SVG al montarse.
- No se encontraron `transition: all` explícitos, listeners de scroll, timers para simular FPS ni escrituras de almacenamiento continuas durante render. La navegación lee su clave únicamente en el inicializador de estado; las demás lecturas y escrituras están en servicios/efectos/acciones.

## Cambios

- Transiciones de interacción de 160 ms sobre transform/opacity y colores; sin interpolación de dimensiones, filtros ni sombras. El colapso hace un único cambio de layout, sin animar su ancho ni el margen del contenido.
- Entrada de sección de 180 ms: opacity y translateY(4px). Modal de 180 ms. Skeleton pulsa opacidad; el highlight del KPI anima opacidad sobre un gradiente estático.
- Blur estable: sidebar/panel 18 px, topbar/login/modal 20 px y cards 10 px. En móvil: shell/panel 10 px, cards 6 px, login 12 px y modal 14 px. Controles y capas anidadas no añaden blur. Se elimina el blur del overlay fullscreen y del tooltip/labels del hero.
- Containment de layout/paint en sidebar, panel derecho y KPI; solo layout en calendario/tareas. Topbar y gráficas no reciben paint containment para conservar dropdowns y tooltips.
- Ondas: dos ciclos mediante transform/opacity, pausadas por IntersectionObserver y Page Visibility cuando no se ven. Sin animaciones JS por frame ni `will-change` global.
- Planner con React.memo; etiquetas y conteos de calendario memorizados. Dashboard con memo y callback de entrada estable. DashboardCharts aísla su rango y memoriza series/distribución. Los dos bloques de Recharts de Reportes están memorizados aparte de búsqueda/exportación.
- Animación geométrica de Area/Pie/Bar desactivada: evita trabajo SVG repetido y se conserva la entrada breve del panel. Sin filtro drop-shadow sobre la curva.
- Dashboard y Reportes cargan mediante React.lazy/Suspense. Recharts queda compartido en un chunk; rutas precargadas en tiempo ocioso tras iniciar sesión, con cancelación y fallback para navegadores sin requestIdleCallback.
- Se conserva prefers-reduced-motion, foco, colores forzados y fallback sin backdrop-filter.

## Bundle de producción

Tamaños Vite en kB decimales, sin logo/CSS:

| JavaScript | Antes | Después |
| --- | ---: | ---: |
| Entrada inicial | 623,91 (gzip 188,42) | 256,71 (gzip 80,63) |
| Dashboard diferido | incluido | 37,18 (gzip 11,53) |
| Reportes diferido | incluido | 24,31 (gzip 8,37) |
| Gráficas compartidas | incluido | 310,31 (gzip 93,29) |
| Total de todos los chunks | 623,91 | 628,51 |

El splitting reduce carga inicial y retrasa parseo/evaluación; no reduce el peso total. Ya no hay chunks mayores de 500 kB ni la advertencia correspondiente.

## Medición local

Traza CDP sobre build de producción en Chromium headless, viewport 1440×1000, sin CPU throttling. Mismo recorrido de ocho cambios de sección, dos colapsos/expansiones, scroll con rAF, hover de KPI, cambios de mes y tareas. Las muestras comparadas se ejecutaron sin otras suites de navegador en paralelo.

| Trabajo acumulado en la traza | Antes | Después |
| --- | ---: | ---: |
| Layout | 209 eventos / 44,47 ms | 109 eventos / 23,32 ms |
| Paint | 435 eventos / 122,74 ms | 305 eventos / 60,29 ms |
| UpdateLayoutTree | 356 eventos / 59,28 ms | 237 eventos / 51,37 ms |
| FunctionCall | 4383 eventos / 416,11 ms | 3048 eventos / 193,13 ms |
| Long tasks >50 ms | 0 | 0 |

Es una muestra diagnóstica, no un benchmark estadístico. El p95 de intervalos rAF permaneció en 50,1 ms en este entorno headless; **no demuestra 60/90/120 FPS ni tiempos GPU**. La mejora observada es menor trabajo de layout, paint y JS. Falta confirmar frame pacing con DevTools y pantalla física de alta frecuencia, especialmente en móviles con GPU limitada.

## Validación

- Build, lint y los 14 tests de servicios.
- CRUD, sesión, CSV, foco/Escape y modales.
- Navegación y planner en 375, 390, 430, 768, 1024 y 1440 px: sin overflow ni errores JavaScript. El planner conserva nodo, mes y tareas entre secciones.
- Estilos calculados: sin transiciones activas de dimensiones/filtros/sombras; blur por nivel comprobado.
- Movimiento reducido, ondas finitas y pausa del hero oculto comprobados en navegador.
- Instrumentación del hook de React DevTools: abrir/cerrar modal no renderiza Dashboard, DashboardCharts ni DashboardPlanner; navegación/colapso no renderizan planner; búsqueda de Reportes no renderiza ReorderChart ni MovementChart.

Sin nuevas dependencias ni modo de rendimiento visible.
