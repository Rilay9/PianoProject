import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// pdf.js decodes JPEG 2000 images (most library scans, Internet Archive's above all) and colour profiles with its own
// WebAssembly files, fetched by name from one folder (getDocument's wasmUrl). Without them such a page draws blank
// (review 2026-10-14). They are served at <base>pdfjs-wasm/ from the installed pdfjs-dist, in development and in the
// build, so they always match the pdf.js version in use.
const WASM_FILES = ['openjpeg.wasm', 'qcms_bg.wasm', 'openjpeg_nowasm_fallback.js'];
const wasmDir = fileURLToPath(new URL('./node_modules/pdfjs-dist/wasm/', import.meta.url));
function pdfjsWasm(): Plugin {
  return {
    name: 'pdfjs-wasm',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = /\/pdfjs-wasm\/([^/?#]+)/.exec(req.url ?? '')?.[1];
        if (!name || !WASM_FILES.includes(name)) { next(); return; }
        res.setHeader('Content-Type', name.endsWith('.wasm') ? 'application/wasm' : 'text/javascript');
        res.end(readFileSync(wasmDir + name));
      });
    },
    generateBundle() {
      for (const name of WASM_FILES) this.emitFile({ type: 'asset', fileName: `pdfjs-wasm/${name}`, source: readFileSync(wasmDir + name) });
    },
  };
}

// Served from GitHub Pages at https://rilay9.github.io/PianoProject/.
export default defineConfig({
  base: '/PianoProject/',
  plugins: [pdfjsWasm()],
});
