// Theme: system (prefers-color-scheme) by default, with a manual override
// persisted through data/persist — IndexedDB as the store of record, mirrored
// to localStorage so the first paint can read it synchronously. Callers should
// only use this module's exports rather than touching either store directly.

import { persistLocal } from '../data/persist';

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
  persistLocal(STORAGE_KEY, pref);
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
