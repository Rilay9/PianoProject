/**
 * The camera, and the contact sheet it builds.
 *
 * Shared by the automatic tour and the interactive review so that both produce
 * the same filenames and the same index — the point of the review is to talk
 * about *this* picture, and that only works if the picture has a stable name.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Page } from '@playwright/test';

/** Everything lands here; the whole directory is disposable. */
export const TOUR_DIR = resolve('../build/tour');

/** The S25 in CSS pixels: 1080 × 2340 at a device pixel ratio of 3. */
export const PORTRAIT = { width: 360, height: 780 } as const;
export const LANDSCAPE = { width: 780, height: 360 } as const;

/**
 * A tablet, both ways up.
 *
 * Not because the owner has one. Because `ui/tablet.ts` exists: at 900 CSS px
 * on the shortest side the app switches to a four-bar window and a side panel,
 * and until now that code path had never been photographed. A layout nobody
 * has looked at is a layout nobody knows the state of, whoever owns the
 * device. 10-inch class, portrait and landscape.
 */
export const TABLET_PORTRAIT = { width: 900, height: 1200 } as const;
export const TABLET_LANDSCAPE = { width: 1200, height: 900 } as const;

/**
 * The four the picture tour shoots, and the two the measuring runs add.
 *
 * `phone-portrait-342` and `phone-landscape-740` are the owner's real device —
 * 342 x 740 and 740 x 342, not the round 360 x 780 and 780 x 360 every fixture
 * in this repository used until now. They are deliberately *not* in
 * `FORM_FACTORS`: that list is what `tour.spec` walks, and two more
 * orientations there would be two more sixteen-minute passes and several
 * hundred new photographs to review. The corpus and the sequence add them to
 * lists of their own, and both name a shot by its orientation, so the type has
 * to know them.
 */
export type Orientation =
  | 'portrait'
  | 'landscape'
  | 'tablet-portrait'
  | 'tablet-landscape'
  | 'phone-portrait-342'
  | 'phone-landscape-740';

/** Every form factor the tour shoots, in the order the contact sheet shows them. */
export const FORM_FACTORS: { orientation: Orientation; size: { width: number; height: number } }[] =
  [
    { orientation: 'portrait', size: PORTRAIT },
    { orientation: 'landscape', size: LANDSCAPE },
    { orientation: 'tablet-portrait', size: TABLET_PORTRAIT },
    { orientation: 'tablet-landscape', size: TABLET_LANDSCAPE },
  ];

export interface Shot {
  /** `03-score-wait`, unique and sortable. */
  slug: string;
  /** What a person is looking at. */
  title: string;
  /** What to look *for*, so feedback is about something. */
  note: string;
  orientation: Orientation;
  file: string;
  /**
   * SHA-1 of the PNG.
   *
   * Two things rest on it. Thirteen of the tour's 328 pictures turned out to
   * be pixel-identical to another scene with a different caption — a scene
   * that had photographed the screen it started from rather than the state it
   * claimed — and a hash is how that stops being something a reviewer has to
   * notice. And a hash that matches the last run means the scene has not
   * changed, which is what makes a 328-picture tour reviewable at all.
   */
  hash?: string;
  /** Against the previous ledger: `new`, `changed` or `same`. */
  since?: 'new' | 'changed' | 'same';
}

const shots: Shot[] = [];
/** The ledger as it was when this run started, for the changed/same mark. */
const before = new Map<string, string>();

/**
 * Photographs the whole viewport.
 *
 * Full page rather than an element: the complaint that started this was about
 * the *empty two thirds of the screen*, which no element screenshot would ever
 * have shown.
 */
export async function shoot(
  page: Page,
  orientation: Orientation,
  slug: string,
  title: string,
  note: string,
): Promise<void> {
  const file = join(TOUR_DIR, orientation, `${slug}.png`);
  mkdirSync(dirname(file), { recursive: true });
  // A beat for fonts, the engraver and any scheduled refit to settle. The tour
  // is not timing-sensitive and a blurred half-drawn shot wastes the reviewer's
  // attention, which is the scarce thing here.
  await page.waitForTimeout(600);
  await page.screenshot({ path: file, animations: 'disabled' });
  const hash = createHash('sha1').update(readFileSync(file)).digest('hex');
  const was = previousHash(orientation, slug);
  const since = was === undefined ? 'new' : was === hash ? 'same' : 'changed';
  shots.push({ slug, title, note, orientation, file, hash, since });
}

