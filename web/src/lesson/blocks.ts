// Drawing a lesson's blocks (owner, 2026-10-15: the lesson page is a skeleton fed with content later). DRAW is the
// one place that maps a block's kind to its drawing; a new kind adds its fields in lesson/read.ts, its drawing here,
// and its line in docs/app-features.md §8c. Every drawing is a plain element that fits the width it is given (the
// page lays them out one under the other on a phone, and in a readable column sideways and on a tablet).

import { base, type App } from '../app';
import { addedLine, ensurePiece, takeAdded } from '../library/catalogue';
import { button, el } from '../ui';
import { itemsXml } from '../exercise/notation';
import { readSet } from '../exercise/items';
import type { Sound } from '../sound';
import { UnderStrip } from '../strip';
import { excerptXml, MiniScore, stopMiniScores } from './miniscore';
import { PATH_DIR, type StepBlock } from './path';
import { barProblem, midiOfPitch, youtubeId, type Block, type ScoreSource } from './read';
import { fingerOn } from '../activity';
import type { Inline, TextBlock } from './text';

export interface DrawContext {
  app: App;
  sound: Sound;
  /** The piano ready (and the app's volumes and piano output) before a little score plays. */
  prepare: () => Promise<void>;
  /** A step's card (the page knows how far it is). */
  step: (b: StepBlock) => HTMLElement;
}

