"""The right played-bar count of each file where the readers disagree (88 files) plus a 12-file spot check of files where they agree.
LABEL: reading. Each entry is a bar path written by hand from rep_structure.json (the printed structure: repeat barlines, voltas, signs, jump words)
and rep_signs.py (where the signs sit in their bars). This script only sums the paths ("a-b" = bars a to b, "n" = bar n, "*k" = k plays) and
compares them with the readers' counts in rep_readers.json; it reads no score.

Reading rules (the page's, area-1A.md section 23, plus the usual engraving rules):
 R1 |: starts a section; :| sends play back to the nearest preceding |: not yet used, else to the bar after the previous :| (else bar 1); times=k on :| = k plays in all
    (music21 bar.py, Repeat.times docstring: "A standard repeat repeats 2 times").
 R2 a |: with no :| after it (or a :| with no |: before it) is an unbalanced sign: the nearest-sign rule R1 is followed and the entry says so ("unbalanced").
 R3 voltas: pass n plays volta n; a volta with no following volta is skipped on the repeat and play goes on after it.
 R4 D.C./D.S.: back to the start / the segno; no repeats are taken after the jump and the last volta is played; al Fine stops at the Fine sign; al Coda leaves at
    the (To) Coda sign for the Coda sign; a sign written at the end of a bar (rep_signs.py offset = bar length) acts after that bar.
kind: right = one count follows; convention = one count follows under the stated rule, the alternative is given; undetermined = the file does not say.
"""
import re, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent

# id -> (kind, primary path or None, {alt label: path}, note)
E = {}
def add(i, kind, path, alts=None, note=""):
    E["song." + i if not i.startswith("song.") else i] = (kind, path, alts or {}, note)

# ---- the 88 files where readers differ
add("beautiful.hungarian-sonata", "right", "1-31 10-14 32-49", note="D.S. al Coda from the end of 31 to the segno at 10, To Coda at the end of 14, coda 32-49")
add("beautiful.merry-christmas-mr-lawrence", "convention", "1-16*2 17-23 24 17-23 25 26-57 17-23 25 26-57 58-75",
    note="plain 'D.S.' (no 'al Fine' or 'al Coda') read as: segno 17 to the end of the piece; the coda sign at 58 has no 'To Coda' to pair with")
add("blues.aunt-hagars-blues", "convention", "1-52", {"|: at 41 repeats to the end (partitura)": "1-52 41-52"}, "unbalanced: one |: at 41, no :|")
add("blues.jazz-me-blues", "convention", "1-41", {"|: at 21 repeats to the end (partitura)": "1-41 21-41"}, "unbalanced: one |: at 21, no :|")
add("blues.riverside-blues", "right", "1-15 16 1-15 17 18-29*2 30-41*2", note="volta 1 = 16, volta 2 = 17; the :| at 41 returns to bar 30 (R1)")
add("blues.st-james-infirmary", "convention", "1-24", {"|: at 17 repeats to the end (partitura)": "1-24 17-24"}, "unbalanced: one |: at 17, no :|")
add("blues.weary-blues", "right", "1-12*2 13-23 24 13-23 25 1-11 26-43", note="D.C. al Coda: to the coda sign at the end of bar 11, coda at 26; bar 11 holds two coda directions (offsets 0 and 4)")
add("classical.ah-vous-dirais-je-maman.pdmx", "undetermined", None, {"D.C. replays all 16 bars": "1-16 1-16"}, "'D.C. al Fine' with no Fine sign anywhere in the file: where the replay stops is not stated")
add("classical.anonymous-romance-anonimo-romanza.pdmx", "right", "1-16*2 17-31 32 17-31 33 1-16", note="D.C. al Fine to the Fine at the end of 16, no repeats")
add("classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx", "convention", "1-9*2 10-18*2 19-27*2 28-36*2 1-18 37-61",
    {"first coda sign taken at the START of bar 18 (offset 0.00): jump before bar 18": "1-9*2 10-18*2 19-27*2 28-36*2 1-17 37-61"},
    "two coda signs, no 'To Coda' words: the first is the jump point (the validation page's rule; offset 0.00 in bar 18 makes it 114 if taken literally)")
