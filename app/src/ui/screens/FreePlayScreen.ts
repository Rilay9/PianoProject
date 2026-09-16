/**
 * Free play (docs/04 §2b) — `#/play`.
 *
 * The owner, asking where the new modes are opened from: *"you could have a
 * button somewhere that says free play that just tracks your notes"*. This is
 * that screen and it is deliberately the whole of it: the keys you are holding
 * light up, they are named, and three or more of them are named as a chord.
 * Nothing is judged, nothing is recorded, and there is no run to start or stop
 * — the Score screen's `Free play` mode still turns pages against a piece, and
 * this has no piece at all.
 *
 * ## What this screen is for, in order
 *
 * 1. **What you are holding, in words.** The chord name large, the notes under
 *    it. It is the one thing the screen knows that the piano does not.
 * 2. **The keys.** The same `KeyboardStrip` the Score screen and the drills
 *    use, so a key lit here is lit the way it is lit everywhere else — and it
 *    is tappable, because for a learner with no cable it *is* the instrument.
 * 3. **Which input is being heard**, and — when there is none — the two
 *    screens that fix that (`04` §0 R4: a strip nothing can reach is dead).
 */
import type { Router } from '../../router';
import { getPiano, micSource, screenKeyboardSource, webMidiSource } from '../../app/services';
import { nameHeldChord } from '../../engine/drills/theory';
import type { InputNoteEvent } from '../../midi/types';
import { midiToNoteName } from '../../midi/parseMidiMessage';
import { KeyboardStrip } from '../KeyboardStrip';
import { onScreenDispose } from '../screenLifecycle';
import { button, el } from '../widgets';
import type { Piano } from '../../audio/Piano';
import { screenFrame } from './screenFrame';
import './FreePlayScreen.css';

/**
 * The microphone hears a note it is unsure of and says so (`05` §11.1).
 *
 * The drill screen holds answers to the same floor. Here the cost of a wrong
 * guess is only a word on the screen, but a chord that flickers between two
 * names while one note is held is worse than a chord that waits.
 */
const MIC_CONFIDENCE_FLOOR = 0.5;

