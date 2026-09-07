/**
 * The camera, and the contact sheet it builds.
 *
 * Shared by the automatic tour and the interactive review so that both produce
 * the same filenames and the same index — the point of the review is to talk
 * about *this* picture, and that only works if the picture has a stable name.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
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

export type Orientation = 'portrait' | 'landscape' | 'tablet-portrait' | 'tablet-landscape';

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
}

const shots: Shot[] = [];

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
  shots.push({ slug, title, note, orientation, file });
}

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
    (old) => !shots.some((s) => s.slug === old.slug && s.orientation === old.orientation),
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
  const bySlug = new Map<string, { title: string; note: string; shots: Partial<Record<Orientation, string>> }>();
  for (const shot of all) {
    const entry = bySlug.get(shot.slug) ?? { title: shot.title, note: shot.note, shots: {} };
    entry.shots[shot.orientation] = `${shot.orientation}/${shot.slug}.png`;
    bySlug.set(shot.slug, entry);
  }
  const rows = [...bySlug.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, entry], index) => {
      const cell = (o: Orientation): string =>
        entry.shots[o]
          ? `<figure><img src="${entry.shots[o] ?? ''}" alt="${slug} ${o}"><figcaption>${o}</figcaption></figure>`
          : `<figure class="missing"><figcaption>${o} — not shot</figcaption></figure>`;
      return `<section id="${slug}">
  <h2><span class="n">${String(index + 1)}</span> ${entry.title} <code>${slug}</code></h2>
  <p class="note">${entry.note}</p>
  <div class="pair">${FORM_FACTORS.map((f) => cell(f.orientation)).join('')}</div>
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
</style>
<h1>PianoPath — every screen, every shape</h1>
<p class="note">Galaxy S25 (360 × 780 at 3×) and a 10-inch tablet (900 × 1200), both ways up. Type what is wrong under any shot, then press
<b>Collect notes</b> at the bottom and send the text back.</p>
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
