"""reading.accidental-kinds: three readers of 'which accidentals are drawn', against the render.

  model      = the rule's own model (common.accidental_model, class in required/courtesy/courtesy_marked/missing = shown)
  emulation  = osmd_emul.osmd_model (the validators' re-implementation of OSMD 2.1.2 checkAccidental)
  render     = OSMD 2.1.2 itself, rendered under jsdom by osmd_acc.cjs (the app's renderer, its DrawnAccidental per note)

The validators' compare() (model vs render) and run() (emulation vs render) are called UNCHANGED; the only things
patched are where the unzipped XML is written (build/xml1a) and that node's output is cached (build/osmd1a) so one
render serves both comparisons. In addition a uniform per-note confusion table is computed for both readers against
the render with the same note key the validators use (bar index, staff, onset, letter, octave).

Usage: python f2_osmd.py <name> [ids...]    name = sample7 (the validators' 30, seed 7) | sample11 (30 new, seed 11) | named | nifc | ids
Writes out/f2_<name>.json.
"""
import sys, json, collections, random, subprocess, zipfile, hashlib, time
import xml.etree.ElementTree as ET
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path[:0] = [str(HERE / "shim1a"), str((HERE / "../../1A/validation").resolve())]
import walk
from common import *
import osmd_compare, osmd_emul

ROOT = walk.ROOT
XMLDIR = ROOT / "build" / "xml1a"
RDIR = ROOT / "build" / "osmd1a"
XMLDIR.mkdir(parents=True, exist_ok=True)
RDIR.mkdir(parents=True, exist_ok=True)


def to_xml(i):
    out = XMLDIR / (i + ".xml")
    if out.exists():
        return out
    with zipfile.ZipFile(walk.CONTENT / BYID[i]["file"]) as z:
        names = z.namelist(); rf = None
        if "META-INF/container.xml" in names:
            c = ET.fromstring(z.read("META-INF/container.xml"))
            for e in c.iter():
                if e.tag.endswith("rootfile"):
                    rf = e.get("full-path"); break
        rf = rf or [n for n in names if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))][0]
        out.write_bytes(z.read(rf))
    return out


osmd_compare.to_xml = to_xml
osmd_emul.to_xml = to_xml
_real_run = subprocess.run


def cached_run(cmd, **kw):
    if cmd and cmd[0] == "node":
        f = RDIR / (Path(cmd[-1]).stem + ".json")
        if f.exists():
            return subprocess.CompletedProcess(cmd, 0, f.read_text(encoding="utf8"), "")
        p = _real_run(cmd, **kw)
        if p.returncode == 0:
            f.write_text(p.stdout, encoding="utf8")
        return p
    return _real_run(cmd, **kw)


subprocess.run = cached_run
osmd_compare.subprocess.run = cached_run


def render(i):
    p = cached_run(["node", "osmd_acc.cjs", str(to_xml(i))], capture_output=True, text=True, timeout=1800, cwd=walk.HERE)
    if p.returncode != 0:
        return None
    return json.loads(p.stdout)


def key_of(r):
    key = r["note"].split(",")[0].replace("Key: ", "")
    octv = int(r["note"].split("octave: ")[1]) + 3
    return (r["m"], r["staff"], round(r["t"], 3), key[0], octv)


