// The guide (docs/04 §7e): what the app can do and how to get music into it,
// in the app, with pictures of the app.
//
// Settings → "How PianoPath works". The setup tour sets the phone up; this
// is the part that explains the rest, in the order a person needs it:
//
//   1. what it does           what you are looking at
//   2. connecting the piano   nothing follows you until the app can hear you
//   3. the score screen       where the practice happens
//   4. lessons and drills     what it tells you to play
//   5-9. your own music       finding it, one file, a folder, a PDF, paper
//   10. progress              and how not to lose it
//   11. offline               and what to send when something looks wrong
//
// The piano is second, not tenth. It used to be tenth, after everything it
// is a precondition for, which meant the guide explained the score screen's
// listening modes to someone whose piano was not plugged in. The five
// sections about getting your own music in are one run, 5 to 9, rather than
// split across the app's own screens.
//
// Every section that describes a screen has a button that opens it, because
// "Library → Shelf" is one tap away from here and a sentence about where to
// find it is not.
//
// The pictures are of the app itself, taken by `tests/e2e/guide-shots.spec.ts`
// at a phone's size and shipped under `public/guide/`, so they are precached
// like everything else and true to the build they ship with. A picture that
// is missing fails the guide's own test rather than the reader.

import { createSubScreen } from './subScreen';
import { button, el } from '../widgets';
import type { Router, SubId, TabId } from '../../router';

interface Figure {
  /** The picture's file under `public/guide/`, without the extension. */
  file: string;
  caption: string;
  /** Sideways pictures are wide; the caption says so and the box is shaped for it. */
  wide?: boolean;
}

interface Opens {
  label: string;
  tab: TabId;
  sub?: SubId;
  /** A full route, when the screen is not a tab or a sub-screen. */
  hash?: string;
}

/** A term and the one line that explains it. */
interface Item {
  term: string;
  text: string;
}

/**
 * One piece of a section's body.
 *
 * A plain string is a paragraph, which is most of the guide; the two shapes
 * are the parts that prose was hiding. `steps` is a procedure you follow in
 * order — the unzip-the-archive sequence was five steps inside a ninety-word
 * paragraph, and it is the one thing that had to be asked about twice.
 * `items` is a set of named things you choose between, one line apiece: the
 * four score modes and the three ways the app can hear you were each a
 * single block of prose you had to read twice to count.
 *
 * A list rather than optional fields on the section, because the order
 * matters: the folder section needs paragraphs *after* its steps, and a
 * renderer that puts every paragraph first cannot do that.
 */
type Body = string | { steps: string[] } | { items: Item[] };

interface Section {
  id: string;
  title: string;
  body: Body[];
  figures?: Figure[];
  opens?: Opens[];
}

