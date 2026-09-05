/**
 * Settings (docs/04 §7), grouped exactly as the spec groups them: Practice,
 * Display, Sound, Input, Content.
 *
 * Every control writes straight through — there is no Save button, because
 * there is nothing to save *to* but this phone, and a settings screen with an
 * unsaved-changes state is a settings screen that loses them.
 *
 * Content carries the offline story (`00` D20): "download everything now",
 * the offline-only switch, and a storage breakdown, because an app that keeps
 * its whole library on the device owes the owner a number for how much of his
 * phone it is using.
 */
import type { Router } from '../../router';
import { allItems } from '../../curriculum/load';
import { getMidiSettings, updateMidiSettings } from '../../data/midiSettings';
import {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  type PracticeSettings,
} from '../../data/settingsStore';
import { getPlan, updatePlan } from '../../data/planStore';
import { allImports } from '../../data/importStore';
import { openDatabase } from '../../data/db';
import { getThemePreference, setThemePreference, type ThemePreference } from '../theme';
import {
  button,
  el,
  field,
  numberControl,
  selectControl,
  toggleControl,
} from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

/** docs/04 §7 "offline only [off]" — stops the app checking for updates. */
export const OFFLINE_ONLY_KEY = 'pianopath.offlineOnly';

export function isOfflineOnly(): boolean {
  try {
    return localStorage.getItem(OFFLINE_ONLY_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOfflineOnly(value: boolean): void {
  try {
    localStorage.setItem(OFFLINE_ONLY_KEY, value ? '1' : '0');
  } catch {
    // Blocked storage: the app checks for updates, which is the safe default.
  }
}

export interface StorageBreakdown {
  usageBytes: number;
  quotaBytes: number;
  precached: number;
  imports: number;
  importBytes: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} kB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

/** What the Content block reports, and what Diagnostics reuses (docs/04 §7b). */
export async function measureStorage(): Promise<StorageBreakdown> {
  const estimate = (await navigator.storage?.estimate?.()) ?? {};
  let precached = 0;
  if (typeof caches !== 'undefined') {
    try {
      for (const name of await caches.keys()) {
        precached += (await (await caches.open(name)).keys()).length;
      }
    } catch {
      // Cache Storage can be unavailable; the number is then simply unknown.
    }
  }
  const rows = await allImports();
  const importBytes = rows.reduce(
    (sum, row) => sum + (typeof row.data === 'string' ? row.data.length : row.data.byteLength),
    0,
  );
  return {
    usageBytes: estimate.usage ?? 0,
    quotaBytes: estimate.quota ?? 0,
    precached,
    imports: rows.length,
    importBytes,
  };
}

export function SettingsScreen(router: Router): HTMLElement {
  const { section, body } = screenFrame('settings', 'Settings');
  const status = statusLine('settings-status');

  const set = (patch: Partial<PracticeSettings>): void => {
    updateSettings(patch);
    status.textContent = 'Saved.';
  };

  function group(title: string): HTMLElement {
    const block = el('section.block', {}, el('h2', { text: title }));
    body.append(block);
    return block;
  }

  const s = getSettings();
  const midi = getMidiSettings();

  // --- Practice ------------------------------------------------------------
  const practice = group('Practice');
  practice.append(
    field(
      'Default mode with MIDI or mic',
      selectControl(
        'set-mode-input',
        [
          { value: 'wait', label: 'Wait' },
          { value: 'tempo', label: 'Tempo' },
        ],
        s.defaultModeWithInput,
        (value) => set({ defaultModeWithInput: value as 'wait' | 'tempo' }),
      ),
    ),
    field(
      'Default mode without one',
      selectControl(
        'set-mode-noinput',
        [
          { value: 'tempo', label: 'Tempo' },
          { value: 'wait', label: 'Wait (screen keys)' },
        ],
        s.defaultModeWithoutInput,
        (value) => set({ defaultModeWithoutInput: value as 'wait' | 'tempo' }),
      ),
    ),
    field('Bars per window', numberControl('set-bars', s.barsPerWindow, (v) => set({ barsPerWindow: v }), { min: 1, max: 8 })),
    field('Half-window scrolling', toggleControl('set-halfwindow', s.halfWindowScrolling, (v) => set({ halfWindowScrolling: v }))),
    field(
      'Layout',
      selectControl(
        'set-layout',
        [
          { value: 'window', label: 'Window' },
          { value: 'scroll', label: 'Scroll' },
        ],
        s.layout,
        (value) => set({ layout: value as PracticeSettings['layout'] }),
      ),
    ),
    field('Default tempo % for new items', numberControl('set-tempo', s.defaultTempoPct, (v) => set({ defaultTempoPct: v }), { min: 30, max: 130, step: 5 })),
    field('Count-in bars', numberControl('set-countin', s.countInBars, (v) => set({ countInBars: v }), { min: 0, max: 4 })),
    field(
      'Metronome sound',
      selectControl(
        'set-metronome-sound',
        [
          { value: 'wood', label: 'Wood' },
          { value: 'beep', label: 'Beep' },
          { value: 'high', label: 'High (5 kHz — for mic follow)' },
        ],
        s.metronomeSound,
        (value) => set({ metronomeSound: value as PracticeSettings['metronomeSound'] }),
      ),
      'The high click is the one the mic detector notches out, so use it when the microphone is listening.',
    ),
    field('Strict Wait mode', toggleControl('set-waitstrict', s.waitStrict, (v) => set({ waitStrict: v })), 'Off (the default) means a wrong note does not reset the chord.'),
    field('Tempo-mode tolerance (ms)', numberControl('set-tolerance', s.toleranceMs, (v) => set({ toleranceMs: v }), { min: 30, max: 500, step: 10 })),
    field('Pass accuracy %', numberControl('set-pass-accuracy', s.passAccuracyPct, (v) => set({ passAccuracyPct: v }), { min: 50, max: 100 })),
    field('Pass tempo %', numberControl('set-pass-tempo', s.passTempoPct, (v) => set({ passTempoPct: v }), { min: 30, max: 130, step: 5 })),
  );

  // --- Display -------------------------------------------------------------
  const display = group('Display');
  display.append(
    field(
      'Theme',
      selectControl(
        'theme-select',
        [
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ],
        getThemePreference(),
        (value) => setThemePreference(value as ThemePreference),
      ),
    ),
    field('Landscape lock on the Score screen', toggleControl('set-landscape', s.landscapeLock, (v) => set({ landscapeLock: v }))),
    field('Zoom', numberControl('set-zoom', s.zoom, (v) => set({ zoom: v }), { min: 0.5, max: 2.5, step: 0.1 })),
    field('Show fingering', toggleControl('set-fingering', s.showFingering, (v) => set({ showFingering: v }))),
    field('Note names in note heads', toggleControl('set-notenames', s.showNoteNames, (v) => set({ showNoteNames: v }))),
    field('Show chord symbols', toggleControl('set-chords', s.showChordSymbols, (v) => set({ showChordSymbols: v }))),
    field('Keyboard strip', toggleControl('set-strip', s.keyboardStrip, (v) => set({ keyboardStrip: v }))),
    field('Keep the screen awake', toggleControl('set-awake', s.keepScreenAwake, (v) => set({ keepScreenAwake: v }))),
  );

  // --- Sound ---------------------------------------------------------------
  const sound = group('Sound');
  sound.append(
    field('Piano volume', numberControl('set-piano-volume', Math.round(midi.pianoVolume * 100), (v) => {
      updateMidiSettings({ pianoVolume: v / 100 });
      status.textContent = 'Saved.';
    }, { min: 0, max: 100, step: 5 })),
    field('Metronome volume', numberControl('set-metronome-volume', Math.round(midi.metronomeVolume * 100), (v) => {
      updateMidiSettings({ metronomeVolume: v / 100 });
      status.textContent = 'Saved.';
    }, { min: 0, max: 100, step: 5 })),
    field(
      'Playback plays',
      selectControl(
        'set-playback-hands',
        [
          { value: 'non-focused', label: 'The hand you are not practising' },
          { value: 'both', label: 'Both hands' },
          { value: 'none', label: 'Nothing' },
        ],
        s.playbackHands,
        (value) => set({ playbackHands: value as PracticeSettings['playbackHands'] }),
      ),
    ),
    field(
      'Playback destination',
      selectControl(
        'set-playback-destination',
        [
          { value: 'phone', label: 'Phone' },
          { value: 'piano', label: 'Piano over MIDI OUT' },
          { value: 'both', label: 'Both' },
        ],
        s.playbackDestination,
        (value) => set({ playbackDestination: value as PracticeSettings['playbackDestination'] }),
      ),
      'Send it to the piano when the microphone is listening — the phone speaker would be heard as your playing.',
    ),
  );

  // --- Input ---------------------------------------------------------------
  const input = group('Input');
  input.append(
    field(
      'Follow input priority',
      selectControl(
        'set-input-priority',
        [
          { value: 'midi,mic,none', label: 'MIDI → Mic → Timed' },
          { value: 'mic,midi,none', label: 'Mic → MIDI → Timed' },
          { value: 'midi,none', label: 'MIDI only, else Timed' },
          { value: 'none', label: 'Always Timed' },
        ],
        s.inputPriority.join(','),
        (value) => set({ inputPriority: value.split(',') as PracticeSettings['inputPriority'] }),
      ),
    ),
    field('Chord leniency % (mic)', numberControl('set-mic-leniency', s.micChordLeniencyPct, (v) => set({ micChordLeniencyPct: v }), { min: 30, max: 100, step: 5 })),
    field('Strict mic scoring', toggleControl('set-mic-strict', s.strictMicScoring, (v) => set({ strictMicScoring: v }))),
    field('Mute expected notes while the mic is on', toggleControl('set-mic-mute', s.muteExpectedWhileMic, (v) => set({ muteExpectedWhileMic: v }))),
    field('Transpose MIDI input (semitones)', numberControl('set-transpose', midi.transposeSemitones, (v) => {
      updateMidiSettings({ transposeSemitones: Math.round(v) });
      status.textContent = 'Saved.';
    }, { min: -24, max: 24 })),
  );
  for (const link of [
    { sub: 'midi' as const, label: 'MIDI devices', hint: 'Connect your piano, pick an input, run the latency test' },
    { sub: 'mic' as const, label: 'Microphone', hint: 'Device, calibration, noise floor' },
    { sub: 'diagnostics' as const, label: 'Diagnostics', hint: 'Offline state, render timings, debug report' },
  ]) {
    input.append(
      el(
        'div.setting-row',
        {},
        el('div.setting-row__text', {}, el('div', { text: link.label }), el('div.muted', { text: link.hint })),
        button('Open', () => router.navigate('settings', link.sub), { id: `open-${link.sub}` }),
      ),
    );
  }

  // --- Content -------------------------------------------------------------
  const content = group('Content');
  const contentStatus = el('p.muted', { id: 'settings-storage', text: 'Measuring…' });
  const trackRow = el('div.filter-row', { id: 'settings-tracks' });
  content.append(trackRow, contentStatus);

  void getPlan().then((plan) => {
    void allItems().then((items) => {
      const tracks = [...new Set(items.flatMap((item) => item.tracks))].sort();
      trackRow.replaceChildren();
      for (const track of tracks) {
        const on = plan.trackOrder.includes(track);
        const node = el('button.chip', {
          type: 'button',
          text: track,
          'aria-pressed': on,
          id: `settings-track-${track}`,
        });
        node.addEventListener('click', () => {
          const pressed = node.getAttribute('aria-pressed') === 'true';
          node.setAttribute('aria-pressed', String(!pressed));
          void getPlan().then((current) =>
            updatePlan({
              trackOrder: pressed
                ? current.trackOrder.filter((id) => id !== track)
                : [...current.trackOrder, track],
            }),
          );
        });
        trackRow.append(node);
      }
    });
  });

  content.append(
    el(
      'div.row',
      {},
      button(
        'Download everything now',
        () => {
          // Re-runs the precache: fetch every catalog file so the service
          // worker's runtime cache holds it, then report what landed.
          status.textContent = 'Downloading the whole library…';
          void allItems()
            .then(async (items) => {
              const files = items.map((item) => item.file).filter((file): file is string => Boolean(file));
              let ok = 0;
              for (const file of files) {
                try {
                  const response = await fetch(
                    new URL(`content/${file}`, document.baseURI).toString(),
                    { cache: 'reload' },
                  );
                  if (response.ok) ok += 1;
                } catch {
                  // Counted as missing below rather than aborting the run.
                }
              }
              status.textContent = `${String(ok)} of ${String(files.length)} score files are on the device.`;
              return measureStorage();
            })
            .then(showStorage)
            .catch((cause: unknown) => {
              status.textContent = `The download did not finish: ${String(cause)}`;
              status.classList.add('status--error');
            });
        },
        { id: 'settings-download', variant: 'primary' },
      ),
      button('Refresh the numbers', () => void measureStorage().then(showStorage), { id: 'settings-measure' }),
    ),
    field(
      'Offline only',
      toggleControl('set-offline-only', isOfflineOnly(), (value) => {
        setOfflineOnly(value);
        status.textContent = value
          ? 'The app will not check for updates. Turn this off to get a new version.'
          : 'The app will check for updates when it has a network.';
      }),
      'Stops the app checking for updates at all. Everything else already works offline.',
    ),
    el(
      'div.row',
      {},
      button(
        'Reset progress',
        () => {
          if (!confirm('Delete all practice history and progress? Imported scores are kept.')) return;
          if (!confirm('Really? There is no undo, and only your backup file would bring it back.')) return;
          void (async () => {
            const db = await openDatabase();
            if (!db) return;
            for (const store of ['progress', 'sessions', 'streak', 'skills'] as const) {
              await db.clear(store);
            }
            status.textContent = 'Progress reset. Reload the app to see it.';
          })();
        },
        { id: 'settings-reset' },
      ),
      button('Restore defaults', () => {
        updateSettings({ ...DEFAULT_SETTINGS });
        status.textContent = 'Settings restored to their defaults. Reopen this screen to see them.';
      }, { id: 'settings-defaults' }),
    ),
  );

  function showStorage(breakdown: StorageBreakdown): void {
    contentStatus.textContent =
      `${formatBytes(breakdown.usageBytes)} used of ${formatBytes(breakdown.quotaBytes)} available · ` +
      `${String(breakdown.precached)} files cached · ` +
      `${String(breakdown.imports)} of your own scores (${formatBytes(breakdown.importBytes)})`;
  }

  void measureStorage().then(showStorage).catch(() => {
    contentStatus.textContent = 'This browser will not say how much storage is in use.';
  });

  // Builder tool, deliberately last and plainly labelled.
  const dev = group('Builder tools');
  dev.append(
    el(
      'div.setting-row',
      {},
      el(
        'div.setting-row__text',
        {},
        el('div', { text: 'Score renderer (dev)' }),
        el('div.muted', { text: 'Step through a fixture and read render timings' }),
      ),
      button('Open', () => router.navigateDev('score'), { id: 'open-dev-score' }),
    ),
  );

  body.append(status);
  return section;
}
