// U113: the probe's JSON per cell, made into the table, the refuting tests, the rules'
// consequences and the cross-check against the pages that asked each smaller count (not for the
// suite).
//   node scripts-u113-table.mjs <out dir> <grid> [<other probe output>...]
// Each input is a probe folder or a kept .jsonl. The grid holds the 24 cells (Bars 4, 6, 8); the
// others (Bars 3, 5, 7 and 1, 2) are read only for the cross-check.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, gridDir, ...otherDirs] = process.argv.slice(2);
const MIN_STAFF_PX = 22;
/** The reshape ladder's last rung (`mayReshape`: `c.n >= MAX_SLOTS + 2`, MAX_SLOTS 4). */
const LADDER_SPENT = 6;
const PIECES = ['five-finger', 'twinkle', 'nocturne', 'scherzo'];
const SIZES = ['342x740', '360x780'];

/** A probe folder (one JSON a cell) or a kept `.jsonl` (one cell a line). */
function load(path) {
  const cells = new Map();
  const all = path.endsWith('.jsonl')
    ? readFileSync(path, 'utf8').split('\n').filter((l) => l.trim().length > 0).map((l) => JSON.parse(l))
    : readdirSync(path).filter((n) => n.endsWith('.json')).map((n) => JSON.parse(readFileSync(join(path, n), 'utf8')));
  for (const d of all) cells.set(`${d.cell.piece}|${d.cell.size}|${String(d.cell.bars)}`, d);
  return cells;
}
const grid = load(gridDir);
/** Every page opened, by piece, viewport and the count it asked. */
const pages = new Map(grid);
for (const dir of otherDirs) for (const [k, v] of load(dir)) pages.set(k, v);

const r1 = (x) => (x === null || x === undefined ? '—' : String(Math.round(x * 10) / 10));
const pct = (x) => `${String(Math.round((x / MIN_STAFF_PX) * 1000) / 10)} %`;
const clears = (c) => c !== undefined && c !== null && c.staffPx >= MIN_STAFF_PX;
const oneBased = (bars) => {
  const [a, b = a] = bars.split('-').map(Number);
  return a === b ? `${String(a + 1)}` : `${String(a + 1)}–${String(b + 1)}`;
};
const rowsOf = (g) => g.rows.map((r) => `${oneBased(r.bars)}${r.ahead ? ' grey' : ''}`).join(' / ');
/** The brief's refuting test, literally: more systems in view, or a look-ahead row the other lacks. */
const moreLiteral = (alt, base) => alt.systems > base.systems || (alt.ahead && !base.ahead);
/** Dominance: no part of the look-ahead poorer, and one part richer. */
const moreDominant = (alt, base) =>
  alt.systems >= base.systems && (alt.ahead || !base.ahead) && (alt.systems > base.systems || (alt.ahead && !base.ahead));
/** Rows of music on the stage at rest: the window's systems and the greyed row. */
const inView = (c) => c.systems + (c.ahead ? 1 : 0);
const lookAheadWords = (c) => `${String(c.systems)} sys${c.ahead ? ' + grey row' : ''}`;

/** Rule B: from Rule A's pick, one bar fewer at a time while the smaller count clears the floor and has more look-ahead. */
function ruleB(cands, from, more) {
  const at = (s) => cands.find((c) => c.shown === s);
  let pick = at(from);
  for (let s = from - 1; s >= 1 && pick; s -= 1) {
    const c = at(s);
    if (!clears(c) || !more(c, pick)) break;
    pick = c;
  }
  return pick;
}