const SECTIONS: Section[] = [
  {
    id: 'what',
    title: 'What it does',
    body: [
      'PianoPath is a piano teacher on your phone, on the music stand. It holds a library of pieces and exercises, a plan that climbs from the first five-finger position to real repertoire, and a score screen that listens to what you play and follows along on the page.',
      'Today builds a session for you every day: a warm-up, something new, a review of what is due, a piece you know, and a minute of free play. The line at the top is minutes this week against a weekly goal — there is no daily streak, on purpose.',
      'Nothing is locked. Every lesson opens whenever you like, and “I already know this” marks one done without playing it.',
      'The sections below are in the order you need them: connect the piano, learn the score screen and the plan, then the five ways of getting your own music in, then keeping your history safe.',
    ],
    figures: [{ file: 'today', caption: 'Today: the session it built, with ▶ on every row and Swap for something else.' }],
    opens: [{ label: 'Open Today', tab: 'today' }],
  },
  {
    id: 'piano',
    title: 'Connecting the piano',
    body: [
      'Do this first. Until the app can hear you it cannot follow the page, wait for a note, or count anything you play — every mode that listens is waiting on this one setting. There are three ways in, and you can change your mind later.',
      {
        items: [
          {
            term: 'A USB cable',
            text: 'The sure way: every key is heard exactly, as soon as you press it. Run the cable from the piano’s MIDI OUT into the phone, then Settings → MIDI → Connect piano. Chrome asks once, and from then on the app reconnects on its own.',
          },
          {
            term: 'The on-screen keys',
            text: 'The keyboard under the notes, on the score and drill screens, is a real input rather than a picture. Nothing to connect, and enough to see how the whole app behaves.',
          },
          {
            term: 'The microphone',
            text: 'Never as certain as a cable, so anything it is unsure about is shown amber and never counted against you. Settings → Microphone calibrates it to this room and this piano.',
          },
        ],
      },
      'If the cable is in and nothing arrives, the DIN plugs are the usual culprit: MIDI OUT on the piano goes to MIDI IN on the interface, not out into out.',
      'The setup tour walks through all of it — which way the phone sits, the piano, how late it is, the sound, the screen, the modes, your practice. Run it again from Settings any time.',
    ],
    figures: [
      { file: 'midi', caption: 'Settings → MIDI: connect, pin an input, play a key and watch it light.' },
      { file: 'tour', caption: 'The setup tour: the score screen on this phone, both ways up — choose one.' },
    ],
    opens: [
      { label: 'MIDI', tab: 'settings', sub: 'midi' },
      { label: 'Microphone', tab: 'settings', sub: 'mic' },
      { label: 'Run the setup tour', tab: 'settings', sub: 'setup' },
    ],
  },
  {
    id: 'score',
    title: 'The score screen',
    body: [
      'This is where the practice happens, and the music follows you. Four modes decide how closely, and you pick one at the top of the screen.',
      {
        items: [
          {
            term: 'Wait for me',
            text: 'Holds the page still until you play the right note. The mode for the first time you meet a piece.',
          },
          {
            term: 'Keep tempo',
            text: 'Clicks, and moves the cursor whether you are with it or not. This is the mode that scores.',
          },
          { term: 'Play it to me', text: 'Plays the piece while you watch, so you can hear what you are aiming at.' },
          { term: 'Free play', text: 'Judges nothing and turns the page on your own notes.' },
        ],
      },
      'Hear it plays the piece to you. Long-press a bar to hear that bar; double-tap two bars to loop them. R, L and Both choose the hand; the phone can play the other one.',
      'Under the notes, the keys: the note it is waiting for is blue, with its finger number; a hit flashes green and a miss red for a moment. Settings → Display chooses how much the keys show ahead, and the ribbon is the same information at a third of the height.',
      'Two more that sit alongside the modes. Blind hides the score and changes nothing else, so a run from memory scores the same way. Perform is one pass through with no restart, kept on its own list in Progress.',
    ],
    figures: [
      { file: 'score-upright', caption: 'Upright: the bar being played and the ones coming, one under the other.' },
      { file: 'score-sideways', caption: 'Sideways: one line at a time, larger, sliding along.', wide: true },
      { file: 'summary', caption: 'The end of a run: accuracy, tempo, the weakest bars, and Again.' },
    ],
    opens: [{ label: 'Open a piece', tab: 'library', hash: '#/score/song.folk.hot-cross-buns' }],
  },
  {
    id: 'lessons',
    title: 'Lessons, drills and skills',
    body: [
      'Plan is the curriculum: stages, units, lessons, each a rung with a few options — an exercise, a song, sometimes a drill. Any of them finishes the rung; two songs per lesson is a stricter rule you can turn on.',
      'Drills are prompt-and-answer: name the note, play the interval, find the chord, keep the rhythm. They score on the same accuracy setting a piece does, and their tips fold out under the prompt.',
      'Skills review, from Today or Plan, lists every skill with its drills, so you can practise the one thing rather than the rung it belongs to.',
    ],
    figures: [
      { file: 'plan', caption: 'The plan: stages and rungs, the next one recommended.' },
      { file: 'drill', caption: 'A drill: the prompt, the keys, right and wrong by shape as well as colour.' },
      { file: 'skills', caption: 'Skills review: every skill, what it is for, and the drills that train it.' },
    ],
    opens: [
      { label: 'Open the plan', tab: 'plan' },
      { label: 'Skills review', tab: 'plan', sub: 'skills' },
    ],
  },
  {
    id: 'finding',
    title: 'Finding pieces to add',
    body: [
      'Most of what you will play, you will go and find, and the app writes the request for you. That is the Find more button, on every lesson: under the title a line says what that rung still wants, and Find more gives you two things to paste — a search line, and a paragraph for a chatbot that already says what the piece must have, that MusicXML is the format to ask for, and that ten with composers and sources would be about right.',
      'The Skills screen has the same button on every skill, for “more of this” rather than “more for this rung”.',
      'What comes back is a file, or a folder of them, or a PDF, or a book you can hold. The four sections after this one are the ways of getting each of those in.',
    ],
    figures: [{ file: 'lesson', caption: 'A lesson page: what the rung wants, Find more, and Import for this rung.' }],
    opens: [
      { label: 'Open the plan', tab: 'plan' },
      { label: 'Skills', tab: 'plan', sub: 'skills' },
    ],
  },
  {
    id: 'importing',
    title: 'Adding your own scores',
    body: [
      'Library → Import a score takes .musicxml, .mxl and .pdf. MusicXML and .mxl become first-class: searchable, playable, and the music follows your playing exactly as it does for anything built in. You can also share a file into PianoPath from Files or Drive — long-press the file, choose PianoPath.',
      'From a lesson, Import for this rung opens a sheet with the rung, a level estimated from the notes and what it trains already filled in; Save is the only tap left. Importing from the Library just files the piece; Assign on its row puts it on a rung whenever you want.',
      'A level marked ≈ is the app’s guess. Type over it and it stops being a guess. A piece on a rung counts towards finishing it, turns up in swaps, and can be picked for a session; a piece with no rung is still playable, the plan just does not know about it.',
    ],
    figures: [{ file: 'library', caption: 'The Library: search, the filters behind one chip, and Import a score at the foot.' }],
    opens: [{ label: 'Open the Library', tab: 'library' }],
  },
  {
    id: 'folder',
    title: 'A whole folder of scores',
    body: [
      'One at a time is fine for a score you bought. For a folder of thousands — the public-domain MusicXML archive from the laptop, or your own — there is Library → Browse a score folder. The app reads what is in there and lists it: search by title or composer, narrow by level or style, or tick “rated 4+ by 5+ people”.',
      'Tap Add on anything you want. That copies it into your library for good, exactly as if you had imported it, and it keeps working whether or not the folder is still there. The listing is saved, so browsing works any time, offline; only adding needs the folder in hand, and Android lends a picked folder to an app for one visit, so you may be asked for it again. Settings → Content → Remember the score folder tries to hold on to it.',
      'A folder from the archive carries a library.json with titles, composers and estimated levels; levels marked est. are guesses to sort by, not verdicts. A folder of your own scores with no such file works too — each one is listed by its filename and takes its real title from inside the file when you add it.',
      'The archive itself comes as one zip, pianopath-library.zip, because thirty-seven thousand files over a cable take hours and one file takes minutes. To get it onto the phone:',
      {
        steps: [
          'Copy pianopath-library.zip onto the phone — internal storage or an SD card, anywhere the file picker can see it.',
          'Unzip it there, with the phone’s own files app. On a Samsung that is My Files: hold the zip, then Extract.',
          'You now have a folder called pianopath-library, with a library.json in it and the scores in folders inside.',
          'In the app: Library → Browse a score folder → Pick a folder.',
          'Choose the pianopath-library folder that has the library.json in it — not one that only holds another folder of the same name. Some files apps wrap the extracted folder in one of their own, and if you pick the wrapper the app looks a level down for the library.json rather than give up, so either does in fact work.',
          'Wait for the listing to build, once. After that it is saved and browsing is instant, offline.',
        ],
      },
      'Any other folder of scores goes in the same way: copy it onto the phone, then Pick a folder and choose it. No zip and no library.json needed — that part is only how the archive travels.',
    ],
    figures: [{ file: 'folder', caption: 'The score folder: pick it, search it, Add what you want.' }],
    opens: [{ label: 'Browse a score folder', tab: 'library', sub: 'folder' }],
  },
  {
    id: 'pdf',
    title: 'PDF sheet music',
    body: [
      'A PDF is pages, not notes. It opens in a viewer that shows one system at a time, full width, with the systems after it greyed below — the only way a bought score is readable on a phone. Turn the phone sideways for a bigger page.',
      'Tap the right half of the page for the next system, the left half for the previous. Timed advances on its own and learns the pace from your last two taps; Loop repeats a system; the metronome can click alongside.',
      'It cannot listen: there are no notes in a picture to match, so Wait for me, the keys and scoring are not offered. If the viewer cuts a page in the wrong place, Adjust cuts lets you drag the lines and Save; the correction is kept with that score.',
      'To have the app follow a PDF piece for real, it needs the notes: turn it into MusicXML on a computer (MuseScore or Audiveris read PDFs) and import that.',
    ],
    figures: [{ file: 'pdf', caption: 'The PDF viewer sideways: the current system full width, the next ones greyed under it.', wide: true }],
    opens: [{ label: 'Import a score', tab: 'library' }],
  },
  {
    id: 'shelf',
    title: 'The books you own',
    body: [
      'Library → Shelf keeps a register of your books: which ones, what is in them, what page, and which rung each piece answers. Nothing is scanned; you read the page number off the paper, which is the one input that is certainly right.',
      'A registered piece appears on its rung’s page under From your own books and can finish the rung. If you have a PDF of the book, link it and each page number opens the viewer at that page. If a piece has a twin in the app — the same notes, bundled or imported — link it by search, and the app can play it and score it.',
      'Practise on a shelf piece is for music the app cannot see: a metronome with a count-in, a tempo, the keys, a timer. It measures notes heard, minutes, tempo and — with the click on and the piano connected — how steady you were. It never measures accuracy, says so, and asks you: Rough, OK or Clean.',
    ],
    figures: [{ file: 'shelf', caption: 'The shelf: a book, its pieces, their pages and rungs.' }],
    opens: [{ label: 'Open the Shelf', tab: 'library', sub: 'shelf' }],
  },
  {
    id: 'progress',
    title: 'Progress and backups',
    body: [
      'Progress shows minutes a day for the last thirteen weeks, what is due for review, what is mastered, and the performances on their own list. An item you passed comes back for review after 1, 3, 7 and 21 days.',
      'This phone holds the only copy. Progress → Export everything writes one file with your history, your settings and your imported scores; put it somewhere that is not the phone, and do it before reinstalling, changing phones or clearing Chrome’s data.',
      'Import a backup brings it back, and merges by default, so restoring an old backup never throws away practice done since.',
    ],
    figures: [{ file: 'progress', caption: 'Progress: the heat map, what is due, and Export everything.' }],
    opens: [{ label: 'Open Progress', tab: 'progress' }],
  },
  {
    id: 'offline',
    title: 'Offline, updates and diagnostics',
    body: [
      'It works with no network from the second launch onwards: every score, the lesson text and the piano samples are on the phone. Settings → Content → Download everything now fetches the whole library at once and says how much of it landed; Offline only stops it checking for updates at all.',
      'When a new version is ready the app says so and lets you choose the moment; it never swaps mid-practice.',
      'Settings → Diagnostics is built to be copied into a message: is it offline-ready, is the cable working, is the microphone hearing anything, is it fast enough, has anything crashed. Copy debug report puts all of it on the clipboard. If something breaks mid-practice, a red banner appears with Copy details — that is the fastest thing to send.',
    ],
    figures: [{ file: 'diagnostics', caption: 'Diagnostics: the numbers, and Copy debug report.' }],
    opens: [{ label: 'Diagnostics', tab: 'settings', sub: 'diagnostics' }],
  },
];

