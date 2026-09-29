/**
 * The tempo a MusicXML file states, read from the file itself (X3d; the X3c review's required change,
 * `docs/review/responses/b71a55ca.md`): **the one reader** the score model's tempo map is placed from
 * (`extractScoreModel`) and the import sheet's tempo line reads (`importSheet`), so what the sheet says,
 * what the Score screen's label shows, what the engine plays and counts in at, and what the measurement
 * reads are one number. Pure: a string in, plain data out; no DOM, no engraver.
 *
 * **Why not the engraver's reading.** OpenSheetMusicDisplay 2.1.2 turns a `<metronome>` into a tempo whose
 * number is its `<per-minute>` with the `<beat-unit>` and its dots ignored, lets it replace the
 * `<sound tempo>` in the same direction, reads a `<sound tempo>` standing in a bar (the form the store
 * writes) only as a start tempo where no other tempo stands anywhere, gives tempo words numbers of its own
 * ("Moderato" is 106), and makes the first tempo it finds anywhere the opening tempo (X3c's probe,
 * `docs/prompts/runs/X3c/probe-player-tempo.txt`; X3d's, `docs/prompts/runs/X3d/`). A half note = 60 in cut
 * time then played at 60 quarter notes a minute, half its tempo.
 *
 * **What it reads**, in score order, each at its measure (the measure's ordinal in its part, which is the
 * engraver's source-measure index) and its offset in quarter notes from the measure's start:
 *
 * - each `<direction>`'s `<metronome>`: its `<beat-unit>`, `<beat-unit-dot>`s and `<per-minute>`, normalised
 *   to quarter notes a minute (the per-minute times the beat unit's length in quarters; one dot × 1.5, two
 *   × 1.75). A metric modulation ("note = note", two beat units), the `<metronome-note>` form, and a mark
 *   with no readable per-minute (a number, or "c." and a number) state no tempo and are skipped;
 * - each `<sound tempo>`, a direction's or one standing in the measure. Its value is already in quarter
 *   notes a minute (MusicXML's definition) and is kept as the file writes it, fractions and all.
 *
 * A direction's `<offset>` moves it only where it says `sound="yes"` (MusicXML: an offset is otherwise
 * visual). Tempo words ("Allegro") carry no number of their own and state a tempo only through a
 * `<sound tempo>` beside them.
 *
 * **Precedence at one position.** A `<sound tempo>` is what the file says it plays, so where one stands at
 * the same measure and offset as a mark — in the same direction (MuseScore writes both, and they agree when
 * the mark is normalised) or beside it — the sound wins; a disagreement is the file's, and the sound is the
 * sounding fact. A mark alone gives its normalised number; a sound alone its own. Where several sounds (or
 * several marks) stand at one position, the first in score order (the top part, then the page) wins.
 *
 * **The opening.** The event at the first measure's start opens the piece; so does the file's first tempo
 * where **nothing sounds before it** — it stands after rests only, because the engraver hung it on the
 * first note after an opening rest (Beethoven's Fifth in the bundled edition: "Allegro con brio" after its
 * eighth rest) or after a bar of rest. No note plays at any other tempo, and the count-in counts in to that
 * first note. That event is copied to the start, and also stays where it stands, so a repeat back to it
 * plays it there. Otherwise nothing written after the start is the opening: the piece opens at the model's
 * default until the first event, which is a tempo change where it stands (an opening `<sound tempo="100">`
 * is never displaced by a mark that appears only in bar 2, and a mark after notes have sounded changes
 * their tempo rather than having set it). A pickup is no exception: an upbeat that sounds before a tempo
 * written over bar 1 plays at the default (no bundled score has that shape; `docs/prompts/runs/X3d/`).
 *
 * **The partwise form only, and that is every score the app holds** (X3e). The walk is parts around
 * measures, so a measure's ordinal is its place in its part and `<divisions>` carry from bar to bar within
 * a part. A `<score-timewise>` file (measures around parts) never reaches this reader: the import door keeps
 * it as its partwise twin (`toPartwise.ts`), because the engraver loads nothing else, and every bundled
 * score is partwise (X3e's search, `docs/prompts/runs/X3e/timewise-search.txt`). Handed timewise text, this
 * finds no measure inside a part and reads no tempo.
 *
 * **Not read:** `<sound time-only>` (which passes of a repeat a sound applies to; every pass hears it), a
 * tempo in a `<note>`'s `<play>`, and tempo marks printed only as text (E32's door reads those and writes a
 * `<sound tempo>` beside them, which this reads).
 */

/** A `<beat-unit>`'s length in quarter notes: MusicXML's note-type values. */
export const BEAT_UNIT_QUARTERS: Readonly<Record<string, number>> = {
  maxima: 32,
  long: 16,
  breve: 8,
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  '16th': 0.25,
  '32nd': 0.125,
  '64th': 1 / 16,
  '128th': 1 / 32,
  '256th': 1 / 64,
  '512th': 1 / 128,
  '1024th': 1 / 256,
};

