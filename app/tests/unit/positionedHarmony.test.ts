/**
 * Positioned harmony (PH1, `docs/prompts/runs/curriculum-review-2026-10-05/briefs/seam-chart-positioned-harmony.md`):
 * a chord symbol's place in its bar, read by the one MusicXML position walk the tempo reader uses
 * (`score/measureWalk.ts`), and the bar as an ordered list of segments (`chartSegments`). The reviewer's six
 * cases (`docs/review/responses/bb1-bluebossa-probe.md` §3, rulings in `g6-ph-briefs-cb1.md` §2-§4):
 *
 * 1. Blue Bossa bar 16 in both identities: Dø7 at 0, G7 at 2 (beat 3);
 * 2. Insensatez bar 22: Bø7 at 0, E7 (add ♭9) at 2;
 * 3. a symbol at the bar's start is at 0;
 * 4. a bar with no new symbol carries the previous chord, and a late first symbol opens on a carried segment;
 * 5. `<backup>` and several voices cannot move a harmony; a grace or `<chord/>` note does not, a `<forward>` does;
 * 6. one-chord bars unchanged: where a bar is one written symbol at 0, its segment is today's `chartBars` entry.
 *
 * And the rulings: a harmony's `<offset>` always moves it (whatever its `sound`); every event at a different offset
 * is kept, identical restatements included; only exact duplicates at one offset merge (counted); two different
 * harmonies at one offset are a reported conflict, never resolved by part order; an ordinary bar is the time
 * signature's length, an explicit pickup (`implicit="yes"`) its notated length, an unexplained mismatch reported.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chartBars, chartSegments, parseHarmony, readHarmony, type ChartBar } from '../../src/score/harmony';
import { toMusicXml } from '../../src/score/mxl';

const REPO = join(process.cwd(), '..');
const BLUE_BOSSA = join(REPO, 'content', 'scores', 'pdmx', 'QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.mxl');
const BLUE_BOSSA_RAW = join(REPO, 'docs', 'review', 'pdmx-quarry-2026-10-05', 'xml', 'B-jazz', 'blue-bossa-QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.musicxml');
const INSENSATEZ = join(REPO, 'content', 'scores', 'pdmx', 'QmemwmomPM2tq51u1sTFEAPqdzPkwrJkuKCsMThnKqpvFW.mxl');
const BACKUP_FIXTURE = join(process.cwd(), 'tests', 'fixtures', 'scores', 'harmony', 'backup-voices.musicxml');

const sha256 = (bytes: Uint8Array | string): string => createHash('sha256').update(bytes).digest('hex');

/** A bar's segments as [text or null, start, duration, carried]. */
const brief = (bar: ChartBar | undefined): [string | null, number, number, boolean][] =>
  (bar?.segments ?? []).map((s) => [s.symbol?.text ?? null, s.start, s.duration, s.carried]);

/** The chart's view of a file: its symbols, measures and segments, with the chart's own bar count. */
function chartOf(xml: string) {
  const { symbols, measures } = readHarmony(xml);
  const measureCount = Math.max(new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size, symbols.length);
  return { symbols, measures, measureCount, ...chartSegments(symbols, measures, measureCount) };
}

/** One part, divisions 1; `bars[i]` is the content of bar i + 1. */
function score(bars: string[], { beats = 4, beatType = 4, implicitFirst = false } = {}): string {
  const measures = bars.map((body, i) => {
    const attributes = i === 0 ? `<attributes><divisions>1</divisions><time><beats>${String(beats)}</beats><beat-type>${String(beatType)}</beat-type></time></attributes>` : '';
    const number = implicitFirst ? i : i + 1;
    return `<measure number="${String(number)}"${implicitFirst && i === 0 ? ' implicit="yes"' : ''}>${attributes}${body}</measure>`;
  });
  return `<score-partwise><part-list><score-part id="P1"/></part-list><part id="P1">${measures.join('')}</part></score-partwise>`;
}
const note = (duration: number, extra = ''): string => `<note>${extra}<pitch><step>C</step><octave>4</octave></pitch><duration>${String(duration)}</duration></note>`;
const chord = (root: string, kind = 'major', inner = ''): string => `<harmony><root><root-step>${root}</root-step></root><kind>${kind}</kind>${inner}</harmony>`;

