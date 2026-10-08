"""Salida de voz del frontend, independiente de la política del juego.

La síntesis se ejecuta en el navegador. No utiliza micrófono, un servidor TTS
propio ni credenciales. El componente recibe mensajes identificados, no decisiones.
"""

from pathlib import Path

import streamlit as st
from streamlit.components.v2 import component

_HTML = """
<section aria-label="Apoyo de voz">
  <div class="controles">
    <button id="activar" type="button" aria-pressed="false">Activar voz</button>
    <button id="repetir" type="button" disabled>Repetir instrucción</button>
    <button id="detener" type="button" disabled>Detener</button>
  </div>
  <p id="estado" role="status" aria-live="polite"></p>
  <details>
    <summary>Ajustes de voz</summary>
    <div class="ajustes">
      <label>Voz en español <select id="voz"></select></label>
      <label>Velocidad
        <select id="velocidad">
          <option value="0.75">Lenta</option>
          <option value="0.9" selected>Tranquila</option>
          <option value="1">Normal</option>
        </select>
      </label>
      <label>Volumen <output id="volumen_valor">80 %</output>
        <input id="volumen" type="range" min="0" max="1" step="0.05" value="0.8">
      </label>
    </div>
    <p class="nota">No se usa el micrófono. Las voces marcadas «en línea» pueden
      necesitar internet y utilizar el servicio de voz del navegador.</p>
  </details>
</section>
"""

_CSS = """
section {
  font-family: var(--st-font, sans-serif);
  color: var(--st-text-color);
  background: var(--st-background-color);
  border: 1px solid var(--st-border-color, #767676);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.controles, .ajustes { display: flex; flex-wrap: wrap; gap: 12px; }
button, select, input { font: inherit; }
button, select {
  min-height: 44px;
  border: 1px solid var(--st-border-color, #767676);
  border-radius: 8px;
  color: inherit;
  background: var(--st-secondary-background-color);
  padding: 8px 12px;
}
button:not(:disabled), summary { cursor: pointer; }
button:disabled { opacity: .55; }
button:focus-visible, select:focus-visible, input:focus-visible, summary:focus-visible {
  outline: 3px solid var(--st-primary-color, #004c99);
  outline-offset: 3px;
}
label { display: flex; flex-direction: column; gap: 6px; max-width: 100%; }
select { max-width: 100%; }
input { min-height: 44px; }
summary { min-height: 44px; align-content: center; }
p { margin: 8px 0; }
.nota { font-size: .85rem; }
"""

# Se registra una sola vez al importar; los datos de cada jugador van en data.
_COMPONENTE_VOZ = component(
    "apoyo_voz",
    html=_HTML,
    css=_CSS,
    js=Path(__file__).with_suffix(".mjs").read_text(encoding="utf-8"),
)


def mostrar_apoyo_voz(mensaje: dict[str, str]) -> None:
    """Mantener una instancia estable durante inicio, pistas y pantalla final."""
    estado = st.session_state.get("apoyo_voz", {})
    _COMPONENTE_VOZ(
        key="apoyo_voz",
        data={
            "message": {"id": mensaje["id"], "text": mensaje["texto_voz"]},
            "settings": estado.get("ajustes", {}),
        },
        on_ajustes_change=lambda: None,
        on_reproduccion_change=lambda: None,
    )
