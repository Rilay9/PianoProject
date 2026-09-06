"""
The conversion cache (replan §1.3).

A cache is only ever allowed to change *when* an answer is computed, never what
it is, so these tests are all about the key: the same inputs must hit, and any
input that changes the written file must miss.
"""
from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import convert  # noqa: E402
from convert import CacheStats, cache_key, cached_convert, tool_fingerprint  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"
SOURCE = FIXTURES / "two-spines.krn"


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


class TestStats(unittest.TestCase):
    def test_summary_reads_as_a_build_line(self) -> None:
        self.assertEqual(CacheStats(hits=3, misses=4).summary(), "3 cached, 4 converted")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
