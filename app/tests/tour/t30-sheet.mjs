// Tiles T30's cells into one contact sheet, and prints the fault table.
//
//   node tests/tour/t30-sheet.mjs ../build/tour/T30
//
// Not collected by Playwright (its `testMatch` wants `*.spec.ts`), and not run
// by any script: it is the second half of `t30-window.spec.ts`, which writes
// one JSON record a cell from four workers and leaves the tiling to this.
//
// The caption carries the numbers; the picture is the proxy. A cell with no
// measurement is printed as such rather than dropped.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2];
const cells = [];
const notShot = [];
for (const f of readdirSync(join(DIR, 'cells'))) {
  const c = JSON.parse(readFileSync(join(DIR, 'cells', f), 'utf8'));
  if (c.notShot) notShot.push(c);
  else cells.push(c);
}
// A cell shot twice (a retry) keeps the last one written.
const byKey = new Map();
for (const c of cells) byKey.set(`${c.orientation}/${c.slug}`, c);
const all = [...byKey.values()].sort(
  (a, b) => a.slug.localeCompare(b.slug) || a.orientation.localeCompare(b.orientation),
);

const SHAPE = {
  'phone-portrait-342': 'phone upright 342x740',
  portrait: 'phone upright 390x844',
  'phone-landscape-740': 'phone sideways 740x342',
  'tablet-portrait': 'tablet upright 768x1024',
  'tablet-landscape': 'tablet sideways 1024x768',
};

/** Before the run the cursor is at the first bar; there is no run to ask. */
function cursor(c) {
  if (c.m?.cursorBar !== null && c.m?.cursorBar !== undefined) return c.m.cursorBar;
  return c.moment === 'before' ? (c.m?.barsInk?.[0] ?? null) : null;
}
function ahead(c) {
  const cur = cursor(c);
  const bars = c.m?.barsInk ?? [];
  if (cur === null || bars.length === 0) return null;
  return Math.max(...bars) - cur;
}
function drawn(c) {
  return c.m?.barsInk?.length ?? null;
}

// --- the four groups the owner named ---------------------------------------
const faults = { next: [], nothing: [], small: [], count: [] };

/**
 * Printed bars per piece, from `content/catalog.json`'s `notation.bars`.
 *
 * A window cannot draw more bars than the piece has, so asking for 8 of a
 * 3-bar exercise and getting 3 is the piece's limit and not a fault. Without
 * this the count group cries wolf on every short piece at every high setting.
 */
const PIECE_BARS = {
  'exercise.five-finger.c-major.right': 3,
  'song.folk.twinkle.ht': 12,
  'song.classical.chopin-nocturne-op48-1.nifc': 81,
  'song.classical.chopin-nocturne-op9-2': 38,
  'exercise.articulation.c.legato.right': 4,
};

/**
 * The fault table describes the build in the tree, not the probes.
 *
 * `p-*` cells were shot against throwaway edits of the renderer (item 3) and
 * would otherwise be counted as faults of the app as it stands.
 */
const today = all.filter((c) => !c.slug.startsWith('p-'));

// "nothing changes": two counts on the same shape, piece, layout, moment and
// mode whose pictures are byte-identical.
const groups = new Map();
for (const c of today) {
  const key = `${c.orientation}|${c.piece}|${c.layout}|${c.moment}|${c.mode}|${c.zoomSteps}`;
  const list = groups.get(key) ?? [];
  list.push(c);
  groups.set(key, list);
}
for (const [key, list] of groups) {
  const byHash = new Map();
  for (const c of list) {
    const same = byHash.get(c.hash) ?? [];
    same.push(c);
    byHash.set(c.hash, same);
  }
  for (const same of byHash.values()) {
    if (same.length > 1) {
      faults.nothing.push({
        cells: same,
        why: `Bars in window ${same.map((c) => c.barsAsked).join(', ')} give a byte-identical picture (sha1 ${same[0].hash.slice(0, 10)})`,
        key,
      });
    }
  }
}

let blindCells = 0;
for (const c of today) {
  if (c.layout === 'drill screen') continue;
  // Blind draws nothing on purpose (`04` §5e): counted separately, not as a
  // window that failed to show the bars it was asked for.
  if (c.mode === 'blind') {
    blindCells += 1;
    continue;
  }
  const d = drawn(c);
  const a = ahead(c);
  // The last bar of a piece has no next music, and `04` §5 says the other
  // slot then keeps the bars just played, as a page would. Excluded, or the
  // group counts the ending of every short exercise as a fault.
  const last = (PIECE_BARS[c.piece] ?? 0) - 1;
  const onLastBar = last > 0 && cursor(c) !== null && cursor(c) >= last;
  if (a !== null && a < 1 && c.m?.stageVisible && !onLastBar) {
    faults.next.push({
      cell: c,
      why: `nothing past the bar being played is on the glass (bars inked ${JSON.stringify(c.m.barsInk)}, cursor on printed bar ${String((cursor(c) ?? 0) + 1)} of ${String(PIECE_BARS[c.piece] ?? '?')}, ${String(c.m.slotCount)} slot(s))`,
    });
  }
  if (c.m?.stavePx !== null && c.m?.stavePx !== undefined && c.m.stavePx < 40 && c.m.stageVisible) {
    faults.small.push({ cell: c, why: `stave ${c.m.stavePx} px, under MIN_STAFF_PX's own 40 px floor` });
  } else if (c.m?.fillW !== null && c.m?.fillW !== undefined && c.m.fillW < 0.55 && c.m.stageVisible) {
    faults.small.push({
      cell: c,
      why: `the ink spans ${(c.m.fillW * 100).toFixed(0)} % of the stage's width, under score.fill's own 55 % floor (stave ${String(c.m.stavePx)} px, ink ${((c.m.fillH ?? 0) * 100).toFixed(0)} % tall)`,
    });
  }
  // The count group asks only what the setting can be held to: never more
  // bars than the piece has, and never in a layout the setting does not reach.
  const cap = Math.min(c.barsAsked, PIECE_BARS[c.piece] ?? c.barsAsked);
  if (c.layout === 'window' && d !== null && c.barsAsked > 0 && d !== cap) {
    faults.count.push({
      cell: c,
      why: `the stepper says ${c.stepperText}; ${String(d)} bar(s) are drawn ${JSON.stringify(c.m.barsInk)}${cap !== c.barsAsked ? ` (the piece has only ${String(PIECE_BARS[c.piece])})` : ''}`,
    });
  }
}

