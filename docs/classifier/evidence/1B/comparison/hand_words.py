"""List the printed hand words (area-1A rule 3 flag 3 regex, copied from evidence/1A/validation/r_format.py HANDW) in every
non-generated catalogue file with their part, staff, bar, onset and text. Writes hand_words.json."""
import json, re
from hand_xml import *

HANDW = re.compile(r"^\s*[\(\[]?\s*(m\.\s?d\.|m\.\s?s\.|m\.\s?g\.|r\.\s?h\.|l\.\s?h\.|rh\b|lh\b|mano destra|mano sinistra|main droite|main gauche|rechte hand|linke hand)", re.I)
cat = json.load(open(CONTENT / "catalog.json", encoding="utf-8"))
out = {}
for it in cat:
    if not it.get("file") or (it.get("provenance", {}).get("source") == "generated"):
        continue
    r = root_of(CONTENT / it["file"])
    rows = []
    for pi, part in enumerate(r.findall("part")):
        div = 1
        t = 0.0
        for mi, m in enumerate(part.findall("measure")):
            for el in m:
                if el.tag == "attributes" and el.findtext("divisions"):
                    div = float(el.findtext("divisions"))
                elif el.tag == "forward":
                    t += float(el.findtext("duration") or 0) / div
                elif el.tag == "backup":
                    t -= float(el.findtext("duration") or 0) / div
                elif el.tag == "note":
                    if el.find("chord") is None:
                        last = t
                        if el.find("grace") is None:
                            t += float(el.findtext("duration") or 0) / div
                elif el.tag == "direction":
                    for w in el.iter("words"):
                        txt = (w.text or "").strip()
                        if HANDW.match(txt):
                            rows.append({"part": pi, "bar_index": mi, "bar_no": m.get("number"), "staff": int(el.findtext("staff") or 1),
                                         "placement": el.get("placement"), "onset_q": round(t, 3), "text": txt[:40]})
    if rows:
        out[it["id"]] = rows
json.dump(out, open(HERE / "hand_words.json", "w"), indent=0)
for k, v in out.items():
    print(k, len(v), [(x["bar_no"], x["staff"], x["text"]) for x in v][:8])
