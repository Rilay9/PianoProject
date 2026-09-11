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
import { renderTrackChips } from '../trackChips';
import { getMidiSettings, updateMidiSettings } from '../../data/midiSettings';
import {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  type PracticeSettings,
} from '../../data/settingsStore';
import { getSetupRecord } from '../../data/setupStore';
import { openDatabase } from '../../data/db';
import { forgetCachedProgress } from '../../data/progressStore';
import { forgetCachedSkills } from '../../data/skillsStore';
import { directoryPickerAvailable } from '../../data/folderLibrary';
import { getThemePreference, setThemePreference, type ThemePreference } from '../theme';
import {
  formatBytes,
  isOfflineOnly,
  measureStorage,
  setOfflineOnly,
  type StorageBreakdown,
} from '../../util/storageReport';
import {
  button,
  el,
  field,
  numberControl,
  selectControl,
  toggleControl,
} from '../widgets';
import { onScreenDispose } from '../screenLifecycle';
import { screenFrame, statusLine } from './screenFrame';

const SESSION_LENGTHS = [15, 30, 60, 120].map((minutes) => ({
  value: String(minutes),
  label: `${String(minutes)} min`,
}));

/** How often the library download is allowed to repaint its count. */
const DOWNLOAD_PROGRESS_MS = 150;

/**
 * Consecutive failures that end the run.
 *
 * `navigator.onLine` is true on a wifi with nothing behind it, so the network
 * is also judged by what happens: ten refusals in a row is a dead connection
 * and not ten missing files, and there is no sense in asking it twelve hundred
 * more times to find that out.
 */
const DOWNLOAD_GIVE_UP_AFTER = 10;