function cap(c) {
  const m = c.m;
  if (!m) return 'not measured';
  const bits = [
    `asked ${c.stepperText ?? String(c.barsAsked)}`,
    `drawn ${String(drawn(c))} bar(s) ${JSON.stringify(m.barsInk)}`,
    `cursor bar ${String(cursor(c))}, ${String(ahead(c))} ahead`,
    `zoom ${String(m.zoom)} x css ${String(m.cssScale)} = ${String(m.drawn)}`,
    `stave ${String(m.stavePx)} px`,
    `ink ${m.fillW === null ? '?' : (m.fillW * 100).toFixed(0)} % wide, ${m.fillH === null ? '?' : (m.fillH * 100).toFixed(0)} % tall of the stage`,
    `${String(m.slotCount)} slot(s), ${String(m.readAhead)}`,
    m.frozen === null ? 'not frozen' : `frozen at ${String(m.frozen)}`,
    `Size ${c.zoomText ?? '?'}`,
  ];
  return bits.join(' · ');
}

const rows = all
  .map(
    (c, i) => `<section id="${c.orientation}-${c.slug}">
  <h2><span class="n">${i + 1}</span> ${c.slug} <code>${SHAPE[c.orientation] ?? c.orientation}</code></h2>
  <p class="note">${c.piece} — ${c.pieceWhy}<br>${c.layout}, ${c.moment}, mode ${c.mode}${c.note ? ` — ${c.note}` : ''}</p>
  <div class="pair"><figure><img src="${c.file}" alt="${c.slug}"><figcaption>${cap(c)}</figcaption></figure></div>
</section>`,
  )
  .join('\n');

const counts = `<ul>
<li><b>Cannot see the next music:</b> ${faults.next.length} cells</li>
<li><b>Nothing changes when the option changes:</b> ${faults.nothing.length} identical pairs/groups</li>
<li><b>Too small:</b> ${faults.small.length} cells</li>
<li><b>The chosen count is not the drawn count:</b> ${faults.count.length} cells</li>
<li>Blind-mode cells, where the stage is dark by design and none of the four groups applies: ${blindCells}</li>
<li>Total cells shot: ${all.length} (${today.length} against the build in the tree, ${all.length - today.length} against item 3's probe builds); not shot: ${notShot.length}</li>
</ul>`;

writeFileSync(
  join(DIR, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>T30 — the score window, every option measured</title>
<style>
 :root{color-scheme:dark}
 body{background:#0f1115;color:#e8eaed;font:15px/1.5 system-ui,sans-serif;margin:0 auto;padding:2rem;max-width:1100px}
 section{border-top:1px solid #2a2f3a;padding:1.2rem 0}
 h2{font-size:1rem;display:flex;gap:.5rem;align-items:center}
 .n{background:#2a2f3a;border-radius:999px;padding:.1rem .55rem;font-size:.8rem}
 code{color:#8ab4f8;font-weight:400;font-size:.85rem}
 .note{color:#9aa0a6;margin:.2rem 0 .8rem}
 figure{margin:0}figure img{max-height:620px;border:1px solid #2a2f3a;border-radius:8px;display:block}
 figcaption{color:#c7cbd1;font-size:.82rem;padding-top:.35rem;max-width:80ch}
</style>
<h1>T30 — the score window, every option measured</h1>
<p class="note">The picture is the proxy; the numbers under it are the claim.</p>
${counts}
${rows}
`,
  'utf8',
);

// --- the fault table, as markdown, for the decision draft -------------------
const md = [];
md.push(`Blind-mode cells excluded from the groups (the stage is dark by design): ${blindCells}.`);
md.push(`Cells shot: ${all.length} (${today.length} against the build in the tree, ${all.length - today.length} probe cells, excluded from the groups below). Not shot: ${notShot.length}.`);
for (const [group, list] of Object.entries(faults)) {
  md.push(`\n### ${group} — ${list.length}\n`);
  if (group === 'nothing') {
    for (const f of list) {
      const c = f.cells[0];
      md.push(`- ${SHAPE[c.orientation]} | ${c.piece} | ${c.layout}, ${c.moment}, ${c.mode} | ${f.why}`);
    }
  } else {
    for (const f of list) {
      const c = f.cell;
      md.push(
        `- ${SHAPE[c.orientation]} | ${c.piece} | ${c.layout}, ${c.moment}, ${c.mode}, ${c.stepperText}, Size ${c.zoomText} | ${f.why}`,
      );
    }
  }
}
for (const n of notShot) md.push(`\n- NOT SHOT ${n.slug} (${n.orientation}): ${n.notShot}`);
writeFileSync(join(DIR, 'faults.md'), md.join('\n'), 'utf8');
console.log(`${all.length} cells (${today.length} today, ${all.length - today.length} probes), ${notShot.length} not shot`);
for (const [g, l] of Object.entries(faults)) console.log(g, l.length);
