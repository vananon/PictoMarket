# 🛒 PictoMarket

Mercado pictográfico para practicar compras cotidianas, con instrucciones visuales, pistas progresivas y apoyo de voz en español.

**El frontend principal ahora es React + Vite + TypeScript. No necesita Python ni Streamlit.** La implementación anterior se conserva exclusivamente en `codigo/legacy/streamlit/`.

## Ejecutar

Requisitos: **Node.js 22.12+** y un navegador actualizado. Chrome o Edge con una voz española instalada son recomendados para el audio.

Desde la raíz del repositorio, entra en la carpeta del frontend:

```bash
cd codigo/frontend
npm ci
npm run dev
```

Abre **http://127.0.0.1:5173**. Detén el servidor con `Ctrl+C`.

```bash
npm run build       # Comprobación TypeScript + producción en codigo/frontend/dist/
npm run preview     # Previsualización del build en http://127.0.0.1:4173
```

`codigo/frontend/dist/` se puede publicar en un servidor estático. `base: './'` permite desplegar también bajo una subcarpeta. No hay backend, credenciales ni llamadas a Streamlit en la aplicación nueva.

## Interfaz

Implementación con componentes React basada en **`img/ui.png`**, usando **`img/fondo.png`** y recortes de su arte:

- Cabecera PictoMarket, objetivo pictográfico y logotipo de la referencia.
- Guía sobre un letrero de madera, con instrucción real y botón para escuchar.
- Toldo, estantes y tarjetas de producto accesibles con precio en monedas.
- Lista de compras con producto actual, marcas de comprado y progreso real.
- Billetera que diferencia monedas disponibles y gastadas; carrito actualizado al comprar.
- Panel del terapeuta en un diálogo con navegación por teclado y cierre con Escape.
- Vista de compra completada y botón para pasar al otro reto.
- Diseño adaptable a escritorio, tablet y móvil; foco visible y respeto de movimiento reducido.

**La referencia no se usa como una captura con zonas clicables.** Texto, precios, botones, tarjetas y estados son elementos reales de React. Solo se recortan recursos gráficos decorativos.

Los valores vienen de los datos existentes, no de las cifras ilustrativas de la referencia. Por ejemplo, el almuerzo empieza con **8 monedas**, la pechuga cuesta **3** y el contador empieza en **0 / 4**. El escenario tiene diez productos: se distribuyen en tres estantes (3 + 3 + 4), sin perder distractores. En móvil, la fila de cuatro se adapta a dos columnas. El orden se mezcla al iniciar cada reto, como antes.

## Arquitectura

```text
PictoMarket/
├── codigo/
│   ├── frontend/
│   │   ├── README.md
│   │   ├── package.json / package-lock.json
│   │   ├── vite.config.ts / tsconfig.json / playwright.config.ts
│   │   ├── scripts/              # Preparación de arte, pictogramas y runner
│   │   ├── tests/
│   │   │   ├── unit/             # Dominio y componentes React
│   │   │   ├── e2e/              # Navegador real con Playwright
│   │   │   └── speech-controller.test.mjs
│   │   ├── index.html
│   │   ├── public/
│   │   │   ├── art/                # Fondo, toldo, madera, guía y marca
│   │   │   ├── pictograms/         # 30 pictogramas originales ARASAAC
│   │   │   ├── fonts/             # Nunito local + licencia OFL
│   │   │   └── ASSETS.md           # Procedencia y licencias
│   │   └── src/
│   │       ├── components/        # Cabecera, mercado, paneles y controles
│   │       ├── hooks/             # useGame, useSpeech
│   │       ├── domain/game.ts     # Estado, compra, pistas, mensajes y eventos
│   │       ├── data/market.ts     # Adaptador al JSON original
│   │       ├── audio/             # Controlador Web Speech independiente
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       └── styles.css
│   └── legacy/streamlit/          # Implementación histórica, no producción
│       ├── tests/                # Regresión de Streamlit
│       └── pytest.ini            # Configuración exclusiva del archivo histórico
├── datos/escenarios.json          # Única fuente de catálogo/precios/retos
├── img/                          # Fondo y referencia originales
└── README.md                     # Entrada general al proyecto
```

### Separación de responsabilidades

- **Dominio:** `domain/game.ts` no importa React ni SpeechSynthesis. Decide la compra, el saldo, las pistas y el registro de eventos sin mutar el estado anterior.
- **Datos:** `data/market.ts` importa directamente `datos/escenarios.json` y valida referencias, categorías, precios y presupuesto. No existe un catálogo duplicado dentro de los componentes.
- **Estado de compra:** `useGame` conecta las transiciones del dominio con `useReducer`.
- **Voz:** `audio/speech-controller.mjs` conserva el controlador probado de la versión anterior, sin dependencias de Streamlit ni de React. `useSpeech` adapta mensajes y ciclo de vida al navegador.
- **Presentación:** componentes React tipados; estilos sin selectores internos de Streamlit, manipulación manual del DOM ni HTML inyectado.

El frontend sigue siendo autónomo. La extracción del dominio facilita una integración posterior con un backend, pero **no se ha añadido FastAPI, ID3 ni aprendizaje automático**.

## Datos y política pedagógica conservados

| Reto                 | Nivel | Lista                                   | Presupuesto |
| -------------------- | ----- | --------------------------------------- | ----------- |
| `desayuno_saludable` | 1     | Leche, pan, manzana                     | 6           |
| `almuerzo_casa`      | 2     | Pechuga de pollo, papa, tomate, lechuga | 8           |

