"""
X42's noise scan: how far apart a `<sound tempo>` and a printed metronome mark at the same score position are,
read from the files (not through the app's reader, which keeps one sound per position: this lists every sound at a
position against the position's first mark, normalised to quarter notes a minute the way the reader normalises it).
It is the evidence for the tolerance that decides whether a sound "agrees" with a mark: the writers' own
serialization noise on one side, the smallest difference that is a different tempo on the other.

Positions follow the reader's rules (`tempoFromXml.ts` rawEvents): parts around measures, the measure's ordinal in
its part, offset in quarters rounded to 1e-6, durations/backup/forward, chords and graces take no time, a
direction's `<offset>` moves it only where it says sound="yes"; positions group across parts by ordinal:offset.

Usage:
  python noise_scan.py catalog <content-dir> <out.txt>     every built score the catalogue names
  python noise_scan.py folders <out.txt> <folder>...       every .mxl under the folders (an unbuilt pool)
"""
from __future__ import annotations

import collections
import math
import re
import sys
import json
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

BEAT = {"maxima": 32, "long": 16, "breve": 8, "whole": 4, "half": 2, "quarter": 1, "eighth": 0.5, "16th": 0.25,
        "32nd": 0.125, "64th": 1 / 16, "128th": 1 / 32, "256th": 1 / 64, "512th": 1 / 128, "1024th": 1 / 256}
PER_MINUTE = re.compile(r"^(?:c(?:a)?\.?\s*)?(\d+(?:\.\d+)?)$", re.I)
BORDER = 0.01  # a reporting split only, to list the two clusters; the tolerance is derived from what this prints


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


def num(text):
    try:
        return float(text) if text is not None and str(text).strip() != "" else None
    except ValueError:
        return None


def mark_of(direction) -> dict | None:
    """The direction's first metronome that states a tempo, the reader's way (metronomeOf)."""
    for e in direction.iter():
        if local(e.tag) != "metronome":
            continue
        if any(local(c.tag) == "metronome-note" for c in e.iter()):
            continue
        units = [(u.text or "").strip() for u in e if local(u.tag) == "beat-unit"]
        if len(units) != 1 or units[0] not in BEAT:
            continue
        per = next(((u.text or "").strip() for u in e if local(u.tag) == "per-minute"), "")
        m = PER_MINUTE.match(per)
        if not m:
            continue
        dots = sum(1 for u in e if local(u.tag) == "beat-unit-dot")
        value = float(m.group(1))
        if value <= 0:
            continue
        return {"printed": f"{units[0]}{'.' * dots}={per}", "quarters": value * BEAT[units[0]] * (2 - 0.5 ** dots)}
    return None


def scan(xml: bytes) -> tuple[dict, list[str]]:
    root = ET.fromstring(xml)
    positions: dict[tuple[int, float], list[dict]] = collections.defaultdict(list)
    sounds_written: list[str] = []
    order = 0
    for part in (e for e in root if local(e.tag) == "part"):
        divisions = 1.0
        for ordinal, measure in enumerate(e for e in part if local(e.tag) == "measure"):
            position = 0.0
            for child in measure:
                tag = local(child.tag)
                if tag == "attributes":
                    d = [c for c in child if local(c.tag) == "divisions"]
                    if d and num(d[0].text) and num(d[0].text) > 0:
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
                    sound_el = child if tag == "sound" else next((c for c in child.iter() if local(c.tag) == "sound"), None)
                    mark = None
                    if tag == "direction":
                        off = next((c for c in child if local(c.tag) == "offset"), None)
                        if off is not None and off.get("sound") == "yes" and num(off.text) is not None:
                            at += num(off.text)
                        mark = mark_of(child)
                    raw_tempo = sound_el.get("tempo") if sound_el is not None else None
                    sound = num(raw_tempo)
                    if sound is not None and not (math.isfinite(sound) and sound > 0):
                        sound = None
                    if sound is not None:
                        sounds_written.append(raw_tempo.strip())
                    if sound is not None or mark is not None:
                        key = (ordinal, round(max(0.0, at / divisions), 6))
                        positions[key].append({"order": order, "sound": sound, "written": raw_tempo, "mark": mark})
                        order += 1
    return positions, sounds_written


def six_sig(s: float) -> bool:
    """A writer keeping quarter notes a second to six significant digits, written x 60 (MuseScore's form)."""
    per_second = s / 60
    digits = 6 - int(math.floor(math.log10(per_second))) - 1
    return abs(round(per_second, digits) - per_second) < 1e-9


