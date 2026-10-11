# Diagnóstico de frames largos — 10 octubre 2026

## Resultado y límites

No se modificó código de la aplicación durante esta investigación. Se conservan Liquid Glass, animaciones, datos y funcionalidades. La comparación principal usa exactamente el mismo build local, antes y después de observar `pmset lowpowermode` pasar de 1 a 0; el agente no modificó esa configuración. Las mejoras siguientes corresponden al entorno energético, no a una optimización de código.

El antiguo p95 de 50,1 ms provenía de Chromium headless con GPU compositing desactivado. No representaba directamente Safari. En Chromium con ventana, GPU Metal y bajo consumo activado, scroll y hover también presentaron frames largos. Al desactivarse bajo consumo, el mismo recorrido mejora sin cambios en la aplicación.

No se alcanza el objetivo estricto p95 <16,7 ms. La cadencia observada es cercana a 60 Hz, con jitter de temporización; no se acredita una pantalla de 120 Hz. Una página vacía en WebKit pasó de p95 34 ms a 17 ms al cambiar el entorno energético. Por tanto, parte del límite existe fuera de React y del diseño.

## Protocolo

Mac M1, 8 GB, viewport 1440×1000. Dos ventanas de 750 ms por interacción, rutas calentadas previamente, sin throttling artificial. Percentiles de intervalos requestAnimationFrame, incluyendo descansos dentro de cada ventana; no son duración de render React ni latencia de input. Muestras cortas de diagnóstico, sin intervalos de confianza. No se mezclan percentiles con las trazas instrumentadas. El scroll A usa el mismo generador rAF en ambas ejecuciones; se contrastó también con un gesto continuo del navegador.

Producción: copia íntegra del build existente servida localmente en 4174, necesaria mientras iCloud bloqueaba el acceso al proyecto y a `dist`. No se presenta como un nuevo `npm run preview` validado. Resumen de mediciones persistido en `docs/frame-diagnostics.json`. Artefactos y scripts originales: `/tmp/ase-ui-qa` (temporales, no dependencias del proyecto). El proceso de FileProvider y la descarga de iCloud generan carga externa; los resultados no constituyen un benchmark de laboratorio.

## Comparación principal: misma aplicación, cambio de entorno energético

| Interacción | Antes p95 (ms) | Después p95 (ms) | Cuello de botella / evidencia |
| --- | ---: | ---: | --- |
| A scroll Dashboard | 50 | 17.7 | Scroll/compositor: espera de commit documentada en traza |
| B Dashboard → Materia Prima | 17.6 | 17.6 | Montaje de sección; sin long task repetible |
| C Materia Prima → Producto Terminado | 17.7 | 17.6 | Montaje de sección; p99 conserva un frame de ~33 ms |
| D Producto Terminado → Reportes | 17.7 | 17.6 | Montaje Recharts; 4 callbacks resize en dos montajes |
| E colapsar/expandir sidebar | 17.6 | 17.6 | Cambio de geometría; 8 callbacks resize esperados, sin bucle |
| F cambiar mes calendario | 17.7 | 17.6 | Actualización local calendario |
| G completar tarea | 17.6 | 17.6 | Actualización local de tareas |
| H abrir modal | 17.7 | 17.6 | Pico aislado 65 ms antes, sin atribución causal suficiente |
| I cerrar modal | 17.6 | 17.6 | Cierre de overlay |
| J escribir en buscador | 17.6 | 17.6 | Filtrado inmediato; sin long task |
| K hover repetido cards | 33.3 | 17.6 | Composición/paint del hover; sensible al entorno |

## Percentiles y tareas largas

Todos los valores siguientes son ms. Chromium posterior corresponde a la pasada sin traza. WebKit es el runner de Playwright, **no Safari nativo**; sus tiempos tienen resolución de aproximadamente 1 ms. Esa pasada coincidió con procesos de validación esperando archivos de iCloud y puede tener carga adicional. WebKit no soporta aquí Long Tasks API: cero entradas no significa cero tareas largas.

