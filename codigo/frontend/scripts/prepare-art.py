"""Regenerar solo arte, nunca controles/texto de la captura de referencia.

Uso opcional: python scripts/prepare-art.py (requiere Pillow).
Los archivos generados están versionados; React no necesita Python.
"""
from collections import deque
from pathlib import Path
from typing import cast

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / 'codigo/frontend/public/art'
OUTPUT.mkdir(parents=True, exist_ok=True)
background = Image.open(ROOT / 'img/fondo.png')
background.save(OUTPUT / 'market.webp', quality=90)
background.crop((207, 195, 1139, 304)).save(OUTPUT / 'awning.webp', quality=94)
background.crop((220, 312, 1128, 469)).save(OUTPUT / 'shelf.webp', quality=94)
reference = Image.open(ROOT / 'img/ui.png')
reference.crop((264, 99, 394, 234)).save(OUTPUT / 'guide.webp', quality=94)
logo = reference.crop((1292, 7, 1513, 80)).convert('RGBA')
# Quitar solo el fondo conectado al borde; conservar el dibujo del logotipo.
base = cast(tuple[int, int, int, int], logo.getpixel((0, 0)))[:3]
pixels = logo.load()
assert pixels is not None
queue = deque([(x, 0) for x in range(logo.width)] + [(x, logo.height - 1) for x in range(logo.width)]
              + [(0, y) for y in range(logo.height)] + [(logo.width - 1, y) for y in range(logo.height)])
visited = set()
while queue:
    x, y = queue.popleft()
    if (x, y) in visited or not (0 <= x < logo.width and 0 <= y < logo.height):
        continue
    visited.add((x, y))
    r, g, b, alpha = cast(tuple[int, int, int, int], pixels[x, y])
    if max(abs(r - base[0]), abs(g - base[1]), abs(b - base[2])) > 35:
        continue
    pixels[x, y] = (r, g, b, 0)
    queue.extend([(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)])
logo.save(OUTPUT / 'kallpa.webp', lossless=True)
print('Arte regenerado en', OUTPUT.relative_to(ROOT))
