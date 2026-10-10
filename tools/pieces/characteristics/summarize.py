"""One row per candidate file from build/pieces/characteristics.jsonl: the published level where chosen.csv has one,
then the headline figure of each characteristic row, for difficulty work and for review. Writes
docs/pieces/characteristics-summary.csv (pushed; build/ is not) and docs/pieces/characteristics.jsonl.gz (the full
per-row results, compressed). Usage: python tools/pieces/characteristics/summarize.py
"""
import csv, gzip, json, os, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))


def g(d, *path, default=""):
    for p in path:
        if not isinstance(d, dict) or p not in d:
            return default
        d = d[p]
    return d


def staff_pair(r, row, key):
    """Value for staff 1 and staff 2 of a per-staff row, as 'a|b' (blank where absent)."""
    d = r.get(row) or {}
    return "|".join(str(g(d, s, key)) for s in ("1", "2"))


def main():
    src = os.path.join(ROOT, "build", "pieces", "characteristics.jsonl")
    chosen = {x["candidate_file"]: x for x in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "chosen.csv"), encoding="utf-8"))}
    passing = {x["file"]: x for x in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "candidates-passing.csv"), encoding="utf-8"))}
    rows = []
    for line in open(src, encoding="utf-8"):
        r = json.loads(line)
        f = r["file"]
        c, p = chosen.get(f, {}), passing.get(f, {})
        e25 = r.get("E25") or {}
        spans = e25.get("spans") or []
        e09 = r.get("E09") or {}
        out = {
            "file": f, "in_chosen": bool(c), "chosen_level": c.get("level", ""),
            "list_level": p.get("list_level", ""), "list": p.get("list", ""),
            "composer": c.get("composer") or p.get("composer", ""), "title": c.get("title") or p.get("title", ""),
            "error": r.get("parse_error", "") or ";".join(k for k, v in r.items() if isinstance(v, dict) and "ERROR" in v),
            "layout": g(r, "E01", "layout"), "two_piano_staves": bool(g(r, "E01", "two_piano_staves", default=None)),
            "stored_measures": g(r, "E32", "stored_measures"), "printed_bars": g(r, "E32", "bars"),
            "quarters": g(r, "E32", "quarters_decimal"), "pickup": g(r, "E32", "pickup"),
            "time_signatures": " ".join(x.get("time", "") for x in e09.get("signatures", [])),
            "metre_classes": " ".join(e09.get("classes", [])), "time_changes": e09.get("n_changes", ""),
            "key_fifths_start": g(r, "E06", "start", "1", "fifths"), "key_changes": g(r, "E06", "n_changes"),
            "clef_changes": g(r, "E03", "n_changes"),
            "tempo_source": e25.get("source", ""), "opening_qpm": spans[0]["qpm"] if spans else "",
            "attacks_per_second": g(r, "D01", "all", "attacks_per_second"), "notes_per_second": g(r, "D01", "all", "notes_per_second"),
            "densest_4_bars_attacks_per_second": g(r, "D01", "all", "densest_4_bars_attacks_per_second"),
            "known_tempo_share": g(r, "D01", "known_tempo_share"),
            "range_low|high_s1": "|".join(str(g(r, "E33", "1", k)) for k in ("low", "high")),
            "range_low|high_s2": "|".join(str(g(r, "E33", "2", k)) for k in ("low", "high")),
            "ledger_max_above_s1|s2": staff_pair(r, "E05", "max_above"), "ledger_max_below_s1|s2": staff_pair(r, "E05", "max_below"),
            "accidentals_per_100_s1|s2": staff_pair(r, "E07", "per_100_notes"),
            "shortest_value_s1|s2": staff_pair(r, "E11", "shortest"),
            "dotted_q_e_s1|s2": staff_pair(r, "E12", "dotted_quarter_eighth"), "dotted_e_s_s1|s2": staff_pair(r, "E12", "dotted_eighth_sixteenth"),
            "tuplet_runs_s1|s2": staff_pair(r, "E13", "runs"), "grace_notes_s1|s2": staff_pair(r, "E14", "n"),
            "largest_chord_s1|s2": staff_pair(r, "E36", "largest"), "span_max_s1|s2": staff_pair(r, "E37", "span_max"),
            "octave_dyads_s1|s2": staff_pair(r, "E38", "octave_dyads"),
            "jumps_over_12_s1|s2": staff_pair(r, "E39", "jumps_over_12_within_2q"),
            "repeated_pitch_run_s1|s2": staff_pair(r, "E40", "repeated_pitch_run"), "equal_value_run_s1|s2": staff_pair(r, "E40", "equal_value_run"),
            "bars_2plus_voices_s1|s2": staff_pair(r, "E41", "bars_2plus_note_voices"),
            "shared_attack_share": g(r, "E43", "shared_attack_share"), "turn_taking_bars": g(r, "E44", "turn_taking_bars"),
            "black_key_share": g(r, "E34", "all", "black_share"), "pitch_entropy": g(r, "E35", "all", "pitch_entropy"),
            "ottava_spans": g(r, "E04", "n_spans"), "pedal_share_bars": g(r, "E24", "share_bars_under_pedal", default=""),
            "fingered_share_s1|s2": staff_pair(r, "E27", "share_fingered"),
            "chord_symbols": g(r, "E29", "n", default=""), "repeats_backward": g(r, "E31", "backward", default=""),
            "median_notes_per_quarter_s1|s2": staff_pair(r, "E46", "median_notes_per_quarter"),
        }
        rows.append(out)
    rows.sort(key=lambda x: (not x["in_chosen"], x["chosen_level"], x["file"]))
    target = os.path.join(ROOT, "docs", "pieces", "characteristics-summary.csv")
    with open(target, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    with open(src, "rb") as a, gzip.open(os.path.join(ROOT, "docs", "pieces", "characteristics.jsonl.gz"), "wb") as b:
        shutil.copyfileobj(a, b)
    print(len(rows), "rows ->", target, "; chosen:", sum(x["in_chosen"] for x in rows))


if __name__ == "__main__":
    main()