| Interacción | Chromium p50 | p95 | p99 | Long tasks >50 ms | WebKit p50 | p95 | p99 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A scroll Dashboard | 16.7 | 17.7 | 17.7 | 0 | 17 | 18 | 23 |
| B Dashboard → Materia Prima | 16.7 | 17.6 | 17.7 | 0 | 17 | 23 | 53 |
| C Materia Prima → Producto Terminado | 16.7 | 17.6 | 33.32 | 0 | 17 | 20 | 42 |
| D Producto Terminado → Reportes | 16.7 | 17.6 | 33.32 | 0 | 17 | 18 | 62 |
| E colapsar/expandir sidebar | 16.7 | 17.6 | 17.8 | 0 | 17 | 21 | 33 |
| F cambiar mes calendario | 16.7 | 17.6 | 17.7 | 0 | 17 | 18 | 18 |
| G completar tarea | 16.7 | 17.6 | 17.7 | 0 | 17 | 17 | 18 |
| H abrir modal | 16.7 | 17.6 | 17.7 | 0 | 17 | 18 | 43 |
| I cerrar modal | 16.7 | 17.6 | 17.7 | 0 | 17 | 18 | 36 |
| J escribir en buscador | 16.7 | 17.6 | 17.7 | 0 | 17 | 18 | 27 |
| K hover repetido cards | 16.7 | 17.6 | 17.7 | 0 | 16 | 18 | 18 |


### Intervalos que superan 16,7 ms

El umbral exacto también cuenta el jitter de un monitor de ~60 Hz; por eso se muestra además >20 ms.

| Interacción | Antes >16,7 ms / muestras | Después >16,7 ms / muestras | Después >20 ms |
| --- | ---: | ---: | ---: |
| A scroll Dashboard | 29 / 74 | 23 / 92 | 0 |
| B Dashboard → Materia Prima | 22 / 92 | 29 / 92 | 0 |
| C Materia Prima → Producto Terminado | 37 / 91 | 35 / 91 | 1 |
| D Producto Terminado → Reportes | 38 / 91 | 38 / 91 | 1 |
| E colapsar/expandir sidebar | 34 / 91 | 46 / 92 | 0 |
| F cambiar mes calendario | 48 / 92 | 43 / 92 | 0 |
| G completar tarea | 48 / 91 | 46 / 92 | 0 |
| H abrir modal | 31 / 55 | 38 / 92 | 0 |
| I cerrar modal | 51 / 92 | 49 / 92 | 0 |
| J escribir en buscador | 42 / 89 | 49 / 90 | 0 |
| K hover repetido cards | 49 / 85 | 42 / 92 | 0 |

## Scripting, layout y paint

Pasadas CDP separadas de la medición principal. Totales acumulados de dos ventanas por interacción, no coste por frame. Scripting es duración inclusiva de FunctionCall/EvaluateScript y puede incluir esperas; no CPU exclusiva. Style es UpdateLayoutTree. Raster/composición ocurren en otros hilos y no deben sumarse como tiempo de main thread.

| Interacción | Scripting antes/después | Style antes/después | Layout antes/después | Paint antes/después |
| --- | ---: | ---: | ---: | ---: |
| A scroll Dashboard | 112.72 / 10.04 | 0.00 / 0.00 | 0.00 / 0.00 | 6.74 / 4.82 |
| B Dashboard → Materia Prima | 42.48 / 22.24 | 21.21 / 10.66 | 11.45 / 4.71 | 14.76 / 6.65 |
| C Materia Prima → Producto Terminado | 31.33 / 18.16 | 28.36 / 10.06 | 8.37 / 3.79 | 12.68 / 6.21 |
| D Producto Terminado → Reportes | 118.58 / 63.36 | 16.81 / 9.94 | 9.52 / 7.43 | 11.75 / 5.88 |
| E colapsar/expandir sidebar | 95.19 / 55.41 | 58.95 / 28.36 | 40.51 / 7.20 | 13.54 / 6.83 |
| F cambiar mes calendario | 14.91 / 10.42 | 3.11 / 2.06 | 5.99 / 2.75 | 3.87 / 2.50 |
| G completar tarea | 17.89 / 17.12 | 4.24 / 3.12 | 0.62 / 0.66 | 2.66 / 2.72 |
| H abrir modal | 48.01 / 49.78 | 18.70 / 17.46 | 11.38 / 11.64 | 7.27 / 5.96 |
| I cerrar modal | 33.21 / 22.60 | 15.85 / 10.02 | 1.31 / 0.83 | 4.91 / 3.18 |
| J escribir en buscador | 45.84 / 18.69 | 2.48 / 1.17 | 9.55 / 3.97 | 9.99 / 4.59 |
| K hover repetido cards | 31.31 / 18.22 | 24.61 / 12.83 | 0.44 / 0.25 | 25.43 / 10.49 |

