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


class TestStats(unittest.TestCase):
    def test_summary_reads_as_a_build_line(self) -> None:
        self.assertEqual(CacheStats(hits=3, misses=4).summary(), "3 cached, 4 converted")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
