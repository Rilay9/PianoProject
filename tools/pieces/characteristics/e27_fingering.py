# E27 Fingering numbers.
#
# Chosen implementation: music21 alone, no raw read. A fingering is a <fingering> child of <notations><technical>; music21
# imports each one as an articulations.Fingering in note.articulations (fingerNumber is an int when the text is a plain
# integer, otherwise the text as a string; .substitution and .alternate come from the attributes). The unit counted is the
# ATTACK: one printed note or chord object (one voice), as in E22. Only printed notes count (_notes.py); grace notes are
# counted apart. A printed fingering says what an editor suggests, not how the learner must play, so nothing here says
# which finger is "right" or used.
#
# Probed on hand-made MusicXML (test_e27.py and the scratch probes):
# - single note: one Fingering per element, in written order; several on one note (3 and 1 as a substitution pair, or
#   2 with an alternate 3) all arrive. placement arrives. "0" and "6" arrive as ints, "1-2" "3-1" "p" as strings, an empty
#   element as fingerNumber None (so never test `if fingerNumber`: 0 and None are different things here).
# - CHORD: music21 moves every member's fingering onto the Chord (members' own lists are emptied), keeps all of them
#   (also two equal ones) and orders them by PITCH, bottom to top, not by written order (probed: written E3 G1 C5 gives
#   [5, 3, 1] against C E G). When every member is fingered the pairing is therefore right, but this function does not
#   rely on it. When only some members are fingered the chord holds fewer fingerings than members and WHICH member carries
#   which is lost. So the function reports attacks and fingerings, never "notes with a finger". Measured below.
# - NOT IMPORTED / not counted: a <fingering> outside <technical> (invalid) is dropped by music21; a digit in
#   <other-technical> arrives as a TechnicalIndication (not a Fingering) and is not counted; print-object="no" on the
#   <fingering> element itself is ignored by music21 (the fingering still arrives, hideObjectOnPrint False; probed).
#   A fingering on a print-object="no" member of a printed chord is attributed to the chord (probed): known, see below.
# - TRAP 1, class hierarchy: FrettedPluck (the <pluck> tag: guitar/harp plucking finger, p i m a or a number) and
#   StringFingering are SUBCLASSES of Fingering, with fingerNumber None. isinstance(a, Fingering) counted them as
#   fingerings (found by the whole-corpus run: <pluck> is 16 marks in 2 files, which gave 16 extra marks and extra
#   "fingered" attacks that had no <fingering>; <string>/<fret> are 1,183/1,141 elements in 7/5 files).
#   type(a) is Fingering is used, as E22 does for its classes.
# - TRAP 2, digits that are not fingerings: digits typed as <words> (music21: expressions.TextExpression, kept on the staff
#   the <direction> names, on BOTH staves of the part when it names none: 1 digit word in 1 file, MKG3vrxx..., counts
#   on both staves there; not patched, pinned in the tests) and digits in lyrics (note.lyrics). They are
#   never counted as fingerings; they are listed apart as `possible_text` for review (ChatGPT's "preserve digit-only free
#   text as an unverified possible fingering, not a match"). Verse numbers such as "1." do not match (digits 0-5 alone,
#   optionally separated by space, comma or hyphen).
#
# Forms of one <fingering> text (classified, because one element is not always one finger), measured on our 842 files:
#   single  "3"                       22,993 printed marks in 102 files (a plain 1-5)
#   stacked "3\n5", "1 2", "1,"       the fingers of a chord written in ONE label, two or more digits separated by a
#                                      newline, space or comma; 294 in 10 files (Jiw5Xrti... has most, "4\n2"-style:
#                                      one element = two fingers). Digits are read as separate fingers.
#   pair    "3-2", "5-4"              23 in 6 files: a finger change written in the text, counted as a substitution
#   zero    "0"                       14 in 1 file (mxl/9/1 QmR2v9...): not a finger 1-5; kept apart
#   other   9 marks: "¨2" (a bad byte), "[1", "34" or "21" (adjacent digits: not guessed), "6" and up;
#   empty   1 mark (an empty element, music21 gives fingerNumber None); both listed in odd_text with their text
# Whole-corpus raw count (scratch e27_rawscan.py, 842 files): 23,432 <fingering> elements in 103 files (12.2% of 842, as
# my row said), all of them inside <notations><technical> of a note: 23,334 on printed non-grace notes, 96 on grace notes
# (20 files), 2 on hidden notes (1 file), 0 on rests. The substitution and alternate ATTRIBUTES occur 0 times in the
# corpus (the 23 substitutions are all written in the text, "3-2"); the code reads both attributes anyway (probed,
# tested). 2,371 chords carry a fingering, 1,289 with every member fingered and 1,082 (37 files) with only some:
# the partial case is why member counts are not reported. 159 notes carry more than one fingering (15 files) and 123
# fingered chords have a member with more than one: both stay counted per mark. No fingered chord has a hidden member
# (0), so the hidden-member attribution never bites here (pinned in the tests). Digit-only <words>: 2,878 in 7 files
# (the files with the most, 726+410, 770+731, 89, 148, have no <fingering> at all: fingering typed as text, which is what
# possible_text exists for), digit-only lyrics 96 in 2 files (one is a scale-degree line "5 6 1 ..."; the verse numbers
# "1." 8 in 3 files are excluded).
# Whole-corpus run of THIS function against an independent raw count (scratch e27_corpus.py, 842 files, 747,754 printed
# non-grace attacks, 21,632 of them with a fingering): fingering marks 23,334 = 23,334 raw, grace 96 = 96, substitutions
# 23 = the 23 "n-n" texts, alternates 0 = 0, digit lyrics 96 = 96, no file failed to parse; digit words 2,879 against 2,878
# raw, the one extra being the staff-less word counted on both staves. A first run disagreed and found two real errors,
# both fixed and pinned by tests: isinstance(Fingering) took <pluck> (+16 marks), and a regex class "[,-–]" read as a
# range matched tempo numbers such as 165 as digit words; and a dedupe I had added dropped same-digit-on-both-hands
# words (about 100 words in 4 files): removed.
#
# From my row (adopted): per staff the share of attacks with a fingering, substitutions, bars; digit-only words and lyrics
# listed apart; the stacked chord case. From ChatGPT's review (adopted): count per attack and per chord and not one digit
# per sounding note; substitutions and alternates kept apart; digit text never merged into the count; the printed number is
# not evidence the fingering suits the learner. Not adopted: a share per NOTE (see the chord note: music21 loses the member
# for partial chords, and a raw read of 1,082 chords for it would be a custom reader for a number nobody asked for);
# partitura (my row mentions it): not needed, music21 already reads every fingering the raw count finds.
from _raw import bar_label  # printed bar numbers as written (MuseScore X1 bars)
import re
from collections import Counter