const rows = [];
const held = { userZoom: new Set(), readAhead: new Set(), lookAhead: new Set(), lookAheadKey: new Set(), frozen: new Set(), pending: new Set(), settled: new Set(), firstRowFrom: new Set(), settings: new Set(), arrangement: new Set(), stage: {}, zoom: {} };
const observations = [];
for (const piece of PIECES) {
  for (const size of SIZES) {
    for (const bars of [4, 6, 8]) {
      const d = grid.get(`${piece}|${size}|${String(bars)}`);
      if (!d) {
        rows.push({ piece, size, bars, missing: true });
        continue;
      }
      const f = d.fit;
      const g = d.glass;
      const cands = f.priced?.candidates ?? [];
      const at = (shown) => cands.find((c) => c.shown === shown);
      held.userZoom.add(f.userZoom);
      held.readAhead.add(f.readAhead);
      held.lookAhead.add(f.lookAhead);
      held.lookAheadKey.add(String(d.storage.lookAhead));
      held.frozen.add(String(f.frozen));
      held.pending.add(f.sheets?.pending);
      held.settled.add(g.settled);
      held.firstRowFrom.add(f.priced?.rows?.[0]?.from);
      held.settings.add(d.storage.settings?.replace(/"barsPerWindow":\d/, '"barsPerWindow":N'));
      held.arrangement.add(f.priced?.arrangement);
      (held.stage[size] ??= new Set()).add(`${String(g.stage.width)}×${String(g.stage.height)}`);
      (held.zoom[`${piece} ${size}`] ??= new Set()).add(f.zoom);
      // The count the pricing starts from: the asked count, or the piece's length if shorter (`wanted`).
      const wanted = Math.min(f.barsAsked, f.sourceMeasureCount);
      const asked = at(wanted);
      const drawn = at(f.barsShown);
      const alt = at(wanted - 1);
      const reserved = f.slotCount > f.systemsPerWindow;
      const ladder = f.shapeChanges?.n ?? 0;
      const where = `${piece} ${size} Bars ${String(bars)}`;
      if (drawn?.ahead !== reserved) {
        observations.push(
          `${where}: the drawn count's read-out says ${drawn?.ahead ? 'a' : 'no'} greyed row, the drawn shape ${reserved ? 'has one' : 'has none'} (slots ${String(f.slotCount)}, systems ${String(f.systemsPerWindow)}); the reshape ladder is at ${String(ladder)}${ladder >= LADDER_SPENT ? ', spent: the shape on the glass is the one the ladder stopped on, not the last pricing pass\'s' : ''}`,
        );
      }
      if (drawn && g.staffPx !== null && Math.abs(drawn.staffPx - g.staffPx) > 0.3) {
        observations.push(`${where}: the drawn count priced at ${r1(drawn.staffPx)} px, the five-line staff on the glass ${r1(g.staffPx)} px`);
      }
      const aheadOnGlass = g.rows.some((r) => r.ahead);
      if (aheadOnGlass !== reserved) observations.push(`${where}: a greyed row on the glass ${String(aheadOnGlass)}, reserved ${String(reserved)}`);
      const literal = clears(asked) && clears(alt) && moreLiteral(alt, asked);
      const dominant = clears(asked) && clears(alt) && moreDominant(alt, asked);
      const bLiteral = ruleB(cands, f.barsShown, moreLiteral);
      const bDominant = ruleB(cands, f.barsShown, moreDominant);
      const bInView = ruleB(cands, f.barsShown, (a, b) => inView(a) > inView(b));
      rows.push({
        piece,
        size,
        stage: `${String(g.stage.width)}×${String(g.stage.height)}`,
        bars,
        barsAsked: f.barsAsked,
        barsShown: f.barsShown,
        pieceBars: f.sourceMeasureCount,
        wanted,
        askedStaff: asked?.staffPx ?? null,
        askedMarginPx: asked ? Math.round((asked.staffPx - MIN_STAFF_PX) * 10) / 10 : null,
        askedMarginPct: asked ? pct(asked.staffPx - MIN_STAFF_PX) : '—',
        drawnStaff: drawn?.staffPx ?? null,
        glassStaff: g.staffPx,
        systems: f.systemsPerWindow,
        slots: f.slotCount,
        aheadState: f.ahead,
        rowsOnGlass: rowsOf(g),
        freeBelow: g.freeBelow,
        rowPx: f.rowPx === null ? null : Math.round(f.rowPx),
        why: g.windowWhy,
        sheets: f.sheets?.loaded,
        zoom: f.zoom,
        ladder,
        asked: asked ?? null,
        alt: alt ?? null,
        literal,
        dominant,
        ruleA: f.barsShown,
        ruleBLiteral: bLiteral?.shown ?? null,
        ruleBDominant: bDominant?.shown ?? null,
        ruleBInView: bInView?.shown ?? null,
        candidates: cands,
      });
    }
  }
}

