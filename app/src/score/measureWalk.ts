/**
 * The one walk of a MusicXML file's measure positions (PH1; factored out of `tempoFromXml.ts`, whose rules it
 * keeps exactly): what the tempo reader and the chord-symbol reader (`harmony.ts`) both stand on, so a tempo mark
 * and a chord symbol are placed by one set of rules, never two.
 *
 * Parts around measures (the partwise form, the one form the app holds: `tempoFromXml.ts`'s module note), so a
 * measure's ordinal is its place in its part and `<divisions>` carry from bar to bar within a part. The position
 * is counted in divisions from the measure's start: a `<note>` moves it on by its `<duration>` unless it is a
 * `<chord/>` note (its chord's first note has already moved it) or a grace note; `<backup>` moves it back and
 * `<forward>` on by their durations. Comments are dropped first. Regexes, not a DOM, for the reason the readers
 * give: this runs in Node tests and at an import, and the shapes are flat.
 *
 * The walk places; it applies no policy. Each reader decides what a child at a position means: the tempo reader
 * moves a direction by its `<offset>` only where the offset sounds, the chord reader moves a harmony by its
 * `<offset>` always (the reviewer, `docs/review/responses/g6-ph-briefs-cb1.md` §2).
 */

/** The measure children the walk visits, in page order. */
export type WalkTag = 'note' | 'backup' | 'forward' | 'direction' | 'attributes' | 'sound' | 'harmony';

/** A measure child where it stands. */
export interface WalkChild {
  tag: WalkTag;
  /** The child's own attributes, as written. */
  attributes: string;
  /** The child's contents ('' for an empty element). */
  inner: string;
  /** The part's ordinal in the file, from 0. */
  part: number;
  /** The measure's ordinal in its part, from 0: the engraver's source-measure index. */
  measure: number;
  /** The `<measure>` tag's own attributes (`number`, `implicit`…), as written. */
  measureAttributes: string;
  /** Divisions from the measure's start, before this child moves the position. */
  position: number;
  /** The divisions a quarter note in force here (an `<attributes>` child's own `<divisions>` already applied). */
  divisions: number;
}

/** A time signature in force: as written, and the bar it states in quarter notes where it states one. */
export interface WalkTime {
  /** `<beats>` values, as written ("3", "3+2"). */
  beats: string[];
  /** `<beat-type>` values, as written. */
  beatTypes: string[];
  /** The bar's nominal length in quarter notes; `undefined` for `<senza-misura>` or a signature with no reading. */
  quarters: number | undefined;
}

/** A measure once walked. */
export interface WalkMeasure {
  part: number;
  measure: number;
  measureAttributes: string;
  /** The furthest the position reached in the measure, in quarter notes: its notated length. */
  furthest: number;
  /** The time signature in force for the measure: the first one written in it, else the one carried from before. */
  time: WalkTime | undefined;
}

export interface WalkVisitor {
  child?: (child: WalkChild) => void;
  measureEnd?: (measure: WalkMeasure) => void;
}

/** Tags that start with these names but are other elements: `<measure-style>`, `<direction-type>`, `<part-list>`. */
const PART = /<part(?=[\s>])[^>]*>([\s\S]*?)<\/part>/g;
const MEASURE = /<measure(?=[\s>])([^>]*)>([\s\S]*?)<\/measure>/g;
const CHILD = /<(note|backup|forward|direction|attributes|sound|harmony)(?=[\s/>])([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;

/** A number standing as an element's whole content: `<duration>2</duration>`. */
export function childNumber(body: string, tag: string): number | undefined {
  const raw = new RegExp(`<${tag}(?=[\\s>])[^>]*>\\s*(-?[\\d.]+)\\s*</${tag}>`).exec(body)?.[1];
  const value = Number(raw);
  return raw !== undefined && Number.isFinite(value) ? value : undefined;
}

/** An attribute's value, double- or single-quoted. */
export function attribute(attributes: string, name: string): string | undefined {
  return new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attributes)?.slice(1).find((value) => value !== undefined);
}

/** An `<attributes>` block's `<time>`, read; `undefined` where it has none. */
function timeOf(inner: string): WalkTime | undefined {
  const body = /<time(?=[\s>])[^>]*>([\s\S]*?)<\/time>/.exec(inner)?.[1];
  if (body === undefined) return undefined;
  const beats = [...body.matchAll(/<beats(?=[\s>])[^>]*>\s*([^<]*?)\s*<\/beats>/g)].map((m) => m[1] ?? '');
  const beatTypes = [...body.matchAll(/<beat-type(?=[\s>])[^>]*>\s*([^<]*?)\s*<\/beat-type>/g)].map((m) => m[1] ?? '');
  let quarters: number | undefined;
  if (!/<senza-misura(?=[\s/>])/.test(body) && beats.length > 0 && beats.length === beatTypes.length) {
    quarters = 0;
    for (const [i, written] of beats.entries()) {
      const counts = written.split('+').map((part) => Number(part.trim()));
      const type = Number(beatTypes[i]);
      if (counts.some((count) => !Number.isFinite(count) || count <= 0) || !Number.isFinite(type) || type <= 0) {
        quarters = undefined;
        break;
      }
      quarters += (counts.reduce((sum, count) => sum + count, 0) * 4) / type;
    }
  }
  return { beats, beatTypes, quarters };
}

/** Walks every measure of every part, in page order, telling the visitor each child where it stands. */
export function walkMeasures(xml: string, visit: WalkVisitor): void {
  const text = xml.replace(/<!--[\s\S]*?-->/g, '');
  let part = 0;
  for (const [, partBody = ''] of text.matchAll(PART)) {
    let divisions = 1;
    let time: WalkTime | undefined;
    let measure = 0;
    for (const [, measureAttributes = '', body = ''] of partBody.matchAll(MEASURE)) {
      let position = 0;
      let furthest = 0;
      let timeHere: WalkTime | undefined;
      const reach = (): void => {
        furthest = Math.max(furthest, position / divisions);
      };
      for (const [, tag = '', attributes = '', inner = ''] of body.matchAll(CHILD)) {
        if (tag === 'attributes') {
          const set = childNumber(inner, 'divisions');
          if (set !== undefined && set > 0) divisions = set;
          const written = timeOf(inner);
          if (written) {
            timeHere ??= written;
            time = written;
          }
        }
        visit.child?.({ tag: tag as WalkTag, attributes, inner, part, measure, measureAttributes, position, divisions });
        if (tag === 'note') {
          // A chord's first note has already moved the position; a grace note takes no time.
          if (/<chord\s*\/>|<chord\s*>/.test(inner) || /<grace(?=[\s/>])/.test(inner)) continue;
          position += childNumber(inner, 'duration') ?? 0;
          reach();
        } else if (tag === 'backup') {
          position -= childNumber(inner, 'duration') ?? 0;
        } else if (tag === 'forward') {
          position += childNumber(inner, 'duration') ?? 0;
          reach();
        }
      }
      visit.measureEnd?.({ part, measure, measureAttributes, furthest: Math.round(furthest * 1e6) / 1e6, time: timeHere ?? time });
      measure += 1;
    }
    part += 1;
  }
}
