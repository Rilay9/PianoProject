/**
 * A MusicXML score in the partwise form (X3e; the X3d review's required change,
 * `docs/review/responses/5e6eceba.md`).
 *
 * MusicXML writes one content in two forms: **partwise**, parts holding measures, and **timewise**, measures
 * holding parts. The import door accepts both (`importStore.addImport`), but the engraver loads only the
 * partwise form — OpenSheetMusicDisplay 2.1.2 refuses a `<score-timewise>` document ("Document is not a
 * valid 'partwise' MusicXML") — so the Score screen could not open such an import and the store could not
 * measure its notes, and every reader of the stored text that walks parts around measures read it wrong or
 * not at all: the one tempo reader (`tempoFromXml`, no events), the import sheet (the app's default tempo,
 * one bar, the swap refused as separate parts), E48's writer (a `<sound tempo>` outside every part). X3e's
 * probe, `docs/prompts/runs/X3e/probe-timewise-committed.json`. So the door turns a timewise file into its
 * partwise twin here, before anything reads it, and the store keeps the one form every consumer reads: no
 * second tempo reader, no second representation.
 *
 * Mechanical, text to text, so it runs wherever the door does (no DOM):
 *
 * - the text before the first measure — the declaration, the doctype, the header, the part list — is kept
 *   as written, with the root element and the doctype renamed to the partwise form;
 * - each part's content in each measure is kept byte for byte, under that measure's own attributes (its
 *   number, `implicit`, `width`…), in that part's run of measures; the parts in the order they first appear;
 * - a part a measure does not name gets an empty measure there, so every part keeps the measure count its
 *   measures are counted by (a measure's ordinal in its part is what the tempo reader and the engraver
 *   count);
 * - a comment or a CDATA section is never read as a tag: one inside a part's content stays with it; one
 *   between measures or between parts is dropped, having no place in the other nesting and no music in it.
 *
 * Anything that is not a timewise score — a partwise one, text that is not MusicXML, a timewise root with
 * no close or no measure — is returned as it was.
 */
export function toPartwise(xml: string): string {
  // Comments and CDATA blanked to spaces of their own length: tags are found in `masked`, and the text kept
  // is taken from `xml` at the same places.
  const masked = xml.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, (hidden) => ' '.repeat(hidden.length));
  const open = /<score-timewise(?=[\s>])([^>]*)>/.exec(masked);
  const close = masked.lastIndexOf('</score-timewise>');
  if (!open || close < open.index) return xml;
  const bodyStart = open.index + open[0].length;
  const body = masked.slice(bodyStart, close);

  const order: string[] = [];
  const partTags = new Map<string, string>();
  const measures: { attributes: string; parts: Map<string, string> }[] = [];
  let header: string | undefined;
  for (const measure of body.matchAll(/<measure(?=[\s/>])([^>]*?)(?:\/>|>([\s\S]*?)<\/measure>)/g)) {
    const at = bodyStart + measure.index;
    header ??= xml.slice(bodyStart, at);
    const inner = measure[2] ?? '';
    const innerStart = at + measure[0].length - (measure[2] === undefined ? 0 : inner.length + '</measure>'.length);
    const parts = new Map<string, string>();
    let nth = 0;
    for (const part of inner.matchAll(/<part(?=[\s/>])([^>]*?)(?:\/>|>([\s\S]*?)<\/part>)/g)) {
      const attributes = part[1] ?? '';
      const key = /\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(attributes)?.slice(1).find((value) => value !== undefined) ?? `#${String(nth)}`;
      nth += 1;
      const content = part[2] ?? '';
      const contentStart = innerStart + part.index + part[0].length - (part[2] === undefined ? 0 : content.length + '</part>'.length);
      if (!partTags.has(key)) {
        partTags.set(key, attributes);
        order.push(key);
      }
      parts.set(key, (parts.get(key) ?? '') + xml.slice(contentStart, contentStart + content.length));
    }
    measures.push({ attributes: measure[1] ?? '', parts });
  }
  if (header === undefined) return xml;

  const partwise = order.map((key) => `<part${partTags.get(key) ?? ''}>${measures.map((measure) => `<measure${measure.attributes}>${measure.parts.get(key) ?? ''}</measure>`).join('')}</part>`);
  const prolog = xml
    .slice(0, open.index)
    .replace(/<!DOCTYPE\s+score-timewise[^>]*>/, (doctype) => doctype.replace('score-timewise', 'score-partwise').replace(/Timewise/g, 'Partwise').replace(/timewise\.dtd/g, 'partwise.dtd'));
  return `${prolog}<score-partwise${open[1] ?? ''}>${header}${partwise.join('')}</score-partwise>${xml.slice(close + '</score-timewise>'.length)}`;
}
