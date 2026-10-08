import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// En Windows, c: y C: pueden cargar dos instancias del runner de Vitest.
// Usar la ruta canónica evita perder el contexto de suite y funciona en Unix.
process.chdir(realpathSync.native(process.cwd()));
const entry = join(process.cwd(), 'node_modules/vitest/vitest.mjs');
process.argv[1] = entry;
await import(pathToFileURL(entry).href);
