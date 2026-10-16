// "How the app works" (owner, 2026-10-15): one short section a screen, in one content file (help.md beside this one),
// read here. The file's format (docs/app-features.md §7d):
//   // a line starting with two slashes is a note for whoever edits the file; it is not shown
//   # A section's title {#its-id}          (starts a section; the id is what the app opens it by)
//   the section's text, in the lessons' small text format (lesson/text.ts): paragraphs, ## headings, - and 1. lists,
//   **bold**, *italics*, [links](https://…); never HTML
// Every id the app opens a section by is in HELP_IDS; the check (tests/content.mjs) reads the shipped file with this
// reader and finds each one.

import { readText, type TextBlock } from '../lesson/text.ts';

/** The sections the app opens by name: a screen's "How this screen works", and Settings' install line. */
export const HELP_IDS = ['home', 'path', 'score', 'memorise', 'simon', 'drills', 'lab', 'freeplay', 'metronome', 'practice', 'music', 'pdf', 'settings', 'install'] as const;
export type HelpId = (typeof HELP_IDS)[number];

export interface HelpSection { id: string; title: string; blocks: TextBlock[] }

/** Reads the help file; a mistake is refused with its line and reason. */
export function readHelp(src: string): HelpSection[] {
  const out: HelpSection[] = [];
  let cur: { id: string; title: string; line: number; text: string[] } | null = null;
  const flush = () => {
    if (!cur) return;
    out.push({ id: cur.id, title: cur.title, blocks: readText(cur.text.join('\n'), `help section "${cur.id}" (line ${cur.line})`) });
  };
  src.replace(/\r/g, '').split('\n').forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return;
    const head = /^#\s+(.+?)\s+\{#([a-z0-9-]+)\}\s*$/.exec(line);
    if (head) {
      flush();
      if (out.some((s) => s.id === head[2])) throw new Error(`help line ${i + 1}: the id "${head[2]}" is used twice`);
      cur = { id: head[2], title: head[1], line: i + 1, text: [] };
      return;
    }
    if (/^#\s/.test(line)) throw new Error(`help line ${i + 1}: a section's title ends with its id, like "# Home {#home}"`);
    if (!cur) { if (line.trim()) throw new Error(`help line ${i + 1}: text before the first section`); return; }
    cur.text.push(line);
  });
  flush();
  if (!out.length) throw new Error('the help file has no sections');
  return out;
}