function previousHash(orientation: Orientation, slug: string): string | undefined {
  if (before.size === 0) {
    for (const shot of loadLedger()) {
      if (shot.hash) before.set(`${shot.orientation}/${shot.slug}`, shot.hash);
    }
    // A marker, so an empty previous ledger is not reloaded on every shot.
    before.set('', '');
  }
  return before.get(`${orientation}/${slug}`);
}

/**
 * Scenes in one form factor whose pictures are byte-for-byte the same.
 *
 * Not a near-match: identical. That only happens when two scenes ended up on
 * the same screen in the same state, which means one of them did not do what
 * its caption says — the tour photographed the screen it started from. Thirteen
 * pairs were found this way, including a "blind mode" shot showing the score.
 */
export function identicalShots(): { orientation: Orientation; slugs: string[] }[] {
  const byHash = new Map<string, { orientation: Orientation; slugs: string[] }>();
  for (const shot of loadLedger()) {
    if (!shot.hash) continue;
    const key = `${shot.orientation}:${shot.hash}`;
    const entry = byHash.get(key) ?? { orientation: shot.orientation, slugs: [] };
    entry.slugs.push(shot.slug);
    byHash.set(key, entry);
  }
  return [...byHash.values()]
    .filter((entry) => entry.slugs.length > 1)
    .map((entry) => ({ orientation: entry.orientation, slugs: [...entry.slugs].sort() }));
}

/**
 * Forgets a shot, and deletes its picture.
 *
 * A scene that used to be photographed and no longer is — because it turned
 * out to have nothing of its own to show, or because it could not be reached —
 * would otherwise keep its last picture for ever: the ledger carries forward
 * every entry this run did not replace. That is how "the session controls"
 * stayed in the identical list after the run had stopped shooting it.
 */
export function dropShot(orientation: Orientation, slug: string): void {
  dropped.push(`${orientation}/${slug}`);
  const file = join(TOUR_DIR, orientation, `${slug}.png`);
  if (existsSync(file)) rmSync(file);
}

const dropped: string[] = [];

/** Remembers shots across the two orientation runs. */
const LEDGER = join(TOUR_DIR, 'shots.json');

export function loadLedger(): Shot[] {
  if (!existsSync(LEDGER)) return [];
  try {
    return JSON.parse(readFileSync(LEDGER, 'utf8')) as Shot[];
  } catch {
    return [];
  }
}

export function saveLedger(): void {
  const previous = loadLedger().filter(
    (old) =>
      !shots.some((s) => s.slug === old.slug && s.orientation === old.orientation) &&
      !dropped.includes(`${old.orientation}/${old.slug}`),
  );
  mkdirSync(TOUR_DIR, { recursive: true });
  writeFileSync(LEDGER, JSON.stringify([...previous, ...shots], null, 2), 'utf8');
}

/**
 * One page showing every shot side by side, portrait next to landscape.
 *
 * Written as a file rather than served, so it can be opened from the file
 * manager and sent to somebody.
 */
