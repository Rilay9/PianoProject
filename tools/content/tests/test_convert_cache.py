"""
The conversion cache (replan §1.3).

A cache is only ever allowed to change *when* an answer is computed, never what
it is, so these tests are all about the key: the same inputs must hit, and any
input that changes the written file must miss.
"""
from __future__ import annotations

import difflib
import hashlib
import shutil
import sys
import tempfile
import types
import unittest
import zipfile
from datetime import date
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import convert  # noqa: E402
from convert import CacheStats, cache_key, cached_convert, tool_fingerprint  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"
SOURCE = FIXTURES / "two-spines.krn"


def converting_on(day: date):
    """
    music21 as it runs on `day`: its exporter reads the date from `datetime.date.today()` and nothing
    else (`m21ToXml.ScoreExporter.setEncoding`, the module's one use of `datetime`), so the test swaps
    the module's `datetime` for one whose today is `day`. A test's clock only: the converter itself
    never patches the library.
    """
    from music21.musicxml import m21ToXml

    return mock.patch.object(m21ToXml, "datetime", types.SimpleNamespace(date=types.SimpleNamespace(today=lambda: day)))


def score_text(path: Path) -> str:
    """The score's MusicXML: the file itself, or the score entry of an `.mxl` (not its container)."""
    if path.suffix.lower() != ".mxl":
        return path.read_bytes().decode("utf-8")
    with zipfile.ZipFile(path) as archive:
        names = [n for n in archive.namelist() if not n.upper().startswith("META-INF/")]
        return archive.read(names[0]).decode("utf-8")


def differing_lines(a: str, b: str) -> list[str]:
    """The lines one text has and the other does not, `-` for the first and `+` for the second."""
    return [line for line in difflib.unified_diff(a.splitlines(), b.splitlines(), lineterm="", n=0)
            if line[:1] in "+-" and not line.startswith(("+++", "---"))]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


#: A music21 header as music21 10.5.0 prints it (the declaration, the DOCTYPE, the encoding block).
DATED_HEADER = (
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<!DOCTYPE score-partwise  PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" '
    '"http://www.musicxml.org/dtds/partwise.dtd">\n'
    '<score-partwise version="4.0">\n'
    "  <identification>\n"
    '    <creator type="composer">Anon</creator>\n'
    "    <encoding>\n"
    "      <encoding-date>2026-09-22</encoding-date>\n"
    "      <software>music21 v.10.5.0</software>\n"
    '      <supports element="beam" type="yes" />\n'
    '      <supports element="stem" type="yes" />\n'
    '      <supports element="accidental" type="yes" />\n'
    "    </encoding>\n"
    "  </identification>\n"
    '  <part-list><score-part id="P1"><part-name /></score-part></part-list>\n'
    "</score-partwise>\n"
)
UNDATED_HEADER = DATED_HEADER.replace("      <encoding-date>2026-09-22</encoding-date>\n", "")


class CacheCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.tmp = Path(self._tmp.name)
        self.cache = self.tmp / "cache"
        self._patch = mock.patch.object(convert, "CACHE_DIR", self.cache)
        self._patch.start()
        convert.CACHE_STATS = CacheStats()
        tool_fingerprint.cache_clear()

    def tearDown(self) -> None:
        self._patch.stop()
        tool_fingerprint.cache_clear()
        self._tmp.cleanup()


class TestKey(CacheCase):
    def test_same_inputs_give_the_same_key(self) -> None:
        self.assertEqual(cache_key(SOURCE, title="A"), cache_key(SOURCE, title="A"))

    def test_options_are_part_of_the_key(self) -> None:
        # The bug this prevents: two callers asking for different tempos and
        # being handed one another's file.
        self.assertNotEqual(cache_key(SOURCE, tempo_bpm=90), cache_key(SOURCE, tempo_bpm=120))
        self.assertNotEqual(cache_key(SOURCE, title="A"), cache_key(SOURCE, title="B"))
        self.assertNotEqual(
            cache_key(SOURCE, keep_lyrics=True), cache_key(SOURCE, keep_lyrics=False)
        )

    def test_source_bytes_are_part_of_the_key(self) -> None:
        other = self.tmp / "other.krn"
        other.write_bytes(SOURCE.read_bytes() + b"\n!!!ONB: a comment\n")
        self.assertNotEqual(cache_key(SOURCE), cache_key(other))

    def test_tool_fingerprint_follows_music21(self) -> None:
        first = tool_fingerprint()
        tool_fingerprint.cache_clear()
        with mock.patch("music21.__version__", "0.0.0-test"):
            second = tool_fingerprint()
        self.assertNotEqual(first, second)


