"""Contrato de mensajes multimodales, sin dependencia de Streamlit ni TTS."""

import re
import unicodedata
from uuid import uuid4


def texto_para_voz(texto: str) -> str:
    """Conservar palabras y puntuación españolas, sin emojis ni marcas visuales."""
    texto = unicodedata.normalize("NFC", texto).replace("_", " ")
    texto = re.sub(r"[^\w\s.,;:¡!¿?\-]", " ", texto)
    return re.sub(r"\s+", " ", texto).strip().lower()


def crear_mensaje(tipo: str, texto: str) -> dict[str, str]:
    """Crear una emisión nueva, incluso si repite las palabras de otra anterior."""
    return {
        "id": uuid4().hex,
        "tipo": tipo,
        "texto": texto,
        "texto_voz": texto_para_voz(texto),
    }
