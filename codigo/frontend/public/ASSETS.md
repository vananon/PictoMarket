# Procedencia de recursos

## Arte proporcionado para la interfaz

Los originales están en `img/`, en la raíz del repositorio:

| Recurso público   | Fuente          | Transformación                                                  |
| ----------------- | --------------- | --------------------------------------------------------------- |
| `art/market.webp` | `img/fondo.png` | Conversión a WebP                                               |
| `art/awning.webp` | `img/fondo.png` | Recorte del toldo                                               |
| `art/shelf.webp`  | `img/fondo.png` | Recorte de madera y cajones                                     |
| `art/guide.webp`  | `img/ui.png`    | Recorte decorativo del rostro del guía                          |
| `art/kallpa.webp` | `img/ui.png`    | Recorte del logotipo y eliminación del fondo conectado al borde |

`img/ui.png` sirve como referencia visual; no se renderiza como pantalla, ni contiene los controles activos. Todos los textos, tarjetas, precios, botones y estados de la aplicación se crean con React.

Los recortes se pueden reproducir con `scripts/prepare-art.py`. **No se dispone de información de licencia de las imágenes suministradas ni de autorización de uso de la marca Kallpa.** Su presencia reproduce la referencia solicitada; no afirma patrocinio ni afiliación. Validar permisos antes de publicar o redistribuir estos recursos.

## Pictogramas

- Autor: **Sergio Palao**.
- Origen: **ARASAAC**, <https://arasaac.org>.
- Propietario: **Gobierno de Aragón**.
- Licencia: **Creative Commons BY-NC-SA**.
- Fuente de cada archivo: `https://static.arasaac.org/pictograms/{id}/{id}_300.png`.

Se conservan los 30 IDs y sus nombres tal como aparecen en `datos/escenarios.json`. Los archivos PNG de `pictograms/` no se redibujan ni reemplazan por iconos de la captura. `scripts/download-pictograms.mjs` reproduce las descargas y valida la firma PNG.

## Fuentes e iconos

- **Nunito**, Google Fonts, fuentes locales 700 y 900. Licencia **SIL Open Font License 1.1**, incluida en `fonts/OFL.txt`. Fuente: <https://github.com/google/fonts/tree/main/ofl/nunito>.
- **Lucide**, iconos SVG a través de `lucide-react`, licencia ISC: <https://lucide.dev/license>.
- Las monedas son dibujos CSS y los emojis decorativos dependen del sistema operativo.