export function FreePlayScreen(router: Router): HTMLElement {
  const { section, header, body } = screenFrame('play', 'Free play');
  header.prepend(
    button('← Today', () => router.navigate('today'), { variant: 'quiet', id: 'play-back' }),
  );
  header.append(
    el('p.muted', {
      id: 'play-purpose',
      text: 'Play anything. It names what you are holding and nothing else — nothing here is scored or recorded.',
    }),
  );

  const chordLine = el('div.play-chord', { id: 'play-chord' });
  const noteLine = el('div.play-notes', { id: 'play-notes' });
  const readout = el('div.play-readout', {}, chordLine, noteLine);

  /**
   * Which input is being heard, and the way out when there is none.
   *
   * Beside the keys rather than at the foot of the screen (`04` §0 R6): it is
   * a message about the strip directly under it, and what it offers when
   * nothing is connected is the screen that connects something.
   */
  const device = el('p.play-device', { id: 'play-device' });
  const deviceLinks = el('div.plan-links', { id: 'play-device-links', hidden: true });
  deviceLinks.append(
    button('MIDI settings', () => router.navigate('settings', 'midi'), {
      id: 'play-open-midi',
      variant: 'quiet',
    }),
    el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
    button('Microphone', () => router.navigate('settings', 'mic'), {
      id: 'play-open-mic',
      variant: 'quiet',
    }),
  );

  const stripHost = el('div.play-strip', { id: 'play-strip' });
  body.append(readout, device, deviceLinks, stripHost);

  // --- the keys -----------------------------------------------------------

  /** Every key that is down right now. */
  const held = new Set<number>();
  let disposed = false;
  let piano: Piano | null = null;
  let pianoAsked = false;

  const strip = new KeyboardStrip({
    interactive: true,
    // Through the shared source rather than straight into `held`, so a tap is
    // an input like any other and this screen has one path for every note it
    // draws — which is also what makes the keys sound.
    onNoteOn: (midi, velocity) => screenKeyboardSource.noteOn(midi, velocity),
    onNoteOff: (midi) => screenKeyboardSource.noteOff(midi),
  });
  stripHost.append(strip.el);
  // After a paint, for the reason `fitKeysToWidth` waits for one: the screen is
  // built before the shell puts it in the document, so until the next frame
  // every key is at offset 0 and "scroll to middle C" resolves to the left end
  // of an 88-key strip — which is where a phone opened, seven octaves from
  // anything anybody plays.
  requestAnimationFrame(() => {
    if (!disposed) strip.scrollToMiddleC('auto');
  });

  /**
   * The on-screen keys make a sound; the piano does not get an echo.
   *
   * A tap on a picture of a key that stays silent is the thing that makes the
   * strip read as a diagram. A note arriving over MIDI has already been played
   * on a real instrument, and doubling it here would be the app playing along
   * with the learner uninvited — which on the Score screen is a setting with a
   * row of its own.
   *
   * The samples are asked for on the first tap rather than when the screen
   * opens: starting them needs a gesture, and a tap is the first one there is.
   * That first note is silent, which is the same trade `Piano.start` already
   * makes — a missed note is better than a throw inside an input handler.
   */
  function sound(event: InputNoteEvent): void {
    if (event.source !== 'screen') return;
    if (!pianoAsked) {
      pianoAsked = true;
      void getPiano()
        .then((loaded) => {
          if (!disposed) piano = loaded;
        })
        .catch(() => {
          /* No samples, no sound. Everything else on this screen still works. */
        });
    }
    if (event.kind === 'noteOn') piano?.start({ midi: event.midi, velocity: event.velocity });
    else piano?.stop(event.midi);
  }

  function onNote(event: InputNoteEvent): void {
    if (disposed) return;
    if ((event.confidence ?? 1) < MIC_CONFIDENCE_FLOOR) return;
    if (event.kind === 'noteOn') held.add(event.midi);
    else held.delete(event.midi);
    sound(event);
    draw();
  }

  function draw(): void {
    const notes = [...held].sort((a, b) => a - b);
    strip.setState({ pressed: notes });
    if (notes.length > 0) strip.scrollToSpan(notes[0] as number, notes[notes.length - 1] as number);

    const chord = nameHeldChord(notes);
    chordLine.textContent = chord?.label ?? '';
    noteLine.textContent =
      notes.length === 0
        ? 'Nothing held yet — play, or tap the keys.'
        : notes.map((midi) => midiToNoteName(midi)).join(' · ');
    // In data as well as in words, so a test can ask what the screen thinks
    // without reading the sentence it happens to be worded in.
    section.dataset.held = String(notes.length);
    section.dataset.chord = chord?.label ?? '';
  }

  // --- which input ---------------------------------------------------------

  /** The piano, the microphone, or nothing but the keys on the glass. */
  function connectedInput(): 'midi' | 'mic' | null {
    if (webMidiSource.inputs.length > 0) return 'midi';
    if (micSource.state.connected) return 'mic';
    return null;
  }

  function drawDevice(): void {
    const connected = connectedInput();
    device.textContent =
      connected === 'midi'
        ? 'Listening to your piano. The keys below work too.'
        : connected === 'mic'
          ? 'Listening through the microphone. The keys below work too.'
          : 'No piano and no microphone — tap the keys below, or connect one:';
    deviceLinks.hidden = connected !== null;
    section.dataset.device = connected ?? 'keys';
  }

  const stopListening = [
    webMidiSource.onNote(onNote),
    screenKeyboardSource.onNote(onNote),
    // The microphone is never opened from here: `connect()` needs a gesture
    // and a permission, and this screen never asked for either. Subscribed
    // anyway, so a microphone already listening — calibrated on its own
    // screen, or left open by a run — reaches the keys like anything else.
    micSource.onNote(onNote),
    webMidiSource.onStateChange(() => drawDevice()),
    micSource.onStateChange(() => drawDevice()),
  ];

  drawDevice();
  draw();

  onScreenDispose(section, () => {
    disposed = true;
    for (const stop of stopListening) stop();
    // Every key this screen sounded, released: a note started with `start`
    // sustains until it is stopped, and leaving the screen mid-chord would
    // otherwise leave it ringing over whatever came next.
    piano?.stop();
    strip.destroy();
  });

  return section;
}
