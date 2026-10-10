# E25 Tempo marks.
#
# Chosen implementation: music21 for every mark, plus ONE small raw read for a measured gap (the <sound tempo> that sits
# in the same <direction> as a <metronome>). Output = a tempo map in QUARTER NOTES PER MINUTE (qpm) per span, with the
# three observations kept apart (my row after ChatGPT's review): the notated metronome mark, the <sound tempo> playback
# value, and the tempo word. Where a span has no usable number its qpm is the string "UNKNOWN", never a guess.
#
# How a span is located (for D01): a span starts at (bar_index, offset) and lasts until the next span starts.
# bar_index is the 0-based index of the measure in its part (a pickup bar is index 0; the same index in both staves of
# a piano part), offset is the position inside that bar in quarter notes, as an exact fraction string ("3/2").
# The first span always starts at (0, "0"). A mark at or before the first printed note governs from (0, "0"); if
# printed notes sound before the first mark, the stretch before it is its own span with qpm UNKNOWN (ChatGPT: "an
# opening mark after sounding notes is not opening tempo").
#
# Probed on hand-made MusicXML (test_e25.py and the scratch probe):
# - <metronome> arrives as tempo.MetronomeMark: number = per-minute as written, referent = beat unit with its dots
#   (dotted quarter = 1.5 quarters, half = 2, eighth = 0.5, 16th = 0.25, double dot 1.75), getQuarterBPM() does the
#   conversion: dotted quarter = 60 -> 90, half = 60 -> 120, eighth = 200 -> 100, eighth. = 63.5 -> 47.625.
# - A <direction> with no <staff> is imported into EVERY staff of the part (one mark appears twice); a direction on
#   staff 2 only stays on staff 2. So marks are merged by (bar_index, offset) over all parts; nothing is "per hand".
# - TRAP 1, invented words: music21 gives every MetronomeMark a text such as 'animato' for 120, 'larghetto' for 60
#   (textImplicit True) - that is a word chosen by the library, not by the composer, and is NOT used. The real words
#   come as expressions.TextExpression (music21 never turned "Allegro" into a TempoText in any probe).
# - TRAP 2, the lost sound tempo: <metronome ...> together with <sound tempo="100"/> in one direction gives ONE
#   MetronomeMark with number 132 and the sound value is gone (probed: numberSounding None). A <sound tempo> without
#   metronome comes as a MetronomeMark with number None and numberSounding set (also a standalone <sound tempo> child of
#   <measure>, and one in a direction with an empty <words/>).
# - Not numbers, and shown as such: per-minute "100-108" or "c. 60" -> number None (no crash); per-minute missing ->
#   number None; two beat units (metric modulation q = q.) -> a MetricModulation object. All become UNKNOWN spans with a
#   reason: a range or equation is not one BPM (ChatGPT), and the old tempo no longer applies after such a mark.
# - A metronome with print-object="no" arrives with style.hideObjectOnPrint True (reported as printed False).
# - <beat-unit-tied> is dropped by music21 (the tied unit vanishes: quarter + tied eighth = 60 reads as quarter = 60).
#   Measured 0 in our files (raw count), so it is NOT patched; it would be wrong silently, so this is the known hole.
#
# Measured on our 842 candidate files (raw XML, scratch raw25.py/dis25.py/both25.py/snd25.py; function run over all 842,
# scratch corp25.py, no file failed): 471 files have a <metronome>, 469 with a number. The other 2 are an empty
# per-minute (2 files) and metric-modulation equations (2 marks in 2 files, one of them sicilienne-op-68-no-11); ranges 0,
# beat-unit-tied 0, print-object="no" 0. Every simple metronome mark (3,565 over all parts) sits in a direction that also
# carries <sound tempo>, and music21 loses that value (TRAP 2), so that gap is patched with one raw read of the sound
# tempo of every <direction> (_raw.directions, the same time cursor as music21). Words and metronome are often TWO
# directions at one place, each with its own sound (Allegro sound 144; half = 69 sound 138: mxl/16/2 and mxl/16/21), so a
# sound tempo is attached to the metronome only when it is in the metronome's own direction (a first version that merged
# by position got 23 files wrong against the independent raw check; this one 0). After the patch metronome and sound
# tempo differ (beyond 2% or 1 qpm, which absorbs whole-number marks against one-decimal sound values: 47 / 47.5) on 53
# marks in 23 files; 27 marks in 14 files are more than 10% apart, read in the raw XML: Chopin Op. 10 No. 3 'Lento, ma
# non troppo' quarter = 100 against sound 35 (a performance-derived playback value; the printed mark is the score's), a
# file with 'Allegro' 108 against 64, 'Alla marcia e molto marcato' 138 against 75. The printed mark wins as qpm and both
# stay visible with disagree True; nothing is hidden, which is ChatGPT's request.
# Where the printed marks themselves conflict (two different metronome values at one bar and offset, e.g. quarter = 120
# above and quarter = 100 below in mxl/16/21 bar 1): 7 places in 6 files, qpm UNKNOWN with both values in metronome_qpms.
# Sound tempo without a metronome in the same direction: 232 files; sound tempo is the only source in 133 files, in 12
# of them nothing but 120 (the exporter default; the other values there are 72, 60, 114 ...), so those get qpm UNKNOWN
# with the 120 kept as sound_qpm (ChatGPT: "must remain UNKNOWN when sound tempo looks like an exporter default").
# 103 files have both kinds; their 820 sound-only marks after a metronome are performance shaping (rit. ramps, 'a
# tempo'), so once a file has a numeric metronome mark the spans come from metronome marks only (my row: "metronome
# marks, else sound tempo"), sound-only marks are listed apart (sound_only_marks: 86 files, 828 marks), and the stretch
# before the first metronome mark is UNKNOWN even if a sound value exists there.
# Opening: 536 files have a mark at or before the first printed note, 66 start with printed notes before the first mark
# (leading UNKNOWN span), 240 have no number at all. Typed tempos in words ('J = 105', a quarter glyph = 72; 34 marks in
# 7 files) are listed as typed_equations, not turned into numbers (the glyph is often lost in the export).
# Whole-corpus tally of the source (function output): metronome 469, sound tempo 121, sound tempo 120 only 12, none 240.
# Against my old reader (metronome 469, only <sound tempo> 121, none 252): identical, because its 252 "none" was my 240
# plus these 12 all-120 files, which it also dropped; the new reading only separates them.
# Known limit, not fixable from the file: a metronome in a footnote text is a mark like any other (Op. 10 No. 3 bar 14,
# quarter = 30 under 'Very few pianists follow this BPM mark. 40 is more common': a span of 30 starts there).
# Known hole, 0 files: <beat-unit-tied> is dropped by music21 (pinned in the test).
#
# Not adopted: music21's word-to-number table (Allegro = 132, my row: a guess); partitura (missed the marks); a number
# per tempo word; reading ranges as their midpoint. Adopted from ChatGPT: three observations apart, no silent choice
# between metronome and sound tempo (both kept, disagreement flagged), beat-unit dots in the conversion (the music21
# referent), opening position tested against the first printed note, tempo words as a separate reading fact (opening_word
# plus every word of the closed list Grave..Prestissimo with its place; the text is matched as a whole word, case-blind).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
import re
from fractions import Fraction

