# T21 — Every rung has the right teaching video, and it is checked by a machine

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/02-curriculum.md` Part D (the free teachers the curriculum leans on),
`app/tests/unit/lessonVideos.test.ts`, and `docs/pending-review.md` Entry 45's video
section (27 rungs with none, counted per track) first.**

## Why

82 lessons name videos in their `videos:` front matter and 27 name none. The 2026-09-19
audit did not fetch a single one ("do not fetch them"), so nothing has ever checked that a
link resolves or that the video is about the rung's subject. The owner's ask: the correct
videos, on every rung, and never a wrong one.

## Do

1. **Verify every existing video link.** For each URL, fetch YouTube's oEmbed
   (`https://www.youtube.com/oembed?url=<url>&format=json`; `curl -s` is enough; a 4xx
   means removed or private) and record `title`, `author_name`, and the HTTP status. Judge
   the title against the rung's subject (the lesson's first paragraph and its concepts):
   `<lesson> | <url> | <status> | <title> | <author> | fits / does not fit, why`. A dead or
   wrong link is removed or replaced.
2. **Find videos for the 27 rungs without.** Prefer the teachers Part D names and the
   channels already used across the lessons (count them first); search the web for the
   rung's subject plus the teacher; take a video only after its oEmbed title and author are
   read and it fits the subject and the stage (a Grade 1 rung does not get a masterclass).
   One or two per rung. If no fitting video exists for a rung, say so per rung with the
   searches run; do not pad.
3. **Make the check mechanical.** `tools/content/video_check.py`: reads every lesson's
   `videos:`, fetches oEmbed, writes `content/video-index.json` (url → title, author,
   checked date, status). `validate.py` gains a check: every video URL in a lesson must be
   in the index with a live status and a checked date; a new URL fails the build until it
   is checked once. Proven red on a made-up URL. The index is committed; the fetch runs on
   demand, never in the build.
4. **A row per video** in `lessonVideos.test.ts` or a sibling: the URL is in the index and
   the index title contains a word from the rung's subject (state the rule). Where the
   lesson's own text names the video's teacher, that sentence gets a claim row.

## Rules

- Files: `content/lessons/*.md` (`videos:` front matter only; the lesson's own prose only
  where it names a teacher), `content/video-index.json` (new), `tools/content/video_check.py`
  (new), `tools/content/validate.py` and its tests, `app/tests/unit/lessonVideos.test.ts`,
  `docs/02` and `docs/03` where the check is described, one appended entry in
  `docs/pending-review.md` (Entry 46).
- Web access is for oEmbed and search only; download nothing. `build.py --offline` once at
  the end; then `npx vitest run app/tests/unit/lessonVideos.test.ts app/tests/unit/lessonShape.test.ts`.
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is several
  claims. Nothing is heard: a video's title is a proxy for its content; say so, and where the
  title is generic, read the description too.
- Every rung gets a line: videos before, verdict per video, videos after. Never stop silently.

## Final message

Links checked, dead, wrong, replaced; rungs given videos and rungs left without with the
searches; the index size; the validator's red proof; what is unverified.
