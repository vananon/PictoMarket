import pytest

from codigo.frontend.mensajes_voz import crear_mensaje, texto_para_voz


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("¡MUY BIEN! LECHE VA AL CARRITO.", "¡muy bien! leche va al carrito."),
        ("MIRA 👉 AQUÍ ESTÁ PLÁTANO", "mira aquí está plátano"),
        ("BUSCA EN 🥛 LÁCTEOS Y HUEVOS", "busca en lácteos y huevos"),
        ("[COMPRAR]  [PARA]\n[DESAYUNO]", "comprar para desayuno"),
        ("CHAMPU\u0301 Y JABÓN", "champú y jabón"),
        ("", ""),
    ],
)
def test_texto_para_voz_preserva_espanol_sin_marcas(texto, esperado):
    assert texto_para_voz(texto) == esperado


def test_cada_emision_tiene_identidad_aunque_el_texto_se_repita():
    primero = crear_mensaje("pista", "MIRA 👉 AQUÍ ESTÁ LECHE")
    segundo = crear_mensaje("pista", "MIRA 👉 AQUÍ ESTÁ LECHE")
    assert primero["id"] != segundo["id"]
    assert primero["texto"] == segundo["texto"] == "MIRA 👉 AQUÍ ESTÁ LECHE"
    assert primero["tipo"] == "pista"
    assert primero["texto_voz"] == "mira aquí está leche"
