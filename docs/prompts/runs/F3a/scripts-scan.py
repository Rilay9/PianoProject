"""Read the built scores F3a's sentences name: pedal marks, ornaments, tempo words, pitch range."""
import json
import re
import sys
import zipfile
from pathlib import Path

WT = Path(__file__).resolve().parents[2]
root = Path(sys.argv[1]) if len(sys.argv) > 1 else WT / "app" / "public" / "content"
cat = json.loads((root / "catalog.json").read_text(encoding="utf-8"))
by = {r["id"]: r for r in cat}
cur = json.loads((root / "curriculum.json").read_text(encoding="utf-8"))


def rung(lesson_id):
    for st in cur["stages"]:
        for u in st["units"]:
            for l in u["lessons"]:
                if l["id"] == lesson_id:
                    return l
    return None


def xml_of(item_id):
    f = root / by[item_id]["file"]
    if f.suffix == ".mxl":
        with zipfile.ZipFile(f) as z:
            names = [n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META-INF")]
            return z.read(names[0]).decode("utf-8", "replace")
    return f.read_text(encoding="utf-8", errors="replace")


PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi_range(xml, staff=None):
    out = []
    for n in re.finditer(r"<note\b[\s\S]*?</note>", xml):
        s = n.group(0)
        if "<rest" in s:
            continue
        if staff is not None:
            m = re.search(r"<staff>(\d+)</staff>", s)
            if m and int(m.group(1)) != staff:
                continue
        st = re.search(r"<step>([A-G])</step>", s)
        oc = re.search(r"<octave>(-?\d+)</octave>", s)
        al = re.search(r"<alter>(-?\d+(?:\.\d+)?)</alter>", s)
        if st and oc:
            out.append(12 * (int(oc.group(1)) + 1) + PC[st.group(1)] + int(float(al.group(1)) if al else 0))
    return (min(out), max(out)) if out else None


def report(item_id):
    xml = xml_of(item_id)
    words = re.findall(r"<words[^>]*>([^<]*)</words>", xml)
    counts = {tag: len(re.findall(rf"<{tag}\b", xml)) for tag in
              ("pedal", "trill-mark", "mordent", "inverted-mordent", "turn", "inverted-turn", "grace", "wavy-line")}
    tempos = re.findall(r'<sound[^>]*tempo="([^"]+)"', xml)
    print(f"{item_id}: {by[item_id].get('title')!r}")
    print(f"  marks={counts} soundTempo={sorted(set(tempos))[:5]}")
    print(f"  words={[w for w in words][:12]}")
    print(f"  staff1 range={midi_range(xml, 1)} all={midi_range(xml)}")


groups = {
    "classical.5 songs (ornaments? pedal?)": rung("classical.5")["songOptions"],
    "1.1 songs (C position range 60-67?)": rung("1.1")["songOptions"],
    "technique.6 trill": ["exercise.trill.c.4pb.left"],
    "ragtime.7 Sugar Cane / Maple Leaf": ["song.ragtime.joplin-sugar-cane", "song.ragtime.joplin-maple-leaf-rag"],
    "1.5 Water Is Wide": ["song.folk.the-water-is-wide.pdmx"],
    "classical.3 Petzold": ["song.classical.petzold-minuet-g-bwv-anh114"],
}
for label, ids in groups.items():
    print(f"== {label}")
    for i in ids:
        try:
            report(i)
        except Exception as e:  # noqa: BLE001
            print(f"{i}: ERROR {e}")
# Every generated trill in the catalogue: does each alternate with the note above?
trills = [r["id"] for r in cat if r["id"].startswith("exercise.trill.")]
print(f"== generated trills: {len(trills)} rows")
for i in trills:
    xml = xml_of(i)
    notes = []
    for n in re.finditer(r"<note\b[\s\S]*?</note>", xml):
        s = n.group(0)
        if "<rest" in s:
            continue
        st = re.search(r"<step>([A-G])</step>", s)
        oc = re.search(r"<octave>(-?\d+)</octave>", s)
        al = re.search(r"<alter>(-?\d+)</alter>", s)
        if st and oc:
            notes.append(12 * (int(oc.group(1)) + 1) + PC[st.group(1)] + (int(al.group(1)) if al else 0))
    first_pair = notes[:2]
    print(f"  {i}: first two sounding {first_pair} ({'upper first' if len(first_pair) == 2 and first_pair[0] > first_pair[1] else 'CHECK'})")