## Atribución de frames y long tasks

- Traza anterior: callback sintético de scroll `tick` de 58,78 ms, de los cuales 58,63 ms corresponden a `LayerTreeHost::WaitForCommitCompletion`. Es una espera de commit del compositor dentro del generador de prueba, no 58 ms de render React. Scroll no registra layout ni style durante las ventanas. Las esperas GPU acumuladas observadas en esa traza bajaron de 994,50 a 27,80 ms en la pasada posterior; son wall time de eventos en otros hilos, no trabajo GPU exclusivo.
- Apertura de modal: una tarea de 65 ms detectada por Long Tasks API en la pasada anterior sin traza. La API solo la identifica como `self`; no proporciona función/componente responsable. No se reproduce en la pasada posterior. No se inventa una atribución ni una corrección.
- Evento click de 63,32 ms en la traza anterior: callback del scheduler React en el bundle, fuera de las ventanas A–K. La pila disponible no identifica componente; no se considera prueba contra planner o charts.
- La pasada posterior sin traza registra cero tareas >50 ms en las once interacciones. Es una observación de esta muestra, no una garantía universal.
- Gesto continuo CDP idéntico: p95 50,4 ms con bajo consumo, 17,1 ms sin bajo consumo. Un wheel de menor frecuencia dio mejores números, pero implica otro workload y no se utiliza como supuesta solución.

## React, gráficos, tablas y glass

Hook de React DevTools en una ejecución separada de producción: planner y charts no renderizan al abrir/cerrar modal; planner no renderiza al navegar ni colapsar sidebar; charts de Reportes no renderizan durante búsqueda. Calendario y tareas actualizan planner en sus propias acciones, como corresponde. App/AppShell/Header/Navegación sí actualizan cuando cambia su estado/props. El contador de fibers renderizados no equivale a duración de React Profiler; el perfil DEV adicional con duraciones se describe más abajo.

ResizeObserver: cero callbacks durante scroll, búsqueda, calendario, tareas, hover y modales. Cuatro en dos montajes de Reportes y ocho al colapsar/expandir dos veces: redimensionados esperados de las gráficas, sin evidencia de bucle continuo. No se añade lazy mounting ni memoización de filas sin coste demostrado. Las búsquedas medidas no muestran long tasks; no se añade debounce ni useDeferredValue especulativo.

Ablaciones temporales solo en navegador, sin guardar cambios: eliminar blur de cards/shell no dio una mejora consistente con bajo consumo. Tras desactivarlo, baseline del gesto p95 17,1–17,7 ms; precomponer cards/shell/todo dio 17,6 ms, sin ventaja. Eliminar sombras tampoco mejoró. No hay evidencia suficiente para sustituir Liquid Glass o agregar capas permanentes. Login, muestra separada de 2,4 s durante las ondas: p50 16,6 ms, p95 17,6 ms, p99 33,4 ms, 143 intervalos y cero long tasks. No sustituye una traza causal del login en Safari.

## DEV frente al nuevo production preview

Tras hidratarse las dependencias, `npm run build` terminó correctamente y se ejecutó `npm run preview` en 4180. Nueva pasada independiente con Chromium con ventana y GPU, bajo consumo desactivado; DEV en 5180 conserva StrictMode. Mismo protocolo A–K y rutas calentadas.

| Interacción | DEV p50/p95/p99 | Preview p50/p95/p99 | DEV long tasks (ms) | Preview long tasks |
| --- | ---: | ---: | --- | ---: |
| A scroll Dashboard | 16.7/17.6/17.6 | 16.7/17.7/17.7 | 0 | 0 |
| B Dashboard → Materia Prima | 16.7/17.6/50.4 | 16.7/17.7/17.7 | 60, 63 | 0 |
| C Materia Prima → Producto Terminado | 16.7/17.7/33.4 | 16.7/17.6/33.32 | 55, 55 | 0 |
| D Producto Terminado → Reportes | 16.7/17.6/50 | 16.7/17.7/33.2 | 70, 69 | 0 |
| E colapsar/expandir sidebar | 16.7/17.6/17.6 | 16.7/17.7/17.7 | 0 | 0 |
| F cambiar mes calendario | 16.7/17.6/17.9 | 16.7/17.7/17.7 | 0 | 0 |
| G completar tarea | 16.7/17.6/17.7 | 16.7/17.7/17.7 | 0 | 0 |
| H abrir modal | 16.7/17.6/49.1 | 16.7/17.7/33.3 | 70, 58 | 0 |
| I cerrar modal | 16.7/17.6/50.9 | 16.7/17.6/17.7 | 52, 59 | 0 |
| J escribir en buscador | 16.7/17.6/17.7 | 16.7/17.6/17.7 | 0 | 0 |
| K hover repetido cards | 16.7/17.6/17.6 | 16.7/17.6/17.7 | 0 | 0 |

