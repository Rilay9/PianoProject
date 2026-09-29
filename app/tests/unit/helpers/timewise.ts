/**
 * A partwise MusicXML fixture's timewise twin (X3e; the X3d review's required change,
 * `docs/review/responses/5e6eceba.md`): the same content re-nested, for the tests that ask the app to read
 * a `<score-timewise>` file as it reads the `<score-partwise>` one. MusicXML's two forms carry one content:
 * partwise has parts holding measures, timewise measures holding parts.
 *
 * Mechanical: the text before the root and before the first `<part>` (the declaration, the doctype, the
 * header, the part list) is kept as written with the root and the doctype renamed; each measure keeps the
 * first part's measure attributes (a fixture whose parts give one measure different attributes, or a
 * different number of measures, is refused, since timewise has one set per measure); each part's content in
 * each measure is kept byte for byte, the parts in their partwise order. The door's conversion
 * (`score/toPartwise.ts`) turns the twin back into the fixture exactly — the round trip
 * `toPartwise.test.ts` asserts on every fixture shape the tempo tests use.
 */
export function timewiseTwin(partwise: string): string {
  const root = /<score-partwise(?=[\s>])([^>]*)>([\s\S]*)<\/score-partwise>/.exec(partwise);
  if (!root) throw new Error('timewiseTwin: not a <score-partwise> document');
  const [whole, rootAttributes = '', body = ''] = root;
  const firstPart = body.search(/<part(?=[\s>])/);
  if (firstPart < 0) throw new Error('timewiseTwin: no <part>');
  const header = body.slice(0, firstPart);
  const parts = [...body.slice(firstPart).matchAll(/<part(?=[\s>])([^>]*)>([\s\S]*?)<\/part>/g)].map(([, attributes = '', inner = '']) => ({
    attributes,
    measures: [...inner.matchAll(/<measure(?=[\s>])([^>]*)>([\s\S]*?)<\/measure>/g)].map(([, measureAttributes = '', content = '']) => ({ attributes: measureAttributes, content })),
  }));
  const first = parts[0]?.measures ?? [];
  for (const part of parts) {
    if (part.measures.length !== first.length) throw new Error('timewiseTwin: the parts have different numbers of measures');
    part.measures.forEach((measure, i) => {
      if (measure.attributes !== first[i]?.attributes) throw new Error(`timewiseTwin: measure ${String(i)}'s attributes differ between parts`);
    });
  }
  const measures = first.map(
    (measure, i) => `<measure${measure.attributes}>${parts.map((part) => `<part${part.attributes}>${part.measures[i]?.content ?? ''}</part>`).join('')}</measure>`,
  );
  const before = partwise
    .slice(0, root.index)
    .replace(/<!DOCTYPE\s+score-partwise[^>]*>/, (doctype) => doctype.replace('score-partwise', 'score-timewise').replace(/Partwise/g, 'Timewise').replace(/partwise\.dtd/g, 'timewise.dtd'));
  return `${before}<score-timewise${rootAttributes}>${header}${measures.join('')}</score-timewise>${partwise.slice(root.index + whole.length)}`;
}
