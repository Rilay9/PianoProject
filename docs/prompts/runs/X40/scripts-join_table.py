"""
X40's table (item 2): one row per MuseTrainer and kern catalogue row that builds a file.

Joins three read-only inputs, resolving nothing itself:
  - reader-dump.jsonl: the app's reader (`tempoEvents`, `openingTempo`) over each built file;
  - raw-scan.jsonl: the raw scan (every `<sound tempo>`, `<metronome>` and tempo `<words>`, unresolved);
  - the source tables (`musetrainer.json`, `kern.json`) and, for a kern row, its `.krn` file's own
    tempo statements (`*MM`, `!!!OMD`, `!LO:TX`), found through import_kern's own row expansion.

Usage: python join_table.py <reader-dump.jsonl> <raw-scan.jsonl> <out-dir> [R]
Writes table.json (full, machine-readable), table.tsv (full) and summary.txt.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "tools" / "content"))

import import_kern  # noqa: E402  (read-only: its row expansion and its file table)

R = float(sys.argv[4]) if len(sys.argv) > 4 else 1.1
TEMPO_WORDS = re.compile(
    r"\b(tempo|marcia|march|valse|waltz|slow|fast|largo|lento|adagio|andante|andantino|moderato|allegretto|"
    r"allegro|vivace|presto|grave|larghetto|maestoso|[0-9]+\s*bpm)\b|\[quarter\]|=\s*\d+|♩",
    re.I,
)


def ratio(a: float, b: float) -> float:
    return max(a, b) / min(a, b)


def load_jsonl(path: str) -> dict[str, dict]:
    return {row["id"]: row for row in (json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines() if line.strip())}


def mt_sources() -> dict[str, dict]:
    table = json.loads((REPO / "content" / "sources" / "musetrainer.json").read_text(encoding="utf-8"))
    out = {}
    for filename, spec in table["items"].items():
        if "id" not in spec:  # an edition exclusion: no row, no file
            continue
        out[spec["id"]] = {"key": filename, "tempoField": spec.get("tempo") or spec.get("tempoBpm"),
                           "editionNotes": spec.get("editionNotes")}
    return out


def kern_sources() -> dict[str, dict]:
    table = json.loads(import_kern.TABLE_PATH.read_text(encoding="utf-8"))
    rows = sorted(table.get("items", {}).items()) + import_kern.expand_groups(table, import_kern.ImportReport())
    out = {}
    for key, spec in rows:
        path = import_kern.KERN_DIR / key
        statements = []
        if path.exists():
            for number, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                tokens = line.split("\t")
                if any(t.startswith("*MM") for t in tokens):
                    statements.append({"line": number, "kind": "*MM", "text": " ".join(sorted({t for t in tokens if t.startswith("*MM")}))})
                elif line.startswith("!!!OMD"):
                    statements.append({"line": number, "kind": "OMD", "text": line.split(":", 1)[-1].strip()})
                elif "!LO:TX" in line:
                    for t in tokens:
                        if "!LO:TX" in t:
                            # The text parameter only (up to the next `:` parameter; `&colon;` is an escaped colon).
                            text = re.sub(r"^.*?:t=", "", t).split(":")[0].replace("&colon;", ":")
                            if TEMPO_WORDS.search(text):
                                statements.append({"line": number, "kind": "LO:TX", "text": text})
        out.setdefault(spec["id"], {"key": key, "tempoField": spec.get("tempo") or spec.get("tempoBpm"),
                                    "editionNotes": spec.get("editionNotes"), "statements": statements})
    return out


def tempo_prose(notes: str | None) -> str | None:
    if not notes:
        return None
    sentences = [s.strip() for s in re.split(r"(?<=[.;])\s+", notes) if TEMPO_WORDS.search(s)]
    return " / ".join(sentences) or None


def fmt_pos(measure: int, offset: float) -> str:
    return f"{measure}:{offset:g}"


def main() -> int:
    reader = load_jsonl(sys.argv[1])
    raw = load_jsonl(sys.argv[2])
    out_dir = Path(sys.argv[3])
    mt = mt_sources()
    kern = kern_sources()
    mt_built = json.loads((out_dir / "mt-sources.json").read_text(encoding="utf-8"))
    rows = []
    for rid, one in reader.items():
        scan = raw.get(rid, {"statements": [], "software": []})
        src = (mt if one["source"] == "MT" else kern).get(rid, {})
        events = one["events"]
        # The raw sounds and marks grouped by position, in score order.
        by_pos: dict[str, dict] = defaultdict(lambda: {"sounds": [], "marks": [], "words": []})
        for s in scan["statements"]:
            here = by_pos[fmt_pos(s["measure"], s["offset"])]
            if s["sound"] is not None:
                here["sounds"].append({"bpm": s["sound"], "words": s["words"], "withMark": bool(s["marks"]), "part": s["part"]})
            for m in s["marks"]:
                here["marks"].append({"beatUnit": m["beatUnit"], "dots": m["dots"], "perMinute": m["perMinute"], "quarters": m["quarters"], "part": s["part"]})
            here["words"] += s["words"]
        findings = []
        for e in events:
            if e["from"] == "sound" and e.get("mark") and ratio(e["bpm"], e["mark"]["quarters"]) > R:
                findings.append({"at": fmt_pos(e["measure"], e["offset"]), "sound": e["bpm"], "mark": e["mark"]["quarters"],
                                 "ratio": round(ratio(e["bpm"], e["mark"]["quarters"]), 4)})
        near = []  # every sound/mark pair the reader resolved, with its ratio above 1 (for choosing R)
        for e in events:
            if e["from"] == "sound" and e.get("mark") and e["bpm"] != e["mark"]["quarters"]:
                near.append({"at": fmt_pos(e["measure"], e["offset"]), "sound": e["bpm"], "mark": e["mark"]["quarters"],
                             "ratio": round(ratio(e["bpm"], e["mark"]["quarters"]), 4)})
        two_sounds = []
        for pos, here in by_pos.items():
            values = [s["bpm"] for s in here["sounds"]]
            if len(values) > 1:
                two_sounds.append({"at": pos, "sounds": values, "differ": len(set(values)) > 1})
        # A raw mark that disagrees with a raw sound at its position although the reader's event agrees
        # (the reader keeps the first of each): recorded so no disagreement hides behind the resolution.
        hidden = []
        for pos, here in by_pos.items():
            marks = [m["quarters"] for m in here["marks"] if m["quarters"]]
            for s in here["sounds"]:
                if marks and all(ratio(s["bpm"], m) > R for m in marks):
                    hidden.append({"at": pos, "sound": s["bpm"], "marks": marks})
        catalogue = one["catalogueTempoBpm"]
        opening = one["openingPlays"]
        cat_vs_opening = None if catalogue is None else (round(catalogue, 2) == round(opening, 2))
        # The source against the built file: what the importer did to the tempo statements.
        if one["source"] == "MT":
            info = mt_built.get(rid, {})
            if "no tempo of its own" in (info.get("normalised") or []):
                source_vs_built = "converted: the source states no tempo; convert.py wrote its default (96) as a printed mark and a sound"
            elif info.get("normalised") and not info.get("verbatim"):
                source_vs_built = f"converted ({'; '.join(info['normalised'])}): sounds {info['sourceSounds']}->{info['builtSounds']}, marks {info['sourceMetronomes']}->{info['builtMetronomes']}"
            elif info.get("verbatim"):
                source_vs_built = "verbatim copy" + (" (normalisation failed; copied as it is)" if info.get("normalised") else "")
            else:
                source_vs_built = "not verbatim (unexpected)"
            defaulted = "no tempo of its own" in (info.get("normalised") or [])
        else:
            mm = [s for s in (src.get("statements") or []) if s["kind"] == "*MM"]
            values = [float(s["text"].split()[0][3:]) for s in mm]
            played = [e["bpm"] for e in events]
            defaulted = not mm
            if not mm:
                source_vs_built = "the .krn states no *MM; convert.py wrote its default (96) as a printed mark and a sound"
            elif played == values:
                source_vs_built = f"plays every *MM ({len(mm)})"
            else:
                dropped = [f"*MM{v:g}@line {s['line']}" for s, v in zip(mm, values)][len(played):] if played == values[:len(played)] else None
                source_vs_built = (f"drops the later *MM: {', '.join(dropped)} (convert.py keeps the first tempo mark only)"
                                   if dropped else f"MISMATCH: *MM {values} vs played {played}")
        if defaulted:
            verdict = "no tempo (defaulted)"
        elif not events:
            verdict = "no tempo (defaulted)"
        elif findings:
            verdict = "sound contradicts the mark beyond R"
        elif any(t["differ"] for t in two_sounds):
            verdict = "two sounds at one position"
        else:
            verdict = "agrees"
        kinds = sorted({("mark+sound" if e.get("mark") else "sound") if e["from"] == "sound" else "mark" for e in events})
        shape = " / ".join(kinds) if kinds else "none"
        disagreements = [
            {"at": e and fmt_pos(e["measure"], e["offset"]), "plays": e["bpm"]}
            for e in events
            if any(f["at"] == fmt_pos(e["measure"], e["offset"]) for f in findings)
            or any(t["at"] == fmt_pos(e["measure"], e["offset"]) and t["differ"] for t in two_sounds)
        ]
        rows.append({
            "id": rid,
            "source": one["source"],
            "file": one["file"],
            "software": scan.get("software"),
            "sourceTable": {
                "key": src.get("key"),
                "tempoField": src.get("tempoField"),
                "editionNotesTempo": tempo_prose(src.get("editionNotes")),
                "kernStatements": src.get("statements"),
            },
            "printedMarks": [{"at": pos, **m} for pos, here in by_pos.items() for m in here["marks"]],
            "soundsByPosition": [{"at": pos, "sounds": here["sounds"], "words": here["words"]} for pos, here in by_pos.items() if here["sounds"]],
            "reader": {"events": events, "opening": one["opening"], "openingPlays": opening, "atDisagreements": disagreements},
            "catalogueTempoBpm": catalogue,
            "catalogueEqualsOpening": cat_vs_opening,
            "verdict": verdict,
            "sourceVsBuilt": source_vs_built,
            "shape": shape,
            "findings": findings,
            "unequalPairs": near,
            "twoSounds": two_sounds,
            "rawMarkSoundDisagreements": hidden,
            "rawStatements": len(scan["statements"]),
            "scanError": scan.get("error"),
        })
    rows.sort(key=lambda r: (r["source"], r["id"]))
    (out_dir / "table.json").write_text(json.dumps({"R": R, "rows": rows}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    def cell(v) -> str:
        return "" if v in (None, [], "") else json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v

    header = ["id", "source", "sourceTableTempo", "kernSourceStatements", "printedMarks", "soundsByPosition",
              "openingPlays", "playsAtDisagreements", "catalogueTempoBpm", "catalogueEqualsOpening", "verdict", "shape",
              "sourceVsBuilt"]
    lines = ["\t".join(header)]
    for r in rows:
        st = r["sourceTable"]
        table_tempo = (f"field: {st['tempoField']}" if st["tempoField"] else "") + (f"editionNotes: {st['editionNotesTempo']}" if st["editionNotesTempo"] else "")
        lines.append("\t".join(cell(x) for x in [
            r["id"], r["source"], table_tempo or "none",
            [f"{s['kind']}@{s['line']}: {s['text']}" for s in (st["kernStatements"] or [])],
            [f"{m['at']} {'+'.join(m['beatUnit'])}{'.' * m['dots']}={m['perMinute']} (q={m['quarters']:g})" if m["quarters"] else f"{m['at']} {'+'.join(m['beatUnit'])}={m['perMinute']} (unread)" for m in r["printedMarks"]],
            [f"{s['at']} " + ", ".join(f"{x['bpm']:g}" + (f" [{'/'.join(x['words'])}]" if x["words"] else "") + (" [mark]" if x["withMark"] else "") for x in s["sounds"]) for s in r["soundsByPosition"]],
            r["reader"]["openingPlays"], [f"{d['at']}: {d['plays']:g}" for d in r["reader"]["atDisagreements"]],
            r["catalogueTempoBpm"], r["catalogueEqualsOpening"], r["verdict"], r["shape"], r["sourceVsBuilt"],
        ]))
    (out_dir / "table.tsv").write_text("\n".join(lines) + "\n", encoding="utf-8")

    summary = [f"R = {R}", f"rows: {len(rows)} ({Counter(r['source'] for r in rows)})"]
    summary.append("verdicts by source: " + json.dumps({f"{s}/{v}": n for (s, v), n in sorted(Counter((r['source'], r['verdict']) for r in rows).items())}, ensure_ascii=False))
    summary.append("shapes by source: " + json.dumps({f"{s}/{v}": n for (s, v), n in sorted(Counter((r['source'], r['shape']) for r in rows).items())}, ensure_ascii=False))
    summary.append("source vs built: " + json.dumps(dict(sorted(Counter(f"{r['source']}/{r['sourceVsBuilt'].split(':')[0].split(' (')[0]}" for r in rows).items())), ensure_ascii=False))
    for r in rows:
        if r["sourceVsBuilt"].startswith(("drops", "MISMATCH", "not verbatim", "converted (")):
            summary.append(f"  {r['id']}: {r['sourceVsBuilt']}")
    summary.append("catalogue vs opening: " + json.dumps({f"{s}/{v}": n for (s, v), n in sorted(Counter((r['source'], str(r['catalogueEqualsOpening'])) for r in rows).items())}))
    summary.append("every unequal sound/mark pair the reader resolved (any ratio above 1):")
    for r in rows:
        for p in r["unequalPairs"]:
            summary.append(f"  {r['id']} @{p['at']}: sound {p['sound']:g} vs mark {p['mark']:g} (ratio {p['ratio']})")
    summary.append("two or more sounds at one position:")
    for r in rows:
        for t in r["twoSounds"]:
            summary.append(f"  {r['id']} @{t['at']}: {t['sounds']} {'DIFFER' if t['differ'] else 'equal'}")
    summary.append("raw mark/sound disagreements beyond R at one position:")
    for r in rows:
        for h in r["rawMarkSoundDisagreements"]:
            summary.append(f"  {r['id']} @{h['at']}: sound {h['sound']:g} vs marks {h['marks']}")
    summary.append("catalogue differs from the opening:")
    for r in rows:
        if r["catalogueEqualsOpening"] is False:
            summary.append(f"  {r['id']}: catalogue {r['catalogueTempoBpm']} vs opening plays {r['reader']['openingPlays']:g} (reader opening {r['reader']['opening']})")
    summary.append("catalogue has no tempo:")
    for r in rows:
        if r["catalogueTempoBpm"] is None:
            summary.append(f"  {r['id']}: opening plays {r['reader']['openingPlays']:g} (reader opening {r['reader']['opening']}); {r['verdict']}")
    (out_dir / "summary.txt").write_text("\n".join(summary) + "\n", encoding="utf-8")
    print("\n".join(summary[:6]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
