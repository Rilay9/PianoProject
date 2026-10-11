import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Served from GitHub Pages at https://rilay9.github.io/PianoProject/.
// preview.html holds design prototypes; it is not linked from the app.
export default defineConfig({
  base: '/PianoProject/',
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), preview: resolve(__dirname, 'preview.html') },
    },
  },
});
