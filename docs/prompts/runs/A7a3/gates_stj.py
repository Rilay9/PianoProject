"""G4-G6 and G11 by tool for the A7a.3 probe's two CIDs (adapted from the A7b.1 probe's gates_bb.py):
quarry_core.analyse on the raw bytes; quarry_core.identity; element counts on raw and converted
(harmony, measure, part, staves, metronome, sound tempo, lyric, unpitched, percussion clef, words,
instrument-sound, credit words); clefs and part names; the round-trip set (quarry.pitch_multiset)."""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "tools" / "content"))
from pdmx.quarry_core import analyse, identity, mxl_inner_xml  # noqa: E402
from convert import parse_source  # noqa: E402
from pdmx.quarry import pitch_multiset  # noqa: E402

ITEMS = {
    "Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs": (
        "st james infirmary", ["traditional", "primrose", "mills"],
        {"title": "St James Infirmary", "song_name": "st james infirmary", "subtitle": "",
         "composer": "Early 1900's", "artist": "Misc Traditional"}),
    "QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG": (
        "st louis blues", ["handy", "w. c. handy"],
        {"title": "st louis blues", "song_name": "St. Louis Blues", "subtitle": "", "composer": "NA",
         "artist": "W. C. Handy"}),
}
for cid, (work, aliases, brief) in ITEMS.items():
    print("=====", cid)
    raw = HERE / "pdmx" / "raw" / f"{cid}.mxl"
    conv = HERE / "pdmx" / "converted" / f"{cid}.mxl"
    xr = mxl_inner_xml(raw.read_bytes())
    xc = mxl_inner_xml(conv.read_bytes())
    print("analyse(raw):", json.dumps(analyse(xr, [0]), default=str))
    print(f"identity({work!r}):", identity(work, aliases, brief))
    for name, x in (("raw", xr), ("converted", xc)):
        print(f"{name}: <harmony> {x.count(b'<harmony')}, <measure {x.count(b'<measure ')}, <part {x.count(b'<part ')}, "
              f"<staves> {x.count(b'<staves>')}, <metronome {x.count(b'<metronome')}, sound tempo {x.count(b'tempo=')}, "
              f"<lyric {x.count(b'<lyric ') + x.count(b'<lyric>')}, <unpitched {x.count(b'<unpitched')}, "
              f"percussion clef {x.count(b'<sign>percussion')}, <words {x.count(b'<words')}, "
              f"<instrument-sound {x.count(b'<instrument-sound')}")
        clefs = re.findall(rb"<clef[^>]*>\s*<sign>(\w+)</sign>\s*<line>(\d)</line>", x)
        print(f"  clefs {sorted(set(clefs))}; part-names {re.findall(rb'<part-name[^>]*>([^<]*)</part-name>', x)}; "
              f"instrument-sound {re.findall(rb'<instrument-sound>([^<]*)<', x)}; "
              f"credit-words {[w.decode('utf-8', 'replace') for w in re.findall(rb'<credit-words[^>]*>([^<]*)</credit-words>', x)]}; "
              f"words {[w.decode('utf-8', 'replace') for w in re.findall(rb'<words[^>]*>([^<]*)</words>', x)][:8]}")
        lyr = re.findall(rb"<text>([^<]*)</text>", x)
        print(f"  lyric syllables {len(lyr)}: {' '.join(t.decode('utf-8', 'replace') for t in lyr[:30])}")
    sa, sc = pitch_multiset(parse_source(raw)), pitch_multiset(parse_source(conv))
    print(f"round-trip (bar, staff, pitch): raw {len(sa)}, converted {len(sc)}, equal {sa == sc}")
    pitches = sorted({p for (_, _, p) in sa})
    print(f"pitch span (midi): {pitches[0]}-{pitches[-1]}")
