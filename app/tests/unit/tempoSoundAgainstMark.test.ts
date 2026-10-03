/**
 * Which tempo is authoritative (X40, Entry 173; the brief `docs/prompts/tasks/X40-which-tempo-is-authoritative.md`
 * and the reviewer's approval in it, `docs/review/responses/questions-bd7d303e.md` §3): every built MuseTrainer and
 * kern score is read through the app's own unzip (`toMusicXml`) and reader (`tempoEvents`), and a **finding** is an
 * event the reader plays from a `<sound tempo>` (`from: 'sound'`) that has a printed metronome mark beside it
 * (`mark`) and disagrees with that mark by more than R: the larger of `bpm` and `mark.quarters` over the smaller.
 *
 * The findings are pinned below in both directions: a new finding fails, and a pinned finding that no longer holds
 * fails, so a repaired file or a changed reader has to say so here. What plays is the reader's (`tempoFromXml.ts`,
 * `resolve`), and this file only checks it. Since X42 (Entry 185; the reviewer's rule, `docs/review/responses/81d9e4af.md`
 * §1–§2) a sound that agrees with the first printed mark at its position — the same statement, differing by no more
 * than the writer's serialization noise (`SERIALIZATION_TOLERANCE`) — wins over a sibling sound there that does not:
 * Maple Leaf Rag's two words-only 120s give way to the 100 beside their printed quarter = 100, and Satie's opening 60
 * to the 76.0002 beside its printed quarter = ca. 76, so those three of X40's fifteen findings are gone. The twelve
 * left, on two rows, are each a lone sound against the mark beside it: no sibling agrees, and a printed mark does not
 * outrank a sound (the same ruling declines that).
 *
 * **Never vacuous.** The corpus half fails, and never skips, when the built folder is missing, when *Maple Leaf
 * Rag*'s MuseTrainer file is absent, or when the number of files read differs from the catalogue's MuseTrainer and
 * kern rows that have a built file in the flavour under test. The Joplin kern rows (CC BY-NC-SA) are tagged
 * `nc-personal-build` and a MuseTrainer row whose composition is not free `personal-build`: the strict flavour
 * (`build.py --no-personal`) makes each a placeholder with no file, while the Chopin first editions (CC BY 4.0)
 * build in both. A pinned finding on a personal row may lack its file only in the strict flavour; in the personal
 * flavour it must be read and must hold. `PIANOPATH_TEMPO_CHECK_CONTENT` names another built folder (a strict
 * build's `--out`); the default is the app's `public/content`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toMusicXml } from '../../src/score/mxl';
import { tempoEvents, type TempoEvent } from '../../src/score/tempoFromXml';

/**
 * R: the largest ratio of a sound to the printed mark beside it that is not a contradiction. Below 1.2, so that
 * Maple Leaf's 120 against its printed quarter = 100 is one. 1.1, the brief's figure, because nothing in the corpus
 * between 1.1 and 1.2 is a pair that agrees (`runs/X40/summary.txt`, every unequal pair the reader resolves): the
 * pairs under 1.1 are MuseScore's rounding of a tempo it stores per second (79.9998 against 80) and Liszt's
 * *La Campanella*, whose sounds sit 3 below its printed marks (88 against 91, at most 1.052); the pairs between 1.1
 * and 1.2 are one edition's, `song.beautiful.g-minor-bach.alt`, whose page prints quarter = 80 where it sounds 90
 * and 95. A learner reading 80 and hearing 90 meets the contradiction this check exists to show, so R is not widened
 * to excuse it; whether that edition means its sounds (a rubato written as tempo changes, its printed text left at
 * 80) is put to the reviewer, and its entries are pinned below.
 */
const R = 1.1;

interface Finding {
  measure: number;
  offset: number;
  sound: number;
  mark: number;
}

/** The findings in one file's events: a sound the reader plays that disagrees with the printed mark at its position by more than `r`. */
function contradictions(events: readonly TempoEvent[], r = R): Finding[] {
  return events.flatMap((event) => {
    if (event.from !== 'sound' || !event.mark) return [];
    const { bpm } = event;
    const mark = event.mark.quarters;
    return Math.max(bpm, mark) / Math.min(bpm, mark) > r ? [{ measure: event.measure, offset: event.offset, sound: bpm, mark }] : [];
  });
}

interface Pinned extends Finding {
  /** The catalogue row. */
  id: string;
  /** The lane that recorded it, and why the file says two things. */
  why: string;
}

