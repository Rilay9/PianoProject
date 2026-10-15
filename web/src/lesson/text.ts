// A lesson's text (owner, 2026-10-15): short paragraphs with a small safe set of formatting, written as plain text:
//   # Heading, ## Smaller heading          (a line of its own)
//   - item  (or * item)  /  1. item        (lists: one line each)
//   **bold**, *italics* (or _italics_), [words](https://link)
//   a blank line between paragraphs
// Never HTML: the text is read into this little tree and drawn with text nodes only, so nothing in it can run. Raw
// HTML (a "<b>" tag) is refused rather than shown, as a mistake; so is a link that is not https.

export type Inline = { t: 'text' | 'b' | 'i'; text: string } | { t: 'link'; text: string; href: string };
export type TextBlock =
  | { t: 'h'; level: 1 | 2; parts: Inline[] }
  | { t: 'p'; parts: Inline[] }
  | { t: 'ul' | 'ol'; items: Inline[][] };

/** Bold, italics and links inside one line. */
export function readInline(s: string, where: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let at = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > at) out.push({ t: 'text', text: s.slice(at, m.index) });
    if (m[1] !== undefined) out.push({ t: 'b', text: m[1] });
    else if (m[2] !== undefined || m[3] !== undefined) out.push({ t: 'i', text: m[2] ?? m[3] });
    else {
      const href = m[5];
      if (!/^https:\/\/[^\s]+$/.test(href)) throw new Error(`${where}: the link "${href}" should start with https://`);
      out.push({ t: 'link', text: m[4], href });
    }
    at = re.lastIndex;
  }
  if (at < s.length) out.push({ t: 'text', text: s.slice(at) });
  return out;
}

export function readText(src: string, where: string): TextBlock[] {
  if (/<\/?[a-z][^>]*>/i.test(src)) throw new Error(`${where}: the text has HTML in it ("${/<\/?[a-z][^>]*>/i.exec(src)![0]}"); use **bold**, *italics*, - lists, # headings and [links](https://…)`);
  const out: TextBlock[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) out.push({ t: 'p', parts: readInline(para.join(' '), where) }); para = []; };
  for (const raw of src.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    const h = /^(#{1,2})\s+(.+)$/.exec(line), ul = /^[-*]\s+(.+)$/.exec(line), ol = /^\d+[.)]\s+(.+)$/.exec(line);
    if (!line) { flush(); continue; }
    if (h) { flush(); out.push({ t: 'h', level: h[1].length as 1 | 2, parts: readInline(h[2], where) }); continue; }
    if (ul || ol) {
      flush();
      const t = ul ? 'ul' : 'ol', item = readInline((ul ?? ol)![1], where), last = out[out.length - 1];
      if (last && last.t === t) last.items.push(item); else out.push({ t, items: [item] });
      continue;
    }
    if (/^#{3,}\s/.test(line)) throw new Error(`${where}: only # and ## headings`);
    para.push(line);
  }
  flush();
  if (!out.length) throw new Error(`${where}: the text is empty`);
  return out;
}
