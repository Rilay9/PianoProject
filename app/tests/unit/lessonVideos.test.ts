// @vitest-environment node
/**
 * Every lesson's video links are links to a video.
 *
 * The fault this exists for: 88 lessons carried a `videos:` list holding 162
 * entries, and every one of the 18 distinct URLs behind them was a **channel
 * home page or a site index** — `youtube.com/@BillHiltonBiz` appeared 39 times,
 * `@PianoteOfficial` 16, `hoffmanacademy.com/lessons/` 9. Each sat under a label
 * promising something specific ("Lesson 2 — playing your first notes"), so the
 * learner tapped Watch and landed on a channel with thousands of videos and no
 * idea which one was meant. Nothing anywhere said the links were generic, and
 * nothing could have noticed.
 *
 * Two things are checked, and the second is the one that matters: the
 * frontmatter parses with the parser the app itself uses (`parseFrontMatter`,
 * a YAML subset — a shape it cannot read is a lesson with no videos on the
 * phone and no error anywhere), and every URL is a *watch* URL. That a video is
 * a video at all is a property of the file.
 *
 * **Whether it is still there, and whether it is about the rung,** is the
 * second half, added when the links were finally fetched (T21, 2026-09-22).
 * `tools/content/video_check.py` asks YouTube's oEmbed endpoint about every
 * URL and writes `content/video-index.json`; the two rows at the bottom of this
 * file join the lessons to that index. Nothing here touches the network — the
 * index is committed and the fetch is run by hand, which is what keeps
 * `build.py --offline` offline.
 *
 * **What the index title is.** It is what the uploader typed. Nothing in this
 * repository has watched a video, so a title is a *proxy* for the content and
 * the subject-word rule below is a proxy for "this video is about this rung".
 * It catches a title with nothing of the rung in it. It cannot catch a video
 * pitched at the wrong stage — a beginner's lick pack on a Stage 9 improvising
 * rung passes every rule here, and three of those were found and replaced by
 * reading, not by running this.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFrontMatter } from '../../src/ui/markdown';

const LESSONS = join('..', 'content', 'lessons');
const INDEX = join('..', 'content', 'video-index.json');
/** `https://www.youtube.com/watch?v=<11 chars>`, canonical and nothing else. */
const WATCH = /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/;

interface Video {
  label?: unknown;
  url?: unknown;
  teacher?: unknown;
}

interface IndexRow {
  title?: unknown;
  author?: unknown;
  status?: unknown;
  checked?: unknown;
}

function videoIndex(): Record<string, IndexRow> {
  return JSON.parse(readFileSync(INDEX, 'utf8')) as Record<string, IndexRow>;
}

/**
 * The rung's subject, as words: its title, its concept ids, its track's name,
 * and — for the five rungs where the video says the same thing in another
 * word — a synonym written down here rather than left to a reader to guess.
 */
const ALSO: Record<string, string[]> = {
  // Reading the treble clef is what "starting to read music" is.
  '1.1': ['read', 'reading'],
  // The rung's own repertoire is the Petzold minuet; "dance" is the category.
  'classical.3': ['minuet', 'petzold'],
  // Two voices of equal weight is what a two-part invention is, and the
  // inventions are on this rung.
  'classical.7': ['invention', 'inventions', 'bach'],
  // The rung calls the pushed chord an anticipation; players call it syncopation.
  'jam.5': ['syncopation'],
  // "Building it" is drama and intensity in anybody else's words.
  'rock.7': ['intensity', 'drama'],
};

/** Words that appear in every piano video title and so distinguish nothing. */
const EMPTY = new Set(
  `a an and are as at be but by for from how i in is it its of on or out the that this to
   what when where which who why with you yours your not no own into over under up down any
   every piano pianist keyboard lesson lessons play playing player music musical note notes
   song songs beginner beginners absolute total tutorial tutorials guide complete easy
   easiest simple simply best explained explain learn learning way ways step steps part
   here more new free video amazing secret trick tricks make made sound sounds need needs
   know get got one two three four five six seven eight nine ten first second third level
   levels`.split(/\s+/),
);

function significant(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !EMPTY.has(word)),
  );
}

/**
 * The rule, stated once: a subject word and a title word match when they are
 * equal, or when both are four letters or longer and share their first four —
 * so `memorising` matches `Memorize`, `arranging` matches `Arrangements`, and
 * `extended` matches `Extensions`, which stemming by hand would otherwise miss.
 */
function shared(subject: Set<string>, title: Set<string>): string | null {
  for (const a of subject) {
    for (const b of title) {
      if (a === b) return `${a}=${b}`;
      if (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4)) return `${a}~${b}`;
    }
  }
  return null;
}

function lessons(): { file: string; videos: Video[] }[] {
  return readdirSync(LESSONS)
    .filter((name) => name.endsWith('.md'))
    .map((file) => {
      const { data } = parseFrontMatter(readFileSync(join(LESSONS, file), 'utf8'));
      const videos = Array.isArray(data.videos) ? (data.videos as Video[]) : [];
      return { file, videos };
    });
}

