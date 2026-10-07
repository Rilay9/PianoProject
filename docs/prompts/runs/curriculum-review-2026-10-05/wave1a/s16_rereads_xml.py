"""The three 1a.6 re-reads partitura does not expose (harmony symbols, dynamics), read from the built MusicXML text.

usage: py -3.11 docs/prompts/runs/curriculum-review-2026-10-05/wave1a/s16_rereads_xml.py
"""
import json
import re
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
CONTENT = ROOT / "app" / "public" / "content"
CAT = {e["id"]: e for e in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))}


def xml(item_id):
    with zipfile.ZipFile(CONTENT / CAT[item_id]["file"]) as z:
        name = next(n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META-INF"))
        return z.read(name).decode("utf-8")


def harmonies(text):
    out = []
    for m in re.finditer(r'<measure\b[^>]*number="([^"]*)"[^>]*>([\s\S]*?)</measure>', text):
        for h in re.finditer(r"<harmony[\s\S]*?</harmony>", m.group(2)):
            root = re.search(r"<root-step>([A-G])</root-step>\s*(?:<root-alter>(-?\d+)</root-alter>)?", h.group(0))
            kind = re.search(r"<kind[^>]*>([^<]*)</kind>", h.group(0))
            alter = int(root.group(2) or 0) if root else 0
            out.append((m.group(1), (root.group(1) if root else "?") + ("#" * max(0, alter)) + ("b" * max(0, -alter)),
                        kind.group(1) if kind else "?"))
    return out


print("Edit 12: O Christmas Tree bar 32 symbols:",
      [h for h in harmonies(xml("song.pop.misc-christmas-o-christmas-tree.pdmx")) if h[0] == "32"])
ann = harmonies(xml("song.folk.john-denver-annie-s-song.pdmx"))
print("Edit 23: Annie's Song suspended-fourth symbols:", [h for h in ann if h[2] == "suspended-fourth"],
      "; first bar's symbols:", [h for h in ann if h[0] == ann[0][0]] if ann else [])
text = xml("song.classical.beethoven-moonlight-iii")
dyn = re.findall(r"<dynamics[^>]*>([\s\S]*?)</dynamics>", text)
marks = Counter(re.sub(r"<([a-z]+)\s*/>", r"\1", d).strip() for d in dyn)
wedges = len(re.findall(r'<wedge[^>]*type="(?:crescendo|diminuendo)"', text))
print(f"Edit 25: Moonlight III <dynamics> elements {len(dyn)} ({dict(marks.most_common(8))}); hairpin starts {wedges}")
