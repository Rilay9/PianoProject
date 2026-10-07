/**
 * PH1's corpus: every MusicXML file under the main checkout's `content/scores/` (the source corpus the brief's
 * census counted) and under its built `app/public/content/scores/` (what the app bundles), plus the worktree's
 * test fixtures. Read through the app's own unzip (`toMusicXml`); one entry per distinct file content, every
 * path that holds it kept (`content/…`, `bundle/…`, `fixtures/…`).
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface CorpusFile {
  sha256: string;
  paths: string[];
  bytes: Uint8Array;
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries.sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(mxl|musicxml|xml)$/i.test(name)) out.push(path);
  }
}

/**
 * `withQuarry` adds the worktree's PDMX quarry dumps (`docs/review/pdmx-quarry-2026-10-05/xml/`, labelled
 * `quarry/…`): raw-shaped files, not bundled, read by the census only so music21 can witness the raw shapes too
 * (the differential's corpus stays the three roots it was run on before and after).
 */
export function corpus(main: string, worktree: string, withQuarry = false): CorpusFile[] {
  const roots: [string, string][] = [
    ['content', join(main, 'content', 'scores')],
    ['bundle', join(main, 'app', 'public', 'content', 'scores')],
    ['fixtures', join(worktree, 'app', 'tests', 'fixtures', 'scores')],
    ...(withQuarry ? ([['quarry', join(worktree, 'docs', 'review', 'pdmx-quarry-2026-10-05', 'xml')]] as [string, string][]) : []),
  ];
  const byHash = new Map<string, CorpusFile>();
  for (const [label, root] of roots) {
    const files: string[] = [];
    walk(root, files);
    for (const path of files) {
      const bytes = new Uint8Array(readFileSync(path));
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const name = `${label}/${relative(root, path).replace(/\\/g, '/')}`;
      const seen = byHash.get(sha256);
      if (seen) seen.paths.push(name);
      else byHash.set(sha256, { sha256, paths: [name], bytes });
    }
  }
  return [...byHash.values()].sort((a, b) => (a.paths[0] ?? '').localeCompare(b.paths[0] ?? ''));
}

/** How the chart counts its bars (`ChordChartScreen.ts`: the distinct `number` attributes, at least the symbol count). */
export function chartMeasureCount(xml: string, symbolCount: number): number {
  const distinct = new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size;
  return Math.max(distinct, symbolCount);
}
