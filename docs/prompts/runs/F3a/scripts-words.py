"""Body word count and readingTime per touched lesson, by lessonShape's rule (words / 200, rounded up)."""
import math
import re
from pathlib import Path

WT = Path(__file__).resolve().parents[2]
LESSONS = ["0.1", "1.1", "practice.1", "practice.2", "practice.3", "practice.5", "blues.4", "blues.5",
           "blues.6", "blues.8", "classical.3", "classical.4", "classical.4.shelf", "classical.5",
           "classical.6", "technique.6", "chords-pop.7", "1.5", "ragtime.6", "ragtime.7"]
for lesson in LESSONS:
    raw = (WT / "content" / "lessons" / f"{lesson}.md").read_text(encoding="utf-8")
    m = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$", raw)
    claimed = int(re.search(r"^readingTime:\s*(\d+)", m.group(1), re.M).group(1))
    words = len(m.group(2).split())
    want = max(1, math.ceil(words / 200))
    flag = "" if want == claimed else "  <-- MISMATCH"
    over = "  (over 3 min)" if want > 3 else ""
    print(f"{lesson:18s} words={words:4d} claimed={claimed} want={want}{flag}{over}")
tip = (WT / "content" / "tips" / "ear-tune.md").read_text(encoding="utf-8")
body = re.sub(r"^---\r?\n[\s\S]*?\r?\n---\r?\n", "", tip)
print(f"tips/ear-tune      words={len(body.split())} (MAX_TIP_WORDS 250)")
