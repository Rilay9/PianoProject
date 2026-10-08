"""Compare the section 12 model of 'shown' accidentals with what OSMD 2.1.2 actually draws (rendered under jsdom)."""
import sys, json, random, subprocess, collections
from common import *
from walk import HERE
import zipfile, xml.etree.ElementTree as ET

SHOWN = {"required", "courtesy", "courtesy_marked", "missing"}


def to_xml(i):
    out = HERE / "xml" / (i + ".xml")
    if out.exists():
        return out
    with zipfile.ZipFile(HERE / BYID[i]["file"]) as z:
        names = z.namelist(); rf = None
        if "META-INF/container.xml" in names:
            c = ET.fromstring(z.read("META-INF/container.xml"))
            for e in c.iter():
                if e.tag.endswith("rootfile"):
                    rf = e.get("full-path"); break
        rf = rf or [n for n in names if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))][0]
        (HERE / "xml").mkdir(exist_ok=True)
        out.write_bytes(z.read(rf))
    return out


def compare(i):
    w = cache(i)
    mine = collections.Counter()
    for n, cls, info in accidental_model(w):
        if n["grace"] or len(w["parts"]) != 1:
            continue
        mine[(n["m"], n["staff"], round(float(n["t"]), 3), n["step"], n["octave"], cls in SHOWN, cls)] += 1
    p = subprocess.run(["node", "osmd_acc.cjs", str(to_xml(i))], capture_output=True, text=True, timeout=600, cwd=HERE)
    if p.returncode != 0:
        return {"error": p.stderr[-300:]}
    osmd = collections.Counter()
    for r in json.loads(p.stdout):
        key = r["note"].split(",")[0].replace("Key: ", "")
        octv = int(r["note"].split("octave: ")[1]) + 3
        osmd[(r["m"], r["staff"], round(r["t"], 3), key[0], octv)] += 0
        osmd[(r["m"], r["staff"], round(r["t"], 3), key[0], octv, r["drawn"] not in (None, "NONE"))] += 1
    agree = dis = unmatched = 0
    by = collections.Counter()
    ex = []
    for k, c in mine.items():
        m, st, t, step, octv, shown, cls = k
        o_shown = osmd.get((m, st, t, step, octv, shown), 0)
        o_other = osmd.get((m, st, t, step, octv, not shown), 0)
        if o_shown >= c:
            agree += c; by[(cls, "agree")] += c
            osmd[(m, st, t, step, octv, shown)] -= c
        elif o_other:
            dis += c; by[(cls, "osmd_shows" if not shown else "osmd_hides")] += c
            if len(ex) < 4:
                ex.append((m, st, t, step + str(octv), cls))
        else:
            unmatched += c
    return {"agree": agree, "disagree": dis, "unmatched": unmatched, "by": {f"{a}/{b}": v for (a, b), v in by.items() if b != "agree" or a in SHOWN or a == "in_file_not_shown"}, "ex": ex}


if __name__ == "__main__":
    ids = sys.argv[1:]
    if ids and ids[0] == "sample":
        random.seed(7)
        gen = [i for i in BYID if pipeline(i) == "generated"]
        pd = [i for i in BYID if pipeline(i) == "pdmx"]
        ot = [i for i in BYID if pipeline(i) == "other"]
        ids = random.sample(gen, 12) + random.sample(pd, 12) + random.sample(ot, 6)
    tot = collections.Counter()
    for i in ids:
        try:
            r = compare(i)
        except Exception as e:
            r = {"error": repr(e)}
        print(i, json.dumps(r))
        for k in ("agree", "disagree", "unmatched"):
            tot[k] += r.get(k, 0)
        for k, v in r.get("by", {}).items():
            tot[k] += v
    print("TOTAL", dict(tot))