El p95 por sí solo oculta trabajo esporádico de DEV: hay tareas de 52–70 ms en estas ventanas, aunque constituyen menos del 5 % de intervalos. No se desactiva StrictMode para mejorar los números. La API Long Tasks no atribuye por sí sola esas tareas a un componente.

### Traza DEV y perfil React

En la pasada DEV instrumentada, `performWorkUntilDeadline` (scheduler de React) ocupa 91,25 y 64,25 ms al entrar en Reportes. Abrir modal registra EventDispatch 76,88 ms y cerrar 60,38/58,23 ms; están anidados con la microtarea de `scheduleImmediateRootScheduleTask → processRootScheduleInMicrotask` de React. Estos eventos incluyen trabajo descendiente y no son tareas independientes para sumar. La traza disponible no separa una función de componente responsable del resto del scheduler. No se aplica una corrección especulativa ni se elimina StrictMode: estos picos no se reproducen como long tasks en la muestra de preview.

Hook DevTools con duraciones React DEV (`actualDuration` de root), en una ejecución separada: 32 commits, mediana 7,8 ms, máximo 39,7 ms, incluyendo login y montaje inicial. Duraciones inclusivas, no latencia de interacción. Las comprobaciones de aislamiento pasan también en DEV: cero renders Dashboard/Charts/Planner por modal; cero planner al navegar/colapsar; cero charts de Reportes por búsqueda. Los datos completos quedan en JSON.

Totales de dos ventanas instrumentadas por caso; DEV y producción conservan el mismo significado de scripting inclusivo descrito antes:

| Interacción | DEV scripting | Prod scripting | DEV layout | Prod layout | DEV paint | Prod paint |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A scroll Dashboard | 9.57 | 10.04 | 0.00 | 0.00 | 4.57 | 4.82 |
| B Dashboard → Materia Prima | 88.07 | 22.24 | 10.49 | 4.71 | 11.60 | 6.65 |
| C Materia Prima → Producto Terminado | 79.16 | 18.16 | 3.00 | 3.79 | 5.31 | 6.21 |
| D Producto Terminado → Reportes | 234.70 | 63.36 | 12.79 | 7.43 | 5.25 | 5.88 |
| E colapsar/expandir sidebar | 156.77 | 55.41 | 5.40 | 7.20 | 5.90 | 6.83 |
| F cambiar mes calendario | 38.57 | 10.42 | 3.09 | 2.75 | 2.76 | 2.50 |
| G completar tarea | 52.01 | 17.12 | 0.49 | 0.66 | 2.45 | 2.72 |
| H abrir modal | 124.20 | 49.78 | 20.95 | 11.64 | 5.80 | 5.96 |
| I cerrar modal | 122.28 | 22.60 | 0.47 | 0.83 | 1.87 | 3.18 |
| J escribir en buscador | 102.40 | 18.69 | 3.64 | 3.97 | 3.68 | 4.59 |
| K hover repetido cards | 20.38 | 18.22 | 0.23 | 0.25 | 10.63 | 10.49 |

## Validación y pendientes

`npm run build`: OK, 2332 módulos, 2,09 s de compilación una vez disponibles los archivos; entrada 256,71 kB (gzip 80,64), CSS 74,23 kB. `npm run lint`: OK, sin errores. `npm test`: 14/14 OK. La espera inicial de varios minutos fue hidratación de iCloud, no tiempo de ejecución de los tests. Comparación DEV/preview completada arriba. Safari nativo rechaza crear sesión porque «Permitir automatización remota» sigue desactivado; WebKit no sustituye esa validación. El objetivo p95 <16,7 ms sigue pendiente, especialmente en Safari real. No hay commit ni push ni nuevas dependencias.