const TOCCATA =
  'X40: a printed quarter = 10 where the file sounds 20 or 36 (the opening’s pauses written, it appears, as tempo changes; the printed number does not follow its sound)';
const G_MINOR =
  'X40: a printed quarter = 80 where the file sounds 90 or 95 (a rubato written, it appears, as tempo changes, its printed text left at 80); a personal-build row';

/**
 * Every finding on the built corpus: 12 on 2 MuseTrainer rows (`bach-toccata-fugue-bwv565` and `g-minor-bach.alt`), none
 * on a kern row. X40's table (`docs/prompts/runs/X40/`) had 15 on 4; X42's reader (`docs/prompts/runs/X42/`) resolved
 * Maple Leaf Rag's two (bar 1's "Tempo Di Marcia" and bar 51's "TRIO", 120 against quarter = 100, now 100) and
 * Satie's opening (60 against quarter = ca. 76, now 76.0002).
 */
const PINNED: readonly Pinned[] = [
  { id: 'song.classical.bach-toccata-fugue-bwv565', measure: 0, offset: 0.25, sound: 20, mark: 10, why: TOCCATA },
  { id: 'song.classical.bach-toccata-fugue-bwv565', measure: 0, offset: 1.125, sound: 36, mark: 10, why: TOCCATA },
  { id: 'song.classical.bach-toccata-fugue-bwv565', measure: 0, offset: 2.375, sound: 20, mark: 10, why: TOCCATA },
  { id: 'song.classical.bach-toccata-fugue-bwv565', measure: 0, offset: 3.5, sound: 36, mark: 10, why: TOCCATA },
  { id: 'song.classical.bach-toccata-fugue-bwv565', measure: 1, offset: 0.25, sound: 20, mark: 10, why: TOCCATA },
  { id: 'song.classical.bach-toccata-fugue-bwv565', measure: 1, offset: 1.125, sound: 36, mark: 10, why: TOCCATA },
  { id: 'song.classical.bach-toccata-fugue-bwv565', measure: 2, offset: 4, sound: 20, mark: 10, why: `${TOCCATA}; at the bar’s end, so nothing sounds at it` },
  { id: 'song.beautiful.g-minor-bach.alt', measure: 15, offset: 3, sound: 90, mark: 80, why: G_MINOR },
  { id: 'song.beautiful.g-minor-bach.alt', measure: 28, offset: 0, sound: 90, mark: 80, why: G_MINOR },
  { id: 'song.beautiful.g-minor-bach.alt', measure: 45, offset: 0, sound: 90, mark: 80, why: G_MINOR },
  { id: 'song.beautiful.g-minor-bach.alt', measure: 61, offset: 0, sound: 90, mark: 80, why: G_MINOR },
  { id: 'song.beautiful.g-minor-bach.alt', measure: 64, offset: 1, sound: 94.9998, mark: 80, why: G_MINOR },
];

const key = (id: string, finding: Finding): string =>
  `${id} @${String(finding.measure)}:${String(finding.offset)} sound ${String(finding.sound)} against mark ${String(finding.mark)}`;

// --- the rule, on files written here ------------------------------------------------------------------------------