WORDS = ["grave", "largo", "larghetto", "lento", "adagio", "adagietto", "andante", "andantino", "moderato",
         "allegretto", "allegro", "vivace", "vivacissimo", "presto", "prestissimo"]
_WORD = re.compile(r"(?<![^\W\d_])(" + "|".join(WORDS) + r")(?![^\W\d_])", re.I)
_EQ = re.compile(r"=\s*(?:c\.?\s*|ca\.?\s*)?\d")


def _num(x):
    return int(x) if float(x) == int(x) else round(float(x), 3)


def _frac(x):
    return Fraction(x).limit_denominator(10000)


def _entry(label):
    return {"bar": label, "mets": [], "met": None, "snd_metro": None, "snd_plain": None, "snd": None, "why": None,
            "printed": True, "unit": None, "per_minute": None}


def _agree(a, b):
    return abs(a - b) <= max(1.0, 0.02 * a)


def tempo(score, path):
    """Tempo map in quarter notes per minute. See the top comment for the span rule and the fields."""
    import music21 as m
    from _notes import printed
    from _raw import raw_root, directions
    marks, texts, first_note = {}, {}, None
    for part in score.parts:
        for mi, meas in enumerate(part.getElementsByClass(m.stream.Measure)):
            label = bar_label(meas)
            if first_note is None or mi <= first_note[0]:
                for n, _ in printed(meas):
                    pos = (mi, _frac(n.getOffsetInHierarchy(meas)))
                    if first_note is None or pos < first_note:
                        first_note = pos
            for x in meas.recurse():
                if not isinstance(x, (m.tempo.MetronomeMark, m.tempo.MetricModulation, m.expressions.TextExpression)):
                    continue
                key = (mi, _frac(x.getOffsetInHierarchy(meas)))
                if isinstance(x, m.expressions.TextExpression):
                    texts.setdefault((key, x.content), label)
                    continue
                e = marks.setdefault(key, _entry(label))
                if isinstance(x, m.tempo.MetricModulation):
                    e["why"] = "metric modulation (an equation between two beat units, not one number)"
                    continue
                if x.number is not None:
                    e["mets"].append(_num(x.getQuarterBPM()))
                    e["unit"] = float(x.referent.quarterLength)
                    e["per_minute"] = _num(x.number)
                    e["printed"] = not x.style.hideObjectOnPrint
                elif x.numberSounding is not None:
                    e["snd_plain"] = _num(x.numberSounding)
                else:
                    e["why"] = "metronome mark without one number (a range, text or an empty per-minute)"
    # the gap: music21 keeps no <sound tempo> that shares a direction with a <metronome>. Every direction is read
    # (directions(root, "direction") yields each <direction> with the same time cursor music21 uses); the sound tempo
    # of a direction that holds a <metronome> belongs to that mark, any other goes to snd_plain. Words and metronome
    # are often separate directions at one place, each with its own <sound> (Allegro 144 / half = 69 with sound 138).
    for _, mi, _, off, el in directions(raw_root(path), "direction"):
        snd = el.find("sound")
        try:
            v = float(snd.get("tempo"))
        except (AttributeError, TypeError, ValueError):
            continue
        e = marks.setdefault((mi, _frac(off)), _entry(None))
        e["snd_metro" if el.find(".//metronome") is not None else "snd_plain"] = _num(v)
    for e in marks.values():
        e["met"] = e["mets"][0] if len(set(e["mets"])) == 1 else None
        e["snd"] = e["snd_metro"] if e["snd_metro"] is not None else e["snd_plain"]
        if len(set(e["mets"])) > 1:
            e["why"] = f"different metronome marks at one place: {sorted(set(e['mets']))}"
    keys = sorted(marks)
    notated = [k for k in keys if marks[k]["met"] is not None or marks[k]["why"]]
    has_metronome = any(marks[k]["met"] is not None for k in keys)
    snd_values = {marks[k]["snd"] for k in keys if marks[k]["snd"] is not None}
    default_like = (not has_metronome) and snd_values == {120}
    use = notated if has_metronome else [k for k in keys if marks[k]["snd"] is not None or marks[k]["why"]]
    spans = []
    for k in use:
        e = marks[k]
        if e["met"] is not None:
            qpm, src = e["met"], "metronome"
            dis = e["snd"] is not None and not _agree(e["met"], e["snd"])
        elif e["why"]:
            qpm, src, dis = "UNKNOWN", "metronome (no single number)", False
        elif default_like:
            qpm, src, dis = "UNKNOWN", "sound tempo 120 only (possible exporter default)", False
        else:
            qpm, src, dis = e["snd"], "sound tempo", False
        spans.append({"bar_index": k[0], "offset": str(k[1]), "bar": e["bar"], "qpm": qpm, "source": src,
                      "metronome_qpm": e["met"], "metronome_qpms": sorted(set(e["mets"])), "sound_qpm": e["snd"], "disagree": dis,
                      "printed": e["printed"],
                      "beat_unit_quarters": e["unit"], "per_minute_written": e["per_minute"], "why": e["why"]})
    # the opening: a mark at or before the first printed note governs from the start
    if spans and (first_note is None or (spans[0]["bar_index"], Fraction(spans[0]["offset"])) <= first_note):
        spans[0]["bar_index"], spans[0]["offset"] = 0, "0"
        opening = "at_start"
    elif spans:
        spans.insert(0, {"bar_index": 0, "offset": "0", "bar": None, "qpm": "UNKNOWN", "source": "none before the first mark",
                         "metronome_qpm": None, "metronome_qpms": [], "sound_qpm": None, "disagree": False, "printed": None,
                         "beat_unit_quarters": None, "per_minute_written": None, "why": "printed notes sound before the first mark"})
        opening = "after_notes"
    else:
        spans = [{"bar_index": 0, "offset": "0", "bar": None, "qpm": "UNKNOWN", "source": "none", "metronome_qpm": None, "metronome_qpms": [],
                  "sound_qpm": None, "disagree": False, "printed": None, "beat_unit_quarters": None,
                  "per_minute_written": None, "why": "no tempo mark in the file"}]
        opening = "none"
    words, eqs = [], []
    for (key, text), label in sorted(texts.items(), key=lambda t: (t[0][0], t[0][1])):
        hit = _WORD.search(text or "")
        if hit:
            words.append({"bar_index": key[0], "offset": str(key[1]), "bar": label, "word": hit.group(1).lower(),
                          "text": text.strip(), "opening": first_note is None or key <= first_note})
        if text and _EQ.search(text):
            eqs.append({"bar_index": key[0], "offset": str(key[1]), "bar": label, "text": text.strip()})
    source = ("metronome" if has_metronome else "sound tempo (120 only, possible exporter default)" if default_like
              else "sound tempo" if snd_values else "none")
    return {"source": source, "opening": opening, "spans": spans,
            "known_qpm": sorted({s["qpm"] for s in spans if s["qpm"] != "UNKNOWN"}),
            "n_disagree": sum(s["disagree"] for s in spans),
            "sound_only_marks": [{"bar_index": k[0], "offset": str(k[1]), "sound_qpm": marks[k]["snd"]}
                                 for k in keys if marks[k]["snd"] is not None and k not in use],
            "opening_word": next((w["word"] for w in words if w["opening"]), None), "tempo_words": words,
            "typed_equations": eqs}
