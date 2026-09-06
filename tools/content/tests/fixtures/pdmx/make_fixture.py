"""
Builds the PDMX fixture archive: a 30-row CSV and a tarball (P13 item 7).

Run it to regenerate; the output is committed, so the test suite needs no
network. The rows cover every gate and every label the selector can produce,
using the real column headers read off the archive's own first line.

The scores are written here rather than copied from `app/tests/fixtures`: those
are two and three bars long and every one of them would fail the structure
gate, which would make an end-to-end test that never reaches review. These are
sixteen bars of two-staff music each, plus three built to fail a specific gate —
one with a bar truncated next to a sixteenth grace (the P2 defect), one with a
pitch below A0, and one whose bars are mostly empty.

    py -3.11 tools/content/tests/fixtures/pdmx/make_fixture.py
"""
from __future__ import annotations

import csv
import shutil
import sys
import tarfile
import tempfile
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[4]
sys.path.insert(0, str(REPO_ROOT / "tools" / "content"))

#: The real header, in the real order, from PDMX.csv's first line.
COLUMNS = (
    "path,metadata,mxl,pdf,version,is_user_pro,is_user_publisher,is_user_staff,has_paywall,"
    "is_rated,is_official,is_original,is_draft,has_custom_audio,has_custom_video,n_comments,"
    "n_favorites,n_views,n_ratings,rating,license,license_url,license_conflict,genres,groups,"
    "tags,song_name,title,subtitle,artist_name,composer_name,publisher,complexity,n_tracks,"
    "tracks,song_length,song_length.seconds,song_length.bars,song_length.beats,n_notes,"
    "notes_per_bar,n_annotations,has_annotations,n_lyrics,has_lyrics,n_tokens,"
    "pitch_class_entropy,scale_consistency,groove_consistency,best_path,is_best_path,"
    "best_arrangement,is_best_arrangement,best_unique_arrangement,is_best_unique_arrangement,"
    "subset:all,subset:rated,subset:deduplicated,subset:rated_deduplicated,"
    "subset:no_license_conflict,subset:valid_mxl_pdf"
).split(",")

