# E26 Tempo-change words (and the structured <swing> element).
#
# Chosen implementation: music21 for every WORD (a <words> direction arrives as expressions.TextExpression with its
# text, bar and offset), plus ONE small raw read for a measured gap: the <swing> element, which music21 drops
# completely. The words are matched against a CLOSED, explicit vocabulary; any other word is listed with its text and
# count, never classified (my row; ChatGPT: "unrecognised words retain the raw text, they are not an absence of
# expression"). Nothing here says how much a tempo changes, only what is written where.
#
# Probed on hand-made MusicXML (test_e26.py and the scratch probe probe26.py):
# - every <words> becomes one TextExpression with its content: "rit.", "poco rit.", "rit. e dim.", "a tempo", "Tempo I",
#   "più mosso" all arrive whole, and only in the music21 text, in the same <direction> or not. Several <words> in one
#   <direction-type> become several expressions. Text is kept with its inner whitespace/newlines (strip + collapse).
# - music21 never made a TempoText, RitardandoSpanner or AccelerandoSpanner from any MusicXML here (as my row said),
#   so there is no second reader inside the library to compare with. E25's finding stays: "Allegro" is a TextExpression
#   too. A direction with a <metronome> next to the words does not change the words (the MetronomeMark gets its own text
#   'animato', invented by the library, which is not used here).
# - a <direction> without <staff> is imported into EVERY staff of the part (the word is seen twice), a direction on staff
#   2 stays on staff 2 (probed, same as E25). Words are therefore merged by (bar_index, offset, text) over all staves and
#   the staves that carry them are listed. Nothing is "per hand".
# - dashes/extension lines: <dashes> next to "rit." arrives as a separate spanner.Line; the word itself is unchanged.
#   "rit. - - - -" typed inside the words is simply the text. The extent of the line is NOT read here.
# - <rehearsal>rit.</rehearsal> arrives as a RehearsalMark, not a word (not read; corpus: 60 rehearsal marks, none tempo
#   words). <other-direction> arrives as nothing at all (corpus: 0).
# - THE GAP, <swing>: <sound><swing><straight/>|<first>2</first><second>1</second><swing-type>eighth</swing-type>
#   <swing-style>..</swing-style></swing></sound> (as a child of <direction> or of <measure>) leaves NO trace in music21:
#   no object, nothing on the neighbouring TextExpression (probed in all three placements). Patched with a raw read of
#   <swing> (the shared helper _raw.directions gives the exact position for those inside a <direction>; a <sound> that is
#   a child of <measure> gets the bar only, offset None). Measured on our 842 files: 0 <swing> elements. It is patched
#   anyway because ChatGPT asked for the structured fact explicitly (the absence in this corpus is no reason to omit a
#   cheap parse), and it is pinned by two cases in test_e26.py. This is a departure from "measured gap only in our files".
#
# Measured on our 842 candidate files (raw XML, scratch raw26.py/tally26.py): 9,834 <words> in 553 files (65.7%) in
# 1,660 distinct texts; direction-types seen: pedal 22,214, dynamics 14,759, wedge 13,962, words 9,834, metronome 3,569,
# dashes 2,670, octave-shift 1,879, bracket 144, rehearsal 60, segno 7, coda 6; no other-direction; no <swing>.
#
# THE VOCABULARY (closed; whole words, case-blind, accent-blind, punctuation ignored, so "rit." = "rit" and
# "più" = "piu"). Grounded in what the corpus writes (marks of this text / files, from the tally):
#   ritardando   rit, ritard, ritardando                  rit. 130/57, poco rit. 46/30, ritard 5/4, ritard. 6/5, ritardando 3/2
#   rallentando  rall, rallent, rallentando, ral          rall. 19/12, poco rall. 10/6, rallent. 4/4, Ral. 2/1, rallentando 2/2
#   ritenuto     riten, ritenuto, ritenente               riten. 21/10, ritenuto 16/8, ritenente 5/3 (rit. is itself the
#                                                          abbreviation of both ritardando and ritenuto, so they share a group)
#   allargando   allargando                               4/2
#   accelerando  accel, accelerando                       accel. 22/8, poco accel. 3/3, accelerando 1/1
#   stringendo   stringendo, string                       string. 5/2 (a Burgmueller-type file, "molto string." beside
#                                                          "poco stringendo"), poco stringendo 2/1
#   a_tempo      a tempo, in tempo, im tempo              a tempo 196/72 + a Tempo 16/7, in tempo 10/6, Im Tempo 4/2
#   tempo_primo  tempo I, tempo 1, tempo primo, I tempo   Tempo I 21/17, Tempo I. 6/5, Tempo primo 2/2, "tempo 1º" 1, "Ⅰ Tempo" 1
#   rubato       rubato                                   7/4 (+ tempo rubato, poco rubato)
#   meno_mosso   meno mosso                               6 entries in the run below (poco meno mosso, meno mosso.)
#   piu_mosso    piu mosso                                8 entries (poco più mosso, poco piu mosso, "stretto più mosso")
#   swing        swing, swung                             Swing 7/7, medium swing 1, Med-Swing 1, Swing 16ths 1
#   straight     straight                                 0 in our files (bare "straight" or "straight eighths")
# Each match also gets an `effect`, the standard dictionary grouping and nothing finer: gradual_slower (ritardando,
# rallentando, ritenuto, allargando), gradual_faster (accelerando, stringendo), return (a_tempo, tempo_primo), new_slower
# (meno_mosso), new_faster (piu_mosso), free (rubato), feel (swing, straight). "poco", "molto", "sempre" and the like
# stay in the printed `text`; they are not interpreted.
#
# Guards, each with a case in the tests: whole words only ("ritmico", "accelerated", "Parallel", "rallying" do not match);
# "tempo l'istesso" / "l'istesso tempo" (the SAME tempo, 5 marks) is not a return; "senza rit." / "sans ralentir" / "non
# rit." (without) is not a ritardando: a negation word right before a vocabulary word moves that mention to `negated`;
# "A tempo I" is one return (tempo_primo), not also a_tempo (longest phrase wins, matched spans are masked).
#
# LEFT OUT of the list (listed in other_words, not classified), frequent in our corpus: poco / molto / più / meno on their
# own (26, 5, 4 ...: modifiers; also "poco a poco" 8, which is split over directions in places), stretto 13/9 (fugue
# entry or accelerating, ambiguous), smorzando 11/9 and calando 9/8 and morendo 4/3 (fading, loudness and tempo mixed),
# più lento 4 + 3 + 1 and Lento 21 and other tempo words (that is E25's list), animato / più animato 8, slentando 4/3,
# slargando 1, tempo di ..., Tempo l'istesso 5, in tempo giusto-type phrases (0), espressivo, ritmico, French and German
# ("Animez un peu", "cédez", "Ralentir beaucoup", "sans ralentir"). Counts are marks / files in the raw tally (tally26.py).
#
# Words split across two directions (my row's pitfall), measured: ONE real case in our 842 files, 's' + 'tringendo' in two
# <words> at one place (QmReAFw... bar 419), which music21 hands over as two TextExpressions. Adjacent pieces at the same
# position, in document order, are tried joined (no space, then one space); a join that matches while neither piece does
# is ONE change with joined_from, also listed in joined_pieces, and its pieces are not listed as other words. Pieces must be
# letters only, so a fingering "1" beside "Tempo" does not become "tempo 1".
#
# Whole-corpus check of this function (all 842 files, scratch corp26.py/an26.py, no file failed, slowest file 16 s) against
# an independent raw count (the raw <words> of every <direction> through _raw.directions, merged by bar, offset and text,
# matched by a differently written token-sequence matcher with the same vocabulary): 9,451 distinct words in 539 files,
# 713 tempo-change entries in 167 files, identical entry for entry in 841 files; the one file that differs (mxl/9/17
# QmReAFw..., bar 419) is the 's' + 'tringendo' join above, which the raw count (one word at a time) cannot see. By word:
# a_tempo 231, ritardando 228, ritenuto 72, rallentando 58, accelerando 38, tempo_primo 33, stringendo 14, rubato 12,
# swing 10 (all the word "Swing", 10 marks in 10 files; <swing> element 0), piu_mosso 8, meno_mosso 6, allargando 4. By
# effect: gradual_slower 362, return 264, gradual_faster 52, free 12, feel 10, new_faster 8, new_slower 6. The old reader's
# list (score_facts CHANGE_WORDS) found 599 entries in 157 files; the 114 extra entries are spellings added here (all
# from this corpus): ritenuto family 72 (riten./ritenuto/ritenente), in/Im tempo 16, rall. spellings (rallent., Ral.) 15,
# string. 9, "Tempo 1" / "I Tempo" 2. The one entry
# the old list had that this one drops is 'senza rit.' ("without rit.", bar 86, one file). 8,664 entries stay in
# other_words (1,526 distinct texts): dynamics words, fingering digits, E25's tempo words, jump words, lyrics.
# What music21 loses of the WORDS in our files, measured as raw words minus TextExpressions: 73 words in 38 files, all of
# them jump texts (Fine 34, D.C. al Fine 19+2, D.C. 4, To Coda 4, D.S. al Coda 4, D.S. 2, Coda 2, D.C. al Coda 1, D.S. al
# Fine 1), which music21 imports as RepeatExpression (E31's row); none holds a vocabulary word, so nothing is patched.
# Negation guard fired once, the split join once, <swing> 0 times.
#
# Not adopted: music21's tempo-text table; classification of unlisted words; reading the dashes extent; the rehearsal
# marks; "straight" read only with eighths (a bare "Straight" is a feel instruction); counting both staves of a staffless
# direction twice (merged instead).
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
import re
import unicodedata
from fractions import Fraction