/**
 * A metronome mark's number in quarter notes a minute: `perMinute` beats of `beatUnit` with `dots` dots.
 * `undefined` for a beat unit MusicXML does not name, a negative or fractional dot count, or no positive
 * number.
 */
export function quartersPerMinute(beatUnit: string, dots: number, perMinute: number): number | undefined {
  const length = BEAT_UNIT_QUARTERS[beatUnit];
  if (length === undefined || !Number.isInteger(dots) || dots < 0) return undefined;
  if (!Number.isFinite(perMinute) || perMinute <= 0) return undefined;
  return perMinute * length * (2 - 0.5 ** dots);
}

/** A metronome mark as the file prints it, and the quarter notes a minute it means. */
export interface TempoMark {
  /** MusicXML's `<beat-unit>`: `half`, `quarter`, `eighth`… */
  beatUnit: string;
  dots: number;
  /** The `<per-minute>` as printed, a number. */
  perMinute: number;
  /** The mark normalised to quarter notes a minute (`quartersPerMinute`). */
  quarters: number;
}

/** One tempo the file states, where it states it. */
export interface TempoEvent {
  /** The measure's ordinal in its part, from 0: the engraver's source-measure index. */
  measure: number;
  /** Quarter notes from the measure's start. */
  offset: number;
  /** Quarter notes a minute: the `<sound tempo>` standing here, else the mark's normalised number. */
  bpm: number;
  /** Where `bpm` came from. */
  from: 'sound' | 'mark';
  /** The metronome mark printed at this position, where one is: what the page shows. */
  mark?: TempoMark;
}

interface Raw {
  measure: number;
  offset: number;
  /** Score order: part, then position in the page, for "the first at a position". */
  order: number;
  sound?: number;
  mark?: TempoMark;
}

