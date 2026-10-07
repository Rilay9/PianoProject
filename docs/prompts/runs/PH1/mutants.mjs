// PH1's mutants: each rule the tests claim to hold, broken one at a time in the source, the named tests run, the
// source restored byte for byte. A mutant the tests do not turn red is a rule the tests do not pin.
//   node mutants.mjs <worktree>/app <out.txt>
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [app, out] = process.argv.slice(2);
const TESTS = 'tests/unit/positionedHarmony.test.ts tests/unit/harmony.test.ts tests/unit/tempoFromXml.test.ts';
const mutants = [
  {
    name: 'a harmony offset applied only where it says sound="yes" (the direction policy)',
    file: 'src/score/harmony.ts',
    from: "const shift = Number(/<offset(?=[\\s>])[^>]*>\\s*(-?[\\d.]+)\\s*<\\/offset>/.exec(inner)?.[1] ?? '0');",
    to: "const shift = /<offset[^>]*sound=\"yes\"/.test(inner) ? Number(/<offset(?=[\\s>])[^>]*>\\s*(-?[\\d.]+)\\s*<\\/offset>/.exec(inner)?.[1] ?? '0') : 0;",
  },
  {
    name: 'the walk ignores <backup>',
    file: 'src/score/measureWalk.ts',
    from: "position -= childNumber(inner, 'duration') ?? 0;",
    to: 'position -= 0;',
  },
  {
    name: 'the walk ignores <forward>',
    file: 'src/score/measureWalk.ts',
    from: "        } else if (tag === 'forward') {\n          position += childNumber(inner, 'duration') ?? 0;",
    to: "        } else if (tag === 'forward') {\n          position += 0;",
  },
  {
    name: 'the walk advances on a <chord/> note',
    file: 'src/score/measureWalk.ts',
    from: "if (/<chord\\s*\\/>|<chord\\s*>/.test(inner) || /<grace(?=[\\s/>])/.test(inner)) continue;",
    to: 'if (/<grace(?=[\\s/>])/.test(inner)) continue;',
  },
  {
    name: 'the walk advances on a grace note',
    file: 'src/score/measureWalk.ts',
    from: "if (/<chord\\s*\\/>|<chord\\s*>/.test(inner) || /<grace(?=[\\s/>])/.test(inner)) continue;",
    to: 'if (/<chord\\s*\\/>|<chord\\s*>/.test(inner)) continue;',
  },
  {
    name: 'the walk keeps one <divisions> for the whole part (a change not applied)',
    file: 'src/score/measureWalk.ts',
    from: 'if (set !== undefined && set > 0) divisions = set;',
    to: 'if (set !== undefined && set > 0 && measure === 0) divisions = set;',
  },
  {
    name: 'the tempo reader moves a direction by any <offset> (the harmony policy leaking into the tempo reader)',
    file: 'src/score/tempoFromXml.ts',
    from: "const shift = offsetMatch && attribute(offsetMatch[1] ?? '', 'sound') === 'yes' ? Number(offsetMatch[2]) : 0;",
    to: 'const shift = offsetMatch ? Number(offsetMatch[2]) : 0;',
  },
  {
    name: 'an identical restatement at a later offset collapsed into the harmony already sounding',
    file: 'src/score/harmony.ts',
    from: 'const at = Math.max(0, symbol.offset);',
    to: 'const at = Math.max(0, symbol.offset); if ([...places.values()].flat().some((kept) => sameChord(kept, symbol))) continue;',
  },
  {
    name: 'exact duplicates at one offset not merged (reported as a conflict)',
    file: 'src/score/harmony.ts',
    from: 'if (distinct.some((kept) => sameChord(kept, symbol))) report.merged.push(symbol);',
    to: 'if (distinct.some((kept) => kept === symbol)) report.merged.push(symbol);',
  },
  {
    name: 'a conflict resolved by part order (the first written wins)',
    file: 'src/score/harmony.ts',
    from: 'harmony: distinct.length > 1 ? { symbol: null, conflict: distinct } : { symbol: distinct[0] ?? null }',
    to: 'harmony: { symbol: distinct[0] ?? null }',
  },
  {
    name: 'an explicit pickup stretched to the time signature',
    file: 'src/score/harmony.ts',
    from: "if (implicit) return bar('incomplete', length);",
    to: "if (implicit) return bar('incomplete', nominal ?? length);",
  },
  {
    name: 'an unflagged short first bar stretched to the time signature',
    file: 'src/score/harmony.ts',
    from: "if (ordinal === 0 && length < nominal) return bar('pickup', length);",
    to: '',
  },
  {
    name: 'a position before the bar clamped to 0',
    file: 'src/score/harmony.ts',
    from: '      if (symbol.offset < -EPSILON) {',
    to: '      if (symbol.offset < -1e9) {',
  },
  {
    name: 'a bar without a symbol at 0 not carried (opens on nothing)',
    file: 'src/score/harmony.ts',
    from: 'if (firstStart > EPSILON) segments.push({ ...sounding, start: 0, duration: round6(firstStart), carried: true });',
    to: 'if (firstStart > EPSILON) segments.push({ symbol: null, start: 0, duration: round6(firstStart), carried: true });',
  },
  {
    name: 'bar 1 carries the last chord round the loop',
    file: 'src/score/harmony.ts',
    from: '  let sounding: { symbol: ChordSymbol | null; conflict?: ChordSymbol[] } = { symbol: null };',
    to: '  let sounding: { symbol: ChordSymbol | null; conflict?: ChordSymbol[] } = { symbol: symbols[symbols.length - 1] ?? null };',
  },
  {
    name: 'a bar’s symbols gathered by the written number, not the source measure (PH1a)',
    file: 'src/score/harmony.ts',
    from: 'for (const symbol of bySource.get(info.source) ?? []) {',
    to: 'for (const symbol of symbols.filter((s) => s.measure === info.measure)) {',
  },
  {
    name: 'bars ordered by the written number, not the source order (PH1a)',
    file: 'src/score/harmony.ts',
    from: '  for (const info of measures) {',
    to: '  for (const info of [...measures].sort((a, b) => a.measure - b.measure)) {',
  },
];

const lines = [];
for (const mutant of mutants) {
  const path = join(app, mutant.file);
  const original = readFileSync(path, 'utf8');
  // A working copy with CRLF line endings (a Windows checkout) holds a multi-line `from` with \r\n.
  const eol = (text) => (original.includes('\r\n') ? text.replace(/\n/g, '\r\n') : text);
  const count = original.split(eol(mutant.from)).length - 1;
  if (count !== 1) {
    lines.push(`NOT APPLIED (${String(count)} matches): ${mutant.name}`);
    continue;
  }
  writeFileSync(path, original.replace(eol(mutant.from), eol(mutant.to)));
  let result;
  try {
    execSync(`npx vitest run ${TESTS}`, { cwd: app, stdio: 'pipe' });
    result = 'SURVIVED (all green)';
  } catch (error) {
    const text = String(error.stdout ?? '') + String(error.stderr ?? '');
    const failed = [...text.matchAll(/^\s*×\s+(.*?)(?:\s+\d+ms)?$/gm)].map((m) => m[1].trim());
    result = `KILLED: ${String(failed.length)} failing: ${failed.join(' || ')}`;
  } finally {
    writeFileSync(path, original);
  }
  if (readFileSync(path, 'utf8') !== original) throw new Error(`restore failed: ${path}`);
  lines.push(`${mutant.name} (${mutant.file}): ${result}`);
}
writeFileSync(out, lines.join('\n') + '\n');
console.log(lines.join('\n'));