describe('lesson videos', () => {
  it('reads every lesson with the parser the app uses', () => {
    const all = lessons();
    expect(all.length).toBeGreaterThan(80);
  });

  it('every link is a video, not a channel or an index', () => {
    const wrong: string[] = [];
    for (const { file, videos } of lessons()) {
      for (const video of videos) {
        const url = typeof video.url === 'string' ? video.url : '';
        if (!WATCH.test(url)) wrong.push(`${file}: ${url || '(no url)'}`);
      }
    }
    expect(wrong, `not a video link:\n  ${wrong.join('\n  ')}`).toEqual([]);
  });

  it('every entry carries the label and the teacher the row draws', () => {
    // `LessonScreen` falls back to the raw URL as the title and draws no
    // subtitle when these are missing, which is how a row comes to say
    // `https://www.youtube.com/watch?v=…` to a learner.
    const thin: string[] = [];
    for (const { file, videos } of lessons()) {
      for (const video of videos) {
        if (typeof video.label !== 'string' || video.label.trim() === '') thin.push(`${file}: no label`);
        if (typeof video.teacher !== 'string' || video.teacher.trim() === '') thin.push(`${file}: no teacher`);
      }
    }
    expect(thin, thin.join('\n  ')).toEqual([]);
  });

  it('does not offer the same video twice inside one lesson', () => {
    const dupes: string[] = [];
    for (const { file, videos } of lessons()) {
      const urls = videos.map((v) => String(v.url));
      if (new Set(urls).size !== urls.length) dupes.push(file);
    }
    expect(dupes).toEqual([]);
  });

  it('leaves an empty list rather than a link that goes nowhere', () => {
    // Eight lessons lost every link they had and now read `videos: []`, which
    // the parser turns into an empty array and the screen draws as "No videos
    // listed for this lesson." A bare `videos:` with nothing under it would
    // instead parse as an empty *object*, and `Array.isArray` would reject it —
    // same blank screen, but by accident. Assert the shape, not the outcome.
    const shapes: string[] = [];
    for (const file of readdirSync(LESSONS).filter((n) => n.endsWith('.md'))) {
      const raw = readFileSync(join(LESSONS, file), 'utf8');
      if (!/^videos:/m.test(raw)) continue;
      const { data } = parseFrontMatter(raw);
      if (!Array.isArray(data.videos)) shapes.push(`${file}: videos is ${typeof data.videos}, not a list`);
    }
    expect(shapes, shapes.join('; ')).toEqual([]);
  });

  it('keeps the list short: a couple of good ones, not a reading list', () => {
    const many = lessons().filter((l) => l.videos.length > 3).map((l) => `${l.file}: ${String(l.videos.length)}`);
    expect(many, many.join(', ')).toEqual([]);
  });

  it('has every URL in the checked index, live and dated', () => {
    // A link nobody has ever fetched looks exactly like a good one. This is the
    // same rule `validate.py`'s `video_index_errors` fails the build on, asked
    // again here so that a lesson edit is caught by `npx vitest run` without a
    // content build. A new URL fails until `video_check.py` has been run once.
    const index = videoIndex();
    const unchecked: string[] = [];
    for (const { file, videos } of lessons()) {
      for (const video of videos) {
        const url = String(video.url);
        const row = index[url];
        if (!row) unchecked.push(`${file}: ${url} is in no index`);
        else if (row.status !== 'live') unchecked.push(`${file}: ${url} is ${String(row.status)}`);
        else if (typeof row.checked !== 'string' || row.checked.trim() === '')
          unchecked.push(`${file}: ${url} has no checked date`);
      }
    }
    expect(unchecked, unchecked.join('\n  ')).toEqual([]);
  });

  it('names the rung in the title YouTube gives back, on every video', () => {
    // One row per video, over the whole built curriculum rather than a sample,
    // so a rung that gains a video is covered without anybody coming back here.
    const index = videoIndex();
    const built = JSON.parse(readFileSync(resolve('public/content/curriculum.json'), 'utf8')) as {
      tracks: { id: string; title: string }[];
      stages: { units: { track: string; lessons: { id: string; title: string; concepts: string[]; textFile: string }[] }[] }[];
    };
    const trackTitle = new Map(built.tracks.map((t) => [t.id, t.title]));
    const rungs = built.stages.flatMap((stage) =>
      stage.units.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, track: unit.track }))),
    );
    expect(rungs.length, 'no rungs in the built curriculum').toBeGreaterThan(80);

    const byFile = new Map(rungs.map((r) => [r.lesson.textFile.replace(/^lessons\//, ''), r]));
    const off: string[] = [];
    let checked = 0;
    for (const { file, videos } of lessons()) {
      const rung = byFile.get(file);
      if (!rung) {
        off.push(`${file}: no rung in the built curriculum owns this lesson file`);
        continue;
      }
      const subject = significant(
        [
          rung.lesson.title,
          rung.lesson.concepts.join(' '),
          trackTitle.get(rung.track) ?? rung.track,
          (ALSO[rung.lesson.id] ?? []).join(' '),
        ].join(' '),
      );
      for (const video of videos) {
        const row = index[String(video.url)];
        const title = typeof row?.title === 'string' ? row.title : '';
        if (title === '') {
          off.push(`${file}: ${String(video.url)} has no title in the index`);
          continue;
        }
        checked += 1;
        if (!shared(subject, significant(title)))
          off.push(`${file}: "${title}" shares no word with ${[...subject].sort().join(', ')}`);
      }
    }
    expect(checked, 'no video was actually compared').toBeGreaterThan(80);
    expect(off, off.join('\n  ')).toEqual([]);
  });

  it('would reject a video that is about something else', () => {
    // Without this the rule above could be vacuous — four-letter prefixes over
    // two large word sets match more often than they look like they would.
    // A theory rung's subject against a boogie-woogie title is the check that
    // the rule still says no.
    expect(shared(significant('Circle of fifths, inversions and cadences'), significant('12 BAR BLUES on Piano - Boogie Woogie Basslines Tutorial'))).toBeNull();
    expect(shared(significant('The clave, and a tune to hear it under'), significant('How to Memorize Music Quickly and Effectively'))).toBeNull();
    expect(shared(significant('Ledger lines and both hands away from middle C'), significant('Sound Amazing at the Piano With SUS CHORDS'))).toBeNull();
  });
});