add("classical.beethoven-ecossaise.pdmx", "right", "1-9 10-18*2 1-9", note="D.C. al Fine, Fine at the end of 9")
add("classical.beethoven-fur-elise", "right", "1-8 9 1-8 10 11-23 24 11-23 25 26-106", note="volta 1 = 9, volta 2 = 10; volta 1 = 24, volta 2 = 25")
add("classical.burgmuller-le-courant-limpide-the-crystal-clear-stream.pdmx", "right", "1-16 1-8")
add("classical.chopin-mazurka-op24-3.nifc", "convention", "1-38 15-38 39-46", {"the |: at 2 pairs with the :| at 38": "1 2-38*2 39-46"}, "unbalanced: |: at 2 and at 15, one :| at 38; R1 pairs the :| with the nearer |:")
add("classical.chopin-mazurka-op6-1.nifc", "convention", "1-16*2 17 18-41*2 42 43-75", {"|: at 43 repeats to the end (partitura)": "1-16*2 17 18-41*2 42 43-75*2"}, "unbalanced: a final |: at 43")
add("classical.chopin-mazurka-op6-2.nifc", "convention", "1-8 9-17*2 18-34*2 35-75", {"|: at 35 repeats to the end (partitura)": "1-8 9-17*2 18-34*2 35-75*2"}, "unbalanced: a final |: at 35")
add("classical.chopin-mazurka-op68-2.nifc", "convention", "1-17 18-29*2 30 31-37*2 38*2 39-66", note="a :| at 38 straight after the :| at 37 is read as a one-bar section (R1); no |: is printed at 38")
add("classical.chopin-mazurka-op7-2.nifc", "right", "1-17*2 18-34*2 35-59*2 60", note="the :| at 59 returns to bar 35 (after the :| at 34)")
add("classical.chopin-polonaise-g-minor.nifc", "right", "1-12*2 13-22*2 23-30*2 31-38*2")
add("classical.chopin-polonaise-g-sharp-minor.nifc", "right", "1-12*2 13-27*2 28-39*2 40-61*2")
add("classical.duvernoy-etude-op-176-no-8.pdmx", "right", "1-24 1-16")
add("classical.handel-handel-g-f-menuet-hwv-434-4.pdmx", "right", "1-16*2 17-38*2 1-16")
add("classical.haydn-sonata-in-g-major-hob-xvi-8.pdmx", "convention", "1-17*2 18-46*2 47-54*2 55-62*2 63-67*2 68-73*2 74-81*2 82-97*2",
    note="lone :| at 54, 67, 81 each return to the bar after the previous :| (R1); if they returned to the start the count would be far larger (music21 956)")
add("classical.hisaishi-totoro-path-of-the-wind.pdmx", "right", "1 2-9 2-8 10-34", note="volta 1 = bar 9 only; no volta 2 printed, so bar 9 is skipped on the repeat and play goes on at 10")
add("classical.kohler-sonatina-op-300-no-1.pdmx", "right", "1-77*2 78-93*2 94-113")
add("classical.lemoine-etude-op-37-no-14.pdmx", "right", "1-32 1-16")
add("classical.lemoine-etude-op-37-no-17.pdmx", "right", "1-9*2 10-18*2 19-27 1-18")
add("classical.lemoine-etude-op-37-no-18.pdmx", "right", "1-52 1-16")
add("classical.lemoine-etude-op-37-no-21.pdmx", "right", "1-9 10-18*2 19-27*2 28-36*2 1-18")
add("classical.lemoine-etude-op-37-no-25.pdmx", "right", "1-38 39-55*2 56-72 5-38", note="no :| at 72: 56-72 once; D.S. al Fine from the segno at 5 to the Fine at the end of 38")
add("classical.lemoine-etude-op-37-no-26.pdmx", "right", "1-50 2-17")
add("classical.lemoine-etude-op-37-no-27.pdmx", "right", "1-9*2 10-18*2 19-27*2 28-36 1-18")
add("classical.lemoine-etude-op-37-no-29.pdmx", "right", "1-8*2 9-24 25-32*2 33-48 1-24")
add("classical.lemoine-etude-op-37-no-32.pdmx", "right", "1-16*2 17-32 1-16")
add("classical.lemoine-etude-op-37-no-33.pdmx", "right", "1-16 1-8")
add("classical.lemoine-etude-op-37-no-35.pdmx", "right", "1-16 1-8")
add("classical.lemoine-etude-op-37-no-36.pdmx", "right", "1-34 2-17")
add("classical.lemoine-etude-op-37-no-39.pdmx", "right", "1-32 1-8")
add("classical.lemoine-etude-op-37-no-40.pdmx", "right", "1-27 1-8")
add("classical.lemoine-etude-op-37-no-42.pdmx", "right", "1-40 1-16")
add("classical.lemoine-etude-op-37-no-44.pdmx", "right", "1-28 1-8")
add("classical.lemoine-etude-op-37-no-45.pdmx", "right", "1-20 1-8")
add("classical.lemoine-etude-op-37-no-6.pdmx", "right", "1-8*2 9-16 17-24*2 25-40 1-16")
add("classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx", "convention", "1-28 29-52 29-48 50-52 53-80",
    {"volta 1 taken to span 49-52 (the :| is at 52)": "1-28 29-52 29-48 53-80"}, "volta 1 is stopped at bar 49 in the file but the :| is at 52 and no volta 2 exists")