describe('the reviewer’s six cases', () => {
  it('1. Blue Bossa bar 16, both identities: Dø7 at 0, G7 at 2; segments Dø7 [0, 2) and G7 [2, 4)', () => {
    const committedBytes = new Uint8Array(readFileSync(BLUE_BOSSA));
    // The raw shape as the quarry dumped it (`<offset>4</offset>`, no sound attribute, divisions 2, before the
    // notes); its committed blob, line endings normalised, is the sha the brief cites.
    const rawText = readFileSync(BLUE_BOSSA_RAW, 'utf8');
    expect({ committed: sha256(committedBytes), raw: sha256(rawText.replace(/\r\n/g, '\n')) }).toEqual({
      committed: 'b2a12ede629b50ecb134e55e321a0539bdf961fbba9c29a3e3065c0f1857b777',
      raw: '3c69fe53f83d8b51a2a928fc48b7903501bca94a059a881fc20a0d921f903a33',
    });
    for (const xml of [toMusicXml(committedBytes), rawText]) {
      const chart = chartOf(xml);
      expect(chart.symbols.filter((s) => s.measure === 16).map((s) => [s.text, s.root, s.offset])).toEqual([
        ['Dmi7b5', 2, 0],
        ['G7', 7, 2],
      ]);
      expect(brief(chart.bars[15])).toEqual([
        ['Dmi7b5', 0, 2, false],
        ['G7', 2, 2, false],
      ]);
      expect(chart.bars[15]?.length).toBe(4);
    }
  });

  it('2. Insensatez bar 22: Bø7 at 0, E7 (add ♭9) at 2, the second half of a 4/4 bar', () => {
    const bytes = new Uint8Array(readFileSync(INSENSATEZ));
    expect(sha256(bytes)).toBe('897e4e99c9a18ae69dd95844d126b67e1fe77bd5b0cf11336d74668bea6783f0');
    const chart = chartOf(toMusicXml(bytes));
    const bar22 = chart.symbols.filter((s) => s.measure === 22);
    expect(bar22.map((s) => [s.text, s.offset])).toEqual([
      ['Bmi7b5', 0],
      ['E7', 2],
    ]);
    // E7 (add ♭9): E G♯ B D and F.
    expect(bar22[1]?.pitchClasses).toEqual([4, 8, 11, 2, 5]);
    expect(brief(chart.bars[21])).toEqual([
      ['Bmi7b5', 0, 2, false],
      ['E7', 2, 2, false],
    ]);
  });

  it('3. a symbol at the bar’s start is at 0, before or after a note-less attributes block', () => {
    const chart = chartOf(score([`${chord('C')}${note(4)}`, `${note(0, '<grace/>')}${chord('F')}${note(4)}`]));
    expect(chart.symbols.map((s) => [s.measure, s.text, s.offset])).toEqual([
      [1, 'C', 0],
      [2, 'F', 0],
    ]);
    expect(chart.bars.map(brief)).toEqual([[['C', 0, 4, false]], [['F', 0, 4, false]]]);
  });

  it('4. a bar with no new symbol carries the previous chord; a late first symbol opens on a carried segment', () => {
    const chart = chartOf(score([`${chord('C')}${note(4)}`, note(4), `${note(1)}${chord('G', 'dominant')}${note(3)}`, `${note(2)}${chord('F')}${note(2)}`]));
    expect(chart.bars.map(brief)).toEqual([
      [['C', 0, 4, false]],
      [['C', 0, 4, true]],
      [
        ['C', 0, 1, true],
        ['G7', 1, 3, false],
      ],
      [
        ['G7', 0, 2, true],
        ['F', 2, 2, false],
      ],
    ]);
    // Bar 1 with no symbol at 0 carries nothing: the chart does not wrap the last chord round to the top.
    const late = chartOf(score([`${note(2)}${chord('D', 'minor')}${note(2)}`, `${chord('G')}${note(4)}`]));
    expect(brief(late.bars[0])).toEqual([
      [null, 0, 2, true],
      ['Dm', 2, 2, false],
    ]);
  });

  it('5. <backup> and several voices cannot move a harmony; grace and <chord/> notes do not, <forward> does', () => {
    const chart = chartOf(readFileSync(BACKUP_FIXTURE, 'utf8'));
    expect(chart.symbols.map((s) => [s.measure, s.text, s.offset])).toEqual([
      [1, 'G7', 2],
      [2, 'Am', 1],
      [2, 'Dm', 3],
      [3, 'F', 1],
      [3, 'C', 2],
    ]);
    // The fixture's three bars (the chart's own count is at least the symbol count, so it draws two more).
    expect(chart.bars.slice(0, 3).map(brief)).toEqual([
      [
        [null, 0, 2, true],
        ['G7', 2, 2, false],
      ],
      [
        ['G7', 0, 1, true],
        ['Am', 1, 2, false],
        ['Dm', 3, 1, false],
      ],
      [
        ['Dm', 0, 1, true],
        ['F', 1, 1, false],
        ['C', 2, 2, false],
      ],
    ]);
  });

  describe('6. one-chord bars unchanged, over every committed score with harmony', () => {
    const roots = [join(REPO, 'content', 'scores', 'pdmx'), join(REPO, 'content', 'scores', 'imported')];
    const files: string[] = [];
    const list = (dir: string): void => {
      if (!existsSync(dir)) return;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) list(path);
        else if (/\.(mxl|musicxml|xml)$/i.test(entry.name)) files.push(path);
      }
    };
    roots.forEach(list);

    it('every bar that is one written symbol at 0 shows today’s chartBars entry; the symbol list is today’s plus an offset', () => {
      expect(files.length).toBeGreaterThan(500);
      let withHarmony = 0;
      let oneChordBars = 0;
      const changed: string[] = [];
      for (const path of files) {
        const xml = toMusicXml(new Uint8Array(readFileSync(path)));
        if (!xml.includes('<harmony')) continue;
        const chart = chartOf(xml);
        if (chart.symbols.length === 0) continue;
        withHarmony += 1;
        const today = chartBars(chart.symbols, chart.measureCount);
        chart.bars.forEach((bar, i) => {
          const [only, ...rest] = bar.segments;
          // A conflict (two different harmonies at 0) is not a one-chord bar: the census lists each.
          if (!only || rest.length > 0 || only.carried || only.start !== 0 || only.conflict) return;
          oneChordBars += 1;
          const was = today[i];
          const same = was && only.symbol && was.text === only.symbol.text && was.root === only.symbol.root && was.bass === only.symbol.bass && was.pitchClasses.join() === only.symbol.pitchClasses.join();
          if (!same) changed.push(`${path} bar ${String(i + 1)}: ${String(was?.text)} -> ${String(only.symbol?.text)}`);
        });
      }
      expect(changed).toEqual([]);
      expect(withHarmony).toBeGreaterThan(90);
      expect(oneChordBars).toBeGreaterThan(1000);
    });
  });
});

