# Implementación histórica de Streamlit

Esta carpeta conserva la versión anterior como referencia y para pruebas de regresión. **No forma parte del frontend React ni del build de Vite.**

Se conservan el prototipo Python, el componente CCv2, mensajes, dependencias y configuración antigua. La raíz de datos se ajustó a la nueva ubicación; los escenarios siguen en `datos/escenarios.json`.

## Regresión opcional

Desde la raíz del repositorio, con un entorno Python 3.10+ separado:

```bash
pip install -r codigo/legacy/streamlit/requirements-dev.txt
python -m pytest -q -c codigo/legacy/streamlit/pytest.ini
node --test codigo/legacy/streamlit/tests/apoyo_voz.test.mjs
```

`codigo/legacy/streamlit/pytest.ini` apunta solo a las pruebas locales de `codigo/legacy/streamlit/tests/`; también guarda su caché aquí. Las pruebas del frontend activo se ejecutan con `npm test` y `npm run test:e2e` desde `codigo/frontend/`.

Para consultar la app histórica:

```bash
streamlit run codigo/legacy/streamlit/app_pictomarket.py
```

El archivo `config.toml` aquí es una copia documental: no configura el frontend nuevo ni se carga automáticamente desde esta carpeta. La utilidad obsoleta `fix_file.py`, que escribía en una ruta absoluta de otro entorno, se retiró durante la limpieza.

El controlador de voz activo, extraído de esta implementación y adaptado a React, está en `codigo/frontend/src/audio/speech-controller.mjs`. La copia histórica no es la fuente de cambios futuros. La función antigua `id3_elegir_distractor` era una selección por reglas/azar, **no un ID3 entrenado**.
