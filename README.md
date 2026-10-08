# 🛒 PictoMarket

**PictoMarket** es una aplicación web interactiva diseñada para apoyar el entrenamiento de habilidades de vida cotidiana en personas con diversidad funcional cognitiva. Simula un supermercado pictográfico donde el usuario, guiado por un agente pedagógico, practica la compra de artículos básicos utilizando pictogramas del sistema ARASAAC.

> **Contexto académico:** Proyecto de investigación aplicada — Inteligencia Artificial & Educación Especial.
> Pictogramas: Sergio Palao · ARASAAC (arasaac.org) · Licencia CC BY-NC-SA · Gobierno de Aragón.

---

## 📋 Tabla de contenidos

1. [Requisitos previos](#-requisitos-previos)
2. [Instalación](#-instalación)
3. [Ejecución](#-ejecución)
4. [Estructura del proyecto](#-estructura-del-proyecto)
5. [Descripción de escenarios](#-descripción-de-escenarios)
6. [Panel del terapeuta](#-panel-del-terapeuta)
7. [Apoyo de voz](#-apoyo-de-voz)
8. [Pruebas](#-pruebas)
9. [Tecnologías utilizadas](#-tecnologías-utilizadas)

---

## ✅ Requisitos previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| Python | 3.10+ | Recomendado 3.11 o superior |
| Streamlit | 1.57+ (< 2) | Incluye los componentes v2 usados por el audio |
| Navegador | Actualizado | Chrome o Edge con una voz en español |
| pip | Incluido con Python | Gestor de paquetes |
| Conexión a internet | — | Para cargar pictogramas desde ARASAAC |

> **Windows:** Se recomienda usar PowerShell o el símbolo del sistema.
> **Mac/Linux:** Terminal estándar.

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/vananon/PictoMarket.git
cd PictoMarket
```

### 2. (Recomendado) Crear un entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

Las dependencias de la librería estándar (`json`, `math`, `random`, `re`, `time`, `pathlib`) ya vienen incluidas con Python y **no requieren instalación adicional**.

---

## ▶️ Ejecución

Desde la **raíz del proyecto** ejecuta:

```bash
streamlit run codigo/frontend/app_pictomarket.py
```

Streamlit abrirá automáticamente el navegador en `http://localhost:8501`.

> Si el navegador no se abre automáticamente, cópiala y pégala manualmente.

### Detener la aplicación

Presiona `Ctrl + C` en la terminal.

---

## 📁 Estructura del proyecto

```
PictoMarket/
│
├── .streamlit/
│   └── config.toml                 # Configuración del servidor Streamlit
│
├── codigo/
│   └── frontend/
│       ├── app_pictomarket.py      # Aplicación principal (Streamlit)
│       ├── mensajes_voz.py          # Mensajes identificados y texto para voz
│       ├── apoyo_voz.py             # Componente Streamlit v2
│       └── apoyo_voz.mjs            # Síntesis y controles en el navegador
│
├── datos/
│   └── escenarios.json             # Catálogo de productos, categorías y retos
│
├── tests/                          # Pruebas Python y del controlador de voz
├── pytest.ini                      # Configuración de pruebas
├── venv/                           # Entorno virtual (no se sube al repo)
├── .gitignore                      # Archivos y carpetas ignorados por Git
├── requirements.txt                # Dependencias de producción
├── requirements-dev.txt            # Dependencias de desarrollo/testing
└── README.md
```

### Descripción de archivos clave

| Archivo | Descripción |
|---|---|
| `codigo/frontend/app_pictomarket.py` | UI, política pedagógica por reglas y eventos del juego |
| `codigo/frontend/mensajes_voz.py` | Contrato `id`, `tipo`, `texto`, `texto_voz`; elimina emojis del texto hablado |
| `codigo/frontend/apoyo_voz.py` y `.mjs` | Apoyo de voz, preferencias y control de reproducción |
| `datos/escenarios.json` | Datos del catálogo ARASAAC, categorías, presupuestos y retos de compra |
| `.streamlit/config.toml` | Puerto, modo headless y tema base de Streamlit |
| `requirements.txt` | Dependencia única de producción: `streamlit` |
| `.gitignore` | Excluye `venv/`, `__pycache__/`, `.DS_Store`, secrets, etc. |

---

## 🎮 Descripción de escenarios

Los escenarios están definidos en `datos/escenarios.json`. Cada reto contiene:

| Campo | Descripción |
|---|---|
| `id_reto` | Identificador único del escenario |
| `nivel` | Dificultad del reto (1 = fácil) |
| `objetivo` | Frase con pictogramas del objetivo (e.g. `[COMPRAR] [PARA] [DESAYUNO]`) |
| `presupuesto` | Número de monedas disponibles |
| `lista_correcta` | IDs ARASAAC de los productos que se deben comprar |
| `distractores` | IDs ARASAAC de productos que no pertenecen a la lista |

### Retos disponibles

| ID | Nivel | Objetivo | Productos correctos | Presupuesto |
|---|---|---|---|---|
| `desayuno_saludable` | 1 | Comprar para desayuno | Leche, Pan, Manzana | 6 🪙 |
| `almuerzo_casa` | 2 | Comprar para almuerzo | Pechuga de pollo, Papa, Tomate, Lechuga | 8 🪙 |

### Categorías del catálogo

| Icono | Categoría | Productos incluidos |
|---|---|---|
| 🥛 | Lácteos y Huevos | Leche, Yogur, Queso, Mantequilla, Huevo |
| 🍎 | Frutas y Verduras | Manzana, Plátano, Naranja, Fresa, Uva, Tomate, Zanahoria, Lechuga, Papa |
| 🥖 | Panadería | Pan, Pan de molde, Galleta, Bizcocho |
| 🍗 | Carnes | Pechuga de pollo, Muslo de pollo, Pescado, Filete, Jamón, Salchicha |
| 🧼 | Aseo | Jabón, Champú, Papel higiénico, Dentífrico, Cepillo, Detergente |

---

## 🧑‍⚕️ Panel del terapeuta

Disponible en la parte inferior de la interfaz (expandible). Permite:

- **Cambiar de escenario** manualmente mediante un selector.
- **Reiniciar** el escenario actual.
- Ver los **errores totales** acumulados.
- Inspeccionar el **estado actual** del agente (`items_restantes`, `items_en_carrito`, `intentos_fallidos`, `nivel_pista`).
- Revisar el **log de eventos** completo en formato JSON (ítem tocado, acción del agente, entropía visual, tiempo de respuesta en ms).

---

## 🤖 Comportamiento del agente pedagógico

El agente sigue una política de 4 acciones según el número de intentos fallidos consecutivos:

| Acción | Trigger | Comportamiento |
|---|---|---|
| `a0` | Producto correcto | ✅ Añade al carrito, felicita al usuario |
| `a1` | 1.º fallo | 💡 Indica la categoría del producto objetivo |
| `a2` | 2.º fallo | 🔍 Resalta la categoría y elimina un distractor de la pantalla |
| `a3` | 3.º fallo o sin distractores | 👉 Señala directamente el producto correcto con animación |

---

## 🔊 Apoyo de voz

El audio acompaña la instrucción inicial, las pistas, los aciertos, el siguiente producto y la compra completada. **Esta fase es de frontend:** no añade FastAPI, ID3, Q-Learning ni reconocimiento de voz.

1. Pulsa **Activar voz**. La primera carga permanece en silencio para respetar los permisos del navegador.
2. **Repetir instrucción** vuelve a leer el mensaje actual; **Detener** interrumpe la lectura y **Silenciar voz** desactiva las siguientes lecturas.
3. En **Ajustes de voz**, elige una voz española, velocidad y volumen. Se conservan al cambiar de escenario dentro de la misma sesión; una recarga o nueva instancia requiere activar otra vez.

Se utiliza `speechSynthesis` (Web Speech API) en el dispositivo del jugador, sin claves ni micrófono. Se prefieren voces locales; las voces **«en línea»** pueden necesitar internet y utilizar servicios del proveedor del navegador. No se garantiza funcionamiento offline ni la misma voz en todos los dispositivos. Si no hay voces españolas, instala una desde el sistema operativo o prueba otro navegador. La app mantiene los pictogramas y el texto si la síntesis no está disponible o falla.

Cada mensaje nuevo tiene un ID propio. Los reruns no lo vuelven a reproducir; una decisión nueva cancela la frase anterior y no acumula una cola de instrucciones. Ocultar la pestaña detiene la voz; al volver se puede repetir. Los cambios de ajustes no reinician la lectura automáticamente.

El último estado de reproducción y las preferencias se conservan en `st.session_state["apoyo_voz"]`. No se persisten en una base de datos ni se corrige aún `t_ms` para descontar tiempo de audio: esa medición y la regla de inactividad corresponden a la fase posterior del backend/agente.

---

## 🧪 Pruebas

Desde la raíz y con el entorno virtual activado:

```bash
pip install -r requirements-dev.txt
python -m pytest -q
node --test tests/apoyo_voz.test.mjs
```

Node.js 22+ se usa **solo para las pruebas JavaScript**, no para ejecutar la app. Las pruebas Python verifican mensajes, reruns, pistas, compras, finalización y reinicio con `AppTest`. Las pruebas JavaScript simulan el motor de voz y comprueban activación, repetición, cancelación, errores, permisos, voces tardías y limpieza del componente; **no prueban que salga sonido por los altavoces**.

Comprobación manual en el dispositivo de uso: activar voz, provocar las tres pistas, completar una compra y reiniciar. Confirmar que cada nueva instrucción se escucha una vez, que repetir funciona, que silenciar interrumpe y que cambiar ajustes no altera el carrito ni vuelve a leer solo. Revisar también volumen, pronunciación de los productos y ausencia de voz al abrir la página.

---

## 🛠️ Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| [Python 3.10+](https://www.python.org/) | Lenguaje principal |
| [Streamlit](https://streamlit.io/) | Framework de interfaz web |
| [ARASAAC API](https://arasaac.org/developers/api) | Pictogramas (CC BY-NC-SA) |
| HTML / CSS | Personalización visual de la interfaz |
| Web Speech API + Streamlit Components v2 | Síntesis de voz en español y controles accesibles |
| Google Fonts — Atkinson Hyperlegible | Tipografía de alta legibilidad |

---

## 📝 Notas de desarrollo

- Los pictogramas se cargan en tiempo real desde `https://static.arasaac.org/pictograms/{id}/{id}_300.png`. Se requiere **conexión a internet**.
- El log de eventos por sesión se almacena únicamente en `st.session_state` (memoria en RAM). Para persistencia, se deberá implementar un módulo de exportación a CSV/JSON.
- Para añadir nuevos retos, edita `datos/escenarios.json` siguiendo el esquema existente.

---

## 📄 Licencia

Este proyecto es de carácter académico. Los pictogramas son propiedad del **Gobierno de Aragón** y se usan bajo licencia **Creative Commons BY-NC-SA**.
Consulta [arasaac.org](https://arasaac.org) para más información sobre las condiciones de uso.
