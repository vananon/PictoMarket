# 🛒 PictoMarket

Mercado pictográfico para practicar compras cotidianas, con pistas y apoyo de voz en español. Interfaz **React + Vite + TypeScript**, basada en `img/ui.png`.

## Ejecutar

Requiere **Node.js 22.12+**. Desde la raíz:

```bash
cd codigo/frontend
npm ci
npm run dev
```

Abre **http://127.0.0.1:5173**. La aplicación actual no necesita Python ni Streamlit.

## Organización

```text
PictoMarket/
├── codigo/
│   ├── frontend/          # React, configuración, scripts, dependencias y pruebas
│   │   ├── src/           # Componentes, dominio, datos y controlador de voz
│   │   ├── public/        # Arte, pictogramas y fuentes locales
│   │   ├── tests/         # Unitarias, voz y Playwright
│   │   └── scripts/       # Mantenimiento de recursos y runner de pruebas
│   └── legacy/streamlit/  # Versión anterior y sus propias pruebas/dependencias
├── datos/                 # Catálogo y escenarios compartidos
├── img/                   # Imágenes originales y referencia de diseño
└── README.md
```

Las configuraciones `package.json`, `vite.config.ts`, `tsconfig.json` y `playwright.config.ts` pertenecen a **`codigo/frontend/`**, no a la raíz. Las salidas regenerables (`dist/`, `artifacts/`, `test-results/`, `node_modules/`) se generan dentro del frontend y no se versionan.

El entorno Python local `venv/`, si existe, se conserva sin mover para no romper sus rutas internas. Solo es necesario para consultar o verificar la implementación histórica; no forma parte del código ni se versiona.

## Comandos del frontend

Ejecutar dentro de `codigo/frontend/`:

```bash
npm test                # Dominio, componentes y voz
npm run test:e2e        # Interacciones y diseño en navegador real
npm run build           # Producción en codigo/frontend/dist/
npm run preview
npm run format:check
```

Las pruebas de navegador son útiles para comprobar compras, pistas, carga de imágenes y diseño adaptable. Están en **`codigo/frontend/tests/e2e/`** junto al resto de pruebas de presentación.

## Documentación

- [Frontend: arquitectura, voz, escenarios y mantenimiento](codigo/frontend/README.md).
- [Procedencia y licencias de los recursos](codigo/frontend/public/ASSETS.md).
- [Streamlit histórico y regresión opcional](codigo/legacy/streamlit/README.md).

Pictogramas: Sergio Palao · ARASAAC · Gobierno de Aragón · CC BY-NC-SA.
