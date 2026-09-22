#!/usr/bin/env python3
"""
Fetches what YouTube says about every video a lesson links to, and writes it down.

**Why this exists.** 80 lessons carry a `videos:` list and the links in them had
never been fetched — the 2026-09-19 audit that found them was told not to, and
`app/tests/unit/lessonVideos.test.ts` says in as many words that "whether a
video is still live needs the network and is not asked here". So a link that had
been taken down, made private or simply mistyped looked exactly like a good one,
on the phone and in every check. `docs/prompts/working-rules.md` §2.8 — make the
correction mechanical — is the rule this implements.

**What it does.** Reads `videos:` out of every `content/lessons/*.md`, asks
YouTube's oEmbed endpoint for each distinct URL, and writes
`content/video-index.json`: url → title, author, status, HTTP code and the date
it was checked. `validate.py` then refuses any lesson URL that is not in that
index with a `live` status, so a newly added link fails the build until somebody
has run this once. The index is committed; the fetch runs on demand and **never
in the build**, which is what keeps `build.py --offline` offline.

**What a title is and is not.** oEmbed returns the title and the channel the
uploader wrote. Nothing here has been watched or heard: a title is a *proxy* for
a video's content, and a generic one ("Piano Lesson 4") tells you nothing at
all. This file records the proxy and says so; judging whether the video suits
the rung is a person's job, done once, and written into the lesson.

Usage:

    python tools/content/video_check.py                  # fetch and rewrite the index
    python tools/content/video_check.py --check          # no network: index vs lessons
    python tools/content/video_check.py --url <watch url>  # one URL, print and exit
    python tools/content/video_check.py --only-new       # keep existing rows, fetch the rest
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CONTENT_SRC  # noqa: E402

#: The committed answer to "has this link ever been fetched, and what came back?"
INDEX_PATH = CONTENT_SRC / "video-index.json"
LESSONS_DIR = CONTENT_SRC / "lessons"

OEMBED = "https://www.youtube.com/oembed"

#: The one URL shape the lessons are allowed to use, and the one this file can
#: ask oEmbed about. `lessonVideos.test.ts` holds the same regular expression;
#: a channel page or a playlist is not a video and oEmbed answers 404 for both.
WATCH = re.compile(r"^https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}$")

#: The status a lesson URL has to carry in the index for the build to pass.
LIVE = "live"


def lesson_videos(lessons_dir: Path = LESSONS_DIR) -> list[tuple[str, list[dict]]]:
    """
    `(filename, [{label, url, teacher}, ...])` for every lesson, in name order.

    `common.read_front_matter` is not used, and the reason matters: it reads a
    `- ` list item as an indented pair, so `videos:` comes back as a *dict* of
    one mangled key. The app's own reader (`app/src/ui/markdown.ts`) handles the
    list, this handles the same subset, and `lessonVideos.test.ts` checks the
    files through the app's one — so the two agree on the corpus rather than on
    a promise.
    """
    out: list[tuple[str, list[dict]]] = []
    for path in sorted(lessons_dir.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        head = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", text, re.S)
        block = ""
        if head:
            found = re.search(
                r"^videos:(.*?)(?=^[A-Za-z0-9_]+:)", head.group(1) + "\n", re.M | re.S
            )
            block = found.group(1) if found else ""
        videos: list[dict] = []
        current: dict | None = None
        for line in block.splitlines():
            if re.match(r"^\s*-\s+", line):
                current = {}
                videos.append(current)
                line = re.sub(r"^(\s*)-\s+", r"\1", line)
            pair = re.match(r"^\s+([A-Za-z0-9_]+):\s*(.*)$", line)
            if pair and current is not None:
                value = pair.group(2).strip()
                if len(value) >= 2 and value[0] in "\"'" and value[-1] == value[0]:
                    value = value[1:-1]
                current[pair.group(1)] = value
        out.append((path.name, videos))
    return out


def lesson_urls(lessons_dir: Path = LESSONS_DIR) -> dict[str, list[str]]:
    """url → the lesson files that link to it."""
    where: dict[str, list[str]] = {}
    for name, videos in lesson_videos(lessons_dir):
        for video in videos:
            url = str(video.get("url") or "")
            if url:
                where.setdefault(url, []).append(name)
    return where


def load_index(path: Path = INDEX_PATH) -> dict[str, dict]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, dict) else {}


def fetch(url: str, timeout: int = 25) -> dict:
    """
    One oEmbed call. A 4xx means removed, private or never there.

    Only the three fields the index keeps are read off the response; the rest of
    what oEmbed returns (thumbnail sizes, an iframe) is about embedding, which
    this app does not do — the lesson row opens the link in the browser.
    """
    query = urllib.parse.urlencode({"url": url, "format": "json"})
    request = urllib.request.Request(
        f"{OEMBED}?{query}", headers={"User-Agent": "piano-content-video-check/1"}
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.load(response)
            return {
                "title": payload.get("title"),
                "author": payload.get("author_name"),
                "status": LIVE,
                "http": response.status,
                "checked": date.today().isoformat(),
            }
    except urllib.error.HTTPError as error:
        return {
            "title": None,
            "author": None,
            # 401/403 is a video the owner has made private, 404 is removed or
            # a wrong id; the index keeps them apart from "the network failed",
            # because only the last one is worth retrying.
            "status": "dead",
            "http": error.code,
            "checked": date.today().isoformat(),
        }
    except Exception as error:  # noqa: BLE001 - a DNS failure is not a dead video
        return {
            "title": None,
            "author": None,
            "status": "unreachable",
            "http": 0,
            "checked": date.today().isoformat(),
            "error": f"{type(error).__name__}: {error}",
        }


def check(index: dict[str, dict], where: dict[str, list[str]]) -> list[str]:
    """
    The offline half: what `validate.py` asks, without the network.

    Kept here rather than only in `validate.py` so that this file can answer
    "would the build pass?" straight after a fetch.
    """
    problems: list[str] = []
    for url in sorted(where):
        row = index.get(url)
        if row is None:
            problems.append(
                f"{', '.join(where[url])}: {url} is in no lesson video index — run "
                "tools/content/video_check.py"
            )
            continue
        if row.get("status") != LIVE:
            problems.append(
                f"{', '.join(where[url])}: {url} is {row.get('status')!r} "
                f"(HTTP {row.get('http')}) in the index"
            )
        if not str(row.get("checked") or "").strip():
            problems.append(f"{', '.join(where[url])}: {url} has no checked date in the index")
    return problems


def write_index(index: dict[str, dict], path: Path = INDEX_PATH) -> None:
    """Sorted by URL and two-space indented, so a re-run diffs as the rows that moved."""
    ordered = {url: index[url] for url in sorted(index)}
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(ordered, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lessons", type=Path, default=LESSONS_DIR)
    parser.add_argument("--index", type=Path, default=INDEX_PATH)
    parser.add_argument("--url", help="fetch one URL, print the answer, write nothing")
    parser.add_argument(
        "--check", action="store_true", help="no network: does the index cover the lessons?"
    )
    parser.add_argument(
        "--only-new", action="store_true", help="keep rows already in the index; fetch the rest"
    )
    args = parser.parse_args()

    if args.url:
        print(json.dumps(fetch(args.url), indent=2, ensure_ascii=False))
        return

    where = lesson_urls(args.lessons)
    index = load_index(args.index)

    if args.check:
        problems = check(index, where)
        print(f"{len(where)} distinct URL(s) across the lessons, {len(index)} row(s) in the index")
        for problem in problems:
            print(f"  - {problem}")
        sys.exit(1 if problems else 0)

    wanted = [url for url in sorted(where) if not (args.only_new and url in index)]
    print(f"fetching {len(wanted)} of {len(where)} distinct URL(s) from oEmbed")
    for url in wanted:
        row = fetch(url)
        index[url] = row
        title = row.get("title") or f"({row['status']})"
        print(f"  {row['http']:>3} {url} — {title} / {row.get('author')}")

    # Rows for URLs no lesson names any more are dropped rather than kept: the
    # index is the answer to "is every link in the corpus checked?", and a row
    # nothing points at cannot make that answer more true.
    stale = [url for url in index if url not in where]
    for url in stale:
        del index[url]
    if stale:
        print(f"dropped {len(stale)} row(s) no lesson links to")

    write_index(index, args.index)
    live = sum(1 for row in index.values() if row.get("status") == LIVE)
    print(f"wrote {args.index}: {len(index)} row(s), {live} live")
    for url, row in sorted(index.items()):
        if row.get("status") != LIVE:
            print(f"  NOT LIVE: {url} — {row.get('status')} (HTTP {row.get('http')})")
    print("titles are what the uploader wrote; nothing here has been watched")


if __name__ == "__main__":
    main()