# canonical name, effect, phrases (written as normalised word sequences). Order matters only for masking: longer
# phrases and tempo_primo go first so "a tempo I" is one return.
VOCAB = [
    ("tempo_primo", "return", ["tempo i", "tempo 1", "tempo primo", "i tempo", "1 tempo"]),
    ("a_tempo", "return", ["a tempo", "in tempo", "im tempo"]),
    ("ritardando", "gradual_slower", ["ritardando", "ritard", "rit"]),
    ("rallentando", "gradual_slower", ["rallentando", "rallent", "rall", "ral"]),
    ("ritenuto", "gradual_slower", ["ritenuto", "ritenente", "riten"]),
    ("allargando", "gradual_slower", ["allargando"]),
    ("accelerando", "gradual_faster", ["accelerando", "accel"]),
    ("stringendo", "gradual_faster", ["stringendo", "string"]),
    ("meno_mosso", "new_slower", ["meno mosso"]),
    ("piu_mosso", "new_faster", ["piu mosso"]),
    ("rubato", "free", ["rubato"]),
    ("swing", "feel", ["swing", "swung"]),
    ("straight", "feel", ["straight"]),
]
NEGATIONS = {"senza", "sans", "non", "ohne", "without", "not", "no"}
# "same tempo" phrases that contain "tempo" next to a word of the list: masked first so they never match
SAME_TEMPO = re.compile(r"(?<![a-z0-9])(tempo l istesso|l istesso tempo|tempo listesso|l istesso)(?![a-z0-9])")


