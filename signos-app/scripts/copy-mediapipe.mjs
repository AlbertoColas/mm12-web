// Copia el "motor" de MediaPipe (WASM) desde node_modules a public/mediapipe,
// para que la app lo sirva ella misma y no dependa de ningún CDN.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const dest = join(root, 'public', 'mediapipe');
const files = ['vision_wasm_internal.js', 'vision_wasm_internal.wasm'];

if (!existsSync(src)) {
  console.warn('[copy-mediapipe] No encuentro @mediapipe/tasks-vision; ¿falta npm install?');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of files) copyFileSync(join(src, f), join(dest, f));
console.log('[copy-mediapipe] WASM copiado a public/mediapipe');
