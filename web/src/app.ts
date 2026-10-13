// What every screen shares (owner, 2026-10-12: the app as a skeleton that screens plug into): the score's drawing,
// the keyboard strip, the sound, the MIDI keyboard and the practice judge; the song list; the message line; and the
// one interface every screen offers to the rest of the app (Screen). Screens live in src/screens/; main.ts builds
// them and routes keys, keyboard-remote commands and turning the phone to the one showing.

import { FollowView } from './follow';
import type { KeyEvent } from './midi';
import { MidiInput } from './midi';
import { Practice } from './practice';
import type { Command } from './remote';
import type { ScoreSettings } from './settings';
import { Sound } from './sound';
import { UnderStrip } from './strip';
import { keepAwake } from './wake';

export const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
export const base = import.meta.env.BASE_URL;

/** A song in scores/index.json (docs/app-features.md §1 says what each field is for). */
export interface Piece {
  id: string;
  title: string;
  composer: string;
  file: string;
  license: string;
  licenseUrl: string;
  source: { dataset: string; uploadTitle: string };
  status: string;
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
  }

  currentPiece(): Piece { return this.pieces.find((p) => p.id === this.currentId) ?? this.pieces[0]; }

  async xmlFor(piece: Piece): Promise<string> {
    const cached = this.xmlCache.get(piece.id);
    if (cached) return cached;
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

  /** A dialog is open: keys and taps meant for the screen wait. */
  dialogOpen(): boolean { return !!document.querySelector('dialog[open]'); }

  /** The screen stays on while anything plays or is played (owner, 2026-10-11). */
  stayAwake(): void { keepAwake(this.screens.some((s) => s.busy)); }
}