add("classical.mozart-contredanse-in-a-major-k-15l.pdmx", "right", "1-16*2 17-24*2 25-32*2 1-16")
add("classical.mozart-contredanse-in-f-major-k-15h.pdmx", "right", "1-12*2 13-24*2 1-12")
add("classical.mozart-minuet-in-c-major-fragment-k-15rr.pdmx", "convention", "1-8*2 9-13", {"|: at 9 repeats to the end (partitura)": "1-8*2 9-13*2"}, "unbalanced: a final |: at 9")
add("classical.mozart-rondo-in-f-major-k-15hh.pdmx", "right", "1-62 1-16", note="'Da capo al Fine' (words with italics markup), Fine at the end of 16")
add("classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx", "right", "1-9*2 10-27*2 28-36*2 1-18", note="Fine at the end of 18 sits inside the repeat 10-27 and is ignored on the first passes; 'Menuetto da Capo al Fine' from 36")
add("classical.nazareth-carioca-1913.pdmx", "undetermined", None,
    {"before the D.C. (repeats inside the coda taken)": "1 2-16 17 2-16 18 19-49 50 19-49 51 2-16 53 54-68 69 54-68 70 71-78",
     "before the D.C. (no repeats inside the coda)": "1 2-16 17 2-16 18 19-49 50 19-49 51 2-16 53 54-68 70 71-78"},
    "the 'D.C. al' at bar 78 returns to bar 1 and the Fine is at the end of bar 18, volta 2 of an A section whose volta 1 is numbered '1,3' (bar 17): the tail is not determined, and whether the coda's own repeats are played after the jump is not stated")
add("classical.pachelbel-pachelbel-chaconne-in-f-minor.pdmx", "undetermined", None, {"whole piece again (the unroller)": "1-185 1-177"},
    "'Thema da capo' at bar 177 names the theme, not the piece; no Fine sign; bars 178-185 follow")
add("classical.radetzky-march-for-easy-piano.pdmx", "undetermined", None, {"D.C. replays all 88 bars": "1-88 1-88"}, "'D.C. al Fine' with no Fine sign in the file")
add("classical.st-louis-blues.pdmx", "undetermined", None, {"D.C. replays all 28 bars": "1-12*2 13-28 1-28"}, "'D.C. al Fine' with no Fine sign in the file")
add("classical.streabbog-la-violette.pdmx", "right", "1-16*2 17-32*2 33-36 37-52*2 1-32", note="D.C. al Fine, Fine at the end of 32")
add("folk.carioquinha.pdmx", "convention", "1-6 7-36 37 38 7-36 38 39 40-72 7-36 73-77", {"bar 38 belongs to volta 1 (the :| is at its end)": "1-6 7-36 37 38 7-36 39 40-72 7-36 73-77"},
    "volta 1 is stopped at bar 37 in the file but the :| is at bar 38; D.S. al Coda to the sign at the end of bar 36")
