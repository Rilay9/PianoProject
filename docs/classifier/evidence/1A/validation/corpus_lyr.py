"""notation.lyrics (20) on music21's bundled corpus, and item.format rule 2 (open-score chorale) on bwv66.6."""
import re, collections, warnings
warnings.simplefilter("ignore")
from music21 import corpus, note
from r_format import VOICE_NAMES, KEYB

COUNT = {str(i) for i in range(1, 13)} | {"&", "+", "and", "e", "a", "ta", "ti", "ti-ti", "tri", "ple", "trip", "let", "po", "tah", "tee"}
SOLF = {"do": "C", "re": "D", "mi": "E", "fa": "F", "sol": "G", "la": "A", "si": "B", "ti": "B"}
FIG = re.compile(r"^[#b]?\d{1,2}(/[#b]?\d{1,2})*$")


def classify(pairs):
    """pairs: (syllable, note letter). Ambiguous tokens settled by alignment with the note's letter."""
    cls = collections.Counter()
    for syl, letter in pairs:
        s = syl.strip().lower()
        if not s:
            continue
        lettery = (re.fullmatch(r"[a-g][#b]?", s) and s[0].upper() == letter) or SOLF.get(s) == letter
        if lettery:
            cls["letter"] += 1
        elif s in COUNT:
            cls["count"] += 1
        elif FIG.match(s):
            cls["fig"] += 1
        else:
            cls["word"] += 1
    tot = sum(cls.values())
    if not tot:
        return "empty", cls
    if cls["count"] / tot >= 0.8:
        return "counting", cls
    if cls["letter"] / tot >= 0.8:
        return "letter names", cls
    if cls["fig"] == tot:
        return "figures", cls
    return "words", cls


for path in ["leadSheet/fosterBrownHair.mxl", "leadSheet/berlinAlexandersRagtime.mxl", "bach/bwv66.6.mxl"]:
    s = corpus.parse(path)
    names = [p.partName for p in s.parts]
    streams = collections.defaultdict(list)
    for pi, p in enumerate(s.parts):
        for n in p.recurse().getElementsByClass(note.Note):
            for l in n.lyrics:
                streams[(pi, l.number)].append((l.text or "", n.pitch.step))
    print(path, "parts", names, "voice-named:", all(VOICE_NAMES.match(x or "") for x in names))
    for k, v in streams.items():
        c, cnt = classify(v)
        print("   stream", k, len(v), "syllables ->", c, dict(cnt), "first:", [x for x, _ in v[:6]])
# synthetic: a sung 'la la' line on a tune whose notes include A
tune = [("la", "C"), ("la", "D"), ("la", "E"), ("la", "A"), ("la", "G"), ("la", "A"), ("la", "F"), ("la", "E")]
print("synthetic 'la' x8 over C D E A G A F E ->", classify(tune))
tune2 = [("la", "A")] * 8
print("synthetic 'la' x8 all on A ->", classify(tune2))
tune3 = [("1", "C"), ("e", "C"), ("&", "D"), ("a", "A"), ("2", "E"), ("e", "E"), ("&", "F"), ("a", "G")]
print("synthetic counting 1 e & a over C C D A E E F G ->", classify(tune3))