/** A file in content/path, or a link as given. */
export const fileUrl = (src: string) => (/^https:\/\//.test(src) ? src : PATH_DIR + src);

/** The lesson's text: built from text nodes only (lesson/text.ts read it; nothing in it can run). */
export function drawText(blocks: TextBlock[]): HTMLElement {
  const box = el('div', 'les-text');
  const inline = (parts: Inline[], into: HTMLElement) => {
    for (const p of parts) {
      if (p.t === 'text') into.append(p.text);
      else if (p.t === 'b') into.append(el('strong', '', p.text));
      else if (p.t === 'i') into.append(el('em', '', p.text));
      else if (p.t === 'link') { const a = el('a', '', p.text); a.href = p.href; a.target = '_blank'; a.rel = 'noopener'; into.append(a); }
    }
  };
  for (const b of blocks) {
    if (b.t === 'h') { const h = el(b.level === 1 ? 'h3' : 'h4'); inline(b.parts, h); box.append(h); }
    else if (b.t === 'p') { const p = el('p'); inline(b.parts, p); box.append(p); }
    else { const list = el(b.t); for (const item of b.items) { const li = el('li'); inline(item, li); list.append(li); } box.append(list); }
  }
  return box;
}

function figure(child: HTMLElement, caption?: string, cls = ''): HTMLElement {
  const f = el('figure', `les-fig ${cls}`.trim());
  f.append(child);
  if (caption) f.append(el('figcaption', '', caption));
  return f;
}

type VideoBlock = Extract<Block, { kind: 'video' }>;
const OFFLINE = 'The video needs the internet: it plays here when you are online.';
const UNREACHABLE = 'The video could not be reached from here (YouTube may be blocked or the connection slow). The link opens it.';

function watchLink(b: VideoBlock, id: string): HTMLAnchorElement {
  const a = el('a', 'les-video-link', 'Watch on YouTube ↗');
  a.href = `https://www.youtube.com/watch?v=${id}${b.start ? `&t=${b.start}s` : ''}`;
  a.target = '_blank';
  a.rel = 'noopener';
  return a;
}
/** Offline or unreachable: the title, why, and the link (never a blank box). */
function offCard(b: VideoBlock, id: string, why: string): HTMLElement {
  const c = el('div', 'les-video-off');
  c.append(el('b', '', b.title), el('span', '', why), watchLink(b, id));
  return c;
}
/**
 * Online but YouTube unreachable (a network that blocks it, a failing connection: review 2026-10-15, V11): an iframe
 * never says it failed, so the video's picture is asked for beside it; failed() when that fails or takes over 8 s.
 */
function probe(id: string, failed: () => void): void {
  const img = new Image();
  const timer = window.setTimeout(failed, 8000);
  img.onload = () => clearTimeout(timer);
  img.onerror = () => { clearTimeout(timer); failed(); };
  img.src = `https://i.ytimg.com/vi/${id}/default.jpg`;
}
/** YouTube's privacy-enhanced player, from the start (and to the end) given, in a 16:9 box. */
function playerFrame(b: VideoBlock, id: string, autoplay: boolean): HTMLElement {
  const frame = el('iframe');
  const q = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
  if (autoplay) q.set('autoplay', '1');
  if (b.start) q.set('start', String(b.start));
  if (b.end) q.set('end', String(b.end));
  frame.src = `https://www.youtube-nocookie.com/embed/${id}?${q}`;
  frame.title = b.title;
  frame.loading = 'lazy';
  frame.allow = `accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen${autoplay ? '; autoplay' : ''}`;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allowFullscreen = true;
  const box = el('div', 'les-video-frame');
  box.append(frame);
  return box;
}
/** Online again (or gone): drawn again, so a card becomes the video and the video a card. */
function onNetwork(box: HTMLElement, draw: () => void): void {
  const again = () => { if (box.isConnected) draw(); else { removeEventListener('online', again); removeEventListener('offline', again); } };
  addEventListener('online', again);
  addEventListener('offline', again);
}

/** A video: YouTube's privacy-enhanced player, from the start (and to the end) given; offline, a card with its link. */
function drawVideo(b: VideoBlock): HTMLElement {
  if (b.size === 'row') return drawVideoRow(b);
  const id = youtubeId(b.youtube)!;
  const box = el('div', 'les-video');
  let tries = 0;
  const draw = () => {
    if (!navigator.onLine) { box.replaceChildren(offCard(b, id, OFFLINE)); return; }
    const mine = ++tries;
    probe(id, () => { if (mine === tries && box.isConnected) box.replaceChildren(offCard(b, id, UNREACHABLE)); });
    const under = el('div', 'les-video-under');
    under.append(el('span', '', b.title), watchLink(b, id));
    box.replaceChildren(playerFrame(b, id, false), under);
  };
  draw();
  onNetwork(box, draw);
  return figure(box, b.caption, 'les-video-fig');
}

/** A row's short notes, offline and unreachable (the link beside them opens the video). */
const ROW_OFFLINE = 'Needs the internet to play here.';
const ROW_UNREACHABLE = 'YouTube can’t be reached from here.';

/** The row playing now: opening another closes it (one at a time). */
let openRow: { row: HTMLElement; close: () => void } | null = null;

/**
 * A reference video as one compact row (owner, 2026-10-16: "No need to show them full size unless they're more than
 * reference"): its still, title and caption, and ▶. A tap plays it in place (the row becomes the player, with ✕ Close
 * back to the row); offline or unreachable, the same card as the full block.
 */
function drawVideoRow(b: VideoBlock): HTMLElement {
  const id = youtubeId(b.youtube)!;
  const row = el('div', 'les-vrow');
  let tries = 0;
  // Offline or unreachable, the row stays one row (coordinator, 2026-10-16: reference videos stay small): its title, a
  // short note and the link, no still.
  const card = (why: string) => {
    if (openRow === me) openRow = null;
    row.classList.remove('open');
    const off = el('div', 'les-vrow-off');
    const words = el('span', 'les-vrow-words');
    words.append(el('span', 'les-vrow-title', b.title), el('span', 'les-vrow-cap', why));
    off.title = b.title;
    off.append(words, watchLink(b, id));
    row.replaceChildren(off);
  };
  const unreachable = (mine: number) => () => { if (mine === tries && row.isConnected) card(ROW_UNREACHABLE); };
  const closed = () => {
    if (openRow === me) openRow = null;
    if (!navigator.onLine) { card(ROW_OFFLINE); return; }
    const mine = ++tries;
    const open = el('button', 'les-vrow-open');
    open.type = 'button';
    open.setAttribute('aria-label', `Play: ${b.title}`);
    // (the still is the row's own check that YouTube can be reached, as the full block's probe is)
    const still = el('img');
    still.alt = '';
    still.decoding = 'async';
    const timer = window.setTimeout(unreachable(mine), 8000);
    still.onload = () => clearTimeout(timer);
    still.onerror = () => { clearTimeout(timer); unreachable(mine)(); };
    still.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
    const thumb = el('span', 'les-vrow-thumb');
    thumb.append(still, el('span', 'les-vrow-play', '▶'));
    const words = el('span', 'les-vrow-words');
    words.append(el('span', 'les-vrow-title', b.title));
    if (b.caption) { words.classList.add('with-cap'); words.append(el('span', 'les-vrow-cap', b.caption)); }
    open.title = b.caption ? `${b.title}: ${b.caption}` : b.title; // (the whole title and caption, where a line cuts them short)
    open.append(thumb, words);
    open.addEventListener('click', play);
    row.classList.remove('open');
    row.replaceChildren(open);
  };
  const play = () => {
    if (!navigator.onLine) { card(ROW_OFFLINE); return; }
    if (openRow && openRow !== me) openRow.close();
    openRow = me;
    const mine = ++tries;
    probe(id, unreachable(mine));
    const under = el('div', 'les-video-under les-vrow-under');
    const words = el('span', 'les-vrow-words');
    words.append(el('span', 'les-vrow-title', b.title));
    if (b.caption) words.append(el('span', 'les-vrow-cap', b.caption));
    const acts = el('div', 'les-vrow-acts');
    acts.append(watchLink(b, id), button('✕ Close', 'btn les-vrow-close', closed));
    under.append(words, acts);
    row.classList.add('open');
    const frame = playerFrame(b, id, true);
    row.replaceChildren(frame, under);
    frame.scrollIntoView({ block: 'nearest' }); // (a row near the bottom bar opens with its player in view)
  };
  const me = { row, close: closed };
  closed();
  onNetwork(row, closed);
  row.dataset.size = 'row';
  return row;
}
const isRow = (b: Block) => b.kind === 'video' && b.size === 'row';

/**
 * Read / Watch (owner, 2026-10-17: "here's a video or here's a text description if you want to read"): one box with two
 * tabs at its top, Read open first; only one shows, a tap on the other switches (the page remembers nothing of it). The
 * video is the full player (offline: its title and that it needs the internet), put in when Watch is chosen and taken
 * out when Read is, so a video playing stops when you go back to reading.
 */
let tabsMade = 0;
function drawReadWatch(b: Extract<Block, { kind: 'read-watch' }>): HTMLElement {
  const box = el('section', 'les-rw');
  const id = `les-rw-${++tabsMade}`;
  const list = el('div', 'les-rw-tabs');
  list.setAttribute('role', 'tablist');
  const read = el('div', 'les-rw-panel'), watch = el('div', 'les-rw-panel');
  read.append(drawText(b.text));
  const tab = (name: 'read' | 'watch', words: string, panel: HTMLElement) => {
    const t = button(words, 'les-rw-tab', () => choose(name));
    t.setAttribute('role', 'tab');
    t.id = `${id}-${name}`;
    panel.id = `${id}-${name}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', t.id);
    t.setAttribute('aria-controls', panel.id);
    return t;
  };
  const tabs = { read: tab('read', 'Read', read), watch: tab('watch', 'Watch', watch) };
  const choose = (name: 'read' | 'watch', focus = false) => {
    for (const [k, t] of Object.entries(tabs)) { const on = k === name; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }
    read.hidden = name !== 'read';
    watch.hidden = name !== 'watch';
    watch.replaceChildren(...(name === 'watch' ? [drawVideo({ kind: 'video', youtube: b.youtube, title: b.title, start: b.start, end: b.end, caption: b.caption })] : []));
    if (focus) tabs[name].focus();
  };
  // (the tabs' own keys, as the ARIA tabs pattern has them: ← and → move between them)
  list.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); choose(read.hidden ? 'read' : 'watch', true); } });
  list.append(tabs.read, tabs.watch);
  box.append(list, read, watch);
  choose('read');
  return box;
}

/**
 * A keyboard to play in the page (owner, 2026-10-17: "an inline keyboard in the page they can press"): the block's keys,
 * the black keys' groups outlined (unless `groups: false`), the octave labels unless `names: false`; every key sounds on
 * the app's piano when tapped, and the keys pressed on a MIDI keyboard show on it while the page is open (the keyboard
 * sounds itself, as everywhere in the app). Nothing is judged or recorded; it is not a step.
 *
 * Its options (owner's lesson 2 spec, 2026-10-18), each turned on by the lesson's content:
 * - `names: "letters"`: every white key's letter on it; `fingers`: finger numbers; both: a Finger numbers | Key names
 *   switch above it, opening on the numbers.
 * - `hide`: a Hide names / Show names button (the letters).
 * - `play`: Hear it plays those notes, each key lighting as it sounds; a mini score playing stops (one sound at a time).
 * - `find`: Find a key: the names hidden, "Find F" above the keys, the letters in a random order (each once before any
 *   comes again, never one twice running). The right key (any of that letter, a MIDI keyboard's in any octave) lights
 *   green and the next letter comes; a wrong one sounds and is named ("That's D", a black key "a black key": their names
 *   aren't taught yet), the prompt stays. Show me outlines the keys of that letter until a key is pressed. Stop brings the
 *   names back. Endless; nothing scored or saved.
 */
interface PageKeys { kb: HTMLElement; strip: UnderStrip; touches: Map<number, { midi: number; stop: Promise<() => void> }>; onKey?: (midi: number) => void }
const pageKeys = new Set<PageKeys>();
const midiDown = new Set<number>();
const showPressed = (p: PageKeys) => p.strip.setPressed(new Set([...midiDown, ...[...p.touches.values()].map((t) => t.midi)]));
/** A key on the MIDI keyboard, while the lesson pages are showing (screens/shell.ts). */
export function pageKeyboardKey(midi: number, on: boolean): void {
  if (on) midiDown.add(midi); else midiDown.delete(midi);
  for (const p of [...pageKeys]) { if (!p.kb.isConnected) { pageKeys.delete(p); continue; } showPressed(p); if (on) p.onKey?.(midi); }
}
/** A keyboard's Hear it sounding now (one at a time, as mini scores): stopped by another, or by leaving the page. */
let hearingNow: (() => void) | null = null;
/** Leaving the page (or drawing it again): any key still held on the screen stops sounding. */
export function releasePageKeyboards(): void {
  hearingNow?.();
  for (const p of [...pageKeys]) {
    for (const t of p.touches.values()) void t.stop.then((stop) => stop());
    p.touches.clear();
    if (!p.kb.isConnected) pageKeys.delete(p); else showPressed(p);
  }
}
/** A white key's letter (C to B); null for a black key. */
const letterOf = (m: number): string | null => 'C D EF G A B'[((m % 12) + 12) % 12].trim() || null;
function drawKeyboard(b: Extract<Block, { kind: 'keyboard' }>, ctx: DrawContext): HTMLElement {
  const kb = el('div', 'keyboard les-keys les-playkeys');
  const strip = new UnderStrip(kb, kb, document.createElement('div'));
  strip.names = b.names === true;
  strip.groups = b.groups;
  const me: PageKeys = { kb, strip, touches: new Map() };
  pageKeys.add(me);
  // What the keys say: finger numbers or letters (the switch), the letters hidden (Hide names, or while finding).
  let view: 'fingers' | 'letters' | 'plain' = b.fingers ? 'fingers' : b.names === 'letters' ? 'letters' : 'plain';
  let hidden = false, finding = false;
  const fingerOf = b.fingers ? (m: number) => fingerOn(b.fingers, m) : null;
  const draw = () => {
    strip.fingers = view === 'fingers' ? fingerOf : null;
    strip.letters = view === 'letters' && !hidden && !finding;
    strip.showRange(b.keys.lo, b.keys.hi);
    showPressed(me);
  };
  draw();
  const wrap = el('div', 'les-kb');
  const tools = el('div', 'les-kb-tools');
  // Finger numbers | Key names (both given): one shown at a time.
  const views: [HTMLButtonElement, 'fingers' | 'letters'][] = [];
  if (b.fingers && b.names === 'letters') {
    const sw = el('div', 'les-kb-switch');
    sw.setAttribute('role', 'group');
    sw.setAttribute('aria-label', 'What the keys show');
    for (const [text, v] of [['Finger numbers', 'fingers'], ['Key names', 'letters']] as const) {
      const btn = button(text, 'btn', () => { if (finding) return; view = v; hidden = false; draw(); sync(); });
      views.push([btn, v]);
      sw.append(btn);
    }
    tools.append(sw);
  }
  const hide = b.hide ? button('Hide names', 'btn', () => { hidden = !hidden; draw(); sync(); }) : null;
  if (hide) tools.append(hide);
  const hear = b.play ? button('▶ Hear it', 'btn', () => void hearIt()) : null;
  if (hear) tools.append(hear);
  const findBtn = b.find ? button('Find a key', 'btn main', () => startFind()) : null;
  if (findBtn) tools.append(findBtn);
  // The find prompt: above the keys while finding.
  const ask = el('div', 'les-kb-find');
  ask.hidden = true;
  const askLine = el('p', 'les-kb-ask'), askSub = el('p', 'les-kb-sub');
  askSub.setAttribute('aria-live', 'polite');
  const showMe = button('Show me', 'btn', () => { if (want) strip.markKeys('want', keysOf(want)); });
  const stopFind = button('Stop', 'btn', () => endFind());
  const askBtns = el('div', 'les-kb-askbtns');
  askBtns.append(showMe, stopFind);
  ask.append(askLine, askSub, askBtns);
  const sync = () => {
    for (const [btn, v] of views) { btn.setAttribute('aria-pressed', String(view === v)); btn.disabled = finding; }
    if (hide) { hide.hidden = view !== 'letters' || finding; hide.textContent = hidden ? 'Show names' : 'Hide names'; }
    if (findBtn) findBtn.hidden = finding;
    ask.hidden = !finding;
  };
  sync();

  // Hear it: the notes at the block's tempo, each key lit as it is heard.
  let ticker = 0;
  const stopHear = () => { clearInterval(ticker); strip.markKeys('now-r', []); if (hearingNow === stopHear) { hearingNow = null; ctx.sound.stop(); } };
  async function hearIt(): Promise<void> {
    hearingNow?.();
    stopMiniScores();
    await ctx.prepare().catch(() => {});
    if (!kb.isConnected) return;
    const q = 60000 / (b.tempo ?? 100), notes = b.play!.map(midiOfPitch);
    hearingNow = stopHear;
    ctx.sound.play(notes.map((midi, i) => ({ t: i * q, midi, dur: q * 0.9, vel: 80 })), [], -150, 1);
    let last = -2;
    ticker = window.setInterval(() => {
      if (hearingNow !== stopHear || !kb.isConnected) { stopHear(); return; }
      const t = ctx.sound.songTime() - ctx.sound.heardDelayMs();
      if (t > notes.length * q + 100 || !ctx.sound.playing) { stopHear(); return; }
      const i = t < 0 ? -1 : Math.min(notes.length - 1, Math.floor(t / q));
      if (i !== last) { last = i; strip.markKeys('now-r', i >= 0 ? [notes[i]] : []); }
    }, 15);
  }

  // Find a key.
  let want: string | null = null, lastAsked: string | null = null, deck: string[] = [], settling = 0;
  const keysOf = (l: string) => { const out: number[] = []; for (let m = b.keys.lo; m <= b.keys.hi; m++) if (letterOf(m) === l) out.push(m); return out; };
  const nextLetter = () => {
    if (!deck.length) {
      deck = [...new Set(b.find!)];
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      if (deck[0] === lastAsked) deck.push(deck.shift()!); // (never the same letter twice running across a reshuffle)
    }
    want = lastAsked = deck.shift()!;
    askLine.textContent = `Find ${want}`;
    askSub.textContent = '';
    strip.markKeys('want', []);
    strip.markKeys('ok', []);
  };
  function startFind(): void { hearingNow?.(); finding = true; deck = []; draw(); sync(); nextLetter(); }
  function endFind(): void { finding = false; want = null; clearTimeout(settling); settling = 0; draw(); sync(); }
  me.onKey = (midi) => {
    if (!finding || !want || !kb.isConnected || settling) return; // (settling: the moment a found key shows green)
    strip.markKeys('want', []);
    const l = letterOf(midi);
    if (l === want) {
      strip.markKeys('ok', [midi]);
      askSub.textContent = `✓ That’s ${want}`;
      settling = window.setTimeout(() => { settling = 0; if (finding) nextLetter(); }, 900);
    } else askSub.textContent = `That’s ${l ?? 'a black key'}. Find ${want}.`;
  };

  let woken = false;
  kb.addEventListener('pointerdown', (e) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>('[data-midi]');
    if (!key) return;
    e.preventDefault();
    if (!woken) { woken = true; void ctx.prepare().catch(() => {}); } // (the app's volumes and piano, as a little score plays)
    const midi = Number(key.dataset.midi), id = e.pointerId;
    try { kb.setPointerCapture(id); } catch { /* not a live pointer */ } // (let go off the keys, it still stops)
    me.touches.get(id)?.stop.then((stop) => stop());
    me.touches.set(id, { midi, stop: ctx.sound.noteNow(midi, 90, () => me.touches.get(id)?.midi === midi) });
    showPressed(me);
    me.onKey?.(midi);
  });
  const lift = (e: PointerEvent) => {
    const t = me.touches.get(e.pointerId);
    if (!t) return;
    me.touches.delete(e.pointerId);
    void t.stop.then((stop) => stop());
    showPressed(me);
  };
  kb.addEventListener('pointerup', lift);
  kb.addEventListener('pointercancel', lift);
  kb.addEventListener('lostpointercapture', lift);
  kb.addEventListener('contextmenu', (e) => e.preventDefault());
  kb.setAttribute('aria-label', 'A keyboard to play: tap the keys');
  if (tools.childElementCount) wrap.append(tools);
  wrap.append(ask, kb);
  return figure(wrap, b.caption, 'les-playkeys-fig');
}

/** The MusicXML a score block draws. */
async function scoreXml(src: ScoreSource, app: App): Promise<string> {
  const fetchText = async (url: string) => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} for ${url}`); return r.text(); };
  if ('piece' in src) {
    // (a catalogue piece named by its "u-" id is added to your library first, as + Add adds it: owner, 2026-10-15)
    const piece = await ensurePiece(app, base, src.piece);
    if (takeAdded(piece.id)) app.showMessage(addedLine(piece.title), true);
    return excerptXml(await app.xmlFor(piece), src.bars[0], src.bars[1]);
  }
  const fromItems = async (setId: string, file: unknown, at: string, n: number) => {
    const set = await readSet(setId, file as never, at, async (id) => {
      const piece = app.pieces.find((p) => p.id === id);
      if (!piece) throw new Error(`no score with id "${id}"`);
      return app.xmlFor(piece);
    }, fetchText);
    const item = set.items.find((i) => i.n === n) ?? (set.order === 'passage' ? set.items[n - 1] : undefined);
    if (!item) throw new Error(`the set "${setId}" has no item ${n}`);
    return itemsXml([item], [], !!item.bars, item.meter ?? set.meter, item.fifths ?? set.fifths ?? 0);
  };
  if ('set' in src) {
    const url = new URL(`${base}content/sets/${src.set}.json`, location.href).href;
    return fromItems(src.set, JSON.parse(await fetchText(url)), url, src.item);
  }
  // A file, or a whole file written in the lesson (read.ts refuses anything else): its bars checked against its time
  // signature (V13), and given the XML declaration OpenSheetMusicDisplay looks for.
  const text = 'file' in src ? await fetchText(new URL(fileUrl(src.file), location.href).href) : src.musicxml;
  const bad = barProblem(text);
  if (bad) throw new Error(bad);
  return /^\s*<\?xml/.test(text) ? text : `<?xml version="1.0" encoding="UTF-8"?>${text}`;
}

