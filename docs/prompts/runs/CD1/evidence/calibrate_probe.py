"""CD1 scratch: D4a's derivation on the bridge's measurement of the declared items (information only, after the T7 stop)."""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "content"))
import demands  # noqa: E402

CONTENT = ROOT / "app" / "public" / "content"
catalog = {row["id"]: row for row in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))}
POS = {
    "rhythm.tresillo": ["exercise.tresillo.c", "exercise.tresillo.f", "exercise.tresillo.g", "song.jazz.the-crave"],
    "rhythm.habanera": ["song.folk.por-una-cabeza-carlos-gardel.pdmx", "song.ragtime.joplin-solace",
                        "song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx"],
}
NEG = {
    "rhythm.habanera": ["song.folk.auld-lang-syne-anonymous-traditional.pdmx", "song.classical.schumann-a-little-romance-op-68-no-19.pdmx",
                        "song.pop.toby-fox-sans-from-undertale-for-piano.pdmx"],
    "rhythm.tresillo": ["song.pop.john-legend-all-of-me-john-legend-easy-piano.pdmx",
                        "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx",
                        "song.pop.electric-light-orchestra-elo-mr-blue-sky-hard-piano.pdmx"],
}
ids = sorted({i for v in (*POS.values(), *NEG.values()) for i in v})
paths = {i: CONTENT / catalog[i]["file"] for i in ids}
rows = demands.measure_opportunities(list(paths.values()))
out = {}
for i in ids:
    row = rows[str(paths[i])]
    out[i] = {d: (row["opportunities"].get(d, 0), row["measures"]) for d in ("rhythm.habanera", "rhythm.tresillo")}
for demand, per in (("rhythm.habanera", 4), ("rhythm.tresillo", 3)):
    print("==", demand)
    pos = [(i, *out[i][demand]) for i in POS[demand]]
    for i, n, bars in pos:
        print(f"  + {i}: located {n} ({n // per} cells), bars {bars}, per bar {n / bars:.4f}")
    rule_min = min(n for _, n, _ in pos)
    rule_per = math.floor(min(n / b for _, n, b in pos) * 100) / 100
    print(f"  rule: min {rule_min}, perBar {rule_per}")
    for i in NEG[demand]:
        n, bars = out[i][demand]
        est = n >= rule_min and n / max(bars, 1) >= rule_per and n > 0
        print(f"  - {i}: located {n}, bars {bars}, per bar {n / max(bars,1):.4f} -> {'ESTABLISHED (crosses)' if est else 'rejected'}"
              f" (by min: {n < rule_min}, by perBar: {n / max(bars,1) < rule_per})")
(ROOT / "build" / "CD1" / "calibration-probe.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
