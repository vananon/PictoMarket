import sys
from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

APP = Path(__file__).resolve().parents[1] / "codigo/frontend/app_pictomarket.py"


@pytest.fixture
def app(monkeypatch):
    # Cada AppTest tiene su propio Runtime. Registrar dentro de ese contexto,
    # sin reutilizar el renderer de un Runtime que ya terminó.
    monkeypatch.delitem(sys.modules, "apoyo_voz", raising=False)
    at = AppTest.from_file(str(APP), default_timeout=15).run()
    assert not at.exception
    return at


def test_inicio_y_reruns_conservan_identidad(app):
    mensaje = dict(app.session_state["mensaje"])
    assert "busca: leche" in mensaje["texto_voz"]
    assert len(app.get("bidi_component")) == 1
    componente_id = app.get("bidi_component")[0].proto.id
    app.run()
    assert not app.exception
    assert app.get("bidi_component")[0].proto.id == componente_id
    assert app.session_state["mensaje"] == mensaje
    assert app.session_state["log_eventos"] == []


def test_pistas_son_emisiones_nuevas_sin_emojis(app):
    ids = {app.session_state["mensaje"]["id"]}
    for producto, accion in [(2618, "a1"), (2964, "a2"), (2699, "a3")]:
        app.button(key=f"btn_{producto}").click().run()
        assert not app.exception
        mensaje = app.session_state["mensaje"]
        assert mensaje["id"] not in ids
        ids.add(mensaje["id"])
        assert mensaje["tipo"] == "pista"
        assert "👉" not in mensaje["texto_voz"]
        assert "🥛" not in mensaje["texto_voz"]
        assert app.session_state["log_eventos"][-1]["accion_agente"] == accion
    assert "leche" in app.session_state["mensaje"]["texto_voz"]


def test_compra_y_final_tienen_voz_sin_cambiar_moneda_ni_carrito(app):
    componente_id = app.get("bidi_component")[0].proto.id
    for producto in [2445, 2494, 2462]:
        anterior = app.session_state["mensaje"]["id"]
        app.button(key=f"btn_{producto}").click().run()
        assert not app.exception
        assert app.session_state["mensaje"]["id"] != anterior
        assert app.get("bidi_component")[0].proto.id == componente_id
    assert app.session_state["items_en_carrito"] == [2445, 2494, 2462]
    assert app.session_state["monedas"] == 2
    mensaje = dict(app.session_state["mensaje"])
    assert "lo lograste" in mensaje["texto_voz"]
    assert "compraste todo" in mensaje["texto_voz"]
    assert len(app.get("bidi_component")) == 1
    app.run()
    assert not app.exception
    assert app.session_state["mensaje"] == mensaje
    app.button(key="btn_siguiente").click().run()
    assert not app.exception
    assert app.session_state["reto_idx"] == 1
    assert app.get("bidi_component")[0].proto.id == componente_id
    assert app.session_state["mensaje"]["id"] != mensaje["id"]
    assert "pechuga de pollo" in app.session_state["mensaje"]["texto_voz"]


def test_reiniciar_no_reutiliza_id_ni_borra_preferencias_de_voz(app):
    anterior = dict(app.session_state["mensaje"])
    ajustes = {"enabled": True, "volume": 0.5, "rate": 0.75, "voiceURI": "local-es"}
    app.session_state["apoyo_voz"] = {"ajustes": ajustes}
    app.button[-1].click().run()  # Reiniciar escenario en el panel del terapeuta.
    assert not app.exception
    assert app.session_state["mensaje"]["id"] != anterior["id"]
    assert app.session_state["mensaje"]["texto"] == anterior["texto"]
    assert app.session_state["apoyo_voz"]["ajustes"] == ajustes


def test_actualizacion_de_una_sesion_anterior_no_reinicia_la_compra(app):
    app.button(key="btn_2445").click().run()
    anterior = app.session_state["mensaje"]
    app.session_state["mensaje"] = {"tipo": anterior["tipo"], "texto": anterior["texto"]}
    app.run()
    assert not app.exception
    assert app.session_state["items_en_carrito"] == [2445]
    assert app.session_state["monedas"] == 4
    assert app.session_state["mensaje"]["id"]
    assert "pan" in app.session_state["mensaje"]["texto_voz"]
