// The Node worker Hypothesis drives (brief §3, §5): the real generator, from a bundle of
// app/src/engine built under <worktree>/build/sr-quality/bundle by properties_test.py
// (rolldown from app/node_modules). One JSON request per stdin line, one JSON answer per
// stdout line. Nothing here judges a phrase; it only builds the options the app's own
// functions build, and writes or refuses one.
//
// Request:
//   {"options": {...}}                        options as given (the level-table domain), or
//   {"params": {...}, "seed": n}              a row's params through sightReadingOptionsFor;
//   + "hold": [demand ids]                     then heldToRung(options, taught) (what
//                                              readingOptions does with no reader moves);
//   + "patch": {"demand": id, "on": bool}      then withDemand / withoutDemand (a reader move);
//   + "twice": true                            generate twice and compare (determinism).
// Answer: {"outcome": "WRITE"|"REFUSE"|"NOPATCH"|"ERROR", "xml", "reasons", "unrealisable",
//          "options", "same"}
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

const bundle = await import(pathToFileURL(process.argv[2]).href);
const { generateSightReading, SightReadingRefusal, unrealisable, heldToRung, withDemand, withoutDemand, sightReadingOptionsFor } = bundle;

function attempt(options) {
  try {
    const phrase = generateSightReading(options);
    return { outcome: 'WRITE', xml: phrase.musicXml, fifths: phrase.fifths, timeSig: phrase.timeSig, version: phrase.generator.version };
  } catch (cause) {
    if (cause instanceof SightReadingRefusal) {
      return { outcome: 'REFUSE', reasons: cause.reasons, fifths: cause.fifths, timeSig: cause.timeSig, version: cause.generator.version };
    }
    return { outcome: 'ERROR', error: String(cause && cause.stack ? cause.stack : cause) };
  }
}

const rl = createInterface({ input: process.stdin });
for await (const line of rl) {
  if (!line.trim()) continue;
  const req = JSON.parse(line);
  let options = req.options ?? sightReadingOptionsFor(req.params, req.seed);
  if (req.hold) {
    const taught = new Set(req.hold);
    options = heldToRung(options, (d) => taught.has(d));
  }
  if (req.patch) {
    const moved = req.patch.on ? withDemand(options, req.patch.demand) : withoutDemand(options, req.patch.demand);
    if (!moved) {
      process.stdout.write(JSON.stringify({ outcome: 'NOPATCH', options }) + '\n');
      continue;
    }
    options = moved;
  }
  const first = attempt(options);
  let same = null;
  if (req.twice) {
    const second = attempt(options);
    same = JSON.stringify(first) === JSON.stringify(second);
  }
  process.stdout.write(JSON.stringify({ ...first, unrealisable: unrealisable(options), options, same }) + '\n');
}
