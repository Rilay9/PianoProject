/**
 * Where the setup tour was left, so coming back does not start it again.
 *
 * `data/setupStore` records the tour's *outcome* — never / skipped / done —
 * and that is the right shape for the thing Settings shows and the launch
 * check reads. This is a different fact with a different life: which step is
 * open right now, kept only while the tour is unfinished and thrown away the
 * moment it is skipped or finished, so "Setup tour · Run again" still starts
 * at the beginning.
 *
 * A first launch lands on the tour. Losing the phone call, the notification or
 * the back gesture half-way through and being put back on step one — with the
 * piano permission prompt to answer again — is the difference between an app
 * and a brick, and it costs a string.
 */

const STORAGE_KEY = 'pianopath.setup.step';

/** Records the open step, or clears it when the tour is done with. */
export function rememberSetupStep(id: string | null): void {
  try {
    if (id === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage blocked: the tour simply starts from the beginning, which is
    // what it did before this existed.
  }
}

export function rememberedSetupStep(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * The step to open, from what was remembered.
 *
 * Anything unrecognised is step one. A remembered id that no longer exists is
 * a tour that has been rewritten since — which is exactly when starting over
 * is right — and it must never be able to open nothing at all.
 */
export function resumeIndex(remembered: string | null, stepIds: readonly string[]): number {
  if (remembered === null) return 0;
  const at = stepIds.indexOf(remembered);
  return at > 0 ? at : 0;
}