// The cross-check: every count priced in a cell against the page that asked that count on the same
// viewport, where that page drew it. That page's shape was priced for the sheets it needs
// (`sheetsNeeded` prices with every sheet a stage can hold), so it also answers whether the sheets
// a long piece has loaded capped a candidate (`mostSlots`).
const cross = [];
let compared = 0;
let sameShape = 0;
let sameStaff = 0;
for (const r of rows) {
  if (r.missing) continue;
  const diffs = [];
  for (const c of r.candidates) {
    if (c.shown === r.barsShown) continue;
    const page = pages.get(`${r.piece}|${r.size}|${String(c.shown)}`);
    if (!page) {
      diffs.push(`${String(c.shown)}: no page asked it`);
      continue;
    }
    const pf = page.fit;
    if (pf.barsShown !== c.shown) continue; // that page drew fewer (the floor): the candidate is under it too
    const pc = (pf.priced?.candidates ?? []).find((x) => x.shown === c.shown);
    const pageRow = pf.slotCount > pf.systemsPerWindow;
    compared += 1;
    const shapeSame = pf.systemsPerWindow === c.systems && pageRow === c.ahead;
    if (shapeSame) sameShape += 1;
    const staffSame = pc !== undefined && Math.abs(pc.staffPx - c.staffPx) <= 0.1;
    if (staffSame) sameStaff += 1;
    if (!shapeSame || !staffSame) {
      diffs.push(
        `${String(c.shown)}: priced here ${lookAheadWords(c)}, ${r1(c.staffPx)} px; asked on its own ${lookAheadWords({ systems: pf.systemsPerWindow, ahead: pageRow })}, ${r1(pc?.staffPx)} px (zoom ${String(r.zoom)} here, ${String(pf.zoom)} there; ladder ${String(pf.shapeChanges?.n ?? 0)} there)`,
      );
    }
  }
  cross.push(`- ${r.piece} ${r.size} Bars ${String(r.bars)}: ${diffs.length === 0 ? 'every smaller count as drawn when asked on its own' : diffs.join(' | ')}`);
}

