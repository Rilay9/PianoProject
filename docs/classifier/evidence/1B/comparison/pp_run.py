"""Run pianoplayer (build/pianoplayer @ 6fb0e211, 3.0.2) on the items of hand_manifest.json (truth + named).
Run with build/venv-pp/Scripts/python.exe. Printed fingering is stripped from the input first (so the output holds only
pianoplayer's own fingering). Hand = pianoplayer's own auto-routing (staff 1 -> right, staff 2 -> left; two parts: part 0
right, part 1 left); a single-staff item declared 'left' is run left_only so it is fingered as a left hand.
Writes build/ppout/<id>.xml and pp_times.json (seconds per item, measured on this machine, one process)."""
import json, re, sys, time, zipfile, os, logging
from pathlib import Path

HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
CONTENT = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject/app/public/content")
OUT = WT / "build/ppout"
OUT.mkdir(parents=True, exist_ok=True)
TMP = WT / "build/pptmp"
TMP.mkdir(parents=True, exist_ok=True)
logging.disable(logging.CRITICAL)
from pianoplayer.core import run_annotate

man = json.load(open(HERE / "hand_manifest.json"))
items = {}
for x in man["truth"] + man["named"]:
    items[x["id"]] = x
only = sys.argv[1:] or None
tag = 'all'
if only == ["@named"]:
    only = [x["id"] for x in man["named"]]
    tag = "named"
elif only == ["@truth_rev"]:
    only = [x["id"] for x in reversed(man["truth"])]
    tag = "truth_rev"
else:
    tag = "partial" if only else "all"
times, errs = {}, {}
for k in (only or list(items)):
    x = items.get(k)
    if x is None:
        continue
    if (OUT / (k + ".xml")).exists() and (OUT / (k + ".xml")).stat().st_size > 0 and not os.environ.get("PP_REDO"):
        continue
    p = CONTENT / x["file"]
    if p.suffix == ".mxl":
        with zipfile.ZipFile(p) as z:
            names = [n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META")]
            txt = z.read(names[0]).decode("utf-8")
    else:
        txt = p.read_text(encoding="utf-8")
    txt = re.sub(r"<fingering\b[^>]*>.*?</fingering>", "", txt, flags=re.S)
    txt = re.sub(r"<fingering\b[^>]*/>", "", txt)
    src = TMP / (k + ".xml")
    src.write_text(txt, encoding="utf-8")
    t0 = time.perf_counter()
    try:
        run_annotate(str(src), str(OUT / (k + ".xml")), quiet=True, left_only=(x.get("hands") == "left"))
        times[k] = round(time.perf_counter() - t0, 3)
    except Exception as e:
        errs[k] = f"{type(e).__name__}: {str(e)[:200]}"
    json.dump({"times": times, "errors": errs}, open(HERE / (f"pp_times_{tag}.json"), "w"), indent=0)
print("done", len(times), "errors", len(errs))
for k, v in list(errs.items())[:10]:
    print(k, v)