add("folk.dark-eyes.pdmx", "convention", "1-17", {"|: at 2 repeats to the end (partitura)": "1-17 2-17"}, "unbalanced: one |: at 2, no :|")
add("folk.down-by-the-riverside.pdmx.2", "right", "1-60 5-16 61-66", note="coda sign at the end of bar 16 (offset 4.00 of 4.00)")
add("folk.margaritaville-keyboard-part.pdmx", "right", "1-38 7-33 39-100", note="coda sign at the end of bar 33")
add("folk.o-holy-night-piano-solo.pdmx", "right", "1-22 23-62 23-49 63-96", note="volta 1 = 50-62 (:| at 62), no volta 2 printed: skipped on the repeat, play goes on at 63")
add("jazz.bart-howard-fly-me-to-the-moon.pdmx", "right", "1-16 1-10 17-22", note="volta 1 = 11-16, :| at 16 with no |: (back to bar 1)")
add("jazz.the-crave", "undetermined", None, {"D.S. to bar 1, no coda sign: replays all": "1-52 1-53"}, "'D.S. al Coda' but no segno and no coda sign anywhere in the file")
add("jazz.vince-guaraldi-skating.pdmx", "convention", "1 2-5*4 6-57 58-60 61 58-60 62 63-92 93-96*3 97-106 38-57 107-109 111 112-126 127-130 131-137",
    {"repeats inside the coda taken": "1 2-5*4 6-57 58-60 61 58-60 62 63-92 93-96*3 97-106 38-57 107-109 110 107-109 111 112-126 127-130*7 131-137"},
    "times=4, 3, 7 read as total plays; D.S. al Coda from 106 to the segno at 38, To Coda at the end of 57, coda from 107; whether the coda's own repeats are played after the jump is not stated")
add("pop.after-you-ve-gone.pdmx", "convention", "1-36", {"|: at 17 repeats to the end (partitura)": "1-36 17-36"}, "unbalanced: one |: at 17, no :|")
add("pop.avalon.pdmx", "convention", "1-33", {"|: at 2 repeats to the end (partitura)": "1-33 2-33"}, "unbalanced: one |: at 2, no :|")
add("pop.coldplay-clocks-coldplay.pdmx", "convention", "1-4*2 5-8*2 1-8 9-18 20-22", note="a plain 'D.C.' at the end of bar 8, before 14 more bars; read as: replay from bar 1 without repeats to the end, taking the last volta (20)")
add("pop.coldplay-fix-you-coldplay.pdmx", "right", "1-12 13-30 13-26 31-38*2 39-46*2 47-53", note="volta 1 = 27-30, volta 2 = 31, then |: at 31 repeats 31-38")
add("pop.eiffel-65-i-m-blue.pdmx", "convention", "1 2-3*3 4-5 6-7*3 8-9 10-11*3 12-29 30-31*3 32-33 34-35*3 36-49 50-51*3 52-53 54-55*3 56-57 58-59*3 60-61",
    {"times=3 read as 2 plays (partitura)": "1 2-3*2 4-5 6-7*2 8-9 10-11*2 12-29 30-31*2 32-33 34-35*2 36-49 50-51*2 52-53 54-55*2 56-57 58-59*2 60-61"}, "times=3 = three plays in all (music21's Repeat.times docstring)")