_SEP_DASH = "-–—"
_PAIR = re.compile(rf"[1-5]\s*[{_SEP_DASH}]\s*[1-5]")
_STACK = re.compile(r"[1-5](?:[\s,]+[1-5])+[\s,]*|[1-5][\s,]+")      # "3\n5", "1 2", "1,"
_POSSIBLE = re.compile(rf"[0-5](?:[\s,{_SEP_DASH[1:]}-][0-5])*")  # hyphen last: inside a class "," then "-" would be a range


def _form(f):
    """(form, finger digits) of one music21 Fingering."""
    v = f.fingerNumber
    if v is None:
        return "empty", []
    if isinstance(v, int):
        return ("single", [v]) if 1 <= v <= 5 else ("zero", []) if v == 0 else ("other", [])
    t = str(v).strip()
    if t == "":
        return "empty", []
    if _PAIR.fullmatch(t):
        return "pair", [int(c) for c in re.findall(r"[1-5]", t)]
    if _STACK.fullmatch(t):
        return "stacked", [int(c) for c in re.findall(r"[1-5]", t)]
    return "other", []


def fingering(score):
    """Per staff: attacks, attacks with a printed fingering, fingering marks by form, finger digits, substitutions,
    alternates, chord and tied counts, odd texts, bars (bar index + printed number), and apart from the count the
    digit-only words and lyrics (`possible_text`)."""
    import music21 as m
    from e01_layout import layout
    from _notes import printed
    L = layout(score)
    staff_no = {idx: k + 1 for k, idx in enumerate(L["staves"])}
    out = {}
    for idx, k in staff_no.items():
        forms, digits, odd, bars = Counter(), Counter(), Counter(), []
        attacks = fingered = marks = subst = alt = multi_note = chord_fingered = chord_marks = tied = 0
        grace_marks = 0
        lyr, words = Counter(), Counter()
        for mi, meas in enumerate(score.parts[idx].getElementsByClass(m.stream.Measure)):
            label = bar_label(meas)
            for x in meas.recurse().getElementsByClass(m.expressions.TextExpression):
                t = (x.content or "").strip()
                if _POSSIBLE.fullmatch(t):
                    words[t] += 1
            for n, _ in printed(meas):
                fs = [a for a in n.articulations if type(a) is m.articulations.Fingering]  # exact class: see TRAP 1
                if n.duration.isGrace:
                    grace_marks += len(fs)
                    continue
                attacks += 1
                for ly in n.lyrics:
                    t = (ly.text or "").strip()
                    if _POSSIBLE.fullmatch(t):
                        lyr[t] += 1
                if not fs:
                    continue
                fingered += 1
                marks += len(fs)
                for f in fs:
                    form, ds = _form(f)
                    forms[form] += 1
                    digits.update(str(d) for d in ds)
                    if form in ("zero", "other", "empty"):
                        odd["" if f.fingerNumber is None else str(f.fingerNumber)] += 1
                    subst += bool(f.substitution) or form == "pair"
                    alt += bool(f.alternate)
                if n.isChord:
                    chord_fingered += 1
                    chord_marks += len(fs)
                elif len(fs) > 1:
                    multi_note += 1
                members = n.notes if n.isChord else [n]
                if all(x.tie is not None and x.tie.type in ("stop", "continue") for x in members):
                    tied += 1
                if not bars or bars[-1][0] != mi:
                    bars.append([mi, label])
        out[k] = {"attacks": attacks, "fingered_attacks": fingered,
                  "share_fingered": round(fingered / attacks, 4) if attacks else None,
                  "fingerings": marks, "by_form": dict(forms), "digits": dict(sorted(digits.items())),
                  "substitutions": subst, "alternates": alt, "notes_with_several": multi_note,
                  "chords_fingered": chord_fingered, "chord_fingerings": chord_marks,
                  "grace_fingerings": grace_marks, "on_tied_continuation": tied, "odd_text": dict(odd), "bars": bars,
                  "possible_text": {"words": dict(words), "lyrics": dict(lyr)}}
    return out