function drawScore(b: Extract<Block, { kind: 'score' }>, ctx: DrawContext): HTMLElement {
  const wrap = el('div', 'les-score');
  const music = el('div', 'les-score-music');
  const bar = el('div', 'les-score-bar');
  const play = el('button', 'btn main les-play', '▶ Hear it');
  play.type = 'button';
  play.disabled = true;
  bar.append(play);
  const keys = b.keys ? el('div', 'keyboard les-keys') : undefined;
  wrap.append(music, bar);
  if (keys) wrap.append(keys);
  const mini = new MiniScore(music, ctx.sound, ctx.prepare, keys);
  mini.onState = (on) => { play.textContent = on ? '■ Stop' : '▶ Hear it'; wrap.classList.toggle('playing', on); };
  play.addEventListener('click', () => { if (mini.playing) mini.stop(); else void mini.play(); });
  (wrap as unknown as { mini: MiniScore }).mini = mini; // (for checks)
  void (async () => {
    try {
      await mini.load(await scoreXml(b.source, ctx.app), b.tempo);
      play.disabled = false;
    } catch (e) {
      music.replaceChildren(el('p', 'note les-bad', `This music could not be drawn: ${e instanceof Error ? e.message : String(e)}`));
    }
  })();
  return figure(wrap, b.caption);
}

