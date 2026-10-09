// Tonal's Scale.detect on the pitch-class sets recorded by scale_run.py / scale_tonal.py.
// Usage: node scale_tonal.cjs <in.json> <out.json>   (tonal installed under build/tonal; see scale-row.md section 2)
// in:  [{id, pcs:[0..11], tonic: int|null}]
// out: {version, results: {id: {all: [{name, type, tonic, chroma}], with_tonic: [...]|null, sec_all, sec_tonic}}}
const path = require("path");
const fs = require("fs");
const root = path.resolve(__dirname, "../../../../../build/tonal/node_modules");
const { Scale } = require(path.join(root, "tonal"));
const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const inp = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const now = () => Number(process.hrtime.bigint()) / 1e9;
function detectAt(pcs, t) {
  const notes = pcs.map((p) => SHARP[p]);
  const names = Scale.detect(notes, { tonic: SHARP[t], match: "exact" });
  return names.map((n) => {
    const s = Scale.get(n);
    return { name: n, type: s.type, tonic: t, chroma: s.chroma };
  });
}
const results = {};
const T0 = now();
for (const q of inp) {
  const a0 = now();
  let all = [];
  for (const t of q.pcs) all = all.concat(detectAt(q.pcs, t));
  const a1 = now();
  let wt = null, b1 = null;
  if (q.tonic !== null && q.tonic !== undefined) {
    const b0 = now();
    wt = q.pcs.includes(q.tonic) ? detectAt(q.pcs, q.tonic) : [];
    b1 = now() - b0;
  }
  results[q.id] = { all, with_tonic: wt, sec_all: a1 - a0, sec_tonic: b1 };
}
fs.writeFileSync(process.argv[3], JSON.stringify({ version: { tonal: require(path.join(root, "tonal/package.json")).version, scale: require(path.join(root, "@tonaljs/scale/package.json")).version }, total_sec: now() - T0, results }));
console.log("queries", inp.length, "total sec", (now() - T0).toFixed(2));