#: One row per thing the selector has to be able to say. The second field names
#: the kind of score to write for it, or None for a row that has no `mxl`.
#:
#: (cid, score kind, overrides, what this row is for)
ROWS: list[tuple[str, str | None, dict, str]] = [
    ("QmFixtureBachMinuet", "good",
     {"composer_name": "J.S. Bach (1685-1750)", "title": "Minuet in G", "genres": "classical",
      "rating": "4.8", "n_ratings": "40", "n_views": "9000", "complexity": "2",
      "song_length.bars": "24", "notes_per_bar": "8"},
     "a PD composer with bracketed years that agree"),
    ("QmFixtureChopinWaltz", "good",
     {"composer_name": "F. Chopin", "title": "Waltz in A minor", "genres": "classical",
      "rating": "4.6", "n_ratings": "22", "n_views": "5400", "complexity": "4",
      "song_length.bars": "48", "notes_per_bar": "14"},
     "an initialled PD composer"),
    ("QmFixtureTradTune", "single-line",
     {"composer_name": "Traditional", "title": "The Rakes of Mallow", "genres": "folk",
      "rating": "4.2", "n_ratings": "8", "n_views": "1200", "complexity": "1",
      "song_length.bars": "16", "notes_per_bar": "5", "n_tracks": "1", "tracks": "0"},
     "traditional, single track — the Part F reference set"),
    ("QmFixtureTradHymn", "good",
     {"composer_name": "trad.", "title": "Amazing Grace", "genres": "religious",
      "rating": "4.4", "n_ratings": "15", "n_views": "3000", "complexity": "1",
      "song_length.bars": "16", "notes_per_bar": "6"},
     "traditional under another alias, folk-hymn bucket"),
    ("QmFixtureJoplin", "good",
     {"composer_name": "Composed by Scott Joplin", "title": "The Easy Winners",
      "genres": "ragtime", "rating": "4.9", "n_ratings": "60", "n_views": "22000",
      "complexity": "5", "song_length.bars": "80", "notes_per_bar": "20"},
     "a credit prefix that has to be stripped"),
    ("QmFixtureDecoyBartok", "good",
     {"composer_name": "Béla Bartók", "title": "For Children No. 1", "genres": "classical",
      "rating": "4.5", "n_ratings": "12", "n_views": "3400", "complexity": "2",
      "song_length.bars": "20", "notes_per_bar": "7"},
     "DECOY: died 1945, must be labelled in-copyright"),
    ("QmFixtureDecoyKabalevsky", "good",
     {"composer_name": "Kabalevsky", "title": "Clowns", "genres": "classical",
      "rating": "4.3", "n_ratings": "9", "n_views": "2100", "complexity": "2",
      "song_length.bars": "24", "notes_per_bar": "8"},
     "DECOY: died 1987"),
    ("QmFixtureDecoyShostakovich", "good",
     {"composer_name": "D. Shostakovich", "title": "Waltz No. 2", "genres": "classical",
      "rating": "4.7", "n_ratings": "30", "n_views": "12000", "complexity": "4",
      "song_length.bars": "60", "notes_per_bar": "12"},
     "DECOY: died 1975"),
    ("QmFixtureUnknownComposer", "good",
     {"composer_name": "Jane Q. Uploader", "title": "My First Piece", "genres": "NA",
      "rating": "3.1", "n_ratings": "2", "n_views": "40", "complexity": "1",
      "song_length.bars": "12", "notes_per_bar": "4"},
     "unmatched composer — labelled unknown, printed in the top-200 list"),
    ("QmFixtureWantRiverFlows", "good",
     {"composer_name": "Yiruma", "artist_name": "Yiruma", "title": "River Flows in You",
      "genres": "pop", "rating": "4.9", "n_ratings": "500", "n_views": "900000",
      "complexity": "3", "song_length.bars": "40", "notes_per_bar": "10"},
     "a named want — admitted outside the quotas"),
    ("QmFixtureWantSeizeTheDay", "good",
     {"composer_name": "Avenged Sevenfold", "artist_name": "Avenged Sevenfold",
      "title": "Seize the Day (piano arrangement)", "genres": "rock", "rating": "4.5",
      "n_ratings": "40", "n_views": "60000", "complexity": "4", "song_length.bars": "56",
      "notes_per_bar": "13"},
     "a named want from the rock module"),
    ("QmFixtureLyrics", "good",
     {"composer_name": "Traditional", "title": "Scarborough Fair", "genres": "folk",
      "has_lyrics": "True", "n_lyrics": "48", "rating": "4.1", "n_ratings": "10",
      "n_views": "2000", "complexity": "1", "song_length.bars": "16", "notes_per_bar": "5"},
     "lyrics: kept, flagged, ranked down"),
    ("QmFixtureTwoTrackPiano", "good",
     {"composer_name": "Muzio Clementi", "title": "Sonatina Op. 36 No. 1",
      "genres": "classical", "rating": "4.6", "n_ratings": "25", "n_views": "8000",
      "complexity": "3", "song_length.bars": "36", "notes_per_bar": "11",
      "n_tracks": "2", "tracks": "0-0"},
     "two piano tracks — a grand staff written as two parts"),
    ("QmFixturePopFilm", "good",
     {"composer_name": "NA", "artist_name": "Studio Ghibli", "title": "Path of the Wind",
      "genres": "soundtrack", "rating": "4.4", "n_ratings": "18", "n_views": "15000",
      "complexity": "3", "song_length.bars": "32", "notes_per_bar": "10"},
     "NA composer with a genre — the pop-film-game bucket"),
    # --- rows that must be rejected, one per gate ---------------------------
    ("QmFixtureNoMxl", None,
     {"mxl": "NA", "composer_name": "Traditional", "title": "No file here"},
     "GATE 1: no mxl in the archive"),
    ("QmFixtureGuitar", "good",
     {"composer_name": "Traditional", "title": "Guitar piece", "n_tracks": "1", "tracks": "24"},
     "GATE 2: program 24 is a guitar"),
    ("QmFixtureFourTracks", "good",
     {"composer_name": "Traditional", "title": "String quartet", "n_tracks": "4",
      "tracks": "40-41-42-43"},
     "GATE 2: four tracks, none of them a piano"),
    ("QmFixtureLicenseConflict", "good",
     {"composer_name": "Traditional", "title": "Conflicted",
      "subset:no_license_conflict": "False", "license_conflict": "True"},
     "GATE 3: the dataset's own licence-conflict flag"),
    ("QmFixtureNotDeduplicated", "good",
     {"composer_name": "Traditional", "title": "A duplicate upload",
      "subset:deduplicated": "False"},
     "GATE 3: not the deduplicated copy"),
    ("QmFixtureDraft", "good",
     {"composer_name": "Traditional", "title": "Work in progress", "is_draft": "True"},
     "GATE 4: a draft"),
    ("QmFixturePaywall", "good",
     {"composer_name": "Traditional", "title": "Behind a paywall", "has_paywall": "True"},
     "GATE 4: paywalled"),
    ("QmFixtureTooShort", "good",
     {"composer_name": "Traditional", "title": "Four bars", "song_length.bars": "4",
      "n_notes": "20"},
     "GATE 5: four bars"),
    ("QmFixtureTooLong", "good",
     {"composer_name": "Traditional", "title": "Nine hundred bars",
      "song_length.bars": "900", "n_notes": "20000"},
     "GATE 5: 900 bars"),
    ("QmFixtureTooFewNotes", "good",
     {"composer_name": "Traditional", "title": "Twelve notes", "n_notes": "12"},
     "GATE 5: twelve notes"),
    # --- more passers, so the quotas have something to choose between -------
    ("QmFixtureBeethoven", "good",
     {"composer_name": "Ludwig van Beethoven", "title": "Für Elise", "genres": "classical",
      "rating": "4.9", "n_ratings": "300", "n_views": "500000", "complexity": "4",
      "song_length.bars": "100", "notes_per_bar": "15"},
     "the most-uploaded piano piece there is"),
    ("QmFixtureMozart", "truncated-grace",
     {"composer_name": "Mozart, W.A.", "title": "Sonata K545 I", "genres": "classical",
      "rating": "4.7", "n_ratings": "80", "n_views": "60000", "complexity": "4",
      "song_length.bars": "70", "notes_per_bar": "16"},
     "a surname-first spelling"),
    ("QmFixtureBurgmuller", "off-piano",
     {"composer_name": "Burgmüller", "title": "Arabesque Op. 100 No. 2",
      "genres": "classical", "rating": "4.5", "n_ratings": "20", "n_views": "9000",
      "complexity": "3", "song_length.bars": "32", "notes_per_bar": "12"},
     "a method-book composer, umlaut folded"),
    ("QmFixtureCarol", "mostly-empty",
     {"composer_name": "Anonymous", "title": "Silent Night", "genres": "christmas",
      "rating": "4.3", "n_ratings": "14", "n_views": "4000", "complexity": "1",
      "song_length.bars": "16", "notes_per_bar": "5"},
     "anonymous — traditional by alias"),
    ("QmFixtureJazzStandard", "good",
     {"composer_name": "NA", "artist_name": "Various", "title": "Autumn Leaves",
      "genres": "jazz", "rating": "4.2", "n_ratings": "11", "n_views": "7000",
      "complexity": "4", "song_length.bars": "32", "notes_per_bar": "13"},
     "the jazz-latin bucket"),
    ("QmFixtureFilmGame", "good",
     {"composer_name": "NA", "artist_name": "Nobuo Uematsu", "title": "To Zanarkand",
      "genres": "video game", "rating": "4.8", "n_ratings": "90", "n_views": "120000",
      "complexity": "3", "song_length.bars": "44", "notes_per_bar": "9"},
     "the video-game bucket"),
]