/** Tags that start with these names but are other elements: `<measure-style>`, `<direction-type>`. */
const PART = /<part(?=[\s>])[^>]*>([\s\S]*?)<\/part>/g;
const MEASURE = /<measure(?=[\s>])[^>]*>([\s\S]*?)<\/measure>/g;
/** The measure's children that move the position or state a tempo, in page order. */
const CHILD = /<(note|backup|forward|direction|attributes|sound)(?=[\s/>])([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;

function attribute(attributes: string, name: string): string | undefined {
  return new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attributes)?.slice(1).find((value) => value !== undefined);
}

/** A tempo attribute's value, when it is a positive number. */
function soundTempo(attributes: string): number | undefined {
  const raw = attribute(attributes, 'tempo');
  if (raw === undefined || raw.trim() === '') return undefined;
  const bpm = Number(raw);
  return Number.isFinite(bpm) && bpm > 0 ? bpm : undefined;
}

function childNumber(body: string, tag: string): number | undefined {
  const raw = new RegExp(`<${tag}(?=[\\s>])[^>]*>\\s*(-?[\\d.]+)\\s*</${tag}>`).exec(body)?.[1];
  const value = Number(raw);
  return raw !== undefined && Number.isFinite(value) ? value : undefined;
}

/** A direction's `<metronome>`, when it states a tempo (see the module note for what is skipped). */
function metronomeOf(direction: string): TempoMark | undefined {
  for (const [, body = ''] of direction.matchAll(/<metronome(?=[\s>])[^>]*>([\s\S]*?)<\/metronome>/g)) {
    if (/<metronome-note(?=[\s>])/.test(body)) continue;
    const units = [...body.matchAll(/<beat-unit>\s*([a-z0-9]+)\s*<\/beat-unit>/g)].map((match) => match[1] ?? '');
    if (units.length !== 1) continue;
    const printed = /<per-minute(?=[\s>])[^>]*>\s*([^<]*?)\s*<\/per-minute>/.exec(body)?.[1] ?? '';
    const number = /^(?:c(?:a)?\.?\s*)?(\d+(?:\.\d+)?)$/i.exec(printed)?.[1];
    if (number === undefined) continue;
    const beatUnit = units[0] ?? '';
    const dots = body.match(/<beat-unit-dot\s*\/>|<beat-unit-dot\s*>\s*<\/beat-unit-dot>/g)?.length ?? 0;
    const perMinute = Number(number);
    const quarters = quartersPerMinute(beatUnit, dots, perMinute);
    if (quarters === undefined) continue;
    return { beatUnit, dots, perMinute, quarters };
  }
  return undefined;
}

/** A place in the score: a measure's ordinal and quarter notes into it. */
interface Place {
  measure: number;
  offset: number;
}
const before = (a: Place, b: Place): boolean => a.measure < b.measure || (a.measure === b.measure && a.offset < b.offset);

/** Every tempo statement in the file, unresolved, in score order, and where the first note sounds. */
function rawEvents(xml: string): { raw: Raw[]; firstSound: Place | undefined } {
  const text = xml.replace(/<!--[\s\S]*?-->/g, '');
  const raw: Raw[] = [];
  let order = 0;
  let firstSound: Place | undefined;
  for (const [, part = ''] of text.matchAll(PART)) {
    let divisions = 1;
    let measure = 0;
    for (const [, body = ''] of part.matchAll(MEASURE)) {
      let position = 0;
      const at = (): number => Math.max(0, Math.round((position / divisions) * 1e6) / 1e6);
      for (const [, tag, attributes = '', inner = ''] of body.matchAll(CHILD)) {
        if (tag === 'attributes') {
          const set = childNumber(inner, 'divisions');
          if (set !== undefined && set > 0) divisions = set;
        } else if (tag === 'note') {
          // A chord's first note has already sounded at this place; a cue note is not played.
          const chord = /<chord\s*\/>|<chord\s*>/.test(inner);
          if (!chord && !/<rest(?=[\s/>])/.test(inner) && !/<cue\s*\/>/.test(inner)) {
            const here = { measure, offset: at() };
            if (!firstSound || before(here, firstSound)) firstSound = here;
          }
          if (chord || /<grace(?=[\s/>])/.test(inner)) continue;
          position += childNumber(inner, 'duration') ?? 0;
        } else if (tag === 'backup') {
          position -= childNumber(inner, 'duration') ?? 0;
        } else if (tag === 'forward') {
          position += childNumber(inner, 'duration') ?? 0;
        } else if (tag === 'sound') {
          const bpm = soundTempo(attributes);
          if (bpm !== undefined) raw.push({ measure, offset: at(), order: order++, sound: bpm });
        } else {
          // A direction: its mark and its sound, at its position (moved by an offset that sounds).
          const offsetMatch = /<offset(?=[\s>])([^>]*)>\s*(-?[\d.]+)\s*<\/offset>/.exec(inner);
          const shift = offsetMatch && attribute(offsetMatch[1] ?? '', 'sound') === 'yes' ? Number(offsetMatch[2]) : 0;
          const offset = Math.max(0, Math.round(((position + (Number.isFinite(shift) ? shift : 0)) / divisions) * 1e6) / 1e6);
          const soundTag = /<sound(?=[\s/>])([^>]*)>/.exec(inner);
          const sound = soundTag ? soundTempo(soundTag[1] ?? '') : undefined;
          const mark = metronomeOf(inner);
          if (sound !== undefined || mark !== undefined) {
            raw.push({ measure, offset, order: order++, ...(sound === undefined ? {} : { sound }), ...(mark === undefined ? {} : { mark }) });
          }
        }
      }
      measure += 1;
    }
  }
  return { raw, firstSound };
}

/** One event per position: the sound over the mark, the first of each in score order. */
function resolve(raw: readonly Raw[]): TempoEvent[] {
  const byPosition = new Map<string, Raw[]>();
  for (const one of [...raw].sort((a, b) => a.measure - b.measure || a.offset - b.offset || a.order - b.order)) {
    const key = `${String(one.measure)}:${String(one.offset)}`;
    const here = byPosition.get(key);
    if (here) here.push(one);
    else byPosition.set(key, [one]);
  }
  const events: TempoEvent[] = [];
  for (const here of byPosition.values()) {
    const first = here[0];
    if (!first) continue;
    const sound = here.find((one) => one.sound !== undefined)?.sound;
    const mark = here.find((one) => one.mark !== undefined)?.mark;
    if (sound !== undefined) events.push({ measure: first.measure, offset: first.offset, bpm: sound, from: 'sound', ...(mark ? { mark } : {}) });
    else if (mark) events.push({ measure: first.measure, offset: first.offset, bpm: mark.quarters, from: 'mark', mark });
  }
  return events;
}

/** The last file read and its events: the sheet asks three questions of one score on every render. */
let memo: { xml: string; events: readonly TempoEvent[] } | undefined;

/**
 * Every tempo the file states, one per position, in score order (measure, then offset): the module note's
 * reading, precedence and opening. Empty where the file states none. Frozen: the answer is shared.
 */
export function tempoEvents(xml: string): readonly TempoEvent[] {
  if (memo?.xml === xml) return memo.events;
  const { raw, firstSound } = rawEvents(xml);
  const events = resolve(raw);
  // Nothing sounds before the file's first tempo (the module note): a copy of it opens the piece.
  const first = events[0];
  if (first && (first.measure !== 0 || first.offset !== 0) && (!firstSound || !before(firstSound, first))) {
    events.unshift({ ...first, measure: 0, offset: 0 });
  }
  const frozen = Object.freeze(events.map((event) => Object.freeze(event)));
  memo = { xml, events: frozen };
  return frozen;
}

/** The tempo the file opens with, where it states one at its opening (the module note's rule). */
export function openingTempoEvent(xml: string): TempoEvent | undefined {
  const first = tempoEvents(xml)[0];
  return first && first.measure === 0 && first.offset === 0 ? first : undefined;
}

/** The tempo the piece opens at, in quarter notes a minute, as the file writes it; `undefined` where it states none there. */
export function openingTempo(xml: string): number | undefined {
  return openingTempoEvent(xml)?.bpm;
}

/** Whether the file states a tempo anywhere. */
export function writesTempo(xml: string): boolean {
  return tempoEvents(xml).length > 0;
}