export function SettingsScreen(router: Router): HTMLElement {
  const { section, body } = screenFrame('settings', 'Settings');
  const status = statusLine('settings-status');

  // --- where a message goes (`04` §0 R6) -----------------------------------
  //
  // This screen is about forty controls and one status line, and the line was
  // the last element in the body: every `Saved.` for a toggle near the top
  // landed thousands of pixels below the finger that caused it, which is not
  // feedback, it is a rumour. So the sentence goes **on the row that caused
  // it** — the shape the score folder's failed *Add* already uses — and the
  // status line keeps a copy for the screen reader and for the two things that
  // belong to no single row (the library download, and *Reset progress*).
  //
  // The row is found from the event rather than passed in by forty call sites:
  // a capture-phase listener on the body runs before the control's own
  // handler, so by the time `set()` is called the row that is being changed is
  // already known.
  let activeRow: Element | null = null;
  const rememberRow = (event: Event): void => {
    const target = event.target;
    activeRow = target instanceof Element ? target.closest('.setting-row') : null;
  };
  body.addEventListener('change', rememberRow, true);
  body.addEventListener('click', rememberRow, true);

  /**
   * Says one thing, once, where the control that caused it is.
   *
   * One note at a time: the previous one goes, so the screen never carries two
   * *Saved.*s for two different rows and leaves the owner to work out which
   * belongs to the tap they just made.
   *
   * The note carries no `role="status"` on purpose. The status line already
   * has one, and two live regions holding the same sentence is the same
   * sentence read out twice — so the line announces and the note is what there
   * is to look at.
   */
  /** The hint a note has displaced, so it can be put back. */
  function rowHint(row: Element | null): HTMLElement | null {
    return row?.querySelector('.setting-row__text > .muted') ?? null;
  }

  function say(text: string): void {
    status.textContent = text;
    for (const old of body.querySelectorAll('.setting-note')) {
      rowHint(old.closest('.setting-row'))?.removeAttribute('hidden');
      old.remove();
    }
    if (!activeRow?.isConnected) return;
    // The note takes the hint's line rather than adding one. A row is a label,
    // a control and at most two lines of sentence under them (`04` §0 R2,
    // measured at 100 px), and a confirmation on a third line is a row grown
    // into a card. It is also the better line of the two to be showing: the
    // hint says what the control does, and the owner has just done it.
    rowHint(activeRow)?.setAttribute('hidden', '');
    // Inside the row, not after it: after it, the row's own grid rules claim
    // the note for the control's cell, and sideways the block's two columns
    // stretch it across both and it belongs to neither.
    activeRow.append(el('p.setting-note', { text }));
  }

  const set = (patch: Partial<PracticeSettings>): void => {
    updateSettings(patch);
    say('Saved.');
  };

  function group(title: string): HTMLElement {
    const block = el('section.block', {}, el('h2', { text: title }));
    body.append(block);
    return block;
  }

  const s = getSettings();
  const midi = getMidiSettings();

  // --- The tour ------------------------------------------------------------
  // First, because it is the one row that sets the rest: the first launch
  // opens it, and this is the way back to it (docs/04 §7d).
  const setup = getSetupRecord();
  const setupWhen =
    setup.status === 'never'
      ? 'Not run yet'
      : `${setup.status === 'done' ? 'Finished' : 'Skipped'}${setup.at ? ` ${new Date(setup.at).toLocaleDateString()}` : ''}`;
  // The first row of the first group, not a group of its own: a one-row
  // block sideways takes a column and leaves the rest of it empty, and the
  // first screenful is measured in rows (`04` §0 R2, R5).
  const setupRow = el(
    'div.setting-row',
    { id: 'settings-setup' },
    el(
      'div.setting-row__text',
      {},
      el('div', { text: 'Setup tour' }),
      el('div.muted', { text: setupWhen }),
    ),
    button('Run again', () => router.navigate('settings', 'setup'), { id: 'open-setup' }),
  );

  const guideRow = el(
    'div.setting-row',
    { id: 'settings-guide' },
    el('div.setting-row__text', {}, el('div', { text: 'How PianoPath works' }), el('div.muted', { text: 'The guide, with pictures' })),
    button('Open', () => router.navigate('settings', 'guide'), { id: 'open-guide' }),
  );

  // --- Practice ------------------------------------------------------------
  const practice = group('Practice');
  practice.append(
    setupRow,
    guideRow,
    field(
      'Default mode, with MIDI or mic',
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
      'Default mode, no input',
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
          { value: 'high', label: 'High (5 kHz)' },
        ],
        s.metronomeSound,
        (value) => set({ metronomeSound: value as PracticeSettings['metronomeSound'] }),
      ),
      'High is the click the mic detector notches out. Use it when the mic is listening.',
    ),
    field('Strict Wait mode', toggleControl('set-waitstrict', s.waitStrict, (v) => set({ waitStrict: v })), 'Off (the default) means a wrong note does not reset the chord.'),
    field('Tempo-mode tolerance (ms)', numberControl('set-tolerance', s.toleranceMs, (v) => set({ toleranceMs: v }), { min: 30, max: 500, step: 10 })),
    field('Pass accuracy %', numberControl('set-pass-accuracy', s.passAccuracyPct, (v) => set({ passAccuracyPct: v }), { min: 50, max: 100 })),
    field('Pass tempo %', numberControl('set-pass-tempo', s.passTempoPct, (v) => set({ passTempoPct: v }), { min: 30, max: 130, step: 5 })),
    field(
      'Require 2 songs per lesson',
      toggleControl('set-two-songs', s.requireTwoSongs, (v) => set({ requireTwoSongs: v })),
      'The stricter completion rule. It never applies to a unit whose skill no song tests.',
    ),
    field(
      'Strict prerequisites',
      toggleControl('set-strict-prereqs', s.strictPrerequisites, (v) =>
        set({ strictPrerequisites: v }),
      ),
      // Off by default (docs/00 D17).
      'On, an unfinished rung shows a badge and asks once. Nothing is disabled.',
    ),
    field(
      'Weekday session (minutes)',
      selectControl(
        'set-weekday-minutes',
        SESSION_LENGTHS,
        String(s.weekdaySessionMinutes),
        (value) => set({ weekdaySessionMinutes: Number(value) }),
      ),
    ),
    field(
      'Weekend session (minutes)',
      selectControl(
        'set-weekend-minutes',
        SESSION_LENGTHS,
        String(s.weekendSessionMinutes),
        (value) => set({ weekendSessionMinutes: Number(value) }),
      ),
    ),
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
    field('Name the note I am waiting for', toggleControl('set-notenames', s.showNoteNames, (v) => set({ showNoteNames: v }))),
    field('Show chord symbols', toggleControl('set-chords', s.showChordSymbols, (v) => set({ showChordSymbols: v }))),
    field(
      'Keys under the score',
      selectControl(
        'set-keys',
        [
          { value: 'strip', label: 'Keyboard' },
          { value: 'ribbon', label: 'Ribbon, with the note name' },
          { value: 'off', label: 'Off' },
        ],
        s.keys,
        (value) => set({ keys: value as PracticeSettings['keys'] }),
      ),
    ),
    field(
      'Keys guide',
      selectControl(
        'set-keys-guide',
        [
          { value: 'next', label: 'The note it waits for' },
          { value: 'next-two', label: 'That, and the one after' },
          { value: 'off', label: 'Off' },
        ],
        s.keysGuide,
        (value) => set({ keysGuide: value as PracticeSettings['keysGuide'] }),
      ),
      'Marked blue on the keys before you play it; the one after in a paler blue.',
    ),
    field('Finger numbers on the keys', toggleControl('set-keys-fingers', s.keysFingerNumbers, (v) => set({ keysFingerNumbers: v })), 'The score’s finger number, printed on each marked key.'),
    field('Flash a hit green and a miss red', toggleControl('set-keys-flash', s.keysFlash, (v) => set({ keysFlash: v })), 'For under a second; then the key goes back to the guide.'),
    field('Keep the screen awake', toggleControl('set-awake', s.keepScreenAwake, (v) => set({ keepScreenAwake: v }))),
  );

  // --- Sound ---------------------------------------------------------------
  const sound = group('Sound');
  sound.append(
    field('Piano volume', numberControl('set-piano-volume', Math.round(midi.pianoVolume * 100), (v) => {
      updateMidiSettings({ pianoVolume: v / 100 });
      say('Saved.');
    }, { min: 0, max: 100, step: 5 })),
    field('Metronome volume', numberControl('set-metronome-volume', Math.round(midi.metronomeVolume * 100), (v) => {
      updateMidiSettings({ metronomeVolume: v / 100 });
      say('Saved.');
    }, { min: 0, max: 100, step: 5 })),
    field(
      'Playback plays',
      selectControl(
        'set-playback-hands',
        [
          { value: 'non-focused', label: 'The other hand' },
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
      'With the mic listening, send it to the piano: the phone would be heard as you.',
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
      say('Saved.');
    }, { min: -24, max: 24 })),
  );
  for (const link of [
    { sub: 'midi' as const, label: 'MIDI devices', hint: 'Connect your piano and run the latency test' },
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

  // The chips are shared with the setup tour (`ui/trackChips`): the
  // curriculum's tracks, in its order, only those the library can offer
  // something for, titles never ids. `film-game` is tagged on catalogue items
  // and defined nowhere; that is a content gap, noted as a follow-up rather
  // than papered over with a made-up label here.
  void renderTrackChips(trackRow);

  // --- "Download everything now" -------------------------------------------
  //
  // Twelve hundred and fifty-six files, one at a time. What it used to do was
  // start that loop, say nothing for as long as it took, and write one line at
  // the end — so there was no way to tell a download in progress from a dead
  // button, no way to stop it, and offline it ran 1,256 failures to report
  // "0 of 1256". Leaving the screen did not stop it either: the loop ran on
  // against a detached status line.

  /** The run in flight, and the handle the Stop button aborts it with. */
  let downloading: AbortController | null = null;
  /** Set when the app shell throws this screen away; the loop reads it. */
  let unmounted = false;

  const downloadButton = button('Download everything now', () => void downloadEverything(), {
    id: 'settings-download',
    variant: 'primary',
  });
  // Beside the button it stops, and only while there is something to stop
  // (`04` §0 R4: nothing dead).
  const stopButton = button(
    'Stop',
    () => {
      downloading?.abort();
    },
    { id: 'settings-download-stop' },
  );
  stopButton.hidden = true;

  async function downloadEverything(): Promise<void> {
    if (downloading) return;
    // Asked before the first fetch, not learned from twelve hundred failures.
    // `{ cache: 'reload' }` goes past the service worker to the network by
    // definition, so with no network every one of them fails.
    if (navigator.onLine === false) {
      say('No network, so there is nothing to download. What is already on the device still works offline.');
      return;
    }
    const items = await allItems().catch(() => null);
    if (!items) {
      say('The catalog could not be read, so there is nothing to download from yet.');
      status.classList.add('status--error');
      return;
    }
    const files = items.map((item) => item.file).filter((file): file is string => Boolean(file));
    const total = files.length;
    if (total === 0) {
      say('The catalog names no score files to download.');
      return;
    }

    downloading = new AbortController();
    const { signal } = downloading;
    downloadButton.disabled = true;
    stopButton.hidden = false;
    let ok = 0;
    let done = 0;
    let refused = 0;
    let paintedAt = 0;
    let gaveUp = false;
    // Throttled, because 1,256 writes to a live region is 1,256 things for a
    // screen reader to say and a repaint per file on the phone.
    const report = (force: boolean): void => {
      const now = Date.now();
      if (!force && now - paintedAt < DOWNLOAD_PROGRESS_MS) return;
      paintedAt = now;
      status.textContent = `Downloading… ${String(done)} of ${String(total)}, ${String(ok)} on the device.`;
    };
    report(true);
    try {
      for (const file of files) {
        if (signal.aborted || unmounted) break;
        try {
          const response = await fetch(new URL(`content/${file}`, document.baseURI).toString(), {
            cache: 'reload',
            signal,
          });
          if (response.ok) {
            ok += 1;
            refused = 0;
          } else {
            refused += 1;
          }
        } catch {
          if (signal.aborted) break;
          refused += 1;
        }
        done += 1;
        if (refused >= DOWNLOAD_GIVE_UP_AFTER) {
          gaveUp = true;
          break;
        }
        report(false);
      }
      if (unmounted) return;
      if (signal.aborted) {
        status.textContent = `Stopped. ${String(ok)} of ${String(total)} score files are on the device.`;
      } else if (gaveUp) {
        status.textContent =
          `The network stopped answering after ${String(done)} files, so the rest were not tried. ` +
          `${String(ok)} of ${String(total)} score files are on the device.`;
        status.classList.add('status--error');
      } else {
        status.textContent = `${String(ok)} of ${String(total)} score files are on the device.`;
      }
    } finally {
      downloading = null;
      downloadButton.disabled = false;
      stopButton.hidden = true;
    }
    // The numbers above the button describe the same thing this just changed.
    if (!unmounted) {
      await measureStorage()
        .then(showStorage)
        .catch(() => undefined);
    }
  }

  content.append(
    el(
      'div.row',
      {},
      downloadButton,
      stopButton,
      // Read once and pressed rarely (`04` §0 R3).
      button('Refresh the numbers', () => void measureStorage().then(showStorage), {
        id: 'settings-measure',
        variant: 'quiet',
      }),
    ),
    // The download's own progress line, beside the button it belongs to
    // (`04` §0 R6) rather than at the far bottom of the body.
    status,
    field(
      'Show US-only public-domain items',
      toggleControl('set-us-only', s.showUsOnlyPd, (v) => set({ showUsOnlyPd: v })),
      'Nine bundled items are public domain in the United States but not everywhere.',
    ),
    field(
      'Remember the score folder',
      toggleControl('set-folder-handles', s.folderHandles, (v) => {
        set({ folderHandles: v });
        say(v
          ? 'The next folder you pick will be remembered, if Chrome allows it.'
          : 'The folder will be asked for each time you add from it.');
      }),
      directoryPickerAvailable()
        ? 'Keeps a handle so Add does not ask again. Chrome may still ask once.'
        : 'This browser cannot remember a folder, so it will ask every time.',
    ),
    field(
      'Offline only',
      toggleControl('set-offline-only', isOfflineOnly(), (value) => {
        setOfflineOnly(value);
        say(value
          ? 'The app will not check for updates. Turn this off to get a new version.'
          : 'The app will check for updates when it has a network.');
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
            // The stores are cleared; the write-through caches in front of them
            // are not, and they are what the next run reads. Without this the
            // first drill after a reset put the old attempt count and the old
            // minutes straight back into the emptied store — the reset was
            // undone rather than merely unrendered.
            forgetCachedProgress();
            forgetCachedSkills();
            status.textContent = 'Progress reset. Reload the app to see it.';
          })();
        },
        { id: 'settings-reset' },
      ),
      button(
        'Restore defaults',
        () => {
          if (!confirm('Put every setting back to its default? Progress and imports are kept.')) return;
          updateSettings({ ...DEFAULT_SETTINGS });
          // Every control on this screen was built from the old values, so
          // reload rather than leave thirty stale inputs on screen. This is
          // the one action in the app where that is the honest response.
          window.location.reload();
        },
        { id: 'settings-defaults' },
      ),
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

  // A download is 1,256 fetches and the owner can leave in the middle of one.
  // Without this the loop ran on to the end against a status line that was no
  // longer in the document — minutes of radio for a number nobody would read.
  onScreenDispose(section, () => {
    unmounted = true;
    downloading?.abort();
  });

  return section;
}