def confusion(i):
    """Uniform per-note table, single-part files only (the validators' scope). Returns counts keyed by (reader, class, reader_says, render_says)
    and the number of notes of each side that found no partner (alignment)."""
    w = cache(i)
    if len(w["parts"]) != 1:
        return {"skipped": "more than one part"}
    rr = render(i)
    if rr is None:
        return {"error": "render failed"}
    draw = collections.Counter()
    for r in rr:
        draw[key_of(r) + (r["drawn"] not in (None, "NONE"),)] += 1
    out = collections.Counter()
    unmatched = collections.Counter()
    # model
    d2 = draw.copy()
    for n, cls, info in accidental_model(w):
        if n["grace"]:
            continue
        k0 = (n["m"], n["staff"], round(float(n["t"]), 3), n["step"], n["octave"])
        shown = cls in osmd_compare.SHOWN
        if d2.get(k0 + (True,), 0) > 0:
            d2[k0 + (True,)] -= 1; drawn = True
        elif d2.get(k0 + (False,), 0) > 0:
            d2[k0 + (False,)] -= 1; drawn = False
        else:
            unmatched["model_no_partner"] += 1; continue
        out[("model", "file_acc" if n["acc"] else "no_file_acc", shown, drawn)] += 1
    unmatched["render_no_partner_for_model"] = sum(v for v in d2.values() if v > 0)
    # emulation (its own note set: no grace notes)
    emu = osmd_emul.osmd_model(w)
    d3 = draw.copy()
    accs = collections.defaultdict(list)
    for n in w["notes"]:
        if n["rest"] or n["step"] is None or n["grace"]:
            continue
        accs[(n["m"], n["staff"], round(float(n["t"]), 3), n["step"], n["octave"])].append(n["acc"])
    for k, c in emu.items():
        for _ in range(c):
            k0, shown = k[:5], k[5]
            if d3.get(k0 + (True,), 0) > 0 and shown:
                d3[k0 + (True,)] -= 1; drawn = True
            elif d3.get(k0 + (False,), 0) > 0 and not shown:
                d3[k0 + (False,)] -= 1; drawn = False
            elif d3.get(k0 + (not shown,), 0) > 0:
                d3[k0 + (not shown,)] -= 1; drawn = not shown
            else:
                unmatched["emu_no_partner"] += 1; continue
            fa = any(accs.get(k0, [None]))
            out[("emulation", "file_acc" if fa else "no_file_acc", shown, drawn)] += 1
    unmatched["render_no_partner_for_emulation"] = sum(v for v in d3.values() if v > 0)
    return {"conf": {"|".join(map(str, k)): v for k, v in out.items()}, "unmatched": dict(unmatched), "render_notes": len(rr)}


def ids_for(name, extra):
    gen = [i for i in BYID if pipeline(i) == "generated"]
    pd = [i for i in BYID if pipeline(i) == "pdmx"]
    ot = [i for i in BYID if pipeline(i) == "other"]
    if name in ("sample7", "sample11"):
        random.seed(7 if name == "sample7" else 11)
        ids = random.sample(gen, 12) + random.sample(pd, 12) + random.sample(ot, 6)
        if name == "sample11":
            old = set(ids_for("sample7", []))
            random.seed(11)
            while any(i in old for i in ids):  # fresh draw: no file of the validators' sample
                ids = [i for i in ids if i not in old]
                pool = [(gen, 12), (pd, 12), (ot, 6)]
                ids = []
                for p, k in pool:
                    ids += random.sample([x for x in p if x not in old], k)
        return ids
    if name == "named":
        return ["exercise.blues-scale.b-flat.1oct.right", "exercise.chromatic.d.1oct.right",
                "exercise.scale.g-sharp-harmonic-minor.1oct.similar.both.2",
                "song.classical.debussy-children-s-corner-the-little-shepherd.pdmx",
                "song.classical.1818-franz-xaver-gruber-silent-night.pdmx"]
    return extra


if __name__ == "__main__":
    name, extra = sys.argv[1], sys.argv[2:]
    ids = ids_for(name, extra)
    res = {}
    t0 = time.time()
    for i in ids:
        t1 = time.time()
        r = {"pipeline": pipeline(i)}
        try:
            r["model_vs_render"] = osmd_compare.compare(i)
            r["emulation_vs_render"] = osmd_emul.run(i)
            r["confusion"] = confusion(i)
        except Exception as e:
            r["error"] = repr(e)
        r["seconds"] = round(time.time() - t1, 1)
        res[i] = r
        print(i, r["seconds"], "s", json.dumps(r.get("emulation_vs_render"))[:160], flush=True)
    json.dump(res, open(HERE / f"out/f2_{name}.json", "w", encoding="utf8"), indent=1)
    print("done", len(res), "files in", round(time.time() - t0), "s")
