/**
 * X31a's shapes probe on the app's side (not a test of the suite; run from app/tests/unit/ as
 * x31aShapesApp.test.ts, then removed and kept here as scripts-shapes-app.test.ts). For every shape in
 * `test_difficulty._app_shapes()` (the JSON `X31A_SHAPES` names, from scripts-shapes-dump.py): the app's one
 * tempo reader's opening (`openingTempo(xml) ?? 100`, the model's default) beside the number the Python table
 * states for the app. Prints one line per shape and a count; asserts nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { openingTempo } from '../../src/score/tempoFromXml';

it('reads every shape the Python table names', () => {
  const file = process.env.X31A_SHAPES ?? '';
  const shapes = JSON.parse(readFileSync(file, 'utf8')) as Record<string, { xml: string; app: number; build: number }>;
  const lines: string[] = [];
  let equal = 0;
  for (const [name, shape] of Object.entries(shapes)) {
    const reader = openingTempo(shape.xml) ?? 100;
    const same = Math.abs(reader - shape.app) < 1e-9;
    if (same) equal += 1;
    lines.push(`${same ? 'equal    ' : 'DIFFERENT'}\t${name}\tthe app's reader ${String(reader)}\tthe table's app ${String(shape.app)}\tthe table's build ${String(shape.build)}`);
  }
  lines.push(`shapes: ${String(Object.keys(shapes).length)}; the table's app number equals the app's reader on ${String(equal)}`);
  const out = process.env.X31A_OUT;
  if (out) writeFileSync(out, `${lines.join('\n')}\n`);
  console.log(lines.at(-1));
});