# --- the scores ---------------------------------------------------------------


#: A bar of four quarter notes, and the one that is a beat long instead.
_FULL_BAR = "".join(
    "<note><pitch><step>C</step><octave>5</octave></pitch>"
    "<duration>4</duration><type>quarter</type></note>"
    for _ in range(4)
)
_SHORT_BAR = (
    "<note><grace/><pitch><step>D</step><octave>5</octave></pitch><type>16th</type></note>"
    "<note><pitch><step>C</step><octave>5</octave></pitch>"
    "<duration>4</duration><type>quarter</type></note>"
)
_ATTRIBUTES = (
    "<attributes><divisions>4</divisions><key><fifths>0</fifths></key>"
    "<time><beats>4</beats><beat-type>4</beat-type></time>"
    "<clef><sign>G</sign><line>2</line></clef></attributes>"
)
_CONTAINER = (
    '<?xml version="1.0" encoding="UTF-8"?>'
    "<container><rootfiles><rootfile full-path=\"score.xml\" "
    'media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>'
)


def write_truncated_grace(title: str, composer: str, path: Path) -> None:
    """
    The P2 defect, written as MusicXML rather than built with music21.

    music21 will not produce a bar that does not add up — `makeMeasures` pads
    it — so a fixture for this gate has to be typed out. Bar 5 reaches four of
    its sixteen divisions and carries a sixteenth grace, which is exactly the
    shape `truncation_scan` looks for, and the defect survives conversion
    (measured, not assumed: the converted file still trips the scan).
    """
    bars = []
    for number in range(1, 17):
        body = _SHORT_BAR if number == 5 else _FULL_BAR
        attributes = _ATTRIBUTES if number == 1 else ""
        bars.append(f'<measure number="{number}">{attributes}{body}</measure>')
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<score-partwise version="3.1">'
        f"<work><work-title>{title}</work-title></work>"
        f"<identification><creator type=\"composer\">{composer}</creator></identification>"
        '<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>'
        f'<part id="P1">{"".join(bars)}</part></score-partwise>'
    )
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        # Fixed timestamps so the fixture is byte-stable.
        for name, text in (("META-INF/container.xml", _CONTAINER), ("score.xml", xml)):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, text)


