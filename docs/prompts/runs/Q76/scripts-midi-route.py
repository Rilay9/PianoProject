"""
Writes midi-route.txt: the reviewer's first fallback measured on ragtime.8's two Mutopia rags. For each: the import's
conversion (tools/content/import_mutopia.convert_item, no cache) and its report (the converter's read-back, the spelling
from the edition, the key changes); the written file's bars, left-hand pattern (printed bars where it fails), ties,
level-model estimate and tempo; and how many notes the converter alone (its key-based spelling) spells differently from
the edition, with the first few.

    python scripts-midi-route.py <scratch dir>
"""
import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve()
REPO = HERE.parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))
import demands as D  # noqa: E402
import difficulty  # noqa: E402
import import_mutopia as M  # noqa: E402
from convert import convert_file  # noqa: E402
from music21 import converter  # noqa: E402

scratch = Path(sys.argv[1])
scratch.mkdir(parents=True, exist_ok=True)
table = json.loads((REPO / "content" / "sources" / "mutopia.json").read_text(encoding="utf-8"))
pine = next(r for r in table["items"] if r["id"].startswith("song.ragtime.joplin-pine-apple-rag"))
magnetic = {**pine, "id": "song.ragtime.joplin-magnetic-rag.mutopia", "title": "Magnetic Rag",
            "ly": {"path": "JoplinS/magnetic/magnetic.ly"}, "midi": {"path": "JoplinS/magnetic/magnetic.mid"},
            "staves": ["top", "bottom"], "key": "Bb major", "timeSig": "4/4"}
lines = []
for row in (pine, magnetic):
    ly = M.SOURCES_DIR / row["ly"]["path"]
    mid = M.SOURCES_DIR / row["midi"]["path"]
    try:
        staged, report = M.convert_item(row, ly, mid, work_dir=scratch / row["id"].split(".")[2][:12], use_cache=False)
    except M.Refused as refused:
        lines.append(f"== {row['title']}: refused: {refused}")
        continue
    written = scratch / "written" / f"{row['id']}.mxl"
    written.parent.mkdir(parents=True, exist_ok=True)
    result = convert_file(staged, written)
    measured = D.measure_each([written])[str(written)]
    every = (measured.get("everyBar") or {}).get("texture.left-hand-pattern") or []
    failing = sorted(set(range(1, int(measured["printedBars"]) + 1)) - set(every))
    level = difficulty.estimate(difficulty.features(converter.parse(str(written)))).level
    # the converter alone: its key-based spelling, against the edition's
    m2x = M._midi_converter()
    raw = scratch / f"{row['id']}.converter-only.musicxml"
    m2x.convert(mid, raw, divisors=(4, 3), respell=True, force=True, forced_key=m2x.parse_key(row["key"]),
                hands="auto", swing=False)
    alone, edited = converter.parse(str(raw)), converter.parse(str(staged))
    differ = []
    for part_alone, part_edited in zip(alone.parts, edited.parts):
        for a, b in zip(M._note_starts(part_alone), M._note_starts(part_edited)):
            if a.pitch.midi == b.pitch.midi and a.pitch.name != b.pitch.name:
                differ.append(f"{a.pitch.nameWithOctave} for the edition's {b.pitch.nameWithOctave}")
    lines.append(f"== {row['title']}")
    lines.append(f"   the import's report: {json.dumps(report)}")
    lines.append(f"   written: {result.measures} bars, {result.note_events} note events, tempo {result.tempo_bpm} "
                 f"(added by the converter: {result.added_tempo})")
    lines.append(f"   left-hand pattern: {'in every bar' if not failing else 'fails at printed bars ' + str(failing)}; "
                 f"ties located {int((measured.get('opportunities') or {}).get('rhythm.ties', 0))}; level model {level}")
    lines.append(f"   the converter alone spells {len(differ)} note(s) differently from the edition; the first: {differ[:6]}")
text = "\n".join(lines) + "\n"
(HERE.parent / "midi-route.txt").write_text(text, encoding="utf-8")
print(text)