def _norm(text):
    """Lower case, accents removed, º/° dropped, every non-alphanumeric run -> one space. 'Più mosso.' -> 'piu mosso',
    'Tempo I.' -> 'tempo i', 'Ⅰ Tempo' -> 'i tempo'."""
    t = unicodedata.normalize("NFKC", (text or "").replace("º", "").replace("°", "")).lower()
    t = "".join(c for c in unicodedata.normalize("NFD", t) if not unicodedata.combining(c))
    return " ".join(re.sub(r"[^a-z0-9]+", " ", t).split())


_RX = [(name, effect, re.compile(r"(?<![a-z0-9])(" + "|".join(re.escape(p) for p in sorted(ps, key=len, reverse=True)) + r")(?![a-z0-9])"))
       for name, effect, ps in VOCAB]


def classify(text):
    """(matches, negated) for one text. matches = list of {word, effect, found}; negated = list of the found words that
    follow a negation word. A matched span is masked so a phrase is not matched twice."""
    t = " " + SAME_TEMPO.sub(lambda m: " " * len(m.group(0)), _norm(text)) + " "
    t = t.strip()
    matches, negated = [], []
    for name, effect, rx in _RX:
        while True:
            hit = rx.search(t)
            if not hit:
                break
            before = t[:hit.start()].split()
            item = {"word": name, "effect": effect, "found": hit.group(1)}
            (negated if before and before[-1] in NEGATIONS else matches).append(item)
            t = t[:hit.start()] + " " * (hit.end() - hit.start()) + t[hit.end():]
    order = {n: i for i, (n, _, _) in enumerate(VOCAB)}
    return sorted(matches, key=lambda x: order[x["word"]]), negated


