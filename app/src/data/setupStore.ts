/**
 * Whether the setup tour has been run (docs/04 §7d).
 *
 * Three states. `never` is a fresh install, and the only state that sends a
 * launch to the tour. `skipped` and `done` both mean "do not ask again": the
 * tour is then a row in Settings, and the date lets that row say when it was
 * last run. Persisted like every setting (data/persist), so it survives a
 * restore and the localStorage clears a phone does on its own.
 */
import { persistLocal } from './persist';

const STORAGE_KEY = 'pianopath.setup';

/** Bumped when the tour gains a step worth walking a returning owner through. */
export const SETUP_VERSION = 1;

export type SetupStatus = 'never' | 'skipped' | 'done';

export interface SetupRecord {
  status: SetupStatus;
  /** ISO timestamp of the last time the tour was finished or skipped. */
  at?: string;
  version: number;
}

function read(): SetupRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { status: 'never', version: SETUP_VERSION };
    const parsed = JSON.parse(raw) as Partial<SetupRecord>;
    const status = parsed.status === 'done' || parsed.status === 'skipped' ? parsed.status : 'never';
    return {
      status,
      ...(typeof parsed.at === 'string' ? { at: parsed.at } : {}),
      version: typeof parsed.version === 'number' ? parsed.version : SETUP_VERSION,
    };
  } catch {
    return { status: 'never', version: SETUP_VERSION };
  }
}

let current: SetupRecord = read();

export function getSetupRecord(): Readonly<SetupRecord> {
  return current;
}

export function setupStatus(): SetupStatus {
  return current.status;
}

/** Records that the tour ended, one way or the other. */
export function markSetup(status: Exclude<SetupStatus, 'never'>, now: Date = new Date()): void {
  current = { status, at: now.toISOString(), version: SETUP_VERSION };
  persistLocal(STORAGE_KEY, JSON.stringify(current));
}

/** After a restore or a hydration, so the in-memory copy matches the store. */
export function reloadSetup(): void {
  current = read();
}