Al abrir se presenta el almuerzo para corresponder al objetivo de la referencia. Ambos retos se pueden seleccionar desde el panel del terapeuta.

| Acción | Condición                                        | Resultado                                         |
| ------ | ------------------------------------------------ | ------------------------------------------------- |
| `a0`   | Cualquier producto pendiente de la lista         | Compra, descuenta su precio y reinicia las pistas |
| `a1`   | Primer error consecutivo                         | Indica y resalta la categoría del objetivo        |
| `a2`   | Segundo error                                    | Elimina el distractor tocado y reduce candidatos  |
| `a3`   | Tercer error o sin distractores al intentar `a2` | Señala el producto correcto                       |

La política es **por reglas**, no un modelo entrenado. Los errores no descuentan monedas y un producto comprado no se cobra dos veces.

## Apoyo de voz

La primera carga es silenciosa. **Activar voz** o el altavoz de la instrucción requieren una acción explícita del usuario.

- Lectura de inicio, aciertos, siguiente producto, pistas y compra completada.
- **Repetir instrucción**, **Detener** y **Silenciar voz**.
- Selector de voz española, velocidad lenta/tranquila/normal y volumen.
- Preferencia por voces españolas locales; no se sustituye por una voz inglesa.
- Cada mensaje tiene `id`, `tipo`, `texto` y `texto_voz`; el texto hablado conserva español y elimina emojis.
- Un render, abrir el panel o cambiar ajustes no vuelve a leer el mismo mensaje.
- Una decisión nueva cancela la lectura anterior, sin acumular una cola.
- Ocultar la pestaña o desmontar la app detiene la voz y limpia los listeners/timers.
- Reiniciar o cambiar de escenario conserva preferencias en esa instancia. Recargar exige activar de nuevo.
- Sin soporte, sin voces o con un error de reproducción, el texto y los pictogramas siguen funcionando.

Se usa **Web Speech API**, sin micrófono, claves ni servidor TTS propio. Las voces «en línea» pueden necesitar internet y servicios del proveedor del navegador. No se garantiza voz offline ni pronunciación idéntica entre equipos. Los recursos visuales y fuentes sí se sirven localmente.

## Panel del terapeuta

Permite cambiar y reiniciar el escenario, consultar productos comprados, errores, nivel de pista, estado y eventos. **Exportar sesión JSON** descarga el estado y el log de la actividad actual.

Los eventos conservan `escenario_id`, `t_ms`, `item_objetivo`, `item_tocado`, `correcto`, `estado_s`, `accion_agente`, `distractor_eliminado`, `entropia_antes`, `entropia_despues` y `recompensa: null`.

El progreso y los eventos viven solo en la memoria de la pestaña: **reiniciar, cambiar escenario o recargar los borra**. Exporta antes si necesitas conservarlos. La medición `t_ms` sigue siendo el intervalo entre decisiones; no descuenta la duración del audio. El panel es una herramienta del prototipo, no un área autenticada.

## Pruebas

```bash
npm test               # 18 pruebas de dominio/React + 17 del controlador de voz
npm run typecheck
npm run build
npm run test:e2e        # 7 pruebas con Chrome instalado
npm audit
```

Las pruebas de navegador revisan anchos **360, 390, 720, 768, 1024 y 1440 px**, carga de imágenes, ausencia de desbordamiento horizontal, separación entre imagen y nombre, errores de ejecución, diálogo y Escape. También ejercitan pistas, compra completa, exportación, cambio de reto y reinicio. Las capturas se guardan en `codigo/frontend/artifacts/`, ignorado por Git. Los resultados de Playwright van a `codigo/frontend/test-results/`. Ninguna prueba ni salida del frontend se crea en la raíz del repositorio.

Si usas Edge en lugar de Chrome:

```powershell
$env:BROWSER_CHANNEL = "msedge"
npm run test:e2e
```

El servidor Vite de las pruebas se inicia y detiene automáticamente. Las pruebas del motor de voz son simuladas: **no certifican sonido en los altavoces**. Verifica manualmente en el dispositivo final: activar, repetir, provocar las tres pistas, completar, detener, silenciar y ajustar voz/ritmo/volumen.

El script `scripts/run-vitest.mjs` normaliza la ruta de Windows para evitar que `c:` y `C:` carguen dos instancias del runner. Las pruebas también funcionan en otros sistemas.

## Recursos y mantenimiento

Todos los recursos necesarios están versionados. No hace falta volver a descargarlos para ejecutar la aplicación.

```bash
npm run assets:pictograms           # Descargar el catálogo desde ARASAAC
# Opcional, solo si cambian las imágenes originales; requiere Pillow:
python scripts/prepare-art.py
```

Al añadir un producto a `datos/escenarios.json`, descarga también su pictograma. Los fallos de imagen mantienen un nombre y una alternativa visual; no sustituyen el producto por un pictograma incorrecto.

## Versión histórica

La migración aparta Python y Streamlit del frontend activo sin destruir su referencia. Consulta [`codigo/legacy/streamlit/README.md`](../legacy/streamlit/README.md) para ejecutar su regresión. No mezcles sus dependencias ni comandos con el frontend React.

## Créditos

Pictogramas: **Sergio Palao · ARASAAC · Gobierno de Aragón · CC BY-NC-SA**. Proyecto académico de Inteligencia Artificial y Educación Especial. Nunito: SIL Open Font License. Consulta la procedencia del arte y la marca en [`codigo/frontend/public/ASSETS.md`](public/ASSETS.md).
