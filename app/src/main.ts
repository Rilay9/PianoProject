import './style.css';
import { Router } from './router';
import { initTheme } from './ui/theme';
import { mountAppShell } from './ui/AppShell';
import { audioEngine } from './audio/AudioEngine';

initTheme();

// Android refuses to start an AudioContext outside a user gesture, and a
// context created too late swallows the first note. Arming this at boot means
// the very first tap anywhere in the app — a tab, a button — gets audio
// running before it is needed (docs/01-architecture.md §4.4).
audioEngine.startOnFirstGesture(window);

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
