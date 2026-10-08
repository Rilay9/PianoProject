"""notation.times as corrected (area-1C.md, origin 485f2be2): per item, part 0's measures with signature, actual length,
barlines (repeat, ending, style), words; then every signature change classified as the page says.
Usage: times.py ID ... (detail) | times.py --changes (every item with a change, classified)."""
import re, sys, json
import xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CAT, BYID, CONTENT, xml_text

CAD_WORDS = re.compile(r"\b(cadenza|quasi cadenza|ad\.? ?lib\.?|ad libitum|a piacere|senza tempo|colla voce|liberamente|freely)", re.I)


def measures(iid):
    t = xml_text(CONTENT / BYID[iid]["file"])
    t = re.sub(r"<!DOCTYPE[^>]*>", "", t)
    root = ET.fromstring(t.encode("utf-8"))
    part = root.find("part")
    div = 1
    sig = None
    out = []
    for m in part.findall("measure"):
        a = m.find("attributes")
        if a is not None:
            d = a.find("divisions")
            if d is not None:
                div = int(float(d.text))
            ti = a.find("time")
            if ti is not None and ti.find("beats") is not None:
                sig = (ti.findtext("beats"), int(ti.findtext("beat-type")))
        pos = F(0); mx = F(0)
        for el in m:
            if el.tag == "note":
                if el.find("chord") is not None or el.find("grace") is not None:
                    continue
                d = el.findtext("duration")
                pos += F(int(float(d)), div) if d else 0
                mx = max(mx, pos)
            elif el.tag == "backup":
                pos -= F(int(float(el.findtext("duration"))), div)
            elif el.tag == "forward":
                pos += F(int(float(el.findtext("duration"))), div); mx = max(mx, pos)
        bars = []
        for bl in m.findall("barline"):
            r = bl.find("repeat"); e = bl.find("ending"); s = bl.findtext("bar-style")
            bars.append((bl.get("location", "right"), s, r.get("direction") if r is not None else None,
                         (e.get("type"), e.get("number")) if e is not None else None))
        words = [w.text for w in m.iter("words") if w.text]
        out.append({"no": m.get("number"), "sig": sig, "len": mx, "bar": bars, "words": words,
                    "tchange": a is not None and a.find("time") is not None, "key": a is not None and a.find("key") is not None})
    return out


def siglen(sig):
    try:
        return F(4 * sum(int(x) for x in sig[0].split("+")), sig[1])
    except Exception:
        return None


def classify(ms):
    """Each bar whose signature differs from the one before: change, device, cadenza or symbol (page's rule)."""
    res = []
    in_cad = False
    cad_bars = set()
    for i, m in enumerate(ms):
        if any(CAD_WORDS.search(w) for w in m["words"]):
            in_cad = True
            cad_start = i
        if in_cad:
            cad_bars.add(i)
            # a cadenza words passage ends at a later tempo word (a tempo, tempo I) or after 4 bars without words
            if any(re.search(r"\ba tempo|tempo i\b|tempo primo", w, re.I) for w in m["words"]) and i > cad_start:
                in_cad = False
    for i, m in enumerate(ms):
        if i == 0 or m["sig"] == ms[i - 1]["sig"]:
            continue
        res.append(i)
    return res, cad_bars


def boundary(ms, i):
    """a repeat, volta, double or final barline at either side of bar i, or a key change at it or the next bar."""
    def has(j, side):
        if j < 0 or j >= len(ms):
            return False
        for (loc, style, rep, end) in ms[j]["bar"]:
            if (loc == side) and (rep or end or style in ("light-light", "light-heavy", "heavy-light", "heavy-heavy")):
                return True
        return False
    return has(i, "left") or has(i, "right") or has(i - 1, "right") or has(i + 1, "left") or ms[i]["key"] or (i + 1 < len(ms) and ms[i + 1]["key"])


def device_runs(ms, cad_bars):
    """Apply the page's definitions to every bar whose signature is not the prevailing one; returns labels per bar."""
    labels = {}
    n = len(ms)
    lens = [siglen(m["sig"]) if m["sig"] else None for m in ms]
    # prevailing signature around bar i: the nearest earlier bar whose signature is held for 2+ bars
    def prevailing(i):
        for j in range(i - 1, -1, -1):
            if j >= 1 and ms[j]["sig"] == ms[j - 1]["sig"]:
                return lens[j]
        for j in range(i + 1, n - 1):
            if ms[j]["sig"] == ms[j + 1]["sig"]:
                return lens[j]
        return None
    for i in range(n):
        if i and ms[i]["sig"] == ms[i - 1]["sig"] and not (i + 1 < n and ms[i + 1]["sig"] != ms[i]["sig"] and False):
            continue
        if i == 0:
            continue
        L = prevailing(i)
        if L is None or lens[i] is None:
            continue
        lab = None
        if i in cad_bars:
            lab = "cadenza bar (words)"
        elif lens[i] < L:
            # one bar, or two consecutive short bars summing to L, at a boundary
            if i + 1 < n and lens[i + 1] is not None and lens[i + 1] < L and lens[i] + lens[i + 1] == L and (boundary(ms, i) or boundary(ms, i + 1)):
                lab = "device (pair sums to the bar)"
                labels[i + 1] = "device (pair sums to the bar)"
            elif i - 1 >= 0 and i - 1 in labels and labels[i - 1].startswith("device (pair"):
                lab = labels[i - 1]
            elif i == n - 1 and ms[0]["len"] < (siglen(ms[0]["sig"]) or 0) and lens[i] + ms[0]["len"] == L:
                lab = "device (final bar completes the pickup)"
            elif boundary(ms, i) or boundary(ms, i + 1 if i + 1 < n else i):
                lab = "device? (one short bar at a boundary: section pickup)"
            else:
                lab = "change (short bar, no boundary)"
        elif lens[i] > L and (i + 1 >= n or ms[i + 1]["sig"] != ms[i]["sig"]) and ms[i - 1]["sig"] != ms[i]["sig"]:
            lab = "cadenza bar (one longer bar)"
        else:
            lab = "change"
        labels.setdefault(i, lab)
    return labels


if __name__ == "__main__":
    if sys.argv[1] == "--changes":
        tot = {}
        for it in CAT:
            if not it.get("file"):
                continue
            try:
                ms = measures(it["id"])
            except Exception as ex:
                continue
            ch, cad = classify(ms)
            if not ch:
                continue
            lab = device_runs(ms, cad)
            sigs = [f"{ms[i]['no']}:{ms[i]['sig'][0]}/{ms[i]['sig'][1]}" for i in ch]
            print(it["id"], "|", " ".join(sigs[:12]), "|", "; ".join(f"[{i}]no.{ms[i]['no']} {v}" for i, v in sorted(lab.items()))[:600])
    else:
        for iid in sys.argv[1:]:
            ms = measures(iid)
            ch, cad = classify(ms)
            lab = device_runs(ms, cad)
            print("==", iid, "changes at idx", ch)
            for i in sorted(set(ch) | {j for c in ch for j in (c - 1, c + 1)}):
                if 0 <= i < len(ms):
                    m = ms[i]
                    print(f"  [{i}] no.{m['no']} sig {m['sig']} len {m['len']} bar {m['bar']} words {m['words'][:3]} key {m['key']} -> {lab.get(i)}")