def write_score(kind: str, title: str, composer: str, path: Path) -> None:
    """
    Writes one fixture score.

    Sixteen bars, two staves, a tempo and a key — the smallest thing that gets
    past the structure gate — with three deliberate defects available so each
    of the quarry's gates has something to catch.
    """
    if kind == "truncated-grace":
        write_truncated_grace(title, composer, path)
        return

    from music21 import chord, clef, instrument, key, layout
    from music21 import metadata, meter, note, pitch, stream, tempo as m21tempo

    from convert import write_mxl

    score = stream.Score()
    score.metadata = metadata.Metadata()
    score.metadata.title = title
    score.metadata.composer = composer

    right = stream.PartStaff(id="RH")
    left = stream.PartStaff(id="LH")
    for part, sign in ((right, clef.TrebleClef()), (left, clef.BassClef())):
        part.insert(0, instrument.Piano())
        part.insert(0, sign)
        part.insert(0, meter.TimeSignature("4/4"))
        part.insert(0, key.KeySignature(0))
    right.insert(0, m21tempo.MetronomeMark(number=88))

    scale = [60, 62, 64, 65, 67, 69, 71, 72]
    for bar in range(16):
        if kind == "mostly-empty" and bar % 4 != 0:
            right.append(note.Rest(quarterLength=4.0))
            left.append(note.Rest(quarterLength=4.0))
            continue
        for beat in range(4):
            midi = scale[(bar + beat) % len(scale)]
            top = note.Note(midi, quarterLength=1.0)
            right.append(top)
        if kind == "single-line":
            left.append(note.Rest(quarterLength=4.0))
            continue
        root = scale[bar % len(scale)] - 24
        if kind == "off-piano" and bar == 3:
            # Below A0: no piano has this note, and the structure gate says so.
            root = 12
        left.append(chord.Chord([pitch.Pitch(midi=root), pitch.Pitch(midi=root + 7)],
                                quarterLength=4.0))

    if kind == "single-line":
        score.insert(0, right)
    else:
        score.insert(0, right)
        score.insert(0, left)
        score.insert(0, layout.StaffGroup([right, left], name="Piano", symbol="brace"))
    for part in score.parts:
        part.makeMeasures(inPlace=True)
    write_mxl(score, path)


