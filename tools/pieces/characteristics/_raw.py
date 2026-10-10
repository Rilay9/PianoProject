# Shared helper for the rows that patch a measured music21 gap with a small raw-XML read. It only opens the file
# (.mxl through META-INF/container.xml, plain .xml/.musicxml directly) and strips namespaces; each row reads the one
# element music21 loses and says why beside it.
import zipfile
import xml.etree.ElementTree as ET


def raw_root(path):
    """The score's root element with namespaces stripped."""
    if path.lower().endswith(".mxl"):
        with zipfile.ZipFile(path) as z:
            names = z.namelist()
            inner = None
            if "META-INF/container.xml" in names:
                c = ET.fromstring(z.read("META-INF/container.xml"))
                rf = next((e for e in c.iter() if e.tag.endswith("rootfile")), None)
                inner = rf.get("full-path") if rf is not None else None
            inner = inner or next(n for n in names if n.lower().endswith((".xml", ".musicxml")) and not n.startswith("META-INF"))
            data = z.read(inner)
    else:
        with open(path, "rb") as fh:
            data = fh.read()
    root = ET.fromstring(data)
    for e in root.iter():
        if isinstance(e.tag, str) and "}" in e.tag:
            e.tag = e.tag.split("}", 1)[1]
    return root


_NUMBERS = {}
_INDEX = {}


def bar_label(meas):
    """The printed bar number of a music21 Measure, as the file writes it (<measure number>, first part, same index).
    Why a raw read: music21 turns MuseScore's "X1" bars (85 bars in 37 of our files) into number + suffix, e.g. 2 + "X1"
    or 1 + "X" (probed by the E24 and E32 builders), so f"{number}{suffix}" misprints them. The file path comes from
    score.metadata.filePath; without it, music21's number and suffix are used."""
    import music21 as m
    part = meas.getContextByClass(m.stream.Part)
    # the part's own sites: getContextByClass(Score) returns None here (probed after ChatGPT's review exposed that
    # every label had silently fallen back to music21's number + suffix)
    score = next((x for x in part.sites.get() if isinstance(x, m.stream.Score)), None) if part is not None else None
    path = getattr(score.metadata, "filePath", None) if score is not None and score.metadata else None
    if path and part is not None:
        if path not in _NUMBERS:
            first = next(raw_root(path).iter("part"), None)
            _NUMBERS[path] = [x.get("number") for x in first.findall("measure")] if first is not None else []
        key = id(part)
        if key not in _INDEX or _INDEX[key][0] is not part:
            _INDEX[key] = (part, {id(x): i for i, x in enumerate(part.getElementsByClass(m.stream.Measure))})
        i = _INDEX[key][1].get(id(meas))
        if i is not None and i < len(_NUMBERS[path]) and _NUMBERS[path][i] is not None:
            return _NUMBERS[path][i]
    return f"{meas.number}{meas.numberSuffix or ''}"


def bar_lengths(path, wanted):
    """{bar index: written length in quarters} for the bars in `wanted`, from the MusicXML time cursor (a note that is
    not a <chord/> member or a grace note moves it by its <duration>, <backup> back, <forward> on), largest over parts.
    Written by the E32 builder for the whole-measure-rest gap (E02 uses it)."""
    from fractions import Fraction
    out = {}
    for part in raw_root(path).iter("part"):
        div = Fraction(1)
        for i, meas in enumerate(part.findall("measure")):
            pos = top = Fraction(0)
            for el in meas:
                if el.tag == "attributes" and el.findtext("divisions"):
                    div = Fraction(el.findtext("divisions"))
                elif i in wanted:
                    if el.tag == "note" and el.find("chord") is None and el.find("grace") is None and el.findtext("duration"):
                        pos += Fraction(el.findtext("duration")) / div
                    elif el.tag == "backup":
                        pos -= Fraction(el.findtext("duration") or 0) / div
                    elif el.tag == "forward":
                        pos += Fraction(el.findtext("duration") or 0) / div
                    top = max(top, pos)
            if i in wanted:
                out[i] = max(out.get(i, Fraction(0)), top)
    return out


def pair_spans(events):
    """Pairs start/stop marks of one kind of line (ottava, wedge ...). `events` is a list of dicts with key (what must
    match: staff, number ...), time (comparable position), order (document order) and start (bool). Within a key, in
    time order, several spans may be open at once (two voices on one staff each with a hairpin) and a stop closes the
    OLDEST open one. At one time position, stops that can close an open span are taken before the starts (a line
    ending where the next begins); a stop with nothing open is taken after the starts (an empty span, not an orphan).
    Returns (spans as (start, stop) pairs, unclosed starts, orphan stop count).
    Why first-in-first-out (measured on our 842 files): ottava lines pair identically either way (939 spans, 1 orphan
    stop); for hairpins one-open-at-a-time left 27 unclosed starts and 29 orphan stops (6,953 hairpins) where this
    leaves 5 and 7 (6,975 hairpins); the E24 builder measured the same direction for pedal marks (36 unclosed
    against 193; E24 keeps its own pairing)."""
    by_key = {}
    for e in events:
        by_key.setdefault(e["key"], []).append(e)
    spans, unclosed, orphans = [], [], 0
    for evs in by_key.values():
        evs.sort(key=lambda e: (e["time"], e["order"]))
        open_, i = [], 0
        while i < len(evs):
            same = [e for e in evs[i:] if e["time"] == evs[i]["time"]]
            i += len(same)
            stops = [e for e in same if not e["start"]]
            late = []
            for s in stops:
                if open_:
                    spans.append((open_.pop(0), s))
                else:
                    late.append(s)
            open_ += [e for e in same if e["start"]]
            for s in late:
                if open_:
                    spans.append((open_.pop(0), s))
                else:
                    orphans += 1
        unclosed += open_
    return spans, unclosed, orphans


def directions(root, tag):
    """Every <direction> holding a <tag> element, with its time position, for rows where music21 loses the mark.
    Yields (part_index, measure_index, staff, offset_in_quarters, element). The position is the MusicXML time cursor:
    a note (not a <chord/> member, not a grace note; cue notes advance it as the standard says) moves it by its
    <duration>, <backup> moves it back, <forward> on; a direction's own <offset> is added. Only this cursor is walked
    here; notes themselves always come from music21."""
    from fractions import Fraction

    def q(s):  # exact value of an XML number, also for "1.5" (ChatGPT's review: int(float(...)) truncated)
        return Fraction(s.strip()) if s and s.strip() else Fraction(0)
    for pi, part in enumerate(root.iter("part")):
        div = Fraction(1)
        for mi, meas in enumerate(part.findall("measure")):
            pos = Fraction(0)
            for el in meas:
                if el.tag == "attributes" and el.findtext("divisions"):
                    div = q(el.findtext("divisions")) or Fraction(1)
                elif el.tag == "note":
                    if el.find("chord") is None and el.find("grace") is None and el.findtext("duration"):
                        pos += q(el.findtext("duration"))
                elif el.tag == "backup":
                    pos -= q(el.findtext("duration"))
                elif el.tag == "forward":
                    pos += q(el.findtext("duration"))
                elif el.tag == "direction":
                    for x in el.iter(tag):
                        yield pi, mi, int(el.findtext("staff") or 1), (pos + q(el.findtext("offset"))) / div, x