class TestRoundTrip(CacheCase):
    def test_second_call_hits_and_does_not_reconvert(self) -> None:
        first = cached_convert(SOURCE, self.tmp / "a.mxl")
        self.assertEqual(convert.CACHE_STATS.hits, 0)
        self.assertEqual(convert.CACHE_STATS.misses, 1)

        with mock.patch.object(convert, "convert_file") as never:
            second = cached_convert(SOURCE, self.tmp / "b.mxl")
            never.assert_not_called()

        self.assertEqual(convert.CACHE_STATS.hits, 1)
        self.assertTrue((self.tmp / "b.mxl").is_file())
        # The bytes and the reported facts both survive the round trip.
        self.assertEqual((self.tmp / "a.mxl").read_bytes(), (self.tmp / "b.mxl").read_bytes())
        self.assertEqual(first.measures, second.measures)
        self.assertEqual(first.title, second.title)
        self.assertEqual(first.tempo_bpm, second.tempo_bpm)
        self.assertEqual(first.staves, second.staves)
        self.assertEqual(second.path, self.tmp / "b.mxl")

    def test_no_cache_always_converts(self) -> None:
        cached_convert(SOURCE, self.tmp / "a.mxl")
        with mock.patch.object(convert, "convert_file", wraps=convert.convert_file) as spy:
            cached_convert(SOURCE, self.tmp / "b.mxl", use_cache=False)
            spy.assert_called_once()

    def test_a_damaged_entry_is_a_miss_not_a_crash(self) -> None:
        cached_convert(SOURCE, self.tmp / "a.mxl")
        for sidecar in self.cache.glob("*.json"):
            sidecar.write_text("{not json", encoding="utf-8")
        result = cached_convert(SOURCE, self.tmp / "b.mxl")
        self.assertEqual(convert.CACHE_STATS.misses, 2)
        self.assertTrue(result.measures > 0)

    def test_an_unwritable_cache_still_converts(self) -> None:
        with mock.patch.object(convert.shutil, "copyfile", side_effect=OSError("read-only")):
            # The first copy is the cache write; convert_file itself does not
            # copy, so the conversion must still succeed and be returned.
            result = cached_convert(SOURCE, self.tmp / "a.mxl")
        self.assertTrue(result.measures > 0)