/** A keyboard with the notes marked, and their fingers under them. */
function drawKeys(b: Extract<Block, { kind: 'keys' }>): HTMLElement {
  const kb = el('div', 'keyboard les-keys les-diagram');
  const strip = new UnderStrip(kb, kb, document.createElement('div'));
  const midis = b.notes.map(midiOfName);
  strip.names = b.names === undefined; // (octave labels only when the block doesn't say otherwise)
  // The whole octaves the notes need, C to B (2026-10-17: was at least two, the marked keys off at one end).
  strip.showRange(Math.floor(Math.min(...midis) / 12) * 12, Math.floor(Math.max(...midis) / 12) * 12 + 11);
  strip.markKeys('now-r', midis);
  if (b.names === 'letters') midis.forEach((m, i) => kb.querySelector(`[data-midi="${m}"]`)?.append(el('span', 'letter', b.notes[i][0])));
  b.fingers?.forEach((f, i) => {
    const key = kb.querySelector<HTMLElement>(`[data-midi="${midis[i]}"]`);
    if (key && f !== null) key.append(el('span', 'finger', String(f)));
  });
  kb.setAttribute('role', 'img');
  kb.setAttribute('aria-label', `Keys: ${b.notes.join(' ')}${b.fingers ? `, fingers ${b.fingers.map((f) => f ?? '–').join(' ')}` : ''}`);
  return figure(kb, b.caption);
}
const STEPS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midiOfName(n: string): number {
  const m = /^([A-G])(#{1,2}|b{1,2})?(-?\d)$/.exec(n)!;
  const alter = m[2] ? (m[2][0] === '#' ? m[2].length : -m[2].length) : 0;
  return (Number(m[3]) + 1) * 12 + STEPS[m[1]] + alter;
}

function drawImage(b: { src: string; alt: string; caption?: string }, cls: string): HTMLElement {
  const img = el('img');
  img.src = fileUrl(b.src);
  img.alt = b.alt;
  img.loading = 'lazy';
  img.addEventListener('error', () => img.replaceWith(el('p', 'note les-bad', `The picture "${b.alt}" could not be loaded${/^https:/.test(b.src) ? ' (it needs the internet)' : ''}.`)));
  return figure(img, b.caption, cls);
}

function drawAnimation(b: Extract<Block, { kind: 'animation' }>): HTMLElement {
  if (!/\.(mp4|webm)$/i.test(b.src)) return drawImage(b, 'les-anim');
  const v = el('video');
  v.src = fileUrl(b.src);
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.setAttribute('aria-label', b.alt);
  // Moving by itself unless the phone asks for less motion (then it has its controls and waits for a tap).
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) v.controls = true; else v.autoplay = true;
  return figure(v, b.caption, 'les-anim');
}