const out = [];
out.push('# U113 — the measured table');
out.push('');
out.push('Generated by `scripts-u113-table.mjs` from the probe\'s JSON (`probe-grid.jsonl`, `probe-other.jsonl`). Every figure is this machine\'s renderer at the stated viewport, upright, at rest, the window at the piece\'s opening; nothing here is a general figure. Staff heights are the five-line staff, top line to bottom line, in CSS px. Margins are against `MIN_STAFF_PX` (22). "sys" is `systemsPerWindow`; "grey row" is a candidate\'s `ahead` read-out (`debugFit().priced.candidates[].ahead`, U113: a greyed look-ahead row below the window, priced from that candidate\'s own geometry in the same pass).');
out.push('');
out.push('## Settings held fixed (read back from every cell)');
out.push('');
out.push(`- Size, \`debugFit().userZoom\`: ${[...held.userZoom].join(', ')} (100 %)`);
out.push(`- arrangement, \`debugFit().readAhead\`: ${[...held.readAhead].join(', ')} (upright slots); \`priced.arrangement\`: ${[...held.arrangement].join(', ')}`);
out.push(`- look-ahead treatment, \`debugFit().lookAhead\`: ${[...held.lookAhead].join(', ')}; \`localStorage['pianopath.lookAhead']\`: ${[...held.lookAheadKey].join(', ')} (so the default)`);
out.push(`- \`localStorage['pianopath.settings']\`: ${[...held.settings].join(' | ')}; every other practice setting at \`DEFAULT_SETTINGS\` (fingering and chord symbols drawn, layout \`window\`, zoom 1); the storage state otherwise holds only the skipped setup tour and \`pianopath.firstSight\` \`["*"]\``);
out.push(`- the stage box, by viewport: ${Object.entries(held.stage).map(([k, v]) => `${k} → ${[...v].join(', ')}`).join('; ')}`);
out.push(`- at rest: \`data-settled\` ${[...held.settled].join(', ')}; \`sheets.pending\` ${[...held.pending].join(', ')}; \`frozen\` ${[...held.frozen].join(', ')}; no run started; the window's first row from bar index ${[...held.firstRowFrom].join(', ')} (the cursor at the opening, step 0)`);
out.push(`- the engraving zoom each piece settled at (not set; recorded): ${Object.entries(held.zoom).map(([k, v]) => `${k} ${[...v].join('/')}`).join('; ')}`);
out.push('- one fresh page per cell, unthrottled, Chromium from the repo\'s Playwright config, the production build served by `vite preview`');
out.push('');
out.push('## The table (24 cells)');
out.push('');
out.push('| piece | viewport | stage | barsAsked | barsShown | staff at the requested count (px) | floor margin at the requested count | staff drawn, priced (px) | staff on the glass (px) | systemsPerWindow | look-ahead state `ahead` | rows on the glass, top to bottom | free below / reserved row (px) | why | sheets loaded | reshape ladder | requested − 1: sys, staff (px), grey row | main hypothesis, literal | main hypothesis, dominance |');
out.push('| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | ---: | ---: | --- | --- | --- |');
for (const r of rows) {
  if (r.missing) {
    out.push(`| ${r.piece} | ${r.size} | MISSING | ${String(r.bars)} |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |`);
    continue;
  }
  const alt = r.alt ? `${String(r.alt.systems)}, ${r1(r.alt.staffPx)}${r.alt.staffPx < MIN_STAFF_PX ? ' (under)' : ''}, ${r.alt.ahead ? 'yes' : 'no'}` : '—';
  const req = r.wanted < r.barsAsked ? ` (the piece's ${String(r.pieceBars)})` : '';
  out.push(
    `| ${r.piece} | ${r.size} | ${r.stage} | ${String(r.barsAsked)} | ${String(r.barsShown)} | ${r1(r.askedStaff)}${req} | ${r1(r.askedMarginPx)} px, ${r.askedMarginPct} | ${r1(r.drawnStaff)} | ${r1(r.glassStaff)} | ${String(r.systems)} | ${r.aheadState} | ${r.rowsOnGlass} | ${String(r.freeBelow)} / ${String(r.rowPx)} | ${r.why ?? (r.wanted < r.barsAsked ? 'whole piece' : '—')} | ${String(r.sheets)} | ${String(r.ladder)}${r.ladder >= LADDER_SPENT ? ' spent' : ''} | ${alt} | ${r.literal ? '**holds**' : 'no'} | ${r.dominant ? '**holds**' : 'no'} |`,
  );
}
out.push('');
out.push('## Every count priced in each cell\'s one pass (`candidates`, the requested count held fixed): shown → sys, staff px, grey row');
out.push('');
for (const r of rows) {
  if (r.missing) continue;
  out.push(`- ${r.piece} ${r.size} Bars ${String(r.bars)}: ${r.candidates.map((c) => `${String(c.shown)} → ${String(c.systems)}, ${r1(c.staffPx)}${c.staffPx < MIN_STAFF_PX ? ' (under)' : ''}, ${c.ahead ? 'yes' : 'no'}`).join('; ')}`);
}
out.push('');
out.push('## Observations the per-cell comparison raised (the drawn count against the chooser and the glass)');
out.push('');
out.push(...(observations.length === 0 ? ['- none'] : observations.map((o) => `- ${o}`)));
out.push('');
out.push('## The three rules\' mechanical consequences (what each would show; "→" marks a change from Rule A)');
out.push('');
out.push('| piece | viewport | Bars | Rule A, today | Rule B, "poorer" read literally | Rule B, "poorer" read as dominance | Rule B, "poorer" read as fewer rows in view | Rule C |');
out.push('| --- | --- | ---: | --- | --- | --- | --- | --- |');
for (const r of rows) {
  if (r.missing) continue;
  const cand = (s) => r.candidates.find((c) => c.shown === s);
  const words = (s) => (s === null ? '—' : `${s === r.ruleA ? '' : '→ '}${String(s)} (${lookAheadWords(cand(s))}, ${r1(cand(s).staffPx)} px)`);
  let c;
  if (r.barsShown < r.wanted) c = `${String(r.barsShown)}: the floor already binds, Rule C does not apply`;
  else if (r.literal) c = `→ ${String(r.alt.shown)} only if f > ${r.askedMarginPct} of the floor and the extra system counts though the grey row is lost; else ${String(r.wanted)}`;
  else c = `${String(r.barsShown)}: no one-bar-fewer count buys look-ahead`;
  out.push(`| ${r.piece} | ${r.size} | ${String(r.bars)} | ${words(r.ruleA)} | ${words(r.ruleBLiteral)} | ${words(r.ruleBDominant)} | ${words(r.ruleBInView)} | ${c} |`);
}
out.push('');
out.push('## Cross-check: each smaller count against the page that asked it (Size 100 %)');
out.push('');
out.push(`Of ${String(compared)} candidate entries whose count a page asked and drew: ${String(sameShape)} with the same systems and grey row as that page drew, ${String(sameStaff)} with the same staff within 0.1 px.`);
out.push('');
out.push(...cross);
out.push('');

