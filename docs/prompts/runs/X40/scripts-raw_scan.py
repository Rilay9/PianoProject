"""
X40's raw scan: a read-only listing of every tempo statement in each built MuseTrainer and kern
score, unresolved, beside the app's reader. NOT the app's reader and not a copy of its resolution:
it lists every `<sound tempo>`, every `<metronome>` and every `<words>` of a tempo-bearing direction
in score order (part, then page), each at its measure ordinal and its offset in quarter notes, so the
table can show every sound at one position where the reader keeps one. Positions follow MusicXML's
own rules (durations, `<backup>`, `<forward>`, chords and graces take no time, `<divisions>` carry
within a part, a direction's `<offset>` moves it only where it says sound="yes").

Usage: python raw_scan.py <catalog.json> <content-dir> <out.jsonl>
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

BEAT = {"maxima": 32, "long": 16, "breve": 8, "whole": 4, "half": 2, "quarter": 1, "eighth": 0.5,
        "16th": 0.25, "32nd": 0.125, "64th": 1 / 16, "128th": 1 / 32}


def main_xml(path: Path) -> bytes:
    with zipfile.ZipFile(path) as archive:
        try:
            container = archive.read("META-INF/container.xml").decode("utf-8", "replace")
            name = re.search(r'full-path="([^"]+)"', container).group(1)
        except (KeyError, AttributeError):
            name = [n for n in archive.namelist() if not n.startswith("META-INF")][0]
        return archive.read(name)


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def num(text: str | None) -> float | None:
    try:
        return float(text) if text is not None else None
    except ValueError:
        return None


def scan(xml: bytes) -> dict:
    root = ET.fromstring(xml)
    statements = []
    lengths: dict[int, list[float]] = {}
    order = 0
    software = [e.text for e in root.iter() if local(e.tag) == "software"]
    for part_index, part in enumerate(e for e in root if local(e.tag) == "part"):
        divisions = 1.0
        for ordinal, measure in enumerate(e for e in part if local(e.tag) == "measure"):
            position = 0.0
            longest = 0.0
            for child in measure:
                longest = max(longest, position)
                tag = local(child.tag)
                if tag == "attributes":
                    d = [c for c in child if local(c.tag) == "divisions"]
                    if d and num(d[0].text):
                        divisions = num(d[0].text)
                elif tag == "note":
                    names = {local(c.tag) for c in child}
                    if "chord" in names or "grace" in names:
                        continue
                    d = [c for c in child if local(c.tag) == "duration"]
                    position += (num(d[0].text) or 0) if d else 0
                elif tag == "backup":
                    d = [c for c in child if local(c.tag) == "duration"]
                    position -= (num(d[0].text) or 0) if d else 0
                elif tag == "forward":
                    d = [c for c in child if local(c.tag) == "duration"]
                    position += (num(d[0].text) or 0) if d else 0
                elif tag in ("direction", "sound"):
                    at = position
                    sound_el = child if tag == "sound" else next((c for c in child if local(c.tag) == "sound"), None)
                    words, marks = [], []
                    if tag == "direction":
                        off = next((c for c in child if local(c.tag) == "offset"), None)
                        if off is not None and off.get("sound") == "yes" and num(off.text) is not None:
                            at += num(off.text)
                        for e in child.iter():
                            if local(e.tag) == "words" and (e.text or "").strip():
                                words.append(e.text.strip())
                            if local(e.tag) == "metronome":
                                units = [u.text for u in e if local(u.tag) == "beat-unit"]
                                dots = sum(1 for u in e if local(u.tag) == "beat-unit-dot")
                                per = next((u.text for u in e if local(u.tag) == "per-minute"), None)
                                quarters = None
                                m = re.match(r"^(?:c(?:a)?\.?\s*)?(\d+(?:\.\d+)?)$", (per or "").strip(), re.I)
                                if len(units) == 1 and units[0] in BEAT and m:
                                    quarters = float(m.group(1)) * BEAT[units[0]] * (2 - 0.5 ** dots)
                                marks.append({"beatUnit": units, "dots": dots, "perMinute": per, "quarters": quarters})
                    sound = num(sound_el.get("tempo")) if sound_el is not None else None
                    if sound is not None or marks:
                        statements.append({
                            "part": part_index, "measure": ordinal, "number": measure.get("number"),
                            "offset": round(max(0.0, at / divisions), 6), "order": order,
                            "sound": sound, "marks": marks, "words": words, "element": tag,
                            "hidden": any(e.get("print-object") == "no" for e in child.iter()),
                        })
                        order += 1
            longest = max(longest, position)
            lengths.setdefault(part_index, []).append(round(longest / divisions, 6))
    return {"software": software, "statements": statements, "measureLengths": lengths}


def main() -> int:
    catalog = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    content = Path(sys.argv[2])
    items = catalog if isinstance(catalog, list) else catalog["items"]
    out = []
    for item in items:
        tags = item.get("tags") or []
        source = "MT" if "musetrainer" in tags else "kern" if "kern" in tags else None
        if source is None or not item.get("file"):
            continue
        path = content / item["file"]
        row = {"id": item["id"], "source": source, "file": item["file"]}
        try:
            row.update(scan(main_xml(path)))
        except Exception as exc:  # noqa: BLE001 - a scan failure is reported, never hidden
            row["error"] = f"{type(exc).__name__}: {exc}"
        out.append(row)
    Path(sys.argv[3]).write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in out), encoding="utf-8")
    print(len(out), "rows scanned;", sum(1 for r in out if "error" in r), "errors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
