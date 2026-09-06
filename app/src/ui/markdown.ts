/**
 * Just enough Markdown for the lesson pages (docs/04 §3: "concept text
 * (markdown)").
 *
 * A library would be 40 kB for a subset of what the 55 lesson files actually
 * use, and every one of them is written by this project — so this handles
 * headings, paragraphs, bold, italic, inline code, links and both kinds of
 * list, and renders anything else as plain text.
 *
 * It builds DOM nodes rather than an HTML string. That is not paranoia about
 * our own content: the same renderer will one day be pointed at a lesson note
 * the owner typed, and a renderer that cannot inject markup is one less thing
 * to remember.
 */

export interface FrontMatter {
  data: Record<string, unknown>;
  body: string;
}

/**
 * Splits the `---` block off the top of a lesson file.
 *
 * The parser is deliberately shallow — scalars, flow lists (`[a, b]`), one
 * level of `- key: value` blocks (what `videos:` uses) and one level of plain
 * `key: value` blocks (what the tips files' `when:` uses). Anything deeper is
 * left as a string rather than guessed at.
 */
export function parseFrontMatter(text: string): FrontMatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const data: Record<string, unknown> = {};
  const lines = (match[1] ?? '').split(/\r?\n/);
  let listKey: string | null = null;
  let list: Record<string, unknown>[] = [];
  let map: Record<string, unknown> | null = null;

  const flush = (): void => {
    // A key with an empty value is followed either by `- ` items or by
    // indented pairs. Which one it was is only known once something has been
    // read under it, so the decision is made here rather than at the header.
    if (listKey) data[listKey] = map ?? list;
    listKey = null;
    list = [];
    map = null;
  };

  for (const line of lines) {
    if (/^\s*-\s+/.test(line) && listKey) {
      map = null;
      const entry = /^\s*-\s+(.*)$/.exec(line)?.[1] ?? '';
      const pair = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(entry);
      list.push(pair ? { [pair[1] as string]: unquote(pair[2] as string) } : { value: unquote(entry) });
      continue;
    }
    if (/^\s{2,}[A-Za-z0-9_]+:/.test(line) && listKey) {
      const pair = /^\s*([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
      if (!pair) continue;
      const key = pair[1] as string;
      const raw = pair[2] as string;
      if (list.length > 0) {
        // Still filling in the last `- ` item's fields.
        (list[list.length - 1] as Record<string, unknown>)[key] = unquote(raw);
      } else {
        // Indented pairs with no `- ` before them: a plain map, like the tips
        // files' `when: { clef: bass }`.
        map ??= {};
        const asNumber = Number(raw);
        map[key] =
          raw === 'true' ? true : raw === 'false' ? false
          : raw !== '' && !Number.isNaN(asNumber) ? asNumber
          : unquote(raw);
      }
      continue;
    }
    const pair = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    flush();
    const key = pair[1] as string;
    const value = pair[2] as string;
    if (value === '') {
      listKey = key;
      list = [];
    } else if (value.startsWith('[')) {
      data[key] = value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((entry) => unquote(entry.trim()))
        .filter((entry) => entry !== '');
    } else {
      const asNumber = Number(value);
      data[key] = value !== '' && !Number.isNaN(asNumber) ? asNumber : unquote(value);
    }
  }
  flush();
  return { data, body: text.slice(match[0].length) };
}

function unquote(value: string): string {
  return value.replace(/^["'](.*)["']$/, '$1');
}

/** Inline spans: `**bold**`, `*italic*`, `` `code` ``, `[text](url)`. */
function renderInline(text: string, into: HTMLElement): void {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index;
    if (index > last) into.append(text.slice(last, index));
    const token = match[0];
    if (token.startsWith('**')) {
      into.append(Object.assign(document.createElement('strong'), { textContent: token.slice(2, -2) }));
    } else if (token.startsWith('`')) {
      into.append(Object.assign(document.createElement('code'), { textContent: token.slice(1, -1) }));
    } else if (token.startsWith('[')) {
      const parts = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const link = document.createElement('a');
      link.textContent = parts?.[1] ?? token;
      link.href = parts?.[2] ?? '#';
      link.target = '_blank';
      link.rel = 'noreferrer';
      into.append(link);
    } else {
      into.append(Object.assign(document.createElement('em'), { textContent: token.slice(1, -1) }));
    }
    last = index + token.length;
  }
  if (last < text.length) into.append(text.slice(last));
}

/** Markdown body -> a fragment of block elements. */
export function renderMarkdown(markdown: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const blocks = markdown.replace(/\r\n/g, '\n').split(/\n{2,}/);

  for (const raw of blocks) {
    const block = raw.trim();
    if (block === '') continue;

    const heading = /^(#{1,6})\s+(.*)$/.exec(block);
    if (heading) {
      const level = Math.min(6, (heading[1] as string).length + 1);
      const node = document.createElement(`h${String(level)}`);
      renderInline(heading[2] as string, node);
      fragment.append(node);
      continue;
    }

    const lines = block.split('\n');
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      const ul = document.createElement('ul');
      for (const line of lines) {
        const li = document.createElement('li');
        renderInline(line.replace(/^\s*[-*]\s+/, ''), li);
        ul.append(li);
      }
      fragment.append(ul);
      continue;
    }
    if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
      const ol = document.createElement('ol');
      for (const line of lines) {
        const li = document.createElement('li');
        renderInline(line.replace(/^\s*\d+[.)]\s+/, ''), li);
        ol.append(li);
      }
      fragment.append(ol);
      continue;
    }

    const p = document.createElement('p');
    renderInline(lines.join(' '), p);
    fragment.append(p);
  }
  return fragment;
}