class TestReproducible(CacheCase):
    """
    The same music must always produce the same bytes.

    Not a nicety: the catalog records each file's sha256 as provenance, and the
    render manifest is keyed on it. music21 mints part and instrument ids from
    object identity and zips them with the wall clock, so without normalising
    both, a file "changed" every run and on every machine — which would have
    made the manifest re-engrave scores nobody had touched.
    """

    def test_converting_twice_gives_identical_bytes(self) -> None:
        # Same output *name* in two directories: the zip stores each entry's
        # filename, so `a.mxl` and `b.mxl` differ for a reason that has nothing
        # to do with reproducibility.
        first = self.tmp / "one" / "score.mxl"
        second = self.tmp / "two" / "score.mxl"
        cached_convert(SOURCE, first, use_cache=False)
        cached_convert(SOURCE, second, use_cache=False)
        self.assertEqual(first.read_bytes(), second.read_bytes())

    def test_zip_entries_carry_a_fixed_timestamp(self) -> None:
        import zipfile

        dest = self.tmp / "stamped.mxl"
        cached_convert(SOURCE, dest, use_cache=False)
        with zipfile.ZipFile(dest) as archive:
            stamps = {info.date_time for info in archive.infolist()}
        self.assertEqual(stamps, {convert.ZIP_EPOCH})

    def test_the_archive_is_the_same_on_every_platform(self) -> None:
        # E50a, the reviewer's required correction (questions-bd7d303e.md §5): `zipfile` writes the
        # creating system into every central-directory entry (`ZipInfo.create_system`: 0 on Windows,
        # 3 elsewhere), so the same score normalised on the laptop and on CI's Linux runner was two
        # files. `normalise_archive` pins it, beside the zip times and the permissions it already pins.
        import zipfile

        entries = [("META-INF/container.xml", b"<container/>"), ("score.musicxml", UNDATED_HEADER.encode("utf-8"))]

        def written(name: str, system: int, external_attr: int) -> Path:
            """An archive as another machine's zip tool wrote it: its own creating system and attributes."""
            path = self.tmp / name
            with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
                for entry, data in entries:
                    info = zipfile.ZipInfo(entry, date_time=convert.ZIP_EPOCH)
                    info.compress_type = zipfile.ZIP_DEFLATED
                    info.create_system = system
                    info.external_attr = external_attr
                    archive.writestr(info, data)
            return path

        # Normalised on Linux and on Windows: one file.
        on = {}
        for platform in ("linux", "win32"):
            path = written(f"{platform}.mxl", 0, 0)
            with mock.patch.object(sys, "platform", platform):
                convert.normalise_archive(path)
            on[platform] = path.read_bytes()
        self.assertEqual(on["linux"], on["win32"])
        # Entries that differ only in platform metadata (a Unix mode under system 3, a DOS attribute under 0)
        # come out as the same bytes, with the one canonical system and the pinned permissions.
        unix = written("unix.mxl", 3, (0o100644 << 16))
        dos = written("dos.mxl", 0, 0x20)
        for path in (unix, dos):
            convert.normalise_archive(path)
        self.assertEqual(unix.read_bytes(), dos.read_bytes())
        self.assertEqual(unix.read_bytes(), on["linux"])
        with zipfile.ZipFile(unix) as archive:
            self.assertEqual({(i.create_system, i.external_attr) for i in archive.infolist()}, {(convert.ZIP_SYSTEM, 0o600 << 16)})

    def test_minted_ids_are_renamed_but_real_ones_are_kept(self) -> None:
        xml = (
            '<score-part id="P64fa5e9c10000199a0c6ce0460494465">'
            '<score-instrument id="Iea9ee0ade06017c9eb3695e345bc8e9f"/>'
            '<midi-instrument id="Iea9ee0ade06017c9eb3695e345bc8e9f"/>'
            '</score-part><part id="P64fa5e9c10000199a0c6ce0460494465"/>'
            '<score-part id="Piano"/>'
        )
        out = convert.deterministic_ids(xml)
        self.assertIn('<score-part id="P1">', out)
        self.assertIn('<part id="P1"/>', out)
        self.assertEqual(out.count('id="I1"'), 2)
        # A name someone chose is left alone; only the minted hex ids move.
        self.assertIn('<score-part id="Piano"/>', out)

    # E50a: "twice" above is twice on one day. music21 also writes the day it ran (`<encoding-date>`),
    # so until the converter removed it a conversion next month was another file, and a cache miss on
    # another day gave other bytes than a hit (docs/03 §3a, "Neither cache can change an answer").

    def test_converting_on_two_dates_gives_identical_bytes(self) -> None:
        first = self.tmp / "one" / "score.mxl"
        second = self.tmp / "two" / "score.mxl"
        with converting_on(date(2026, 9, 16)):
            cached_convert(SOURCE, first, use_cache=False)
        with converting_on(date(2026, 10, 1)):
            cached_convert(SOURCE, second, use_cache=False)
        self.assertEqual(differing_lines(score_text(first), score_text(second)), [])
        self.assertEqual(first.read_bytes(), second.read_bytes())

    def test_converting_on_two_dates_gives_identical_bytes_as_plain_musicxml(self) -> None:
        first = self.tmp / "one" / "score.musicxml"
        second = self.tmp / "two" / "score.musicxml"
        with converting_on(date(2026, 9, 16)):
            cached_convert(SOURCE, first, use_cache=False)
        with converting_on(date(2026, 10, 1)):
            cached_convert(SOURCE, second, use_cache=False)
        self.assertEqual(differing_lines(score_text(first), score_text(second)), [])
        self.assertEqual(first.read_bytes(), second.read_bytes())

    def test_the_encoding_date_goes_with_its_line_and_nothing_else_moves(self) -> None:
        out = convert.without_encoding_date(DATED_HEADER)
        self.assertEqual(differing_lines(DATED_HEADER, out), ["-      <encoding-date>2026-09-22</encoding-date>"])
        self.assertEqual(out, UNDATED_HEADER)
        # The declaration, the DOCTYPE and `<software>` stay byte for byte, and text with no date comes back as it was.
        self.assertTrue(out.startswith(DATED_HEADER[: DATED_HEADER.index("  <identification>")]))
        self.assertIn("      <software>music21 v.10.5.0</software>\n", out)
        self.assertEqual(convert.without_encoding_date(UNDATED_HEADER), UNDATED_HEADER)
        self.assertEqual(convert.without_encoding_date("<score-partwise/>\n"), "<score-partwise/>\n")


