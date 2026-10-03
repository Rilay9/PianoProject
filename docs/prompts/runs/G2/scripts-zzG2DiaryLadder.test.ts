/**
 * G2's diary ladder probe, run once as `app/tests/unit/zzG2DiaryLadder.test.ts` on HEAD's sources and
 * on G2's, then removed: the three reader learners' stored rows (dumped by `firstThirtyDays.test.ts`
 * with `C4C_DIARY_ROWS`), read into every vocabulary skill's ladder state at the end of each day they
 * played. Written to `G2_LADDER_OUT`. Imports only what both codebases have.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SessionRow } from '../../src/data/db';
import { ladderState } from '../../src/evidence/ladder';
import { storedEvidence } from '../../src/evidence/readingState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

const ROWS = process.env.G2_ROWS ?? '';
const OUT = process.env.G2_LADDER_OUT ?? '';

describe('G2 diary ladder probe', () => {
  it('prints every skill each day', () => {
    const lines: string[] = [];
    for (const file of readdirSync(ROWS).filter((name) => name.endsWith('.json')).sort()) {
      const rows = (JSON.parse(readFileSync(join(ROWS, file), 'utf8')) as SessionRow[]).sort((a, b) => a.at.localeCompare(b.at));
      const days = [...new Set(rows.map((row) => row.at.slice(0, 10)))].sort();
      for (const day of days) {
        const upTo = rows.filter((row) => row.at.slice(0, 10) <= day);
        const today = new Date(`${day}T23:00:00`);
        const states = VOCABULARY_V0.skills.map((skill) => {
          const reading = ladderState({ evidence: upTo.flatMap(storedEvidence).filter((e) => e.skill === skill.id), today });
          return `${skill.id}=${reading.state}`;
        });
        lines.push(`${file.replace('.json', '')} ${day} ${states.join(' ')}`);
      }
    }
    writeFileSync(OUT, `${lines.join('\n')}\n`);
    expect(lines.length).toBeGreaterThan(0);
  });
});
