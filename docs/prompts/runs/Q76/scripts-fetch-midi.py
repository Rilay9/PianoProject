"""
The reviewer's first fallback (questions-400e69c8.md §2): the MIDI file Mutopia publishes for the same edition. Fetches
the published .mid and .ly of the named pieces from mutopiaproject.org (the piece pages link them) into
content/scores/imported/mutopia/published/, and prints each file's sha256, whether the published .ly is byte-identical
to the GitHub mirror's at the pinned revision, and the MIDI's tracks (name, notes, channels) as music21 reads them.

    python scripts-fetch-midi.py PineappleRag/PineappleRag magnetic/magnetic ...
"""
import hashlib
import sys
import urllib.request
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
REPO = Path(__file__).resolve().parents[4]
MIRROR = REPO / "content" / "scores" / "imported" / "mutopia" / "ftp" / "JoplinS"
OUT = REPO / "content" / "scores" / "imported" / "mutopia" / "published" / "JoplinS"
BASE = "https://www.mutopiaproject.org/ftp/JoplinS/"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


for stem in sys.argv[1:]:
    for suffix in (".mid", ".ly"):
        dest = OUT / (stem + suffix)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            with urllib.request.urlopen(BASE + stem + suffix, timeout=60) as r:
                dest.write_bytes(r.read())
        print(f"{stem}{suffix}: {dest.stat().st_size} bytes, sha256 {sha(dest)}")
    mirror = MIRROR / (stem + ".ly")
    same = mirror.exists() and mirror.read_bytes().replace(b"\r\n", b"\n") == (OUT / (stem + ".ly")).read_bytes().replace(b"\r\n", b"\n")
    print(f"  published .ly identical to the mirror's (line endings aside): {same}")
    from music21 import midi

    mf = midi.MidiFile()
    mf.open(str(OUT / (stem + ".mid")))
    mf.read()
    mf.close()
    print(f"  MIDI format {mf.format}, ticks per quarter {mf.ticksPerQuarterNote}, {len(mf.tracks)} track(s)")
    for i, track in enumerate(mf.tracks):
        names = [e.data for e in track.events if e.type == midi.MetaEvents.SEQUENCE_TRACK_NAME]
        notes = [e for e in track.events if e.type == midi.ChannelVoiceMessages.NOTE_ON and e.velocity]
        channels = sorted({e.channel for e in notes})
        tempos = [e for e in track.events if e.type == midi.MetaEvents.SET_TEMPO]
        times = [e.data for e in track.events if e.type == midi.MetaEvents.TIME_SIGNATURE]
        print(f"  track {i}: name {names[:1]} notes {len(notes)} channels {channels} tempo events {len(tempos)} time signatures {len(times)}")