writeFileSync(join(outDir, 'table.md'), `${out.join('\n')}\n`);

// The entry's table: the brief's columns, each its own.
const entry = [];
entry.push('| piece | viewport → stage | barsAsked | barsShown | staff at the requested count (px) | floor margin (px) | floor margin (% of 22) | systemsPerWindow | look-ahead state `ahead` | rows on the glass | requested − 1: shown | requested − 1: systems | requested − 1: staff (px) | requested − 1: margin (px) | requested − 1: grey row | main hypothesis (literal) |');
entry.push('| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | --- | --- |');
for (const r of rows) {
  if (r.missing) continue;
  const note = r.wanted < r.barsAsked ? ` (at ${String(r.wanted)}: the piece's length)` : '';
  const a = r.alt;
  entry.push(
    `| ${r.piece} | ${r.size} → ${r.stage} | ${String(r.barsAsked)} | ${String(r.barsShown)} | ${r1(r.askedStaff)}${note} | ${r1(r.askedMarginPx)} | ${r.askedMarginPct.replace(' %', '')} | ${String(r.systems)} | ${r.aheadState} | ${r.rowsOnGlass} | ${a ? String(a.shown) : '—'} | ${a ? String(a.systems) : '—'} | ${a ? r1(a.staffPx) : '—'} | ${a ? r1(Math.round((a.staffPx - MIN_STAFF_PX) * 10) / 10) : '—'} | ${a ? (a.ahead ? 'yes' : 'no') : '—'} | ${r.literal ? '**holds**' : 'no'} |`,
  );
}
writeFileSync(join(outDir, 'entry-table.md'), `${entry.join('\n')}\n`);
console.log(
  `cells ${String(rows.filter((r) => !r.missing).length)}, missing ${String(rows.filter((r) => r.missing).length)}, literal ${String(rows.filter((r) => r.literal).length)}, dominance ${String(rows.filter((r) => r.dominant).length)}, observations ${String(observations.length)}, cross shape ${String(sameShape)}/${String(compared)} staff ${String(sameStaff)}/${String(compared)}`,
);