add("pop.harry-styles-falling-by-harry-styles.pdmx", "right", "1-8 9-15 16 9-15 17 18-75 76-83 76-81 84-89", note="second volta pair: volta 1 = 82-83 with :| at 83, no volta 2: skipped on the repeat, play goes on at 84")
add("pop.margie.pdmx", "convention", "1-48", {"|: at 17 repeats to the end (partitura)": "1-48 17-48"}, "unbalanced: one |: at 17, no :|")
add("pop.toby-fox-sans-from-undertale-for-piano.pdmx", "undetermined", None, {"D.C. replays all 12 bars": "1-12 1-12"}, "a bare 'D.C.' on the last bar, no Fine sign")
add("ragtime.joplin-cascades", "convention", "1-4 5-21 22-37*2 38-42 43-58*2 59 60-75*2 76", {"the |: at 5 pairs with the :| at 37": "1-4 5-37*2 38-42 43-58*2 59 60-75*2 76"}, "unbalanced: |: at 5, 21 and 22, one :| at 37 (R1 pairs it with 22)")
add("ragtime.joplin-chrysanthemum", "right", "1-4 5-20*2 21-37*2 38-54 55-70*2 71 72-87*2 88-104")
add("ragtime.joplin-crush-collision-march", "right", "1-5 6-21*2 22 23-38*2 39-40 41-56*2 57-73*2 74 75-106*2 107")
add("ragtime.joplin-elite-syncopations", "convention", "1-4 5-20*2 21-37*2 38-70*2 71 72-88", {"|: at 72 repeats to the end (partitura)": "1-4 5-20*2 21-37*2 38-70*2 71 72-88*2"}, "unbalanced: a final |: at 72")
add("ragtime.joplin-eugenia", "convention", "1-4 5-20*2 21 22-37*2 38-54 55-70 71-102*2 103", {"the |: at 55 pairs with the :| at 102 (partitura)": "1-4 5-20*2 21 22-37*2 38-54 55-102*2 103"}, "unbalanced: |: at 55 and 71, one :| at 102")
add("ragtime.joplin-leola", "right", "1 2-17*2 18 19-34*2 35-67*2 68-84*2 85", note="lone :| at 67 returns to bar 35, at 84 to bar 68")
add("ragtime.joplin-maple-leaf-rag", "right", "1 2-16 17 2-16 18 19-33 34 19-33 35 36-51 52-66 67 52-66 68 69-83 84 69-83 85", note="volta 1 = 17 with no volta 2: skipped on the repeat, play goes on at 18")
add("ragtime.joplin-maple-leaf-rag.kern", "right", "1 2-17*2 18 19-34*2 35-51 52-67*2 68-84*2 85")
add("ragtime.joplin-march-majestic", "convention", "1-4 5-20*2 21 22-36*2 37*2 38-55*2 56 57-88*2 89", note="a :| at 37 straight after the :| at 36 is a one-bar section (R1)")
add("ragtime.joplin-new-rag", "right", "1-4 5-20*2 21-37*2 38-54 55-70*2 71-111")
add("ragtime.joplin-nonpareil", "right", "1-4 5-20*2 21 22-37*2 38-54*2 55 56-71*2 72")
add("ragtime.joplin-pleasant-moments", "convention", "1-35*2 36*2 37-70*2 71-98", note="a :| at 36 straight after the :| at 35 is a one-bar section (R1)")
add("ragtime.joplin-rose-bud-march", "right", "1-4 5-20*2 21 22-37*2 38-71*2 72-77 78-93*2 94")
add("ragtime.joplin-rose-leaf-rag", "convention", "1-4 5-20*2 21 22-37*2 38-54 55-70*2 71 72-88", {"|: at 72 repeats to the end (partitura)": "1-4 5-20*2 21 22-37*2 38-54 55-70*2 71 72-88*2"}, "unbalanced: a final |: at 72")
add("ragtime.joplin-school-of-ragtime", "right", "1-5*2 6-9*2 10-13*2 14-17*2 18-25*2 26-33*2", note="six exercises, each closed by a lone :| (R1); music21 592 returns to bar 1 each time")
add("ragtime.joplin-stoptime-rag", "convention", "1-8*2 9 10-17*2 18-26 27-42*2 43 44-51*2 52-53 54-61*2 62 63-70*2 71-78 79-86*2 87", note="|: at 71 and 79, one :| at 86 (R1 pairs it with 79)")
add("ragtime.joplin-swipesy-cakewalk", "right", "1-4 5-20*2 21 22-37*2 38-70*2 71-87*2 88")
add("ragtime.joplin-weeping-willow", "right", "1-4 5-20*2 21 22-37*2 38-70*2 71 72-87*2 88")