class TestFormerIdentities(CacheCase):
    """
    E50a item 2: the identities a converted file had while music21's date was in it, as historical data.

    After the date is removed, the only difference between the file the converter writes and the one
    it wrote on day D is music21's line for D. So a recorded dated file (`former_identities.json`, the
    identities the catalogues able to store a learner's material held) names today's file exactly when
    removing its date gives today's file, and putting its date back into today's file gives its bytes.
    These are the proofs that the reconstruction is that file, and that nothing beyond the record is
    ever derived: no day is tried that no recorded file carries (the reviewer's rule, questions-71bd6cee.md).
    """

    def dated_conversion(self, day: date, folder: str, system: int = 0) -> Path:
        """
        The committed converter's output on `day`, on a machine whose `zipfile` records `system` (0, the
        laptop's Windows, by default): a conversion with the removal bypassed and that creating system.
        """
        dest = self.tmp / folder / "score.mxl"
        with converting_on(day), mock.patch.object(convert, "without_encoding_date", lambda text: text), \
                mock.patch.object(convert, "ZIP_SYSTEM", system):
            cached_convert(SOURCE, dest, use_cache=False)
        self.assertIn(f"<encoding-date>{day.isoformat()}</encoding-date>", score_text(dest))
        self.assertEqual(convert.archive_system(dest.read_bytes()), system)
        return dest

    def recorded(self, path: Path) -> dict:
        entry = convert.dated_form(path.read_bytes())
        self.assertIsNotNone(entry, path)
        return {**entry, "file": "scores/score.mxl"}

    def test_the_committed_table_is_historical_and_bounded(self) -> None:
        import json
        import re

        table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))
        entries = table["identities"]
        self.assertGreater(len(entries), 0)
        self.assertIn("9193261b", table["bounds"]["lower"], "the lower bound names D4, the first catalogue storing a material")
        self.assertIn("2026-09-29", table["bounds"]["upper"], "the upper bound names the last deployable catalogue")
        self.assertIn("2026-09-30", table["bounds"]["upper"], "and the landing's deliberate addition: the six authored files the last pre-E50a laptop build re-dated (the reviewer's ruling, responses/questions-bd7d303e.md section 5)")
        hexes = re.compile(r"^[0-9a-f]{64}$")
        for entry in entries:
            with self.subTest(file=entry["file"], date=entry["date"]):
                self.assertEqual(set(entry), {"file", "date", "system", "sha256", "undated"})
                self.assertIn(entry["system"], (0, 3), "a creating system zipfile writes: Windows 0, elsewhere 3")
                self.assertRegex(entry["sha256"], hexes)
                self.assertRegex(entry["undated"], hexes)
                day = date.fromisoformat(entry["date"])
                # Never a future date: the last one is the landing day, 2026-09-30, when the six authored files the
                # last pre-E50a laptop build re-dated were added deliberately (the reviewer's ruling); every other
                # entry is on or before the last deployable catalogue, 2026-09-29.
                self.assertLessEqual(day, date(2026, 9, 30))
                if day == date(2026, 9, 30):
                    self.assertTrue(entry["file"].startswith("scores/authored/exercise.blues.twelve-bar-shuffle."), "only the six added at the landing carry the landing day")
                # A build-converted file is on or after the converter epoch; a committed copy keeps its quarry date.
                self.assertGreaterEqual(day, date(2026, 9, 16) if not entry["file"].startswith("scores/pdmx/") else date(2026, 9, 6))
        self.assertEqual(len({e["sha256"] for e in entries}), len(entries), "one entry per identity")
        self.assertEqual(entries, sorted(entries, key=lambda e: (e["file"], e["date"], e["sha256"])))
        self.assertEqual(table["bounds"]["dates"], f"{min(e['date'] for e in entries)} to {max(e['date'] for e in entries)}")
        index = convert.historical_identities()
        self.assertEqual(sum(len(found) for found in index.values()), len(entries))

    def test_removing_and_restoring_the_date_is_a_round_trip(self) -> None:
        self.assertEqual(convert.with_encoding_date(convert.without_encoding_date(DATED_HEADER), date(2026, 9, 22)), DATED_HEADER)
        dated = convert.with_encoding_date(UNDATED_HEADER, date(2026, 10, 1))
        self.assertIn("    <encoding>\n      <encoding-date>2026-10-01</encoding-date>\n      <software>", dated)
        self.assertEqual(convert.without_encoding_date(dated), UNDATED_HEADER)
        # A text that already has a date, or whose encoding is not music21's, is not restored.
        self.assertIsNone(convert.with_encoding_date(DATED_HEADER, date(2026, 10, 1)))
        self.assertIsNone(convert.with_encoding_date(UNDATED_HEADER.replace("music21 v.10.5.0", "MuseScore 3.6.2"), date(2026, 10, 1)))
        self.assertIsNone(convert.with_encoding_date("<score-partwise/>\n", date(2026, 10, 1)))

    def test_a_recorded_dated_file_of_the_same_music_is_re_proved_and_named(self) -> None:
        # One historical file written on the laptop (creating system 0), one on a Linux runner (3).
        history = [self.dated_conversion(date(2026, 9, 16), "a", 0), self.dated_conversion(date(2026, 9, 29), "b", 3)]
        table = [self.recorded(path) for path in history]
        self.assertEqual([entry["system"] for entry in table], [0, 3])
        now = self.tmp / "now" / "score.mxl"
        cached_convert(SOURCE, now, use_cache=False)
        self.assertEqual(convert.archive_system(now.read_bytes()), convert.ZIP_SYSTEM)
        # Removing a recorded file's date gives exactly the file the converter writes today, whichever
        # machine wrote the record: today's file is one file on every machine.
        self.assertEqual({entry["undated"] for entry in table}, {sha256(now)})
        self.assertEqual(convert.former_identities(now, table), [sha256(path) for path in history])
        self.assertNotIn(sha256(now), convert.former_identities(now, table))
        # The build's call names no table: it reads the committed file, here one holding these entries.
        import json

        table_file = self.tmp / "former_identities.json"
        table_file.write_text(json.dumps({"identities": table}), encoding="utf-8")
        with mock.patch.object(convert, "FORMER_IDENTITIES_FILE", table_file):
            convert.historical_identities.cache_clear()
            try:
                self.assertEqual(convert.former_identities(now), [sha256(path) for path in history])
            finally:
                convert.historical_identities.cache_clear()
        # Nothing beyond the record: no entry, no identity; no day is tried that no recorded file carries.
        self.assertEqual(convert.former_identities(now, []), [])
        never_written = {**table[0], "date": "2026-09-20"}
        self.assertEqual(convert.former_identities(now, [never_written]), [], "an entry whose date does not rebuild its bytes")
        other_music = {**table[0], "undated": "0" * 64}
        self.assertEqual(convert.former_identities(now, [other_music]), [])
        other_machine = {**table[0], "system": 3}
        self.assertEqual(convert.former_identities(now, [other_machine]), [], "an entry whose creating system does not rebuild its bytes")

    def test_dated_form_records_a_dated_music21_file_and_nothing_else(self) -> None:
        dated = self.dated_conversion(date(2026, 9, 22), "dated")
        entry = convert.dated_form(dated.read_bytes())
        self.assertEqual(entry["date"], "2026-09-22")
        self.assertEqual(entry["sha256"], sha256(dated))
        now = self.tmp / "now" / "score.mxl"
        cached_convert(SOURCE, now, use_cache=False)
        self.assertIsNone(convert.dated_form(now.read_bytes()), "an undated file is today's, not history")
        self.assertIsNone(convert.dated_form(b"not a zip"))

    def test_a_dated_file_a_musescore_file_and_a_file_with_no_encoding_give_none(self) -> None:
        def entry_for(path: Path) -> dict:
            """An entry that names this very file as its undated form: only an undated music21 file may use it."""
            return {"file": "x", "date": "2026-09-22", "system": convert.ZIP_SYSTEM, "sha256": "f" * 64, "undated": sha256(path)}

        dated = self.dated_conversion(date(2026, 9, 22), "dated")
        self.assertEqual(convert.former_identities(dated, [entry_for(dated)]), [])

        # In the converter's own archive layout: the undated music21 text is named by its recorded dated
        # form, and the same text with a date anywhere in its encoding (here after `<software>`) is not.
        def pinned(name: str, text: str) -> Path:
            path = self.tmp / name
            path.write_bytes(convert.pinned_archive([("META-INF/container.xml", b"<container/>"), ("score.musicxml", text.encode("utf-8"))]))
            return path

        undated = pinned("undated.mxl", UNDATED_HEADER)
        recorded = convert.dated_form(pinned("recorded.mxl", DATED_HEADER).read_bytes())
        self.assertEqual(recorded["undated"], sha256(undated))
        self.assertEqual(convert.former_identities(undated, [recorded]), [recorded["sha256"]])
        software = "      <software>music21 v.10.5.0</software>\n"
        late_date = UNDATED_HEADER.replace(software, software + "      <encoding-date>2026-09-22</encoding-date>\n")
        self.assertIsNone(convert.with_encoding_date(late_date, date(2026, 10, 1)))
        late = pinned("late-date.mxl", late_date)
        self.assertEqual(convert.former_identities(late, [entry_for(late)]), [])
        self.assertIsNone(convert.dated_form(late.read_bytes()), "a date music21 did not put first cannot be rebuilt")

        def zipped(name: str, text: str, when: tuple = convert.ZIP_EPOCH) -> Path:
            path = self.tmp / name
            with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
                archive.writestr(zipfile.ZipInfo("META-INF/container.xml", date_time=when), '<container><rootfiles><rootfile full-path="score.musicxml"/></rootfiles></container>')
                info = zipfile.ZipInfo("score.musicxml", date_time=when)
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, text)
            return path

        musescore = DATED_HEADER.replace("music21 v.10.5.0", "MuseScore 2.3.2")
        for path in (zipped("musescore.mxl", musescore), zipped("musescore-undated.mxl", convert.without_encoding_date(musescore)),
                     zipped("bare.mxl", '<?xml version="1.0"?>\n<score-partwise version="4.0"/>\n')):
            with self.subTest(path=path.name):
                self.assertEqual(convert.former_identities(path, [entry_for(path)]), [])
                self.assertIsNone(convert.dated_form(path.read_bytes()))
        # The undated music21 text in an archive the converter did not write (a real timestamp) is not its file.
        now = self.tmp / "now" / "score.mxl"
        cached_convert(SOURCE, now, use_cache=False)
        foreign = zipped("foreign.mxl", score_text(now), (2026, 9, 29, 12, 0, 0))
        self.assertEqual(convert.former_identities(foreign, [entry_for(foreign)]), [])
        # A plain MusicXML file: no built row is one, and none is named.
        plain = self.tmp / "now" / "score.musicxml"
        cached_convert(SOURCE, plain, use_cache=False)
        self.assertEqual(convert.former_identities(plain, [entry_for(plain)]), [])

    def test_a_musical_change_is_new_material(self) -> None:
        changed = self.tmp / "changed.krn"
        text = SOURCE.read_text(encoding="utf-8")
        self.assertIn("4E\t4b", text)
        changed.write_text(text.replace("4E\t4b", "4F\t4b"), encoding="utf-8")
        before = self.recorded(self.dated_conversion(date(2026, 9, 22), "before"))
        after = self.tmp / "after" / "score.mxl"
        cached_convert(changed, after, use_cache=False)
        self.assertNotEqual(before["undated"], sha256(after))
        self.assertEqual(convert.former_identities(after, [before]), [])
        # Even offered as if it were this file's history, the old bytes do not rebuild from the new music.
        self.assertEqual(convert.former_identities(after, [{**before, "undated": sha256(after)}]), [])


class TestStats(unittest.TestCase):
    def test_summary_reads_as_a_build_line(self) -> None:
        self.assertEqual(CacheStats(hits=3, misses=4).summary(), "3 cached, 4 converted")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