def report(entries: list[tuple[str, str, Path]]) -> list[str]:
    pairs = []  # every sound against the first mark at a position that has both
    written = collections.Counter()
    files = errors = 0
    for ident, source, path in entries:
        files += 1
        try:
            positions, sounds_written = scan(main_xml(path))
        except Exception as exc:  # noqa: BLE001 - a scan failure is reported, never hidden
            errors += 1
            continue
        for w in sounds_written:
            written[(source, w)] += 1
        for (measure, offset), here in positions.items():
            here.sort(key=lambda s: s["order"])
            marks = [s["mark"] for s in here if s["mark"] is not None]
            sounds = [s for s in here if s["sound"] is not None]
            if not marks or not sounds:
                continue
            first = marks[0]
            for s in sounds:
                pairs.append({"id": ident, "source": source, "at": f"{measure}:{offset:g}", "sound": s["sound"],
                              "written": s["written"], "mark": first["quarters"], "printed": first["printed"],
                              "delta": abs(s["sound"] - first["quarters"]), "nSounds": len(sounds)})
    nonzero = sorted(p["delta"] for p in pairs if p["delta"] > 0)
    lines = [f"files read: {files}; scan errors: {errors}",
             f"sound/first-mark pairs at a position with both: {len(pairs)}; exactly equal: {sum(1 for p in pairs if p['delta'] == 0)}; "
             f"nonzero: {len(nonzero)}",
             "every distinct nonzero delta |sound - first mark, in quarters a minute| under 5, ascending: count (sources)"]
    distinct = collections.defaultdict(list)
    for p in pairs:
        if 0 < p["delta"] < 5:
            distinct[float(f"{p['delta']:.9g}")].append(p["source"])
    for d in sorted(distinct):
        lines.append(f"  {d!r}: {len(distinct[d])} ({', '.join(f'{k} {v}' for k, v in sorted(collections.Counter(distinct[d]).items()))})")
    noise = [p for p in pairs if 0 < p["delta"] < BORDER]
    real = [p for p in pairs if p["delta"] >= BORDER]
    if noise:
        lines.append(f"nonzero deltas under {BORDER}: {len(noise)}, max {max(p['delta'] for p in noise)!r}")
    else:
        lines.append(f"nonzero deltas under {BORDER}: none")
    if real:
        lines.append(f"deltas at or over {BORDER}: {len(real)}, min {min(p['delta'] for p in real)!r}")
    over = [p for p in noise if p["delta"] > 1e-9]
    lines.append(f"of the deltas under {BORDER} and over 1e-9, sounds that are a six-significant-digit quarters-a-second figure x 60: "
                 f"{sum(1 for p in over if six_sig(p['sound']))} of {len(over)}")
    lines.append("deltas under 1e-9 (float serialization):")
    for p in noise:
        if p["delta"] <= 1e-9:
            lines.append(f"  {p['id']} ({p['source']}) @{p['at']}: sound {p['written']} against {p['printed']} ({p['mark']!r}); delta {p['delta']!r}")
    if noise:
        lines.append(f"every pair at the largest delta under {BORDER}:")
        top = max(p["delta"] for p in noise)
        for p in sorted(noise, key=lambda p: -p["delta"]):
            if p["delta"] < top - 1e-12:
                break
            lines.append(f"  {p['id']} ({p['source']}) @{p['at']}: sound {p['written']} against {p['printed']} ({p['mark']!r}); delta {p['delta']!r}")
    lines.append(f"every pair at a delta of {BORDER} or more and under 5:")
    for p in sorted(real, key=lambda p: p["delta"]):
        if p["delta"] >= 5:
            break
        lines.append(f"  {p['id']} ({p['source']}) @{p['at']}: sound {p['written']} against {p['printed']} ({p['mark']!r}); delta {p['delta']!r}")
    lines.append("positions with more than one sound and a mark (the population the amended rule reaches):")
    multi = sorted({(p["id"], p["at"]) for p in pairs if p["nSounds"] > 1})
    for ident, at in multi:
        here = [p for p in pairs if p["id"] == ident and p["at"] == at]
        lines.append(f"  {ident} @{at}: first mark {here[0]['printed']} ({here[0]['mark']!r}); sounds "
                     + ", ".join(f"{p['written']} (delta {p['delta']:.6g})" for p in here))
    lines.append("every non-integer <sound tempo> value written, by source: value x count (distance to the nearest half)")
    by_source = collections.defaultdict(list)
    for (src, w), n in sorted(written.items()):
        v = float(w)
        if v != int(v):
            by_source[src].append(f"{w} x{n} ({abs(v - round(v * 2) / 2):.6g})")
    for src, values in sorted(by_source.items()):
        lines.append(f"  {src}: {len(values)} distinct values: " + "; ".join(values))
    return lines


def main() -> int:
    mode = sys.argv[1]
    if mode == "catalog":
        content, out = Path(sys.argv[2]), Path(sys.argv[3])
        catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
        items = catalog if isinstance(catalog, list) else catalog["items"]
        entries = []
        for item in items:
            if not item.get("file"):
                continue
            tags = item.get("tags") or []
            source = next((t for t in ("musetrainer", "kern", "pdmx", "generated", "mutopia") if t in tags), "other")
            entries.append((item["id"], source, content / item["file"]))
    else:
        out = Path(sys.argv[2])
        entries = [(path.name, path.parent.name, path) for folder in sys.argv[3:] for path in sorted(Path(folder).rglob("*.mxl"))]
    lines = report(entries)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    sys.stdout.buffer.write(("\n".join(lines[:40]) + "\n").encode("utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