def tempo_change(score, path):
    """Tempo-change words and <swing> elements with bar index + printed number. `score` is the music21 Score, `path`
    the file (read only for <swing>). See the top comment for the vocabulary."""
    import music21 as m
    from _raw import raw_root, directions
    found = {}      # (bar_index, offset, text) -> staves, bar label
    for si, part in enumerate(score.parts):
        for mi, meas in enumerate(part.getElementsByClass(m.stream.Measure)):
            label = bar_label(meas)
            for x in meas.recurse().getElementsByClass(m.expressions.TextExpression):
                text = " ".join((x.content or "").split())
                off = Fraction(x.getOffsetInHierarchy(meas)).limit_denominator(10000)
                e = found.setdefault((mi, off, text), {"bar": label, "staves": []})
                if si not in e["staves"]:
                    e["staves"].append(si)
    changes, negated, other, joined = [], [], {}, []
    # words split over several directions at one position (real case: 's' + 'tringendo'): adjacent pieces, in document
    # order, are tried joined; a join that matches while neither piece does is ONE change, and its pieces are not listed
    # as other words. Pieces must be letters only, so a fingering digit next to the word "Tempo" never makes "tempo 1".
    by_pos, used = {}, set()
    for k, e in found.items():
        if k[2]:
            by_pos.setdefault((k[0], k[1]), []).append((k, e))
    for (mi, off), items in by_pos.items():
        for i in range(len(items) - 1):
            (ka, ea), (kb, eb) = items[i], items[i + 1]
            a_, b_ = ka[2], kb[2]
            if ka in used or kb in used or not (a_.replace(" ", "").isalpha() and b_.replace(" ", "").isalpha()):
                continue
            if classify(a_)[0] or classify(b_)[0] or classify(a_)[1] or classify(b_)[1]:
                continue
            for sep in ("", " "):
                j = a_ + sep + b_
                hits, neg = classify(j)
                if hits and not neg:
                    used.update((ka, kb))
                    joined.append({"bar_index": mi, "offset": str(off), "bar": ea["bar"], "pieces": [a_, b_], "joined": j})
                    changes.append({"bar_index": mi, "offset": str(off), "bar": ea["bar"], "text": j,
                                    "staves": sorted(set(ea["staves"]) | set(eb["staves"])), "matches": hits,
                                    "joined_from": [a_, b_]})
                    break
    for (mi, off, text), e in sorted(found.items(), key=lambda kv: (kv[0][0], kv[0][1], kv[0][2])):
        if not text or (mi, off, text) in used:
            continue
        hits, neg = classify(text)
        base = {"bar_index": mi, "offset": str(off), "bar": e["bar"], "text": text, "staves": sorted(e["staves"])}
        if hits:
            changes.append({**base, "matches": hits})
        if neg:
            negated.append({**base, "negated": neg})
        if not hits:
            other.setdefault(text, {"count": 0, "first_bar_index": mi, "first_bar": e["bar"]})["count"] += 1
    changes.sort(key=lambda c: (c["bar_index"], Fraction(c["offset"])))
    # the gap: <swing> is dropped by music21
    swings, seen = [], set()
    root = raw_root(path)
    for _, mi, _, off, el in directions(root, "swing"):
        s = _swing(el)
        key = (mi, str(off), tuple(sorted(s.items())))
        if key not in seen:
            seen.add(key)
            swings.append({"bar_index": mi, "offset": str(off), **s})
    for part in root.iter("part"):
        for mi, meas in enumerate(part.findall("measure")):
            for snd in meas.findall("sound"):
                for el in snd.iter("swing"):
                    s = _swing(el)
                    key = (mi, None, tuple(sorted(s.items())))
                    if key not in seen:
                        seen.add(key)
                        swings.append({"bar_index": mi, "offset": None, **s})
    labels = {}
    for part in score.parts:
        for mi, meas in enumerate(part.getElementsByClass(m.stream.Measure)):
            labels.setdefault(mi, bar_label(meas))
    for s in swings:
        s["bar"] = labels.get(s["bar_index"])
    swings.sort(key=lambda s: (s["bar_index"], Fraction(s["offset"]) if s["offset"] else Fraction(-1)))
    by_word, by_effect = {}, {}
    for c in changes:
        for mt in c["matches"]:
            by_word[mt["word"]] = by_word.get(mt["word"], 0) + 1
            by_effect[mt["effect"]] = by_effect.get(mt["effect"], 0) + 1
    return {"changes": changes, "n_changes": len(changes), "by_word": by_word, "by_effect": by_effect,
            "swing_elements": swings, "negated": negated, "joined_pieces": joined,
            "other_words": other}


def _swing(el):
    """One <swing> element: straight, or a ratio first:second of a note value, plus the style text."""
    straight = el.find("straight") is not None
    out = {"straight": straight, "first": None, "second": None,
           "swing_type": el.findtext("swing-type") or (None if straight else "eighth"),
           "style": (el.findtext("swing-style") or "").strip() or None}
    if not straight:
        for k in ("first", "second"):
            try:
                out[k] = int(el.findtext(k))
            except (TypeError, ValueError):
                out[k] = None
    return out