export function GuideScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'guide',
    title: 'How PianoPath works',
    backTo: 'settings',
    backLabel: 'Settings',
  });

  card.append(
    el('p.muted', {
      text: 'What the app can do and how to get your music into it, in the order you need it. Every section opens the screen it describes.',
    }),
  );

  // The contents: one line per section, jumping within the page.
  const contents = el('nav.guide-contents', { 'aria-label': 'Sections' });
  for (const s of SECTIONS) {
    const link = el('a.guide-contents__link', { href: `#guide-${s.id}`, text: s.title });
    link.addEventListener('click', (event) => {
      // The app's router owns the hash; a plain anchor would navigate.
      event.preventDefault();
      document.getElementById(`guide-${s.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    contents.append(link);
  }
  card.append(contents);

  for (const s of SECTIONS) {
    const block = el('section.block.guide-section', { id: `guide-${s.id}`, 'data-guide': s.id }, el('h2', { text: s.title }));
    for (const part of s.body) block.append(bodyPart(part));
    for (const figure of s.figures ?? []) {
      const img = el('img', {
        src: `${import.meta.env.BASE_URL}guide/${figure.file}.png`,
        alt: figure.caption,
        loading: 'lazy',
        decoding: 'async',
      });
      block.append(el(`figure.guide-figure${figure.wide ? '.guide-figure--wide' : ''}`, {}, img, el('figcaption.muted', { text: figure.caption })));
    }
    if (s.opens && s.opens.length > 0) {
      const row = el('div.row');
      for (const open of s.opens) {
        row.append(
          button(
            open.label,
            () => {
              if (open.hash) window.location.hash = open.hash;
              else router.navigate(open.tab, open.sub);
            },
            { id: `guide-open-${s.id}-${open.label.toLowerCase().replace(/[^a-z]+/g, '-')}` },
          ),
        );
      }
      block.append(row);
    }
    card.append(block);
  }

  return section;
}

/**
 * A paragraph, a numbered procedure, or a list of terms.
 *
 * The steps and the terms carry a class each, `guide-steps` and
 * `guide-terms`. Both are shapes the browser already draws sensibly — an `ol`
 * numbers its items and indents them, a `dl` puts the term on its own line
 * with the line under it — so this reads correctly whatever the stylesheet
 * says, and the rules beside `.guide-figure` only tune it.
 *
 * The `strong` inside the `dt` is the one thing defaults do not give: `dt` is
 * the term semantically but is drawn in the same weight as the line below
 * it, and a term you cannot pick out at a glance is what the prose was doing
 * wrong in the first place.
 *
 * The knock-on the rules exist for: `.card p` mutes every paragraph in this
 * card, so an unstyled list came out at full contrast beside grey prose. That
 * reads as emphasis, which is right for a procedure being followed with the
 * phone in one hand and wrong for the second line of a definition — so the
 * steps keep it and `dd` is muted back.
 */
function bodyPart(part: Body): HTMLElement {
  if (typeof part === 'string') return el('p', { text: part });
  if ('steps' in part) {
    const list = el('ol.guide-steps');
    for (const step of part.steps) list.append(el('li', { text: step }));
    return list;
  }
  const list = el('dl.guide-terms');
  for (const item of part.items) {
    list.append(el('dt', {}, el('strong', { text: item.term })), el('dd', { text: item.text }));
  }
  return list;
}

/** The pictures the guide expects, for the test that checks they ship. */
export const GUIDE_FIGURES: readonly string[] = SECTIONS.flatMap((s) => (s.figures ?? []).map((f) => f.file));
