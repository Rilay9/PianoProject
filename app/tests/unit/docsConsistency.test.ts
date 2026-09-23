// @vitest-environment node
/**
 * Three relationships between the documents and the code, so a rename in one
 * place cannot leave the other quietly pointing at nothing (the doc review of
 * 2026-09-16 found `select.py` named in `03` three months after it became
 * `shortlist.py`, and two sub-screens the router knows with no section in `04`).
 *
 *   1. Every `docs/03 §N` a pipeline script or its tests cite is a section
 *      `docs/03-content-pipeline.md` actually has.
 *   2. Every `*.py` that `03` names exists under `tools/content/`.
 *   3. Every sub-screen in the router's `SUB_IDS` has a heading in `04`.
 *
 * Relationships only. No count of sections, files or screens is asserted,
 * because those move with the work and a number measured today is red
 * tomorrow (`docs/00-invariants.md` §2).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SUB_IDS, type SubId } from '../../src/router';

/** Vitest runs from `app/`; the docs and the pipeline are one level up. */
const ROOT = resolve(process.cwd(), '..');
const DOC_03 = readFileSync(join(ROOT, 'docs', '03-content-pipeline.md'), 'utf8');
const DOC_04 = readFileSync(join(ROOT, 'docs', '04-ui-spec.md'), 'utf8');
const TOOLS = join(ROOT, 'tools', 'content');

/** Every `.py` under a directory, skipping caches and virtual environments. */
function pythonFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__pycache__' || entry === '.venv' || entry === 'node_modules') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) pythonFiles(path, out);
    else if (entry.endsWith('.py')) out.push(path);
  }
  return out;
}

/** The `##` and `###` headings of a document, as written. */
function headings(doc: string): string[] {
  return doc.split('\n').filter((line) => /^#{2,3} /.test(line));
}

describe('the documents and the code agree', () => {
  it('every docs/03 section a pipeline script cites is a section 03 has', () => {
    const sections = new Set<string>();
    for (const heading of headings(DOC_03)) {
      const match = /^#{2,3} (\d+[a-z]?)\./.exec(heading);
      if (match?.[1]) sections.add(match[1]);
    }
    expect(sections.size).toBeGreaterThan(0);

    const pattern = /docs\/03(?:-content-pipeline\.md)? ?§ ?(\d+[a-z]?)/g;
    for (const file of pythonFiles(TOOLS)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(pattern)) {
        const section = match[1] ?? '';
        expect(sections.has(section), `${file} cites docs/03 §${section}, which 03 does not have`).toBe(true);
      }
    }
  });

  it('every *.py that docs/03 names exists where docs/03 says it is', () => {
    // Widened 2026-09-22: the check assumed every script named in `03` lives
    // under `tools/content`, and the source table now names one that
    // deliberately does not - `tools/midi-cleanup/midi_to_musicxml.py`, the
    // personal MIDI converter `build.py` neither runs nor knows about. A name
    // written with its directory is looked up there; a bare name is still
    // looked for under `tools/content`, which is what keeps the check honest
    // about the pipeline's own scripts.
    const bare = new Set(pythonFiles(TOOLS).map((file) => basename(file)));
    // Widened again 2026-09-23: the path form allowed exactly one directory
    // under `tools/`, and `03` now names a harness two deep
    // (`tools/midi-cleanup/tests/parity_reference.py`, which writes what the
    // TypeScript port of the converter is compared against). A path is still a
    // path wherever it points; the bare-name rule below is untouched, and that
    // is what keeps the check honest about the pipeline's own scripts.
    const withPath = new Set(DOC_03.match(/\btools(?:\/[a-z_0-9-]+)+\/[a-z_0-9]+\.py\b/g) ?? []);
    for (const relative of withPath) {
      expect(
        existsSync(join(ROOT, relative)),
        `docs/03 names ${relative}, which is not on disk`,
      ).toBe(true);
    }
    const named = new Set(
      (DOC_03.match(/\b[a-z_0-9]+\.py\b/g) ?? []).filter(
        (name) => ![...withPath].some((relative) => relative.endsWith(`/${name}`)),
      ),
    );
    expect(named.size).toBeGreaterThan(0);
    for (const name of named) {
      expect(bare.has(name), `docs/03 names ${name}, which is not under tools/content`).toBe(true);
    }
  });

  it('every sub-screen the router knows has a section in docs/04', () => {
    // The word a section heading has to carry for each screen. Kept here, not
    // derived from the id, because `mic` is headed "Microphone" and `folder`
    // "Score folder" — the heading names the thing, the id names the route.
    const NAMED_BY: Record<SubId, RegExp> = {
      midi: /\bMIDI\b/,
      diagnostics: /Diagnostics/,
      mic: /Microphone/,
      metronome: /Metronome/,
      skills: /Skills review/,
      folder: /Score folder/,
      shelf: /Shelf/,
      setup: /setup tour/i,
      guide: /The guide/,
    };
    const lines = headings(DOC_04);
    for (const id of SUB_IDS) {
      const wanted = NAMED_BY[id];
      expect(
        lines.some((heading) => wanted.test(heading)),
        `no heading in docs/04 names the ${id} screen (looked for ${String(wanted)})`,
      ).toBe(true);
    }
  });
});