const QUARTER = '<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><voice>1</voice><type>quarter</type></note>';
function score(opening: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${opening}${QUARTER.repeat(4)}</measure></part></score-partwise>`;
}
const markDirection = (perMinute: number, sound?: number): string =>
  `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${String(perMinute)}</per-minute></metronome></direction-type>${sound === undefined ? '' : `<sound tempo="${String(sound)}"/>`}</direction>`;
const wordsDirection = (words: string, sound: number): string =>
  `<direction placement="above"><direction-type><words>${words}</words></direction-type><sound tempo="${String(sound)}"/></direction>`;
const found = (xml: string): [number, number][] => contradictions(tempoEvents(xml)).map((f) => [f.sound, f.mark]);

describe('the rule: a sound the reader plays against the printed mark at its position', () => {
  it('a sound that agrees with its mark is no finding', () => {
    expect(found(score(markDirection(100, 100)))).toEqual([]);
  });

  it('a pair at exactly R is no finding, either way round; just beyond it is', () => {
    expect(found(score(markDirection(100, 110)))).toEqual([]);
    expect(found(score(markDirection(110, 100)))).toEqual([]);
    expect(found(score(markDirection(100, 111)))).toEqual([[111, 100]]);
  });

  it('a mark with no sound plays its own number and is no finding', () => {
    const events = tempoEvents(score(markDirection(100)));
    expect(events.map((e) => [e.bpm, e.from])).toEqual([[100, 'mark']]);
    expect(found(score(markDirection(100)))).toEqual([]);
  });

  it('two sounds at one position: the one the reader keeps is judged against the mark (Maple Leaf’s shape)', () => {
    // Words with MuseScore's 120, then the printed quarter = 100 with its own 100, at one place: the reader plays 100,
    // the sound that agrees with the mark (X42), and nothing contradicts the page.
    expect(found(score(wordsDirection('Tempo Di Marcia', 120) + markDirection(100, 100)))).toEqual([]);
    // The same two the other way round: the reader keeps the mark's own sound, and nothing contradicts the page.
    expect(found(score(markDirection(100, 100) + wordsDirection('Tempo Di Marcia', 120)))).toEqual([]);
  });
});

// --- the built corpus ---------------------------------------------------------------------------------------------

interface Row {
  id: string;
  file?: string;
  tags?: string[];
}

const CONTENT = process.env.PIANOPATH_TEMPO_CHECK_CONTENT ?? join(process.cwd(), 'public', 'content');
const MAPLE_LEAF = 'song.ragtime.joplin-maple-leaf-rag';
const PERSONAL_TAGS = ['nc-personal-build', 'personal-build'];

interface Corpus {
  rows: Row[];
  /** Rows whose file was read, by id. */
  read: Map<string, Finding[]>;
  missing: string[];
  personal: boolean;
  catalogue: Map<string, Row>;
}

let cached: Corpus | undefined;
function corpus(): Corpus {
  if (cached) return cached;
  const catalogPath = join(CONTENT, 'catalog.json');
  expect(existsSync(catalogPath), `${catalogPath} — run the content build first (python tools/content/build.py --offline)`).toBe(true);
  const raw = JSON.parse(readFileSync(catalogPath, 'utf8')) as Row[] | { items: Row[] };
  const all = Array.isArray(raw) ? raw : raw.items;
  const catalogue = new Map(all.map((row) => [row.id, row]));
  const rows = all.filter((row) => (row.tags ?? []).some((tag) => tag === 'musetrainer' || tag === 'kern') && row.file);
  const read = new Map<string, Finding[]>();
  const missing: string[] = [];
  for (const row of rows) {
    const path = join(CONTENT, row.file ?? '');
    if (!existsSync(path)) {
      missing.push(`${row.id}: ${path}`);
      continue;
    }
    read.set(row.id, contradictions(tempoEvents(toMusicXml(new Uint8Array(readFileSync(path))))));
  }
  const personal = rows.some((row) => (row.tags ?? []).some((tag) => PERSONAL_TAGS.includes(tag)));
  cached = { rows, read, missing, personal, catalogue };
  return cached;
}

describe('the built MuseTrainer and kern scores', () => {
  it('reads every MuseTrainer and kern row that has a built file, Maple Leaf’s among them', () => {
    const { rows, read, missing, catalogue } = corpus();
    expect(catalogue.get(MAPLE_LEAF)?.file, `${MAPLE_LEAF} has no built file in ${CONTENT}`).toBeTruthy();
    expect(read.has(MAPLE_LEAF), `${MAPLE_LEAF}'s file was not read`).toBe(true);
    expect(missing).toEqual([]);
    expect(rows.length).toBeGreaterThan(0);
    expect(read.size).toBe(rows.length);
  });

  it('finds exactly the pinned contradictions, no new one and none gone', () => {
    const { read, personal, catalogue } = corpus();
    const observed = [...read].flatMap(([id, findings]) => findings.map((finding) => key(id, finding)));
    const expected = PINNED.filter((pin) => {
      const row = catalogue.get(pin.id);
      // A pinned row missing from the catalogue is a stale pin, never excused. In the strict flavour a personal
      // row is a placeholder with no file; anywhere else its file must be read and its finding must hold.
      if (!row) return true;
      const personalRow = (row.tags ?? []).some((tag) => PERSONAL_TAGS.includes(tag));
      return !(!personal && personalRow && !row.file);
    }).map((pin) => key(pin.id, pin));
    const fresh = observed.filter((one) => !expected.includes(one));
    const stale = expected.filter((one) => !observed.includes(one));
    expect({ new: fresh, stale }).toEqual({ new: [], stale: [] });
  });
});
