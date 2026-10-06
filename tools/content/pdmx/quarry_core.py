"""
Pure functions behind the PDMX quarry: text normalisation, the identity verdict, shape from
MusicXML and the structural signals used by the improv/compose lane. No file or CSV access.
"""
from __future__ import annotations

import io
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from fractions import Fraction


# ---------------------------------------------------------------- text
def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"['’‘`´]", "", s)  # apostrophes join, so "don't" == "dont"
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", s)).strip()


def padded(s: str) -> str:
    n = norm(s)
    return f" {n} " if n else ""


def strip_brackets(s: str) -> str:
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r"\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\}", " ", s)
    return s


def title_variants(s: str) -> set[str]:
    """Normalised forms a title takes once brackets and an Artist segment are removed."""
    if not s or s == "NA":
        return set()
    s = strip_brackets(s)
    out = {norm(s)}
    segs = [norm(x) for x in re.split(r"\s+-\s+|\s+–\s+|\s+—\s+", s)]
    if len(segs) > 1:
        out.update(x for x in segs if x)
    return {x for x in out if x}


def _saint(s: str) -> str:
    return re.sub(r"\bst\b", "saint", s)


# ---------------------------------------------------------------- identity
#: Words that may sit round a title without making it another piece.
BENIGN = {
    "piano", "cover", "tutorial", "solo", "arr", "arranged", "arrangement", "version", "lyrics", "sheet",
    "music", "easy", "advanced", "intermediate", "beginner", "for", "chords", "accompaniment", "intro",
    "live", "vocal", "voice", "original", "simplified", "transcription", "score", "lesson", "by", "in",
    "and", "the", "a", "bpm", "no", "part", "full", "short", "reduction", "arrangment",
}
TRAD = {"", "na", "n a", "traditional", "anonymous", "anon", "unknown", "folk", "trad", "public domain",
        "various", "none"}


def _is_trad(x: str) -> bool:
    n = norm(x)
    toks = set(n.split())
    return n in TRAD or bool(toks & {"traditional", "anonymous", "anon", "trad"}) or n.startswith("folk ") or n.startswith("unknown")


def _is_unspecified(x: str) -> bool:
    """A bucket or a date, not a creator: 'Misc tunes', 'Various', 'Early 1900s', 'Urheber unbekannt'."""
    n = norm(x)
    if not n:
        return True
    toks = n.split()
    if toks[0] in ("misc", "miscellaneous", "various", "va"):
        return True
    if n in ("composer", "composer name", "artist", "transcribed", "arranger", "author", "writer", "me", "na"):
        return True
    if "unbekannt" in toks or "inconnu" in toks or "desconocido" in toks:
        return True
    rest = [t for t in toks if t not in ("early", "late", "mid", "circa", "c", "ca", "around", "about", "before",
                                         "after", "the", "s")]
    return bool(rest) and all(re.fullmatch(r"1[0-9]{3}s?|20[0-9]{2}s?", t) for t in rest)


def _is_arranger(x: str) -> bool:
    return bool(re.match(r"\s*(arr\b|arr\.|arranged|arrangement|transcribed|transcription|adapted)", x or "", re.I))


def _present(x) -> bool:
    return bool(x) and x != "NA" and bool(norm(x))


