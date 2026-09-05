// Theme: system (prefers-color-scheme) by default, with a manual override
// persisted to localStorage for now. P7 moves all settings into IndexedDB
// behind the same get/set shape, so callers should only use this module's
// exports rather than touching localStorage directly.

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'pianopath.theme';

function readStored(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // localStorage can throw in private-browsing/storage-blocked contexts.
  }
  return 'system';
}

let current: ThemePreference = readStored();
const listeners = new Set<(pref: ThemePreference) => void>();

export function getThemePreference(): ThemePreference {
  return current;
}

export function setThemePreference(pref: ThemePreference): void {
  current = pref;
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // ignore — theme just won't persist this session
  }
  applyTheme();
  for (const l of listeners) l(current);
}

export function onThemeChange(cb: (pref: ThemePreference) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function resolvedScheme(): 'light' | 'dark' {
  if (current !== 'system') return current;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(): void {
  document.documentElement.setAttribute('data-theme', resolvedScheme());
}

export function initTheme(): void {
  applyTheme();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (current === 'system') applyTheme();
  });
}
