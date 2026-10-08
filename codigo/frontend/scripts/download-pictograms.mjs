import { readFile, writeFile, mkdir } from 'node:fs/promises';
let data;
try {
  data = JSON.parse(
    await readFile(
      new URL('../../../datos/escenarios.json', import.meta.url),
      'utf8',
    ),
  );
} catch (cause) {
  throw new Error(
    'No se pudieron leer los escenarios para descargar los pictogramas.',
    { cause },
  );
}
const folder = new URL('../public/pictograms/', import.meta.url);
await mkdir(folder, { recursive: true });
// Descargas acotadas; una falla no sustituye silenciosamente un pictograma.
const entries = Object.keys(data.catalogo);
for (let offset = 0; offset < entries.length; offset += 4) {
  await Promise.all(
    entries.slice(offset, offset + 4).map(async (id) => {
      const url = data.url_pictograma.replaceAll('{id}', id);
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a')
        throw new Error(`${id}: no es PNG`);
      await writeFile(new URL(`${id}.png`, folder), bytes);
      console.log(`${id}: ${data.catalogo[id].nombre}`);
      return id;
    }),
  );
}
