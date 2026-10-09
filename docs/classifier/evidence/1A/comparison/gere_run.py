"""Run the Gere et al. checkers over a list of files with one try/except per file (run in build/venv-gere as C:/vgere).

Why: `detect_errors check --mode both` on the 2,020 catalogue files stopped without writing its output at about 75% of the contextual
pass, on an uncaught IndexError inside partitura 1.7.0 `unfold_paths` (repeat unfolding; the traceback is in build/gere_cat.log). This
driver calls the repository's own `check_path` functions exactly as its cli.py does (same arguments, same order: individual for all,
contextual for the files with no individual error) and records a crash per file instead of stopping. Output has cli.py's structure
plus a "crashed" key. Usage: C:/vgere/Scripts/python.exe gere_run.py <list.txt> <out.json>
"""
import sys, json, time, traceback, warnings, logging
from pathlib import Path
from functools import partial

WT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(WT / "build/gere/src"))
logging.disable(logging.CRITICAL)
from contextual_errors_checker import check_path as check_ctx          # noqa: E402
from individual_errors_checker import check_path as check_ind          # noqa: E402

paths = [Path(l.strip()) for l in open(sys.argv[1], encoding="utf8") if l.strip()]
out = {"individual": {}, "contextual": {}, "crashed": {}, "seconds": {}}
t0 = time.time()
for i, p in enumerate(paths):
    t = time.perf_counter()
    try:
        r = check_ind(p)
        if r:
            out["individual"][p.as_posix()] = {m: [str(e) for e in v] for m, v in r.items()}
            out["seconds"][p.as_posix()] = round(time.perf_counter() - t, 3)
            continue
    except Exception as e:                                          # noqa
        out["crashed"][p.as_posix()] = "individual: " + repr(e)[:200]
        continue
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            r = check_ctx(p, allow_longer_measures=False, allow_duplicate_notes_in_chord=False)
        if r:
            out["contextual"][p.as_posix()] = {m: [str(e) for e in v] for m, v in r.items()}
    except RecursionError as e:                                     # noqa
        out["crashed"][p.as_posix()] = "contextual: RecursionError"
    except Exception as e:                                          # noqa
        out["crashed"][p.as_posix()] = "contextual: " + repr(e)[:200]
    out["seconds"][p.as_posix()] = round(time.perf_counter() - t, 3)
    if i % 200 == 0:
        print(i, len(paths), round(time.time() - t0), flush=True)
json.dump(out, open(sys.argv[2], "w", encoding="utf8"), indent=0)
print("done", len(paths), "individual", len(out["individual"]), "contextual", len(out["contextual"]), "crashed", len(out["crashed"]))
