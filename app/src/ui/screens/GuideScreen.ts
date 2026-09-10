// The guide (docs/04 §7e): what the app can do and how to get music into it,
// in the app, with pictures of the app.
//
// Settings → "How PianoPath works". The setup tour sets the phone up; this
// is the part that explains the rest — finding pieces, importing scores, the
// score folder, PDFs, the books on the shelf, lessons and drills, backups —
// in the order a person needs them. Every section that describes a screen
// has a button that opens it, because "Library → Shelf" is one tap away from
// here and a sentence about where to find it is not.
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

interface Section {
  id: string;
  title: string;
  paragraphs: string[];
  figures?: Figure[];
  opens?: Opens[];
}

const SECTIONS: Section[] = [
  {
    id: 'what',
    title: 'What it does',
    paragraphs: [
      'PianoPath is a piano teacher on your phone, on the music stand. It holds a library of pieces and exercises, a plan that climbs from the first five-finger position to real repertoire, and a score screen that listens to what you play and follows along on the page.',
      'Today builds a session for you every day: a warm-up, something new, a review of what is due, a piece you know, and a minute of free play. The line at the top is minutes this week against a weekly goal — there is no daily streak, on purpose.',
      'Nothing is locked. Every lesson opens whenever you like, and “I already know this” marks one done without playing it.',
    ],
    figures: [{ file: 'today', caption: 'Today: the session it built, with ▶ on every row and Swap for something else.' }],
    opens: [{ label: 'Open Today', tab: 'today' }],
  },
  {
    id: 'score',
    title: 'The score screen',
    paragraphs: [
      'The music follows you. Wait for me holds the page still until you play the right note — the first time you meet a piece. Keep tempo clicks and moves the cursor whether you are with it or not, and is the mode that scores. Play it to me plays the piece while you watch; Free play judges nothing and turns the page on your own notes.',
      'Hear it plays the piece to you. Long-press a bar to hear that bar; double-tap two bars to loop them. R, L and Both choose the hand; the phone can play the other one.',
      'Under the notes, the keys: the note it is waiting for is blue, with its finger number; a hit flashes green and a miss red for a moment. Settings → Display chooses how much the keys show ahead, and the ribbon is the same information at a third of the height.',
      'Blind hides the score and changes nothing else, so a run from memory scores the same way. Perform is one pass through with no restart, kept on its own list in Progress.',
    ],
    figures: [
      { file: 'score-upright', caption: 'Upright: the bar being played and the ones coming, one under the other.' },
      { file: 'score-sideways', caption: 'Sideways: one line at a time, larger, sliding along.', wide: true },
      { file: 'summary', caption: 'The end of a run: accuracy, tempo, the weakest bars, and Again.' },
    ],
    opens: [{ label: 'Open a piece', tab: 'library', hash: '#/score/song.folk.hot-cross-buns' }],
  },
  {
    id: 'finding',
    title: 'Finding music',
    paragraphs: [
      'Most of what you will play, you will find yourself. Open any lesson: under the title a line says what that rung still wants, and Find more gives you two things to paste — a search line, and a paragraph for a chatbot that already says what the piece must have, that MusicXML is the format to ask for, and that ten with composers and sources would be about right.',
      'The Skills screen has the same button on every skill, for “more of this” rather than “more for this rung”.',
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
    paragraphs: [
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
    paragraphs: [
      'One at a time is fine for a score you bought. For a folder of thousands — the public-domain MusicXML archive from the laptop, or your own — there is Library → Browse a score folder.',
      'The archive comes as one zip file, pianopath-library.zip, because thirty-seven thousand files over a cable take hours and one file takes minutes. Copy the zip onto the phone — internal storage or an SD card, anywhere the file picker can see it — and unzip it there with the files app (on a Samsung, My Files: hold the zip, Extract). That makes a folder called pianopath-library with a library.json in it and the scores in folders inside; that top folder is the one to pick, not one of the folders inside it.',
      'Any other folder of scores goes the same way: copy it onto the phone. Then tap Pick a folder and choose it. The app reads what is in there and lists it: search by title or composer, narrow by level or style, or tick “rated 4+ by 5+ people”.',
      'Tap Add on anything you want. That copies it into your library for good, exactly as if you had imported it, and it keeps working whether or not the folder is still there. The listing is saved, so browsing works any time, offline; only adding needs the folder in hand, and Android lends a picked folder to an app for one visit, so you may be asked for it again. Settings → Content → Remember the score folder tries to hold on to it.',
      'A folder from the archive carries a library.json with titles, composers and estimated levels; levels marked est. are guesses to sort by, not verdicts. A folder of your own scores with no such file works too — each one is listed by its filename and takes its real title from inside the file when you add it.',
    ],
    figures: [{ file: 'folder', caption: 'The score folder: pick it, search it, Add what you want.' }],
    opens: [{ label: 'Browse a score folder', tab: 'library', sub: 'folder' }],
  },
  {
    id: 'pdf',
    title: 'PDF sheet music',
    paragraphs: [
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
    paragraphs: [
      'Library → Shelf keeps a register of your books: which ones, what is in them, what page, and which rung each piece answers. Nothing is scanned; you read the page number off the paper, which is the one input that is certainly right.',
      'A registered piece appears on its rung’s page under From your own books and can finish the rung. If you have a PDF of the book, link it and each page number opens the viewer at that page. If a piece has a twin in the app — the same notes, bundled or imported — link it by search, and the app can play it and score it.',
      'Practise on a shelf piece is for music the app cannot see: a metronome with a count-in, a tempo, the keys, a timer. It measures notes heard, minutes, tempo and — with the click on and the piano connected — how steady you were. It never measures accuracy, says so, and asks you: Rough, OK or Clean.',
    ],
    figures: [{ file: 'shelf', caption: 'The shelf: a book, its pieces, their pages and rungs.' }],
    opens: [{ label: 'Open the Shelf', tab: 'library', sub: 'shelf' }],
  },
  {
    id: 'lessons',
    title: 'Lessons, drills and skills',
    paragraphs: [
      'Plan is the curriculum: stages, units, lessons, each a rung with a few options — an exercise, a song, sometimes a drill. Any of them finishes the rung; two songs per lesson is a stricter rule you can turn on.',
      'Drills are prompt-and-answer: name the note, play the interval, find the chord, keep the rhythm. They score on the same accuracy setting a piece does, and their tips fold out under the prompt.',
      'Skills review, from Today or Plan, lists every skill with its drills and a Find more of its own.',
    ],
    figures: [
      { file: 'plan', caption: 'The plan: stages and rungs, the next one recommended.' },
      { file: 'drill', caption: 'A drill: the prompt, the keys, right and wrong by shape as well as colour.' },
    ],
    opens: [
      { label: 'Open the plan', tab: 'plan' },
      { label: 'Skills review', tab: 'plan', sub: 'skills' },
    ],
  },
  {
    id: 'progress',
    title: 'Progress, and not losing it',
    paragraphs: [
      'Progress shows minutes a day for the last thirteen weeks, what is due for review, what is mastered, and the performances on their own list. An item you passed comes back for review after 1, 3, 7 and 21 days.',
      'This phone holds the only copy. Progress → Export everything writes one file with your history, your settings and your imported scores; put it somewhere that is not the phone, and do it before reinstalling, changing phones or clearing Chrome’s data. Import a backup brings it back, and merges by default, so restoring an old backup never throws away practice done since.',
    ],
    figures: [{ file: 'progress', caption: 'Progress: the heat map, what is due, and Export everything.' }],
    opens: [{ label: 'Open Progress', tab: 'progress' }],
  },
  {
    id: 'piano',
    title: 'The piano, the microphone, the phone',
    paragraphs: [
      'A USB cable from the piano’s MIDI OUT into the phone is the sure way: every key is heard exactly. Settings → MIDI → Connect piano; Chrome asks once, and from then on the app reconnects on its own. If nothing arrives, the DIN plugs are the usual culprit — MIDI OUT on the piano goes to MIDI IN on the interface.',
      'No cable? The on-screen keys on the score and drill screens are a real input. The microphone is the third option — never as certain as a cable, so anything it is unsure about is shown amber and never counted against you — and Settings → Microphone calibrates it to this room and this piano.',
      'The setup tour walks through all of it: which way the phone sits, the piano, how late it is, the sound, the screen, the modes, your practice. Run it again from Settings any time.',
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
    id: 'offline',
    title: 'Offline, updates and when something looks wrong',
    paragraphs: [
      'It works with no network from the second launch onwards: every score, the lesson text and the piano samples are on the phone. Settings → Content → Download everything now fetches the whole library at once and says how much of it landed; Offline only stops it checking for updates at all. When a new version is ready the app says so and lets you choose the moment; it never swaps mid-practice.',
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
      text: 'What the app can do and how to get your music into it. Every section opens the screen it describes.',
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
    for (const text of s.paragraphs) block.append(el('p', { text }));
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

/** The pictures the guide expects, for the test that checks they ship. */
export const GUIDE_FIGURES: readonly string[] = SECTIONS.flatMap((s) => (s.figures ?? []).map((f) => f.file));