export function writeContactSheet(): void {
  const all = loadLedger();
  const bySlug = new Map<
    string,
    {
      title: string;
      note: string;
      shots: Partial<Record<Orientation, string>>;
      since: Partial<Record<Orientation, string>>;
    }
  >();
  for (const shot of all) {
    const entry = bySlug.get(shot.slug) ?? { title: shot.title, note: shot.note, shots: {}, since: {} };
    entry.shots[shot.orientation] = `${shot.orientation}/${shot.slug}.png`;
    entry.since[shot.orientation] = shot.since ?? 'new';
    bySlug.set(shot.slug, entry);
  }
  // The columns are whatever was actually shot, not a fixed four.
  //
  // `FORM_FACTORS` is the picture tour's list; the corpus and the sequence add
  // the owner's own 342 x 740 and 740 x 342 to lists of their own. Rendering a
  // fixed four meant a run at those sizes wrote its pictures and its ledger
  // and then showed neither — a photograph nobody can see is not evidence.
  const shotOrientations = [...new Set(all.map((shot) => shot.orientation))];
  const columns = [
    ...FORM_FACTORS.map((f) => f.orientation).filter((o) => shotOrientations.includes(o)),
    ...shotOrientations.filter((o) => !FORM_FACTORS.some((f) => f.orientation === o)),
  ];
  const rows = [...bySlug.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, entry], index) => {
      const cell = (o: Orientation): string =>
        entry.shots[o]
          ? `<figure><img src="${entry.shots[o] ?? ''}" alt="${slug} ${o}"><figcaption>${o}${
              entry.since[o] === 'same' ? '' : ` · ${entry.since[o] ?? 'new'}`
            }</figcaption></figure>`
          : `<figure class="missing"><figcaption>${o} — not shot</figcaption></figure>`;
      // A scene counts as changed if any of its pictures did. The filter
      // exists so a second tour is a review of the difference rather than of
      // 328 pictures again.
      const moved = Object.values(entry.since).some((s) => s !== 'same');
      return `<section id="${slug}" data-since="${moved ? 'changed' : 'same'}">
  <h2><span class="n">${String(index + 1)}</span> ${entry.title} <code>${slug}</code>${
    moved ? ' <span class="tag">changed</span>' : ''
  }</h2>
  <p class="note">${entry.note}</p>
  <div class="pair">${columns.map((o) => cell(o)).join('')}</div>
  <textarea placeholder="What is wrong with this one? (type here, then copy the whole page's notes at the bottom)"
            data-slug="${slug}"></textarea>
</section>`;
    })
    .join('\n');

  const html = `<!doctype html>
<meta charset="utf-8">
<title>PianoPath — UX tour</title>
<style>
  :root { color-scheme: dark; }
  body { background:#0f1115; color:#e8eaed; font:15px/1.5 system-ui, sans-serif; margin:0 auto; padding:2rem; max-width:1100px; }
  h1 { font-size:1.4rem; }
  section { border-top:1px solid #2a2f3a; padding:1.5rem 0; }
  h2 { font-size:1.05rem; font-weight:600; display:flex; align-items:center; gap:.5rem; }
  .n { background:#2a2f3a; border-radius:999px; padding:.1rem .55rem; font-size:.85rem; }
  code { color:#8ab4f8; font-weight:400; font-size:.85rem; }
  .note { color:#9aa0a6; margin:.2rem 0 1rem; }
  .pair { display:flex; gap:1.5rem; align-items:flex-start; flex-wrap:wrap; }
  figure { margin:0; }
  figure img { max-height:620px; border:1px solid #2a2f3a; border-radius:8px; display:block; }
  figcaption { color:#9aa0a6; font-size:.8rem; padding-top:.35rem; }
  .missing { color:#5f6368; font-style:italic; }
  textarea { width:100%; min-height:3.5rem; margin-top:1rem; background:#171a21; color:#e8eaed;
             border:1px solid #2a2f3a; border-radius:8px; padding:.6rem; font:inherit; }
  #out { width:100%; min-height:12rem; margin-top:1rem; }
  button { background:#8ab4f8; color:#0f1115; border:0; border-radius:8px; padding:.6rem 1rem;
           font:inherit; font-weight:600; cursor:pointer; }
  .tag { background:#3d2f14; color:#f6c26b; border-radius:999px; padding:.1rem .5rem; font-size:.75rem; font-weight:500; }
  #filter { display:flex; align-items:center; gap:.5rem; color:#9aa0a6; margin:1rem 0 0; }
  body.only-changed section[data-since="same"] { display:none; }
</style>
<h1>PianoPath — every screen, every shape</h1>
<p class="note">Galaxy S25 (360 × 780 at 3×) and a 10-inch tablet (900 × 1200), both ways up. Type what is wrong under any shot, then press
<b>Collect notes</b> at the bottom and send the text back.</p>
<p id="filter"><label><input type="checkbox" id="changed-only" onchange="document.body.classList.toggle('only-changed', this.checked)"> Only what changed since the last tour</label></p>
${rows}
<section>
  <h2>Your notes</h2>
  <button onclick="collect()">Collect notes</button>
  <textarea id="out" placeholder="press the button"></textarea>
</section>
<script>
function collect() {
  const lines = [];
  for (const t of document.querySelectorAll('textarea[data-slug]')) {
    if (t.value.trim()) lines.push('## ' + t.dataset.slug + '\\n' + t.value.trim());
  }
  document.getElementById('out').value = lines.join('\\n\\n') || '(nothing typed yet)';
}
</script>
`;
  mkdirSync(TOUR_DIR, { recursive: true });
  writeFileSync(join(TOUR_DIR, 'index.html'), html, 'utf8');
}