# ---- spot check: 12 files where the readers that gave a count agree (seed 7 sample of the 241)
SPOT = {}
def spot(i, path):
    SPOT["song." + i] = path
spot("classical.lemoine-etude-op-37-no-49.pdmx", "1-8*2 9-24")
spot("classical.chopin-mazurka-op30-3.nifc", "1-8 9-24*2 25-95")
spot("classical.mozart-minuet-in-f-major-k-4.pdmx", "1-10*2 11-24")
spot("jazz.the-dave-brubeck-quartet-take-five.pdmx", "1 2-17*2 18-25")
spot("classical.bach-little-prelude-in-c-major-bwv-933.pdmx", "1-8*2 9-16*2")
spot("classical.bach-menuet-in-d-minor-bwv-anh-132.pdmx", "1-7 8 1-7 9 10-16 17 10-16 18")
spot("ragtime.joplin-antoinette", "1-4 5-20*2 21 22-37*2 38-54 55-90*2 91-92")
spot("classical.schumann-soldiers-march-op-68-no-2.pdmx", "1-16 17-32*2")
spot("classical.bertini-etude-in-b-flat-major-op-29-no-4.pdmx", "1-8*2 9-35")
spot("classical.mozart-k545-i", "1-28*2 29-73*2")
spot("folk.je-te-laisserai-des-mots-patrick-watson.pdmx", "1-47*2")
spot("classical.bach-little-prelude-in-d-major-bwv-936.pdmx", "1-20*2 21-48*2")


def total(path):
    n = 0
    for tok in path.split():
        m = re.fullmatch(r"(\d+)(?:-(\d+))?(?:\*(\d+))?", tok)
        assert m, tok
        a = int(m.group(1)); b = int(m.group(2) or a); k = int(m.group(3) or 1)
        assert b >= a
        n += (b - a + 1) * k
    return n


if __name__ == "__main__":
    R = json.load(open(HERE / "rep_readers.json", encoding="utf8"))
    S = json.load(open(HERE / "rep_structure.json", encoding="utf8"))
    out = {}
    miss = [i for i in E if i not in R]
    assert not miss, miss
    for i, (kind, path, alts, note) in E.items():
        r = R[i]
        ent = {"kind": kind, "reading": total(path) if path else None, "path": path, "alts": {k: total(v) for k, v in alts.items()}, "alt_paths": alts, "note": note,
               "printed": r["printed"], "pipeline": S[i]["pipeline"], "jump": bool(S[i]["jump_words"]),
               "unroller": r["unroller"], "unroller_cp": r["unroller_cp"], "music21": r["music21"], "pt_max_noleap": r["pt_max_noleap"], "pt_max": r["pt_max"]}
        out[i] = ent
    spot_out = {}
    for i, p in SPOT.items():
        r = R[i]
        spot_out[i] = {"reading": total(p), "path": p, "unroller": r["unroller"], "music21": r["music21"], "pt_max_noleap": r["pt_max_noleap"]}
    json.dump({"files": out, "spot": spot_out}, open(HERE / "rep_readings.json", "w", encoding="utf8"), indent=1, ensure_ascii=False)
    print("readings:", len(out), "files; spot:", len(spot_out))
    import collections
    print(collections.Counter(e["kind"] for e in out.values()))
    # reader verdicts against the primary reading (kind right/convention)
    readers = ["unroller", "unroller_cp", "music21", "pt_max_noleap"]
    for rd in readers:
        c = collections.Counter()
        for i, e in out.items():
            if e["kind"] == "undetermined":
                continue
            v = e[rd]
            if not isinstance(v, int):
                c["no count"] += 1
            elif v == e["reading"]:
                c["right"] += 1
            else:
                c["wrong"] += 1
        print(rd, dict(c))
    bad = [(i, e["reading"], e["unroller_cp"]) for i, e in out.items() if e["kind"] != "undetermined" and e["unroller_cp"] != e["reading"]]
    print("files where unroller_cp differs from the reading:", bad)
    for i, e in spot_out.items():
        print("spot", i, e["reading"], e["unroller"], e["music21"], e["pt_max_noleap"], "OK" if e["reading"] == e["unroller"] else "DIFF")
