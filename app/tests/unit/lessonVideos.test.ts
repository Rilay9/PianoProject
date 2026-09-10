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
 * phone and no error anywhere), and every URL is a *watch* URL. Whether a video
 * is still live needs the network and is not asked here; that it is a video at
 * all is a property of the file.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFrontMatter } from '../../src/ui/markdown';

const LESSONS = join('..', 'content', 'lessons');
/** `https://www.youtube.com/watch?v=<11 chars>`, canonical and nothing else. */
const WATCH = /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/;

interface Video {
  label?: unknown;
  url?: unknown;
  teacher?: unknown;
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
});
