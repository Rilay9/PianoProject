// @vitest-environment jsdom
/**
 * The evidence job's progress is on the storage report (C5 item 5): Settings →
 * Content says how many runs' evidence is up to date, how many are still to
 * do while the job runs, and how many are kept out and why — a run kept out
 * contributes nothing to where the learner is, so the learner is told.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';
import { evidenceJobLine } from '../../src/ui/help';
import type { EvidenceJobStatus } from '../../src/data/evidenceJob';

vi.mock('../../src/ui/trackChips', () => ({ renderTrackChips: () => Promise.resolve() }));
vi.mock('../../src/util/storageReport', async (original) => ({
  ...(await original<typeof import('../../src/util/storageReport')>()),
  measureStorage: () =>
    Promise.resolve({ usageBytes: 1024, quotaBytes: 2048, precached: 3, imports: 0, importBytes: 0, sessions: 0, sessionCap: 2200 }),
}));

const { SettingsScreen } = await import('../../src/ui/screens/SettingsScreen');
const { disposeScreen } = await import('../../src/ui/screenLifecycle');
const job = await import('../../src/data/evidenceJob');

const base: EvidenceJobStatus = { state: 'done', current: 0, recomputed: 0, pending: 0, excluded: {}, normalised: 0, carried: 0 };

describe('the words', () => {
  it('says what is up to date, what is still to do, and what is kept out and why', () => {
    expect(evidenceJobLine({ ...base, current: 12 })).toBe('Evidence from your runs: 12 up to date.');
    expect(evidenceJobLine({ ...base, state: 'running', current: 3, pending: 9 })).toBe(
      'Evidence from your runs: 3 up to date, 9 being brought up to date.',
    );
    expect(evidenceJobLine({ ...base, current: 5, excluded: { 'no-steps': 7, 'phrase-differs': 2 } })).toBe(
      'Evidence from your runs: 5 up to date. Kept out: 7 recorded before the app kept each note; 2 whose phrase the app now writes differently.',
    );
    expect(evidenceJobLine({ ...base, state: 'waiting' })).toBe('Evidence from your runs: checking after the screen is up.');
  });

  // Added (C5, found in the pictures): while the job is still looking through
  // the runs it has not yet counted what is to do, and the line read exactly
  // as it does when the job has finished — "0 up to date." over a row it had
  // not reached. It says it is still checking until the job is done.
  it('says when it stopped before the end, and that it tries again', () => {
    expect(evidenceJobLine({ ...base, current: 2, stopped: true })).toBe(
      'Evidence from your runs: 2 up to date. Stopped before the end; it tries again the next time the app opens.',
    );
  });

  it('says it is still checking while the job has not finished looking', () => {
    expect(evidenceJobLine({ ...base, state: 'running', current: 3, pending: 0 })).toBe(
      'Evidence from your runs: 3 up to date, still checking.',
    );
  });
});

describe('the storage report', () => {
  afterEach(() => {
    document.body.replaceChildren();
    job.resetEvidenceJobForTest();
  });

  it('prints the job’s line, and follows it as the job reports', async () => {
    const screen = SettingsScreen({ navigate: vi.fn(), navigateDev: vi.fn() } as unknown as Router);
    document.body.replaceChildren(screen);
    const line = (): string => screen.querySelector('#settings-evidence')?.textContent ?? '';
    expect(line()).toBe('Evidence from your runs: checking after the screen is up.');
    const settled = (): string | null => screen.querySelector('#settings-evidence')?.getAttribute('data-settled') ?? null;
    expect(settled(), 'the line says it is settled before the job has run').toBeNull();
    // The job runs with a store of its own here; what matters is that the
    // screen repeats what it reports.
    await job.runEvidenceJob(
      {
        curriculum: () => Promise.resolve({ version: 1, tracks: [], stages: [] }),
        items: () => Promise.resolve([]),
        walkRuns: () => Promise.resolve(),
        writeEvidence: () => Promise.resolve(),
        modelOf: () => Promise.reject(new Error('no phrase to write')),
        write: () => ({ musicXml: '' }),
        vocabulary: { skills: [], demands: [], conditions: [] },
        idle: () => Promise.resolve(),
        carryOver: () => Promise.resolve(0),
        normalise: () => Promise.resolve([]),
        announce: () => undefined,
      },
      job.reportEvidenceJob,
    );
    expect(line()).toBe('Evidence from your runs: 0 up to date.');
    // Settled once the job is done, so a reader (or a test) can wait on the
    // state rather than on the words (C5).
    expect(settled()).toBe('true');
    disposeScreen(screen);
  });
});
