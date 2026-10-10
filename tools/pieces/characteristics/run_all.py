"""Runs every characteristic function on every candidate file (docs/pieces/candidates-passing.csv + chosen.csv), one
music21 parse per file, and writes build/pieces/characteristics.jsonl (one line per file: each row's result, or its
error) plus a summary of errors and time per row. Usage: python tools/pieces/characteristics/run_all.py [N files]
"""
import csv, json, os, sys, time, traceback, warnings
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
FILES = os.path.join(ROOT, "build", "pieces", "files")
sys.path.insert(0, HERE)

ROWS = [("E01", "e01_layout", "layout", 0), ("E02", "e02_bars", "bars", 1), ("E03", "e03_clefs", "clefs", 0),
        ("E04", "e04_ottava", "ottava", 1), ("E05", "e05_ledger", "ledger", 1), ("E06", "e06_keys", "keys", 0),
        ("E07", "e07_accidentals", "accidentals", 1), ("E08", "e08_signature_exercised", "signature_exercised", 0),
        ("E09", "e09_times", "times", 1), ("E10", "e10_pickup", "pickup", 1), ("E11", "e11_values", "values", 1),
        ("E12", "e12_dotted", "dotted", 0), ("E13", "e13_tuplets", "tuplets", 1), ("E14", "e14_grace", "grace", 1),
        ("E15", "e15_ornaments", "ornaments", 0), ("E16", "e16_arpeggiate", "arpeggiate", 0),
        ("E17", "e17_tremolo", "tremolo", 0), ("E18", "e18_glissando", "glissando", 0), ("E19", "e19_fermata", "fermata", 1),
        ("E20", "e20_dynamics", "dynamics", 0), ("E21", "e21_hairpins", "hairpins", 1),
        ("E22", "e22_articulations", "articulations", 0), ("E23", "e23_slurs", "slurs", 1), ("E24", "e24_pedal", "pedal", 1),
        ("E25", "e25_tempo", "tempo", 1), ("E26", "e26_tempo_change", "tempo_change", 1), ("E27", "e27_fingering", "fingering", 0),
        ("E29", "e29_chord_symbols", "chord_symbols", 0), ("E30", "e30_slash", "slash_notation", 1),
        ("E31", "e31_repeats", "repeats_and_jumps", 1), ("E32", "e32_length", "length", 1), ("E33", "e33_range", "pitch_range", 0),
        ("E34", "e34_pitch_inventory", "pitch_inventory", 0), ("E35", "e35_pitch_entropy", "pitch_entropy", 0),
        ("E36", "e36_simultaneous", "simultaneous", 0), ("E37", "e37_span", "span", 0), ("E38", "e38_octaves", "octaves", 0),
        ("E39", "e39_movement", "movement", 0), ("E40", "e40_runs", "runs", 0), ("E41", "e41_voices", "voices", 0),
        ("E42", "e42_rates", "rates", 0), ("E43", "e43_shared_attacks", "shared_attacks", 0),
        ("E44", "e44_turn_taking", "turn_taking", 0), ("E45", "e45_hold_and_move", "hold_and_move", 0),
        ("E46", "e46_density", "density", 1), ("D01", "d01_rate", "rate", 1)]


def candidate_files():
    files = [r["file"] for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "candidates-passing.csv"), encoding="utf-8"))]
    files += [r["candidate_file"] for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "chosen.csv"), encoding="utf-8"))]
    return sorted(set(files))


def path_of(f):
    return os.path.join(FILES, os.path.basename(f)) if f.startswith("./mxl") else os.path.join(ROOT, f)


def jsonable(o):
    if isinstance(o, Fraction):
        return str(o)
    if isinstance(o, dict):
        return {str(k): jsonable(v) for k, v in o.items()}
    if isinstance(o, (list, tuple, set)):
        return [jsonable(v) for v in o]
    return o


def work(f):
    warnings.filterwarnings("ignore")
    import importlib
    import music21 as m
    p = path_of(f)
    out = {"file": f, "times": {}}
    t0 = time.time()
    try:
        score = m.converter.parse(p)
    except Exception as e:  # noqa: BLE001
        out["parse_error"] = f"{type(e).__name__}: {e}"
        return out
    out["times"]["parse"] = round(time.time() - t0, 2)
    for rid, mod, fn, needs_path in ROWS:
        t = time.time()
        try:
            func = getattr(importlib.import_module(mod), fn)
            out[rid] = jsonable(func(score, p) if needs_path else func(score))
        except Exception as e:  # noqa: BLE001
            out[rid] = {"ERROR": f"{type(e).__name__}: {e}", "where": traceback.format_exc().strip().splitlines()[-3:]}
        out["times"][rid] = round(time.time() - t, 2)
    return out


def main():
    from collections import Counter
    from multiprocessing import Pool
    files = candidate_files()
    if len(sys.argv) > 1:
        files = files[:int(sys.argv[1])]
    errors, times, parse_errors = Counter(), Counter(), 0
    examples = {}
    target = os.path.join(ROOT, "build", "pieces", "characteristics.jsonl")
    with open(target, "w", encoding="utf-8") as fh, Pool(3) as pool:
        for r in pool.imap_unordered(work, files, chunksize=2):
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
            if "parse_error" in r:
                parse_errors += 1
                continue
            for rid, *_ in ROWS:
                times[rid] += r["times"].get(rid, 0)
                if isinstance(r.get(rid), dict) and "ERROR" in r[rid]:
                    errors[rid] += 1
                    examples.setdefault(rid, (r["file"], r[rid]["ERROR"], r[rid]["where"]))
    print(f"{len(files)} files -> {target}; parse errors {parse_errors}")
    print("errors per row:", dict(errors) or "none")
    for rid, ex in examples.items():
        print(" ", rid, ex[0], ex[1], ex[2][-1] if ex[2] else "")
    print("seconds per row (summed over files):", {k: round(v) for k, v in times.most_common()})
    if parse_errors or errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
