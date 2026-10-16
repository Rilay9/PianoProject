// What every screen shares (owner, 2026-10-12: the app as a skeleton that screens plug into): the score's drawing,
// the keyboard strip, the sound, the MIDI keyboard and the practice judge; the song list; the message line; and the
// one interface every screen offers to the rest of the app (Screen). Screens live in src/screens/; main.ts builds
// them and routes keys, keyboard-remote commands and turning the phone to the one showing.

import { FollowView } from './follow';
import type { KeyEvent } from './midi';
import { MidiInput } from './midi';
import { Practice } from './practice';
import type { Command } from './remote';
import { settingsFor, type ScoreSettings } from './settings';
import { Sound } from './sound';
import { UnderStrip } from './strip';
import { keepAwake } from './wake';
import { xmlOfFile } from './library/files';
import { fileOf } from './library/store';
import { fileOfRef, type FullRef } from './library/full';

export const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
export const base = import.meta.env.BASE_URL;

/** A song in scores/index.json (docs/app-features.md §1 says what each field is for). */
export interface Piece {
  id: string;
  title: string;
  composer: string;
  file: string;
  // Where it came from and its state (shown in ⓘ; optional: an entry without them still opens).
  license?: string;
  licenseUrl?: string;
  source?: { dataset: string; uploadTitle?: string };
  status?: string;
  /** An exercise score (owner, 2026-10-15): its kind of exercise (Exercises lists it by this; docs §0). */
  kind?: string;
  /** A MusicXML exercise taken from a set (lesson/path.ts musicExercises): the set's id; not listed in Music. */
  exerciseOf?: string;
  /** Every item of its set is such a file: the set is listed as these pieces, not as cards. */
  allOfSet?: boolean;
  /** How it opens on the score (its set's `play`; Wait for me when the set names none). */
  play?: { mode: string; hands?: string; tempo?: number };
  /** A piece of the full PDMX set opened without adding it (owner, 2026-10-15): its file in the copied zip. */
  full?: FullRef;
}

export interface KeyRange { lo: number; hi: number }

/**
 * A screen, as the rest of the app sees it. Every screen (the score, Memorise, the exercise screen, Free play, and
 * whatever comes next) offers these; main.ts routes to whichever is showing.
 */
export interface Screen {
  /** A key from the MIDI keyboard or the screen's own keys, after the keyboard remote has taken its commands. */
  key(e: KeyEvent): void;
  /** A keyboard-remote command (remote.ts): a mash, the lowest or highest key, or the lowest held (Peek). */
  command(c: Command): void;
  /** The keys the music on screen uses: an edge key inside them is a note, not a command. */
  musicRange(): KeyRange | null;
  /** The window was resized or the phone turned. */
  resized(): void;
  /** Something is playing or being played: the screen stays awake. */
  readonly busy: boolean;
  /**
   * A panel (any dialog: its settings, ⋯, Keyboard controls…) opened over this screen, or the last one closed
   * (owner, 2026-10-15): what it runs pauses, and carries on after. A screen that has this gets no keys while a panel
   * is open (main.ts); one without it (Free play, the library, the PDF reader) is left as it was.
   */
  panel?(open: boolean): void;
}

export class App {
  readonly score = $('score');
  readonly view: FollowView;
  readonly strip = new UnderStrip($('under'), $('keyboard'), $('note-line'));
  readonly sound = new Sound();
  readonly midi = new MidiInput();
  readonly practice: Practice;
  pieces: Piece[] = [];
  currentId = '';
  private readonly message = $<HTMLParagraphElement>('message');
  private readonly xmlCache = new Map<string, string>();
  /** What the score's drawing plays and judges with (the score's settings, or Memorise's while it is open). */
  playSettings: () => ScoreSettings = () => { throw new Error('no screen has the score yet'); };
  /** Every screen, to keep the phone awake while any is busy. */
  screens: Screen[] = [];

  constructor() {
    this.view = new FollowView(this.score, (text) => this.showMessage(`Could not draw this song: ${text}`));
    this.view.onNotice = (text) => this.showMessage(text);
    this.practice = new Practice(this.view, this.sound, this.midi, () => this.playSettings());
    // Every dialog, whoever opens it and however it closes (Done, ✕, Esc, another chosen in its place): one watch on
    // their `open`, so a panel replaced by another (⋯ → Keyboard controls) is one panel, not a close and an open.
    let was = false;
    new MutationObserver(() => {
      const now = this.dialogOpen();
      if (now !== was) { was = now; this.onPanel(now); }
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  }

  /** A panel opened over the screen, or the last one closed (main.ts passes it to the screen showing). */
  onPanel: (open: boolean) => void = () => {};

  /** A file you added was replaced: its MusicXML is read again next time. */
  forgetXml(id: string): void { this.xmlCache.delete(id); }

  currentPiece(): Piece { return this.pieces.find((p) => p.id === this.currentId) ?? this.pieces[0]; }

  async xmlFor(piece: Piece): Promise<string> {
    const cached = this.xmlCache.get(piece.id);
    if (cached) return cached;
    if (piece.id.startsWith('u-')) { // a file you added: kept in the library on this phone
      // (or a full-set piece opened without adding it: read from its zip; once added, the library's copy)
      const blob = (await fileOf(piece.id)) ?? (piece.full ? await fileOfRef(piece.full) : undefined);
      if (!blob) throw new Error(`${piece.title} is no longer in the library`);
      const xml = await xmlOfFile(blob);
      this.xmlCache.set(piece.id, xml);
      return xml;
    }
    const response = await fetch(`${base}scores/${piece.file}`);
    if (!response.ok) throw new Error(`${response.status} for ${piece.file}`);
    const xml = await response.text();
    this.xmlCache.set(piece.id, xml);
    return xml;
  }

  /** The message line (above the bottom bar): a problem (red) or, with info, just news; action: a button in it. */
  showMessage(text: string, info = false, action?: { label: string; run: () => void }): void {
    const m = this.message;
    m.textContent = text;
    if (action) {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: 'btn msg-action', textContent: action.label });
      b.addEventListener('click', action.run);
      m.append(' ', b);
    }
    m.hidden = text === '';
    m.classList.toggle('info', info);
  }
  get messageText(): string { return this.message.hidden ? '' : this.message.textContent ?? ''; }
  get messageIsNews(): boolean { return !this.message.hidden && this.message.classList.contains('info'); }

  /** The app-wide piano and click volumes and click sound (Tempo dialog), for screens other than the score. */
  appSound(): void {
    const s = settingsFor('');
    this.sound.setVolumes(s.pianoVolume, s.clickVolume);
    this.sound.setClick(s.click);
  }

  /** A dialog is open: keys and taps meant for the screen wait. */
  dialogOpen(): boolean { return !!document.querySelector('dialog[open]'); }

  /** The screen stays on while anything plays or is played (owner, 2026-10-11). */
  stayAwake(): void { keepAwake(this.screens.some((s) => s.busy)); }
}