/** Each kind's drawing: the one place to add a kind (with its fields in read.ts). */
export const DRAW: { [K in Block['kind']]: (b: Extract<Block, { kind: K }>, ctx: DrawContext) => HTMLElement } = {
  text: (b) => drawText(b.text),
  tip: (b) => { const a = el('aside', 'les-tip'); a.append(el('b', 'les-tip-label', b.label), drawText(b.text)); return a; },
  image: (b) => drawImage(b, 'les-image'),
  video: (b) => drawVideo(b),
  score: (b, ctx) => drawScore(b, ctx),
  keys: (b) => drawKeys(b),
  animation: (b) => drawAnimation(b),
  step: (b, ctx) => ctx.step(b),
  'read-watch': (b) => drawReadWatch(b),
  keyboard: (b, ctx) => drawKeyboard(b, ctx),
};

export function drawBlock(b: Block, ctx: DrawContext): HTMLElement {
  const e = (DRAW[b.kind] as (b: Block, ctx: DrawContext) => HTMLElement)(b, ctx);
  e.dataset.block = b.kind;
  return e;
}

/**
 * A lesson's blocks in the content's order (never reordered). Consecutive row videos sit together as one list; when the
 * lesson ends with row videos, that list is under one plain heading, "Videos" (owner, 2026-10-16: videos at the bottom,
 * compact unless more than reference; putting them at the end is the content's job).
 */
export function drawBlocks(blocks: Block[], ctx: DrawContext): HTMLElement[] {
  let tail = blocks.length;
  while (tail > 0 && isRow(blocks[tail - 1])) tail--;
  const out: HTMLElement[] = [];
  for (let i = 0; i < blocks.length;) {
    if (!isRow(blocks[i])) { out.push(drawBlock(blocks[i++], ctx)); continue; }
    const list = el('div', 'les-vrows');
    list.setAttribute('role', 'list');
    if (i === tail) {
      const section = el('section', 'les-videos');
      section.append(el('h3', 'les-videos-h', 'Videos'), list);
      out.push(section);
    } else out.push(list);
    for (; i < blocks.length && isRow(blocks[i]); i++) {
      const r = drawBlock(blocks[i], ctx);
      r.setAttribute('role', 'listitem');
      list.append(r);
    }
  }
  return out;
}