describe('the rulings', () => {
  it('a harmony’s <offset> moves it whatever its sound attribute; a direction’s rule is the tempo reader’s own', () => {
    const offsets = (attribute: string) =>
      parseHarmony(score([`${chord('C')}${chord('G', 'dominant', `<offset${attribute}>2</offset>`)}${note(4)}`])).map((s) => s.offset);
    expect({ none: offsets(''), no: offsets(' sound="no"'), yes: offsets(' sound="yes"') }).toEqual({ none: [0, 2], no: [0, 2], yes: [0, 2] });
  });

  it('keeps every event at a different offset, an identical restatement included', () => {
    const chart = chartOf(score([`${chord('C')}${note(2)}${chord('C')}${note(2)}`]));
    expect(brief(chart.bars[0])).toEqual([
      ['C', 0, 2, false],
      ['C', 2, 2, false],
    ]);
    expect(chart.report.merged).toEqual([]);
  });

  it('merges only an exact duplicate at one offset, and counts it; two different harmonies there are a conflict', () => {
    const twoParts = (second: string): string =>
      '<score-partwise><part-list><score-part id="P1"/><score-part id="P2"/></part-list>' +
      `<part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${chord('C')}${note(4)}</measure></part>` +
      `<part id="P2"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${second}${note(4)}</measure></part>` +
      '</score-partwise>';
    const same = chartOf(twoParts(chord('C')));
    expect(brief(same.bars[0])).toEqual([['C', 0, 4, false]]);
    expect(same.report.merged.map((s) => [s.measure, s.offset, s.text])).toEqual([[1, 0, 'C']]);
    expect(same.report.conflicts).toEqual([]);

    const different = chartOf(twoParts(chord('A', 'minor')));
    expect(different.report.conflicts.map((c) => [c.measure, c.offset, c.symbols.map((s) => s.text)])).toEqual([[1, 0, ['C', 'Am']]]);
    // Not resolved by part order: the segment names no harmony and carries both.
    const [segment] = different.bars[0]?.segments ?? [];
    expect({ symbol: segment?.symbol ?? null, conflict: segment?.conflict?.map((s) => s.text) }).toEqual({ symbol: null, conflict: ['C', 'Am'] });
  });

  it('bar length: an ordinary bar is the time signature’s, an explicit pickup its notated length, a mismatch reported', () => {
    const pickup = chartOf(score([`${chord('G')}${note(1)}`, `${chord('C')}${note(3)}`, note(2)], { beats: 3, implicitFirst: true }));
    expect(pickup.measures.map((m) => [m.measure, m.status, m.nominal, m.walked, m.length])).toEqual([
      [0, 'incomplete', 3, 1, 1],
      [1, 'full', 3, 3, 3],
      [2, 'mismatch', 3, 2, 3],
    ]);
    const sixEight = chartOf(score([`${chord('C')}${note(3)}`], { beats: 6, beatType: 8 }));
    expect(sixEight.measures.map((m) => [m.status, m.nominal, m.length])).toEqual([['full', 3, 3]]);
    // A short first bar with no implicit is an anacrusis by notation (music21's padAsAnacrusis): its notated
    // length. A short bar later, or an overfull one, is a reported mismatch, as long as the longer of the two.
    const unflagged = chartOf(score([`${chord('G')}${note(1)}`, note(4), `${note(1)}${chord('F')}${note(5)}`, note(2), chord('C')]));
    expect(unflagged.measures.map((m) => [m.status, m.walked, m.length])).toEqual([
      ['pickup', 1, 1],
      ['full', 4, 4],
      ['mismatch', 6, 6],
      ['mismatch', 2, 4],
      ['empty', 0, 4],
    ]);
    expect(brief(unflagged.bars[2])).toEqual([
      ['G', 0, 1, true],
      ['F', 1, 5, false],
    ]);
  });

  it('a position outside its bar gets no segment and is never clamped: it is what the bar at that barline carries', () => {
    const early = chartOf(score([`${chord('C')}${note(4)}`, `${chord('G', 'dominant', '<offset>-1</offset>')}${note(2)}${chord('A', 'minor')}${note(2)}`]));
    expect(early.symbols.map((s) => [s.measure, s.text, s.offset])).toEqual([
      [1, 'C', 0],
      [2, 'G7', -1],
      [2, 'Am', 2],
    ]);
    expect(brief(early.bars[1])).toEqual([
      ['G7', 0, 2, true],
      ['Am', 2, 2, false],
    ]);
    const late = chartOf(score([`${chord('C')}${note(4)}${chord('F', 'major', '<offset>0</offset>')}`, `${note(2)}${chord('G')}${note(2)}`]));
    expect(late.symbols.map((s) => [s.measure, s.text, s.offset])).toEqual([
      [1, 'C', 0],
      [1, 'F', 4],
      [2, 'G', 2],
    ]);
    expect([brief(late.bars[0]), brief(late.bars[1])]).toEqual([
      [['C', 0, 4, false]],
      [
        ['F', 0, 2, true],
        ['G', 2, 2, false],
      ],
    ]);
    expect(late.report.outside.map((o) => [o.symbol.text, o.symbol.offset, o.length])).toEqual([['F', 4, 4]]);
    expect(early.report.outside.map((o) => [o.symbol.text, o.symbol.offset, o.length])).toEqual([['G7', -1, 4]]);
  });
});
