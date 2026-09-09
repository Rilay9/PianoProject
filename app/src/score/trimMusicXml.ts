/**
 * The first `bars` measures of a MusicXML document, as MusicXML.
 *
 * For the probe: it draws only the first `PROBE_MAX_BARS` of a piece to
 * measure the tallest system, but the engraver loads the whole document to
 * draw any of it, and loading the 780-bar Scherzo a third time was five
 * seconds of the first window's budget. Cutting the document down first is
 * a parse and a serialise — a few hundred milliseconds on a phone, on idle
 * time — and the engraver then loads forty-eight bars.
 *
 * Partwise scores lose the measures past `bars` in every part; timewise
 * scores lose the measures themselves. Anything that referred forward — a
 * repeat's backward sign, a tie into the cut — is left dangling, which the
 * engraver tolerates and the measurement does not care about. A document
 * that does not parse is returned as it was, so the worst case is the old
 * cost, not a probe that cannot load.
 */
export function trimMusicXml(xml: string, bars: number): string {
  if (!(bars > 0) || typeof DOMParser === 'undefined') return xml;
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
  } catch {
    return xml;
  }
  if (doc.getElementsByTagName('parsererror').length > 0) return xml;
  const root = doc.documentElement;
  const measureLists: Element[] =
    root.tagName === 'score-timewise'
      ? [root]
      : root.tagName === 'score-partwise'
        ? [...root.children].filter((el) => el.tagName === 'part')
        : [];
  if (measureLists.length === 0) return xml;
  let cut = 0;
  for (const list of measureLists) {
    const measures = [...list.children].filter((el) => el.tagName === 'measure');
    for (const measure of measures.slice(bars)) {
      measure.remove();
      cut += 1;
    }
  }
  if (cut === 0) return xml;
  return new XMLSerializer().serializeToString(doc);
}
