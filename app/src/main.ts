import './style.css';
import { Router } from './router';
import { initTheme } from './ui/theme';
import { mountAppShell } from './ui/AppShell';

initTheme();

const root = document.getElementById('app');
if (!root) {
  throw new Error('root element #app not found');
}

const router = new Router();
mountAppShell(root, router);

if ('serviceWorker' in navigator) {
  // Registered by vite-plugin-pwa's virtual module; see vite.config.ts.
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