def identity(term: str, aliases, row: dict) -> tuple[str, str]:
    """
    MATCH      title is the term (or the term plus only filler words) AND an expected creator alias is found
    TITLE_ONLY title fits but the creator is absent, traditional, an arranger, or the term is only a part of a longer title
    MISMATCH   title does not contain the term, or the named creator is someone else
    n/a        no creator expectation exists for this term
    """
    if aliases is None:
        return "n/a", ""
    nt = _saint(norm(term))
    al = [norm(a) for a in aliases]
    alias_toks = {t for a in al for t in a.split()}

    def field_class(value: str) -> str:
        """exact | sub | none for one title field."""
        variants = {_saint(x) for x in title_variants(value)}
        if not variants:
            return "empty"
        if nt in variants:
            return "exact"
        cls = "none"
        for v in variants:
            if f" {nt} " in f" {v} ":
                toks, nts = v.split(), nt.split()
                rest = []
                for i in range(len(toks) - len(nts) + 1):
                    if toks[i:i + len(nts)] == nts:
                        rest = [t for t in toks[:i] + toks[i + len(nts):] if t not in alias_toks]
                        break
                if all(t in BENIGN or t.isdigit() for t in rest):
                    return "exact"
                cls = "sub"
            elif len(v) >= 4 and f" {v} " in f" {nt} ":
                cls = "sub"
        return cls

    classes = [field_class(row.get(f) or "") for f in ("title", "song_name")]
    classes = [c for c in classes if c != "empty"]
    if not classes:
        classes = ["none"]
    classes = [c for c in classes if c != "none"] or ["none"]
    if classes == ["none"]:
        # a hit found only through the subtitle is a part of a larger title at best
        sub = _saint(padded(row.get("subtitle") or ""))
        if f" {nt} " in f" {sub} ":
            tclass = "sub"
        else:
            return "MISMATCH", "the title does not contain the term"
    elif "sub" in classes:
        tclass = "sub"
    else:
        tclass = "exact"
    comp, art = row.get("composer") or "", row.get("artist") or ""
    pool = " ".join(padded(x) for x in (comp, art, row.get("title") or "", row.get("song_name") or "",
                                        row.get("subtitle") or ""))
    pool = f" {pool} "
    alias_hit = [a for a in al if a != "traditional" and f" {a} " in pool]
    named = [x for x in (comp, art) if _present(x) and not _is_unspecified(x)]
    trad = [x for x in named if _is_trad(x)]
    people = [x for x in named if not _is_trad(x) and not _is_arranger(x)]
    if alias_hit:
        confirmed = True
        why = f"creator alias '{alias_hit[0]}' found"
    elif people:
        return "MISMATCH", f"named creator '{people[0]}' is not one of the expected ({', '.join(aliases)})"
    elif trad:
        confirmed = "traditional" in al
        why = f"creator '{trad[0]}' is traditional" + (", as expected" if confirmed else "")
    else:
        confirmed = False
        why = "no creator named" if not named else f"creator '{named[0]}' is an arranger"
    if confirmed and tclass == "exact":
        return "MATCH", why
    if tclass == "sub":
        return "TITLE_ONLY", f"term is only part of a longer title; {why}"
    return "TITLE_ONLY", why


IDENT_RANK = {"MATCH": 0, "n/a": 0, "TITLE_ONLY": 1, "MISMATCH": 2}