def default_row(cid: str, index: int) -> dict[str, str]:
    """A row with every column filled in, before the overrides."""
    shard = f"{index % 9 + 1}/{index % 40 + 10}"
    return {
        "path": f"./data/{shard}/{cid}.json",
        "metadata": f"./metadata/{index % 9}/{5700000 + index}.json",
        "mxl": f"./mxl/{shard}/{cid}.mxl",
        "pdf": f"./pdf/{shard}/{cid}.pdf",
        "version": "3.01",
        "is_user_pro": "True",
        "is_user_publisher": "False",
        "is_user_staff": "False",
        "has_paywall": "False",
        "is_rated": "True",
        "is_official": "False",
        "is_original": "False",
        "is_draft": "False",
        "has_custom_audio": "False",
        "has_custom_video": "False",
        "n_comments": "0",
        "n_favorites": "2",
        "n_views": "500",
        "n_ratings": "5",
        "rating": "4.0",
        "license": "publicdomain",
        "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
        "license_conflict": "False",
        "genres": "classical",
        "groups": "NA",
        "tags": "NA",
        "song_name": "Fixture",
        "title": "Fixture",
        "subtitle": "NA",
        "artist_name": "NA",
        "composer_name": "NA",
        "publisher": "NA",
        "complexity": "2",
        "n_tracks": "2",
        "tracks": "0-0",
        "song_length": "33120",
        "song_length.seconds": "41.4",
        "song_length.bars": "24",
        "song_length.beats": "96",
        "n_notes": "300",
        "notes_per_bar": "8.0",
        "n_annotations": "0",
        "has_annotations": "False",
        "n_lyrics": "0",
        "has_lyrics": "False",
        "n_tokens": "500",
        "pitch_class_entropy": "2.77",
        "scale_consistency": "0.96",
        "groove_consistency": "0.83",
        "best_path": f"./data/{shard}/{cid}.json",
        "is_best_path": "True",
        "best_arrangement": f"./data/{shard}/{cid}.json",
        "is_best_arrangement": "True",
        "best_unique_arrangement": f"./data/{shard}/{cid}.json",
        "is_best_unique_arrangement": "True",
        "subset:all": "True",
        "subset:rated": "True",
        "subset:deduplicated": "True",
        "subset:rated_deduplicated": "True",
        "subset:no_license_conflict": "True",
        "subset:valid_mxl_pdf": "True",
    }


def build(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, str]] = []
    members: list[tuple[str, Path]] = []
    scratch = Path(tempfile.mkdtemp(prefix="pdmx-fixture-"))

    for index, (cid, kind, overrides, _why) in enumerate(ROWS):
        row = default_row(cid, index)
        row.update(overrides)
        rows.append(row)
        if kind and row["mxl"].upper() != "NA":
            path = scratch / f"{cid}.mxl"
            write_score(kind, row["title"], row["composer_name"], path)
            # The member name has no leading `./` — the same difference the
            # real archive has, so the fixture exercises the bug rather than
            # hiding it.
            members.append((row["mxl"].removeprefix("./"), path))

    csv_path = out_dir / "PDMX.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    tar_path = out_dir / "mxl.tar.gz"
    with tarfile.open(tar_path, "w:gz") as tar:
        for member, source in members:
            info = tar.gettarinfo(str(source), arcname=member)
            # Fixed metadata so the fixture is byte-stable across machines.
            info.mtime = 0
            info.uid = info.gid = 0
            info.uname = info.gname = ""
            with source.open("rb") as handle:
                tar.addfile(info, handle)

    shutil.rmtree(scratch, ignore_errors=True)
    print(f"{len(rows)} row(s) -> {csv_path}")
    print(f"{len(members)} member(s) -> {tar_path} ({tar_path.stat().st_size} bytes)")


if __name__ == "__main__":
    build(HERE)
