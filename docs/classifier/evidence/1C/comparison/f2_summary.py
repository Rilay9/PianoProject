"""reading.accidental-kinds: tables from the f2_osmd.py / f2_full.py outputs.

For every file, from the uniform confusion table (f2_osmd.confusion): notes matched to the render by (bar, staff, onset, letter, octave);
a reader 'disagrees' on a note when its shown/not-shown differs from the render's drawn/not-drawn. Grace notes are in the model's table
and not in the emulation's (the validators' emulation skips them), so the two readers are compared on their own matched notes and the
render-only notes (grace notes, or notes that found no partner) are counted apart.
Usage: python f2_summary.py <name> ...     (names: sample7 sample11 named, or full)
"""
import sys, json, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent


def load(name):
    if name == "full":
        res = {}
        for s in (0, 1):
            f = HERE / f"out/f2_full_{s}.json"
            if f.exists():
                res.update(json.load(open(f, encoding="utf8")))
        return res
    return {i: {"confusion": r.get("confusion"), "pipeline": r["pipeline"]} for i, r in json.load(open(HERE / f"out/f2_{name}.json", encoding="utf8")).items()}


def stats(res, label):
    per = {}
    T = collections.defaultdict(collections.Counter)
    skipped = errors = 0
    for i, r in res.items():
        c = r.get("confusion") if "confusion" in r else r
        if not c or "conf" not in c:
            if c and "skipped" in c: skipped += 1
            else: errors += 1
            continue
        p = {}
        for k, v in c["conf"].items():
            reader, fa, shown, drawn = k.split("|")
            shown, drawn = shown == "True", drawn == "True"
            key = (reader, fa)
            T[(reader, fa)]["notes"] += v
            T[(reader, fa)]["disagree"] += v if shown != drawn else 0
            T[(reader, fa)][("shown_not_drawn" if shown and not drawn else "drawn_not_shown" if drawn and not shown else "agree")] += v
            p[reader] = p.get(reader, 0) + (v if shown != drawn else 0)
        um = c["unmatched"]
        per[i] = {"model": p.get("model", 0), "emulation": p.get("emulation", 0), "pipeline": r["pipeline"],
                  "model_unpaired": um.get("model_no_partner", 0), "emu_unpaired": um.get("emu_no_partner", 0), "render_only_emu": um.get("render_no_partner_for_emulation", 0)}
    print(f"\n=== {label}: {len(res)} files ({len(per)} single-part files compared, {skipped} multi-part skipped, {errors} errors)")
    for reader in ("model", "emulation"):
        a, b = T[(reader, "file_acc")], T[(reader, "no_file_acc")]
        print(f"  {reader:9}: all matched notes {a['notes']+b['notes']}, disagree with the render {a['disagree']+b['disagree']} "
              f"({100*(a['disagree']+b['disagree'])/max(1,a['notes']+b['notes']):.3f}%) | notes WITH a file accidental {a['notes']}: disagree {a['disagree']} "
              f"({100*a['disagree']/max(1,a['notes']):.1f}%) [reader shows, render does not {a['shown_not_drawn']}; render draws, reader does not {a['drawn_not_shown']}] "
              f"| notes without one {b['notes']}: disagree {b['disagree']}")
    for reader in ("model", "emulation"):
        ok = sum(1 for v in per.values() if v[reader] == 0)
        print(f"  {reader:9}: files with zero disagreement {ok}/{len(per)}; by pipeline",
              {p: f"{sum(1 for v in per.values() if v['pipeline']==p and v[reader]==0)}/{sum(1 for v in per.values() if v['pipeline']==p)}" for p in ("generated", "pdmx", "other")})
    unaligned = [i for i, v in per.items() if v["emu_unpaired"] > 0.2 * max(1, sum(T[('emulation','file_acc')].values()) * 0) + 20]
    print("  emulation: files with 20+ emulation notes that found no partner in the render (alignment failures):", unaligned)
    return per


if __name__ == "__main__":
    allper = {}
    for name in sys.argv[1:]:
        allper[name] = stats(load(name), name)
    json.dump(allper, open(HERE / "out/f2_summary.json", "w"), indent=0)