# ---------------------------------------------------------------- xml
def mxl_inner_xml(data: bytes) -> bytes:
    if data[:2] != b"PK":
        return data
    zf = zipfile.ZipFile(io.BytesIO(data))
    inner = None
    if "META-INF/container.xml" in zf.namelist():
        cont = ET.fromstring(zf.read("META-INF/container.xml"))
        for el in cont.iter():
            if el.tag.endswith("rootfile"):
                inner = el.get("full-path")
                break
    if not inner:
        inner = next(n for n in zf.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META-INF"))
    return zf.read(inner)


def _parse(xml: bytes):
    root = ET.fromstring(xml)
    for el in root.iter():
        if isinstance(el.tag, str) and "}" in el.tag:
            el.tag = el.tag.split("}", 1)[1]
    return root


PIANO_NAME = re.compile(r"piano|klavier|keyboard|pianoforte|clavier|grand", re.I)

SHAPE_SCORE = {"PIANO_GRAND_STAFF": 3, "LEADSHEET": 3, "MIXED_WITH_PIANO": 2, "MULTI_PIANO_PART": 1,
               "PIANO1": 1, "OTHER": 0}


def analyse(xml: bytes, csv_programs: list[int]) -> dict:
    root = _parse(xml)
    info = {}
    for sp in root.iter("score-part"):
        mp = sp.find(".//midi-program")
        pr = int(mp.text) - 1 if mp is not None and (mp.text or "").strip().isdigit() else None
        info[sp.get("id")] = (pr, (sp.findtext("part-name") or "").strip(),
                              (sp.findtext("part-abbreviation") or "").strip(),
                              (sp.findtext(".//instrument-name") or "").strip())
    parts, meters, tempo, key, harmony = [], [], [], None, 0
    for p in root.findall("part"):
        pid = p.get("id")
        measures = p.findall("measure")
        staves = 1
        for a in p.iter("attributes"):
            s = a.findtext("staves")
            if s and s.strip().isdigit():
                staves = max(staves, int(s))
            for t in a.findall("time"):
                m = f"{t.findtext('beats')}/{t.findtext('beat-type')}"
                if m not in meters:
                    meters.append(m)
            if key is None:
                k = a.find("key")
                if k is not None:
                    key = f"fifths={k.findtext('fifths')}" + (f" {k.findtext('mode')}" if k.findtext("mode") else "")
        h = len(p.findall(".//harmony"))
        harmony += h
        for d in p.iter("direction"):
            for w in d.iter("words"):
                tx = (w.text or "").strip()
                if tx and tx[:40] not in tempo and len(tempo) < 4:
                    tempo.append(tx[:40])
            sn = d.find("sound")
            if sn is not None and sn.get("tempo") and f"tempo={sn.get('tempo')}" not in tempo and len(tempo) < 4:
                tempo.append(f"tempo={sn.get('tempo')}")
        pr, pname, abbr, iname = info.get(pid, (None, "", "", ""))
        parts.append({"id": pid, "name": pname or iname or abbr, "staves": staves, "program": pr,
                      "measures": len(measures), "harmony": h})
    csv_piano = bool(csv_programs) and all(0 <= x <= 7 for x in csv_programs)
    for pt in parts:
        pr = pt["program"]
        if pr is not None:
            pt["piano"] = 0 <= pr <= 7
        elif pt["name"]:
            pt["piano"] = bool(PIANO_NAME.search(pt["name"]))
        else:
            pt["piano"] = csv_piano
    bars = max((pt["measures"] for pt in parts), default=0)
    all_piano = bool(parts) and all(pt["piano"] for pt in parts)
    any_grand = any(pt["piano"] and pt["staves"] >= 2 for pt in parts)
    if len(parts) == 1 and parts[0]["staves"] == 1 and harmony >= 8:
        shape = "LEADSHEET"
    elif all_piano and any_grand:
        shape = "PIANO_GRAND_STAFF"
    elif all_piano and len(parts) >= 2:
        shape = "MULTI_PIANO_PART"
    elif any_grand:
        shape = "MIXED_WITH_PIANO"
    elif all_piano and len(parts) == 1:
        shape = "PIANO1"
    else:
        shape = "OTHER"
    return {
        "shape": shape, "n_parts": len(parts), "max_staves": max((pt["staves"] for pt in parts), default=0),
        "total_staves": sum(pt["staves"] for pt in parts),
        "part_names": [pt["name"] for pt in parts],
        "parts": [f"{pt['id']}:'{pt['name']}':staves={pt['staves']}:prog={pt['program']}:piano={pt['piano']}" for pt in parts],
        "meters": meters, "harmony": harmony, "bars": bars, "key": key, "tempo": tempo,
    }


# ---------------------------------------------------------------- melody / structure signals
def _midi(pt) -> int:
    step = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[pt.findtext("step")]
    return 12 * (int(pt.findtext("octave")) + 1) + step + int(float(pt.findtext("alter") or 0))


def _staff_events(part, staff: str):
    """Per measure: list of (onset Fraction, midi|None, dur Fraction) for one staff; plus pickup flags."""
    div = 1
    out, flags = [], []
    for m in part.findall("measure"):
        for a in m.findall("attributes"):
            if a.findtext("divisions"):
                div = max(1, int(float(a.findtext("divisions"))))
        pos, last = 0, 0
        ev = []
        for el in m:
            if el.tag == "note":
                dur = el.findtext("duration")
                if el.find("grace") is not None or dur is None:
                    continue
                d = int(float(dur))
                if el.find("chord") is not None:
                    onset = last
                else:
                    onset = pos
                    last = pos
                    pos += d
                if (el.findtext("staff") or "1") != staff:
                    continue
                pt = el.find("pitch")
                ev.append((Fraction(onset, div), None if el.find("rest") is not None or pt is None else _midi(pt),
                           Fraction(d, div)))
            elif el.tag == "backup":
                pos -= int(float(el.findtext("duration") or 0))
            elif el.tag == "forward":
                pos += int(float(el.findtext("duration") or 0))
        out.append(ev)
        flags.append(m.get("implicit") == "yes" or m.get("number") == "0")
    return out, flags


def _sig(ev):
    by = {}
    for on, p, d in ev:
        s = by.setdefault((on, d), set())
        if p is not None:
            s.add(p)
    return tuple(sorted((on, d, tuple(sorted(s))) for (on, d), s in by.items()))


def _rel(ev):
    by = {}
    for on, p, d in ev:
        by.setdefault(on, [d, []])[1].append(p)
    items = sorted(by.items())
    base = None
    out = []
    for on, (d, ps) in items:
        ps = [p for p in ps if p is not None]
        top = max(ps) if ps else None
        if top is not None and base is None:
            base = top
        out.append((on, d, None if top is None else top - (base if base is not None else top)))
    return tuple(out)


def _rhy(ev):
    by = {}
    for on, p, d in ev:
        by.setdefault((on, d), False)
        if p is not None:
            by[(on, d)] = True
    return tuple(sorted((on, d, v) for (on, d), v in by.items()))


def melody_signals(xml: bytes) -> dict:
    """Signals only, no judgement."""
    root = _parse(xml)
    parts = root.findall("part")
    if not parts:
        return {}
    part = parts[0]
    staves = 1
    for a in part.iter("attributes"):
        s = a.findtext("staves")
        if s and s.strip().isdigit():
            staves = max(staves, int(s))
    top, flags = _staff_events(part, "1")
    if len(parts) > 1 and staves == 1:
        low = None
    else:
        low = _staff_events(part, "2")[0] if staves >= 2 else None
    start = 1 if flags and flags[0] and len(flags) > 1 else 0
    top_m = top[start:]
    n = len(top_m)
    sigs = [_sig(e) for e in top_m]
    rels = [_rel(e) for e in top_m]
    rhys = [_rhy(e) for e in top_m]
    sounding = [any(p is not None for _, p, _ in e) for e in top_m]
    exact_rep = trans_rep = 0
    seen, seen_rel = set(), set()
    for i in range(n):
        if not sounding[i]:
            continue
        if sigs[i] in seen:
            exact_rep += 1
        elif rels[i] in seen_rel:
            trans_rep += 1
        seen.add(sigs[i])
        seen_rel.add(rels[i])
    ret_exact = ret_rhythm = None
    contrast = False
    if n >= 12:
        A = sigs[0:4]
        R = rhys[0:4]
        contrast = sigs[4:8] != A
        for j in range(8, n - 3):
            if sigs[j:j + 4] == A and any(sounding[j:j + 4]):
                ret_exact = j + 1
                break
        for j in range(8, n - 3):
            if rhys[j:j + 4] == R and any(sounding[j:j + 4]):
                ret_rhythm = j + 1
                break

    def max_sim(evs):
        best = 0
        for e in evs:
            c = {}
            for on, p, d in e:
                if p is not None:
                    c[on] = c.get(on, 0) + 1
            best = max(best, max(c.values(), default=0))
        return best

    ms_top = max_sim(top_m)
    ms_low = max_sim(low[start:]) if low else None
    reps = len(root.findall(".//repeat"))
    endings = len([e for e in root.iter("ending") if e.get("type") == "start"])
    harmony = len(part.findall(".//harmony"))
    return {
        "bars_ex_pickup": n, "repeat_barlines": reps, "ending_brackets": endings,
        "exact_repeat_measures": exact_rep, "transposed_repeat_measures": trans_rep,
        "halves_8_or_16": n in (16, 32), "first_phrase_returns_exact_at_bar": ret_exact,
        "first_phrase_returns_rhythm_at_bar": ret_rhythm, "middle_contrasts": contrast,
        "max_simultaneity_top_staff": ms_top, "max_simultaneity_lower_staff": ms_low,
        "has_lower_staff": low is not None, "chord_symbols": harmony,
        "single_line_top": ms_top == 1,
        "support": (harmony >= 4) or (low is not None and (ms_low or 0) <= 2),
    }
