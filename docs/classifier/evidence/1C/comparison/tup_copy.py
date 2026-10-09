"""rhythm.tuplets-other noise rule as corrected: every <time-modification> ratio in the catalogue, by pipeline,
with the 5 per cent bound and the fewer-notes-than-actual bracket test; the irregular-figuration test (11+ notes, or
9+ at more than twice the normal density, not 12/16/24/32). Output tup.txt."""
import re, sys
from collections import Counter, defaultdict
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent / "shim1c"))  # COPY of validation/tup.py: this line and the output path (last line) are the only changes
from common import CAT, CONTENT, xml_text

ratio_notes = defaultdict(Counter)   # ratio -> pipeline -> notes
ratio_items = defaultdict(set)
brackets_short = []                  # (item, ratio, notes in bracket, measure)
brackets_all = Counter()
for it in CAT:
    if not it.get("file"):
        continue
    src = "gen" if it["id"].startswith("exercise.") else "pdmx" if (it["id"].endswith(".pdmx") or ".pdmx." in it["id"]) else "rep"
    t = xml_text(CONTENT / it["file"])
    for mm in re.finditer(r"<measure\b[^>]*number=\"([^\"]*)\"[^>]*>(.*?)</measure>", t, re.S):
        mno, body = mm.group(1), mm.group(2)
        open_ = {}  # (staff, voice, number) -> [ratio, count]
        for nm in re.finditer(r"<note\b.*?</note>", body, re.S):
            n = nm.group(0)
            tm = re.search(r"<actual-notes>(\d+)</actual-notes>\s*<normal-notes>(\d+)</normal-notes>", n)
            if not tm:
                continue
            a, b = int(tm.group(1)), int(tm.group(2))
            if "<grace" in n:
                continue
            chord = "<chord" in n
            if not chord:
                ratio_notes[(a, b)][src] += 1
                ratio_items[(a, b)].add(it["id"])
            staff = (re.search(r"<staff>(\d+)</staff>", n) or [None, "1"])[1]
            voice = (re.search(r"<voice>(\d+)</voice>", n) or [None, "1"])[1]
            for tp in re.finditer(r"<tuplet(\s[^>]*)>", n):
                attrs = tp.group(1)
                typ = re.search(r'type="(\w+)"', attrs).group(1)
                num = (re.search(r'number="(\d+)"', attrs) or [None, "1"])[1]
                key = (staff, voice, num)
                if typ == "start":
                    open_[key] = [(a, b), 0]
            for key in list(open_):
                if key[0] == staff and key[1] == voice and not chord:
                    open_[key][1] += 1
            for tp in re.finditer(r"<tuplet(\s[^>]*)>", n):
                attrs = tp.group(1)
                typ = re.search(r'type="(\w+)"', attrs).group(1)
                num = (re.search(r'number="(\d+)"', attrs) or [None, "1"])[1]
                key = (staff, voice, num)
                if typ == "stop" and key in open_:
                    (ra, cnt) = open_.pop(key)
                    brackets_all[src] += 1
                    if cnt < ra[0]:
                        brackets_short.append((it["id"], ra, cnt, mno))
out = []
out.append("ratio | gen/pdmx/rep notes | items | within 5% | example items")
for (a, b), c in sorted(ratio_notes.items(), key=lambda x: (-sum(x[1].values()))):
    w = abs(a / b - 1) <= 0.05
    out.append(f"{a}:{b} | {c['gen']}/{c['pdmx']}/{c['rep']} | {len(ratio_items[(a, b)])} | {'NOISE' if w else ''} | {', '.join(sorted(ratio_items[(a, b)])[:3])}")
out.append(f"brackets closed: {dict(brackets_all)}; brackets holding fewer notes than actual-notes: {len(brackets_short)}")
by = Counter((x[0], x[1]) for x in brackets_short)
for (iid, ra), k in by.most_common(60):
    ms = sorted({x[3] for x in brackets_short if x[0] == iid and x[1] == ra}, key=lambda s: int(re.sub(r'\D', '', s) or 0))
    out.append(f"  short: {iid} {ra[0]}:{ra[1]} x{k} measures {ms[:8]}")
(Path(__file__).resolve().parent / "out" / "f3_tup_copy.txt").write_text("\n".join(out), encoding="utf-8")  # (the validators' wrote tup.txt beside tup.py)
print("\n".join(out))

