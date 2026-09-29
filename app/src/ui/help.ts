/**
 * What every mode, drill and tool is, in the learner's words — one table.
 *
 * The owner, 2026-09-22: *"there's not enough context or explanation given in
 * the modes and exercises. There's gotta be a better way to tell the user
 * what's going on, what they're supposed to do, what they can do, and what's
 * available."*
 *
 * Four questions, and every practising screen answers all four:
 *
 *  1. **What is this?**        `what`      — the thing in one line.
 *  2. **What do I do now?**    `now`       — one line, before anything has
 *                                            happened. The run replaces it
 *                                            while it is going, from the same
 *                                            signals the cues use; this is the
 *                                            sentence the screen opens on.
 *  3. **What can I do here?**  `controls`  — the controls that matter, one
 *                                            line each, and what each says back.
 *  4. **What else is there?**  `elsewhere` — where this fits, and what its
 *                                            neighbours are.
 *
 * One table rather than a sentence beside each markup, because a sentence
 * beside markup is copied into the spec and then changed in one of the two
 * places. `LAB_HELP` in `engine/sightReading.ts` is the same shape for the
 * lab's ten controls and is the pattern this follows (Entry 30); `04` §5f
 * prints this table and `help.test.ts` is the join.
 *
 * **Voice**: a teacher at the piano beside you. Short, concrete, second person
 * where it tells the learner to do something, no word a Stage 0 learner has
 * not met, and the one name `04` §5 gives the thing — *Wait for me*, never
 * "Wait mode".
 */
import type { DrillKind } from '../engine/drills/types';
import type { Refusal } from '../evidence/evidence';
import type { Skill } from '../demands/vocabulary';
import type { ExposureFamily, ReadingMove, ReadingWhy, SlotClaim, SlotKind } from '../curriculum/session';
import type { AlternativeTier } from '../curriculum/selectors';
import { VOCABULARY_V0 } from '../evidence/vocabulary';
import type { ProjectAction, ProjectState, ReadingRecipe } from '../data/db';
import type { RequirementReading, RungReading } from '../evidence/rungState';
import type { LadderState } from '../evidence/ladder';
import type { EvidenceJobStatus } from '../data/evidenceJob';
import type { SkillMove } from '../data/skillsStore';
import type { EvidenceExclusion } from '../data/db';
import type { Measurement, Provenance } from '../curriculum/types';

/** One control, and what it says back. */
export interface HelpControl {
  /** Exactly the words on the control, so the line can be read beside it. */
  readonly name: string;
  /** What it does, and what happens when you press it. */
  readonly does: string;
}

export interface HelpEntry {
  /** The one name for this thing, as `04` gives it. */
  readonly title: string;
  /** Question 1. */
  readonly what: string;
  /** Question 2, before the run starts. */
  readonly now: string;
  /**
   * What counts here — the third line of the first-sight card.
   *
   * A learner's first question after "what do I do" is "and does this go on my
   * record?", and it has a different answer on nearly every screen: a Keep
   * tempo run can pass a rung, a lab loop is not recorded at all, Show me
   * costs the card it is pressed on.
   */
  readonly counts: string;
  /** Question 3. */
  readonly controls: readonly HelpControl[];
  /** Question 4. */
  readonly elsewhere: string;
}

/**
 * The ways a piece can be open on the Score screen.
 *
 * The first four are the mode selector at the top of the screen. The last
 * three sit alongside a mode rather than replacing one — a blind run is still
 * a *Wait for me* or *Keep tempo* run — and they are here because each changes
 * what the learner is being asked to do, which is the question this table
 * answers.
 */
export type ScoreMode = 'wait' | 'tempo' | 'listen' | 'free' | 'rhythm' | 'blind' | 'perform';

/** The practising tools that have a route of their own. */
export type ToolKey = 'lab' | 'chart' | 'play' | 'metronome' | 'paper' | 'pdf';

/**
 * The four modes at the top of the Score screen, and the three that sit
 * alongside them.
 *
 * Exhaustive by type: a mode added without a row here does not compile.
 */
export const MODE_HELP: Readonly<Record<ScoreMode, HelpEntry>> = {
  wait: {
    title: 'Wait for me',
    what: 'The page holds still until you play the right note, for as long as you like.',
    now: 'Play the first note. Nothing moves until you do.',
    counts: 'A run in this mode is practice: it is recorded, but a pass for the rung is measured in Keep tempo.',
    controls: [
      { name: 'Hear it', does: 'Plays the piece to you. Nothing is judged while it plays, and a run you are part way through waits, paused, until it stops.' },
      { name: 'Hands', does: 'Which hand the app waits for. The phone can play the other one.' },
      { name: '⋯', does: 'The settings you change once: the metronome, the input, how much music is on the screen, the keys underneath.' },
      { name: 'Bars in window', does: 'How many bars you want on the screen at once. You always get the next bar after them too, and the notes are never squeezed or stretched to make a number fit — so if the one you ask for would come out too small to read, the app shows fewer and tells you so.' },
      { name: '← Back', does: 'Leaves the piece. A run you were part way through is offered again when you come back.' },
    ],
    elsewhere: 'The mode for the first time you meet a piece. When the notes are under your fingers, Keep tempo is the one that scores.',
  },
  tempo: {
    title: 'Keep tempo',
    what: 'A click and a moving cursor that carry on whether you keep up or not, and mark what you miss.',
    now: 'The count-in clicks, then play along.',
    counts: 'A pass needs both the accuracy and the share of the written tempo set in Settings, in one run.',
    controls: [
      { name: 'Tempo', does: 'A share of the written speed. Slower is how a hard bar becomes an easy one.' },
      { name: '▶', does: 'Starts the run. With a piano connected your own first note starts it instead, and the clock waits for it.' },
      { name: 'Loop', does: 'Repeats a few bars until they are yours. Double-tap two bars on the sheet to mark them.' },
      { name: 'Metronome', does: 'The click, on or off. Turn it off to play against silence.' },
      { name: '⋯', does: 'Rhythm only, Ladder, Duet, Blind and Perform, and the settings you change once.' },
    ],
    elsewhere: 'This is the mode a pass is measured in. Wait for me is where a piece is learned first; Play it to me is where you hear what you are aiming at.',
  },
  listen: {
    title: 'Play it to me',
    what: 'The app plays the piece while you watch and listen. Nothing you play is judged.',
    now: 'Press Hear it and follow the cursor.',
    counts: 'Nothing is counted here: you are listening, not playing.',
    controls: [
      { name: 'Hear it', does: 'Starts and stops the playing.' },
      { name: 'Tempo', does: 'Slows the playing down so you can see what the hands are doing.' },
      { name: 'Hands', does: 'Plays one hand only, so you can play the other one over it.' },
    ],
    elsewhere: 'Use it before the first read, or when a bar will not come right. Long-pressing one bar on any mode plays that bar alone.',
  },
  free: {
    title: 'Free play',
    what: 'The page turns on your own notes and nothing is judged, counted or recorded.',
    now: 'Play. The page follows you; nothing is marked.',
    counts: 'Nothing is counted, recorded or marked.',
    controls: [
      { name: 'Hands', does: 'Which hand the page follows.' },
      { name: '⋯', does: 'The keys under the score and how much music is on the screen. The metronome is off here: Free play has no clock for it to click against.' },
      { name: 'Bars in window', does: 'How many bars you want on the screen at once, with the next bar after them always drawn as well. Ask for more than fits and the app shows as many as it can read out clearly, and says how many that is.' },
    ],
    elsewhere: 'For improvising over a piece, or just playing it. Nothing from a free run reaches Progress; Keep tempo is what records a run.',
  },
  rhythm: {
    title: 'Rhythm only',
    what: 'A Keep tempo run judged on your timing alone: the notes are not looked at.',
    now: 'Tap the rhythm on any key at all.',
    counts: 'It is counted as a rhythm run, and never as playing the piece.',
    controls: [
      { name: 'Metronome', does: 'The click to tap against. One tap for each written note or chord; extra keys are wrong.' },
      { name: 'Tempo', does: 'How fast the written rhythm goes past.' },
      { name: '⋯', does: 'Turns Rhythm only off again, and holds the rest of the settings.' },
    ],
    elsewhere: 'Its summary is headed Rhythm run and never counts as playing the piece. Turn it off and the same run judges the notes as well.',
  },
  blind: {
    title: 'Blind',
    what: 'The same run with the notation hidden, so you play from memory.',
    now: 'Play from memory. It is still being marked.',
    counts: 'It counts exactly as the same run would with the notation showing.',
    controls: [
      { name: '⋯', does: 'Shows the score again, once the run is paused. The screen is set up again and offers the run back from the bar you left it on.' },
    ],
    elsewhere: 'It is scored exactly as a sighted run, so a blind pass counts for the rung. It sits alongside Wait for me and Keep tempo rather than replacing either.',
  },
  perform: {
    title: 'Perform',
    what: 'One pass from start to finish: no restarts, no loop, and it is kept on its own list.',
    now: 'One run through. There is no going back.',
    counts: 'It is kept as a performance, on its own list, however it went. Use Hear it part way and it is kept as practice instead.',
    controls: [
      { name: '⋯', does: 'Stops performing and goes back to practising, once the run is paused.' },
    ],
    elsewhere: 'Performances are listed on their own in Progress, apart from practice runs. Practise the piece in Keep tempo first.',
  },
};

/**
 * What the summary sheet says about what a run did and did not measure (T37,
 * `04` §5).
 *
 * Here beside `MODE_HELP` because they are the same facts told at the other
 * end of the run: *Wait for me* says before a run that a pass is measured in
 * Keep tempo, and the sheet says it again after one, in the same words, so
 * the two cannot drift apart.
 */
export const SUMMARY_TEXT = {
  /**
   * The Tempo line of a Wait for me run. The slider's value is a setting
   * nobody played to, so it is not printed as a share of anything.
   */
  waitTempo: 'Not judged in Wait for me — to pass, play it in Keep tempo',
  /**
   * The heading of a Wait for me run whose notes met the pass. "Run finished"
   * read as a failure over a run that had every note it needed, and "Passed"
   * would claim the half nobody measured.
   */
  waitNotesReady: 'Notes ready',
  /** Said once a *Clean* self-report is on the record: `02` Part G's pass without MIDI. */
  selfReportClean: 'Recorded: Clean — a pass, in your own judgement.',
  /**
   * Said once a *Rough* or *OK* self-report is on the record — or a *Clean*
   * one after a rhythm run, which can never pass the piece (T40, `05` §3a).
   */
  selfReportOther: (report: 'rough' | 'ok' | 'clean'): string =>
    `Recorded: ${report === 'ok' ? 'OK' : report === 'clean' ? 'Clean' : 'Rough'} — practice, not marked passed.`,
  /**
   * The heading of a run the app heard nothing of (T40): no note reached it
   * from any source, so there is no accuracy, no miss and no weak bar to give.
   * It printed *Accuracy 0%* and *Missed 17* over a run nothing listened to.
   * Not a failure, because nothing failed: nothing was measured.
   */
  notMeasuredHeading: 'Not measured',
  /** …the line under it, the reason in the learner's terms… */
  notMeasured: 'The app heard no notes, so there is nothing to mark.',
  /** …and where nothing was listening, how to be heard next time. */
  notMeasuredNoInput: 'To be marked, connect a piano or choose Screen keys in ⋯.',
  /**
   * The line under the same heading on a drill's end sheet when the set ended with no card answered (U96):
   * *End drill* before the first answer, or, on a kind the learner closes card by card (loud and soft, a
   * rhythm), *Next* or *Done* with nothing played. (A skipped card is not this: it counts as answered, wrong,
   * `PromptDrill.next`.) Its sheet printed *Not passed yet* over *Accuracy 0%*, a verdict and a share of
   * nothing. No answers rather than no notes, so a sentence of its own.
   */
  notAnswered: 'Nothing was answered, so there is nothing to mark.',
  /**
   * A sight-read of a phrase already on the record, or run again (T37): the
   * material has been seen, so the run is not a first reading (`05` §7). It is
   * kept as practice (C1): its minutes and its attempt count, and it is
   * flagged so it counts as no reading.
   */
  sightReadRepeat: 'Sight-reading counts on the first attempt only — this run is kept as practice.',
  /**
   * A sight-read whose phrase was played to the learner — part way through
   * the run (T33), or before it started (T40): the phrase has been heard, so
   * the run is not a first reading of it (`05` §7). Kept as practice, as
   * above (C1; the reviewer's decision 3).
   */
  sightReadHeard: 'Sight-reading counts only on music you have not heard — this run is kept as practice.',
  /**
   * A sight-read of a phrase the learner looked at on an earlier visit and
   * never played or heard (G1): the notation has been read before, so the
   * run is not a first reading of it. The viewing is a stored encounter now,
   * read back when the phrase is opened again; looking at it on this visit,
   * before playing, is what sight-reading is and costs nothing.
   */
  sightReadSeen: 'Sight-reading counts only on music you have not seen before — this run is kept as practice.',
  /**
   * The second half of a performance's heading when the piece was played to
   * the learner part way through it (T40): the take is kept as practice, not
   * as a performance, and the *Changed* line under it names the bar.
   */
  demonstratedTake: 'heard part way, kept as practice',
  /**
   * The summary's one line naming what changed during the run (T33, C5), so
   * the numbers are read against the run that produced them. Its label, and
   * how each thing is said.
   */
  changedLabel: 'Changed',
  /** One setting that changed; `when` is `atBar(n)` or `afterTheRun`. */
  changed: (key: RunChangeKey, to: string, when: string, from?: string): string => {
    switch (key) {
      case 'mode':
        return `mode changed to ${to} ${when}`;
      case 'hands':
        return `hands changed to ${to} ${when}`;
      case 'tempo':
        return `tempo ${from ?? '?'} → ${to} % ${when}`;
      case 'loop':
        return to === 'off' ? `loop cleared ${when}` : `loop set to ${to} ${when}`;
      case 'input':
        return `input changed to ${to} ${when}`;
      case 'rhythm':
        return `rhythm only ${to} ${when}`;
      case 'duet':
        return `duet ${to} ${when}`;
      case 'metronome':
        return `metronome ${to} ${when}`;
    }
  },
  atBar: (bar: number): string => `at bar ${String(bar)}`,
  afterTheRun: 'after the run',
  /** The run was set aside while the piece was played to the learner (C1). */
  heard: (bars: readonly number[]): string =>
    `heard it played at bar${bars.length === 1 ? '' : 's'} ${bars.map(String).join(', ')}`,
} as const;

/**
 * What the summary sheet says a run could not judge (C3 item 6, `04` §5f).
 *
 * Where the evidence function refuses a skill the item declares, the sheet
 * prints a *Not judged* line saying what and why, where it used to say nothing
 * — a Wait run of a reading row printed its accuracy and not a word about the
 * rhythm it never timed. Each line comes from a refusal and cites the fields of
 * the run's own record it read (`notJudgedLines`); a refusal that says nothing
 * about this run (a skill no run can show yet) is not printed. The *Accents*
 * line's not-judged reasons are here too (U46): where the record keeps the
 * accents as not measured, the sheet says so instead of printing a share.
 */
export const NOT_JUDGED_TEXT = {
  /** The label of each line. */
  label: 'Not judged',
  /** Timing, on a Wait for me run: the page waits, so nothing is on a clock. */
  timingWait: 'timing — Wait for me keeps no clock',
  /** Timing, on a Keep tempo run where none of the skill's notes was played to be timed. */
  timingUntimed: 'timing — none of those notes was played, so none was timed',
  /** The notes, on a rhythm-only run. */
  notesRhythm: 'the notes — Rhythm only judges the timing',
  /** A skill for both hands at once, on a run of one hand. */
  oneHand: (hand: 'R' | 'L'): string => `you played the ${hand === 'L' ? 'left' : 'right'} hand alone`,
  /** A skill whose standard asks for Keep tempo, on a run that kept none. */
  keepTempo: 'it needs Keep tempo',
  /** A skill that counts only on a first reading. */
  unseen: 'it counts only on music you have not seen or heard',
  /** A skill that counts only with the keys guide off. */
  guideOff: 'it counts only with the keys guide off',
  /** The skill's demand is not in what was played: the whole phrase, or the bars looped. */
  noOpportunity: (looped: boolean): string => (looped ? 'none in the bars you played' : 'none in this phrase'),
  /** The timing window is not narrower than the rhythm error the skill is about, at this tempo. */
  precision: 'too close to call at this speed; slower, the app can tell',
  /** Accents over notes that all arrived at one loudness (the screen keys). */
  accentsFlat: 'not judged — every note came at the same loudness, so louder cannot be heard',
  /** Accents where no accented note was played to be compared. */
  accentsNone: 'not judged — no accented note was played',
} as const;

/** One *Not judged* line: what the sheet prints, and the record fields it rests on. */
export interface NotJudgedLine {
  text: string;
  /** The observation fields the refusals behind it read (`SessionRow` paths). */
  cites: string[];
}

/**
 * The sheet's *Not judged* lines for a run's refusals, grouped where the
 * reason is one sentence: *timing — Wait for me keeps no clock (Sight-reading,
 * Subdivision)*; *Ledger lines, Accidentals — none in this phrase*.
 */
export function notJudgedLines(
  refusals: readonly Refusal[],
  skills: readonly Skill[],
  run: { hands?: { played: 'R' | 'L' | 'both' }; looped: boolean },
): NotJudgedLine[] {
  const name = (id: string): string => skills.find((skill) => skill.id === id)?.display ?? id;
  const channelLines = new Map<string, { skills: string[]; cites: Set<string> }>();
  const skillLines = new Map<string, { skills: string[]; cites: Set<string> }>();
  const add = (into: typeof channelLines, why: string, refusal: Refusal): void => {
    const entry = into.get(why) ?? { skills: [], cites: new Set<string>() };
    entry.skills.push(name(refusal.skill));
    for (const path of refusal.cites) entry.cites.add(path);
    into.set(why, entry);
  };
  for (const refusal of refusals) {
    switch (refusal.reason) {
      case 'not-measured:timing':
        add(channelLines, refusal.detail === 'wait' ? NOT_JUDGED_TEXT.timingWait : NOT_JUDGED_TEXT.timingUntimed, refusal);
        break;
      case 'not-measured:pitch':
        // Only a rhythm-only run's is about this run's choices; a run nothing
        // heard is already headed *Not measured*.
        if (refusal.detail === 'rhythm-only') add(channelLines, NOT_JUDGED_TEXT.notesRhythm, refusal);
        break;
      case 'condition:both-hands':
        add(skillLines, NOT_JUDGED_TEXT.oneHand(run.hands?.played === 'L' ? 'L' : 'R'), refusal);
        break;
      case 'condition:keep-tempo':
        add(skillLines, NOT_JUDGED_TEXT.keepTempo, refusal);
        break;
      case 'condition:unseen':
        add(skillLines, NOT_JUDGED_TEXT.unseen, refusal);
        break;
      case 'condition:guide-off':
        add(skillLines, NOT_JUDGED_TEXT.guideOff, refusal);
        break;
      case 'no-opportunity':
        add(skillLines, NOT_JUDGED_TEXT.noOpportunity(run.looped), refusal);
        break;
      case 'precision':
        add(skillLines, NOT_JUDGED_TEXT.precision, refusal);
        break;
      case 'not-measured:observable':
      case 'unknown-skill':
        // Nothing about this run: the same on every run, and the build says it.
        break;
    }
  }
  const lines: NotJudgedLine[] = [];
  for (const [why, entry] of channelLines) {
    lines.push({ text: `${why} (${entry.skills.join(', ')})`, cites: [...entry.cites] });
  }
  for (const [why, entry] of skillLines) {
    lines.push({ text: `${entry.skills.join(', ')} — ${why}`, cites: [...entry.cites] });
  }
  return lines;
}

/**
 * What the Progress history's detail line says about a run (C1, `04` §6).
 *
 * The line was `N% at T%` for every run but paper, so it printed a Wait run
 * as "88% at 70%" (the slider, as if kept), a self-reported run as "0%" and a
 * kept jam as "0%" (backlog L41, L43, L49). It says what was measured now,
 * and these are its words, here beside the sheet's so the two say one thing.
 */
export const HISTORY_TEXT = {
  /** After a Wait run's accuracy, in place of "at 70%": the slider is not a tempo anyone kept. */
  tempoNotJudged: 'tempo not judged',
  /** A run the app heard nothing of — the sheet's own heading for it. */
  notMeasured: 'Not measured',
  /** …and the answer the learner gave, which is the whole of its record. */
  youSaid: (report: 'rough' | 'ok' | 'clean'): string =>
    `you said ${report === 'ok' ? 'OK' : report === 'clean' ? 'Clean' : 'Rough'}`,
  /** A run nothing judged — a jam over a backing track. */
  notJudged: 'Not judged',
  /** A sight-read of a phrase met before: practice, not a reading. */
  notFirstSight: 'not first sight',
  /** A run the piece was played to the learner part way through. */
  heardPartWay: 'heard part way',
  /** A rhythm-only run: its figure is the rhythm's, not the notes'. */
  rhythmOnly: 'rhythm only',
} as const;

/** The settings whose change the summary's *Changed* line names (T33, C5). */
export type RunChangeKey =
  | 'mode'
  | 'hands'
  | 'tempo'
  | 'loop'
  | 'input'
  | 'rhythm'
  | 'duet'
  | 'metronome';

/**
 * The Score screen's state line, when the run has something to say about
 * itself (`04` §5f): paused, played to, restarted (T31, T33).
 *
 * In the table rather than beside the markup for the reason this file exists:
 * `04` §5f prints these sentences, and `help.test.ts` fails when the two stop
 * being the same sentence.
 */
export const STATE_TEXT = {
  /** Paused by ⏸ (T31). */
  paused: 'Paused — ▶ to carry on, or Start again in ⋯ to go back to the beginning.',
  /** …during a performance, which has no *Start again* row (`04` §5e). */
  pausedPerforming: 'Paused — ▶ to carry on.',
  /** Paused because the page was hidden (`05` §4, T31). */
  away: (seconds: number | string, performing: boolean): string =>
    `Paused — you were away ${String(seconds)} s. ${
      performing ? '▶ to carry on.' : '▶ to carry on, or Start again in ⋯ to go back to the beginning.'
    }`,
  /** A demonstration with no run under it (T31). */
  hearing: 'Playing it to you — nothing is judged. Hear it again to stop.',
  /**
   * A demonstration with the learner's run set aside under it (T33, C1). What
   * matters most first: at 342 px the line holds about forty characters, and
   * *your run waits at bar 12* is the answer to the question a learner has
   * the moment the piece starts playing — did I just lose my run? `Stop` is
   * what `Hear it` reads while it plays.
   */
  hearingOverRun: (bar: number | string): string =>
    `Playing it to you — your run waits at bar ${String(bar)}. Stop to go back to it.`,
  /**
   * The demonstration has ended and the run is back where it was (T33, C1).
   * `▶ to carry on`, the words of the paused line T31 wrote, rather than the
   * decision's *press ▶ to carry on*: one way of saying it on one line, and
   * the whole sentence fits at 342 px.
   */
  pausedAt: (bar: number | string): string => `Paused at bar ${String(bar)} — ▶ to carry on`,
  /**
   * An option changed while the run was paused: the run restarted and is
   * waiting for the learner (T33, C2). `what` is one of `RESTARTED_WITH`.
   * Where it is cut at 342 px it is cut after what changed, and ▶ is on the
   * bar, which a paused run keeps open.
   */
  restarted: (bar: number | string, what: string): string =>
    `Restarted at bar ${String(bar)} ${what} — ▶ when ready`,
} as const;

/**
 * What changed, in the words `STATE_TEXT.restarted` puts after the bar (T33,
 * C2): *Restarted at bar 1 **with the left hand** — press ▶ when ready*.
 */
export const RESTARTED_WITH = {
  mode: (label: string): string => `in ${label}`,
  hands: (hand: 'R' | 'L' | 'both'): string =>
    hand === 'both' ? 'with both hands' : `with the ${hand === 'R' ? 'right' : 'left'} hand`,
  tempo: (pct: number): string => `at ${String(pct)} %`,
  loop: (bars: string): string => `on a loop of ${bars}`,
  noLoop: 'with no loop',
  input: (said: string): string => `listening to ${said}`,
  noInput: 'with nothing listening',
  rhythm: (on: boolean): string => (on ? 'judging the rhythm only' : 'judging the notes as well'),
  duet: (played: string | null): string =>
    played === null ? 'with nothing played under you' : `with the app playing ${played}`,
  bars: (count: number): string => `with ${String(count)} bar${count === 1 ? '' : 's'} in the window`,
  layout: (scroll: boolean): string => (scroll ? 'in the Scroll layout' : 'in the Window layout'),
} as const;

/**
 * The status line at each pass boundary of a loop with the tempo ladder on
 * (`04` §5, `05` §6): what the pass was, then what the tempo does about it —
 * *Clean — up to 70 %*, *A mistake — staying at 30 %*.
 */
export const LADDER_TEXT = {
  /** Nothing missed, wrong or early in the pass. */
  clean: 'Clean',
  /** A miss, a wrong note or an early one in the pass. */
  mistake: 'A mistake',
  /**
   * A pass nothing judged (T42): no input was listening, so the pass was
   * neither clean nor a mistake and the ladder holds. The words give the
   * reason, which is not a floor or a ceiling, and match `RESTARTED_WITH`'s
   * *with nothing listening*.
   */
  nothingListening: 'Nothing listening',
  line: (verdict: string, fromPct: number, toPct: number): string =>
    toPct === fromPct
      ? `${verdict} — staying at ${String(toPct)} %`
      : `${verdict} — ${toPct > fromPct ? 'up' : 'down'} to ${String(toPct)} %`,
} as const;

/**
 * Why a `⋯` row cannot act now, on the row's own label (T33, C3 and C4) —
 * the label rather than the hint, because sideways the sheet hides every
 * hint and a reason nobody can see is a dead control with an excuse.
 */
export const ROW_TEXT = {
  /** C3: the engine refuses the click in Free play (`05` §3b). */
  metronomeNoClock: 'no clock in Free play',
  /** C3: the click is on, and waits for the run to be going to be heard. */
  metronomeWithRun: 'the click starts with the run',
  metronomeOnResume: 'the click starts when you carry on',
  metronomeOnFirstNote: 'the click starts on your first note',
  /** C4: Blind and Perform are refused while a run is going. */
  pauseFirst: 'pause the run first',
} as const;

/**
 * A transfer offer the Score screen could not find (D4a; `data/offerSnapshot.ts`), on a line of its own
 * under the header, which folds away when the run starts: the item opens as ordinary practice, and the
 * run records no intent and no relationship. `gone` for an offer no longer on today's card — the card
 * recomposed, the row swapped, another day's or another item's link; `unreadable` where what was kept
 * could not be read, which is not the learner's doing and is not said to be.
 */
export const OFFER_TEXT = {
  gone: 'This offer is no longer on today’s card; opened as practice.',
  unreadable: 'This offer could not be read back; opened as practice.',
} as const;

/**
 * Why Today offers this sight-reading phrase, in one line (C4, C4c; `04` §2,
 * design §11 item 4, backlog I1).
 *
 * The line says only what the stored evidence established: the last read's
 * sight-reading measurement (right notes in time on every step), and, where
 * the reads single out a demand (C4a's `pattern` or `isolated`), that demand
 * and the number of phrases it went wrong in. Where two reads went against the
 * recipe and nothing is singled out, it says the app is not sure yet what went
 * wrong, and names nothing. It never says a demand was *read* (Entry 72: "right
 * and in time" at a demand's notes is not reading them), never ranks one key
 * above another, and where no evidence chose the phrase it says the rung's
 * words and nothing more. Printed in `04` §2.
 *
 * What the phrase changes comes first: the session card cuts a reason to one
 * line at the owner's width, and the half that has to survive is what this
 * phrase is.
 */
export const READING_TEXT = {
  /** No evidence chose it: the daily card's words, as they always were. */
  rungDaily: 'One phrase you have never seen, once, slowly',
  /** No evidence chose it: the session row's words, as they always were. */
  rungSlot: 'Read something you have never seen, once, slowly',
  /** Today's phrase is on the record, read. */
  metRead: 'Read today — tomorrow’s phrase is new',
  /** Today's phrase is on the record, heard or read before its first run. */
  metHeard: 'Heard before it was read — tomorrow’s phrase is new',
  /** The easy one, on purpose. */
  easy: 'An easy one, for fluency',
  /** The easy one after two reads against the recipe that singled nothing out. */
  easyUnsure: 'An easy one',
  /** The same recipe again. */
  hold: 'Another like it',
  /** Two reads against the recipe, and the reads single nothing out (C4c). */
  unsure: 'not sure yet what went wrong',
  /**
   * A demand singled out, and no control here keeps it out (C4c). X1's voice pass (U57): it said "and every
   * phrase here has them", which is the reader's reason in the reader's terms — and true only where the recipe
   * promises the demand in every phrase (U58). What the learner needs is what the app can do about it: it
   * cannot take them out on this row, so the next phrase has them too.
   */
  kept: 'and they can’t be left out here',
  /** The key signature's control, on: a key to read, not a harder one (C4c, U52). */
  keySignature: 'A key signature to read',
  /** The rung that holds the row has moved on, and its phrases may hold more (C4c). */
  lesson: 'This lesson’s phrases',
  /** Ready to move, and nothing the rung has taught to move to. */
  stayTaught: 'The next step waits for a later lesson',
  /** The measurement's words. */
  rightInTime: 'right and in time',
  /** A singled-out demand's words: "skips went wrong in 3 phrases". */
  wentWrong: 'went wrong in',
} as const;

/**
 * What the project sheet, Progress and Stage 9's page say about a project (G1b; `04` §5, §6, §3f
 * rows in Entry 138). The actions are the learner's words for what they are doing with the piece;
 * the states are the same facts said as where the piece is now. Nothing here says the app decided,
 * judged or scheduled anything: every change is the learner's.
 */
export const PROJECT_TEXT = {
  /** The finish sheet's door, and the empty Progress list's pointer to it. */
  door: 'What next with this piece?',
  /** A piece with no project: the sheet's state line. */
  none: 'Not a project yet',
  /** A Stage 9 song option with no project. */
  notStarted: 'not started',
  /** Stage 9's page, in place of *What the app counts*. */
  stageNine: 'A project: there is no rung to pass here.',
  actions: {
    save: 'Save for later',
    learn: 'Learn this',
    polish: 'Prepare it for performance',
    ready: 'It is ready',
    performed: 'I performed it',
    keep: 'Keep it playable',
    'bring-back': 'Bring it back',
    pause: 'Pause',
    retire: 'Put it away',
  } satisfies Record<ProjectAction, string>,
  states: {
    saved: 'Saved for later',
    learning: 'Learning',
    polishing: 'Preparing for performance',
    'performance-ready': 'Ready to perform',
    maintaining: 'Keeping it playable',
    refreshing: 'Bringing it back',
    paused: 'Paused',
    retired: 'Put away',
  } satisfies Record<ProjectState, string>,
  /** The date field beside *I performed it*. */
  performedWhen: 'When',
  /** What the encounter history says of the piece (`encounterStore.familiarity`). */
  checking: 'Looking at what you have played…',
  heardOnly: 'You have listened to it and not played it yet.',
  viewedOnly: 'You have opened it and not played it yet.',
  never: 'You have never opened it.',
  /** R18's three facts. */
  goal: 'This week’s goal',
  problem: 'The problem right now',
  sections: 'Sections',
  sectionFrom: 'Bars',
  sectionTo: 'to',
  /** The two bar boxes' names for a screen reader, where the visible words are short. */
  sectionFirst: 'First bar',
  sectionLast: 'Last bar',
  sectionName: 'Name',
  addSection: 'Add section',
  removeSection: 'Remove',
  noSections: 'No sections yet.',
  /** Progress. */
  heading: 'Projects',
  makeProject: 'Make it a project',
  learnedHeading: 'Pieces you have passed, not yet projects',
  empty: 'No projects yet. At the end of a run, “What next with this piece?” makes one.',
  /** Said after the learner's action, beside the actions. */
  saved: 'Saved.',
  /**
   * The Library's Project filter (G85): its name, every piece whatever its project, and every piece
   * with a project in any state; each state is `states`. Not *Any project* for the second: the status
   * filter beside it says *Any status* for no filter at all, and the same shape would read the same.
   */
  filter: 'Project',
  filterAll: 'Project or not',
  filterAny: 'Your projects',
} as const;

/** "Learning since 2026-09-29": a project's state and the local day it was entered. */
export function projectSince(state: ProjectState, sinceIso: string, day: (at: Date) => string): string {
  return `${PROJECT_TEXT.states[state]} since ${day(new Date(sinceIso))}`;
}

/** The history's last line: *I performed it*'s day, or the state before this one and its day. */
export function projectHistoryLine(
  history: readonly { state: ProjectState; at: string; performedOn?: string }[],
  day: (at: Date) => string,
): string | null {
  const last = history[history.length - 1];
  if (last?.performedOn !== undefined) return `You performed it on ${last.performedOn}.`;
  const before = history[history.length - 2];
  return before ? `Before this: ${PROJECT_TEXT.states[before.state]}, from ${day(new Date(before.at))}.` : null;
}

/** "You last played it on 2026-09-28." — or part of it, where a run covered only some of its bars. */
export function playedLine(dayPlayed: string, part: boolean): string {
  return part ? `You last played part of it on ${dayPlayed}.` : `You last played it on ${dayPlayed}.`;
}

/** A project's goal on its Progress row. */
export function goalWords(goal: string): string {
  return `Goal: ${goal}`;
}

/**
 * A passed piece offered as a project on Progress: "Last played 2026-09-28". The list's own line says
 * the pieces are passed, so the row does not say it again (`04` §0 R2), and at 342 px beside *Make it
 * a project* the date is what the line has room for.
 */
export function lastPlayedLine(lastPlayed: string): string {
  return `Last played ${lastPlayed}`;
}

/** Where a section is: "Bars 1–8 · The tune". */
export function sectionWords(section: { from: number; to: number; label: string }): string {
  const bars = section.from === section.to ? `Bar ${String(section.from)}` : `Bars ${String(section.from)}–${String(section.to)}`;
  return section.label === '' ? bars : `${bars} · ${section.label}`;
}

/**
 * What a rung asks and what the evidence shows, in the learner's words (C5):
 * the lesson page's state line and its list *What the app counts*, and the
 * badges Plan puts on a rung. `04` §3 prints them and `help.test.ts` is the
 * join. It says what the app counts and nothing more: the lesson's own *How
 * you'll know* can ask for more than a run shows, and a rule no run can show is
 * printed as the lesson's (T2).
 */
export const RUNG_TEXT = {
  heading: 'What the app counts',
  /** Under the list: where a run has to be opened from to count (the judging rung, C5). */
  opensFromHere: 'A run counts for this rung when you open it from this page, or from Today’s card for this rung.',
  met: 'complete',
  inProgress: 'in progress',
  notStarted: 'not started',
  notJudged: 'not judged by the app',
  /** A rung whose every requirement is the lesson's rule. */
  notJudgedLine: 'The app cannot judge this rung: its rule is the lesson’s. Mark it done when you have done it.',
  known: 'you said you know it',
  done: 'marked done',
  carried: 'done before',
  carriedLine: 'Done before the app judged rungs by what your runs showed, and not judged again.',
  wordLine: 'Your word is kept apart from your runs: it moves the plan on and counts as none of them.',
  /** Before a requirement the app cannot judge. */
  unjudged: 'Not judged by the app — the lesson’s rule:',
  counted: 'counted',
  notYet: 'not yet',
  /** Plan's stage line and legend: the rungs the evidence met, beside those done before. */
  countedSince: 'counted since',
  byWord: 'by your word',
} as const;

/**
 * What the Skills screen and Progress say about a skill (C7; `04` §3a and §6,
 * `help.test.ts` the join). One state, the ladder's, in a person's words; "not
 * shown in 4 weeks" where the evidence has not supported a skill within the
 * ladder's retention span — the words Today's review line uses — beside the
 * state the evidence still supports; and, for a concept the app cannot
 * measure, that it does not judge it and where it is taught. The ladder's
 * "transfer demonstrated" is said as what v0 measured, "shown on different
 * material" (Part 26: never "transferred", as if everywhere).
 */
export const SKILL_TEXT = {
  notJudged: 'not judged by the app',
  taughtIn: 'Taught in',
  /** The Skills screen's filter, and its count line while on. */
  notShownFilter: 'Not shown lately',
  notShownCount: 'not shown lately',
  notIntroduced: 'not shown yet',
  introduced: 'introduced',
  practised: 'tried, not yet shown',
  transfer: 'shown on different material',
  /** Progress: the section, its empty line and its way to the Skills screen. */
  heading: 'Skills',
  nothingMoved: 'No skill the app measures has moved in the last four weeks.',
  review: 'Review a skill',
  /** Progress: a skill shown again after the retention span. */
  shownAgain: 'shown again',
} as const;

/** A ladder state as the Skills screen and Progress say it (`SKILL_TEXT`). */
export function skillStateWords(state: LadderState): string {
  switch (state) {
    case 'not introduced':
      return SKILL_TEXT.notIntroduced;
    case 'introduced':
      return SKILL_TEXT.introduced;
    case 'practised':
      return SKILL_TEXT.practised;
    case 'transfer demonstrated':
      return SKILL_TEXT.transfer;
    default:
      return state;
  }
}

/** "not shown in 4 weeks", counted from the last supporting evidence: Today's words (`spanWords`). */
export function notShownWords(since: string, today: Date): string {
  return spanWords(since, today);
}

/**
 * How a skill moved, as Progress says it (C7, X3): "tried, not yet shown →
 * familiar" for a step on the ladder, "familiar · not shown in 4 weeks" for a
 * skill the evidence has not supported within the retention span, "familiar ·
 * shown again" after one. The state is always the one the evidence supports
 * today; time alone lowers nothing.
 */
export function skillMoveWords(move: Pick<SkillMove, 'then' | 'now' | 'kind' | 'lastSupport'>, today: Date): string {
  const now = skillStateWords(move.now.state);
  const quiet = move.now.notShownRecently && move.lastSupport !== undefined ? ` · ${notShownWords(move.lastSupport, today)}` : '';
  if (move.kind === 'up' || move.kind === 'down') return `${skillStateWords(move.then.state)} → ${now}${quiet}`;
  if (move.kind === 'shown again') return `${now} · ${SKILL_TEXT.shownAgain}`;
  return `${now}${quiet}`;
}

/**
 * A stage's count on Plan (C5). Where rungs were carried over from before C5
 * they come first, apart, and the rungs the evidence has met since follow —
 * "3 of 9 done before · 1 counted since" — so the line reads as the learner's
 * place kept, not a reset; otherwise the rungs met, "3 of 9 lessons". The
 * learner's word is counted apart after either.
 */
export function stageCountWords(counts: { done: number; total: number; byWord: number; before: number }): string {
  const head =
    counts.before > 0
      ? `${String(counts.before)} of ${String(counts.total)} ${RUNG_TEXT.carried} · ${String(counts.done)} ${RUNG_TEXT.countedSince}`
      : `${String(counts.done)} of ${String(counts.total)} lessons`;
  return counts.byWord > 0 ? `${head} · ${String(counts.byWord)} ${RUNG_TEXT.byWord}` : head;
}

/** Why the evidence job kept runs out, as the storage report says it (C5). */
export const EVIDENCE_EXCLUSION_WORDS: Readonly<Record<EvidenceExclusion, string>> = {
  'no-steps': 'recorded before the app kept each note',
  'item-gone': 'whose exercise is no longer in the catalog',
  'no-seed': 'whose phrase was never numbered',
  'not-generated': 'of music the job does not rewrite',
  'phrase-differs': 'whose phrase the app now writes differently',
};

/**
 * The evidence job's line on the storage report (Settings → Content, C5): what
 * is up to date, what is still to do, and what is kept out and why. A run kept
 * out contributes nothing to where the learner is.
 */
export function evidenceJobLine(status: EvidenceJobStatus): string {
  if (status.state === 'waiting') return 'Evidence from your runs: checking after the screen is up.';
  // While it runs: the rows still to do once it has counted them, and until
  // then that it is still checking — "0 up to date." over rows it has not
  // reached yet read exactly like the finished line.
  const doing =
    status.state !== 'running'
      ? ''
      : status.pending > 0
        ? `, ${String(status.pending)} being brought up to date`
        : ', still checking';
  const kept = (Object.entries(status.excluded) as [EvidenceExclusion, number][])
    .filter(([, n]) => n > 0)
    .map(([why, n]) => `${String(n)} ${EVIDENCE_EXCLUSION_WORDS[why]}`);
  const stopped = status.stopped === true ? ' Stopped before the end; it tries again the next time the app opens.' : '';
  return `Evidence from your runs: ${String(status.current)} up to date${doing}.${kept.length > 0 ? ` Kept out: ${kept.join('; ')}.` : ''}${stopped}`;
}

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

function countWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

function percent(share: number): string {
  return `${String(Math.round(share * 100))} %`;
}

/** A ladder state as a person says it (C3's ladder, `evidence/ladder.ts`). */
export function ladderWords(state: LadderState): string {
  if (state === 'not introduced' || state === 'introduced') return 'not shown yet';
  // The rest as the Skills screen says them — "shown on different material",
  // never "transfer demonstrated" (Part 26, C7).
  return skillStateWords(state);
}

/** What one requirement asks, in a sentence, without its state. */
export function requirementWords(
  reading: RequirementReading,
  context: {
    /** The share and the tempo a run of the rung is judged at (`masteryCriteriaFor`). */
    accuracy: number;
    tempoPct: number;
    /** An item's title, for the items a requirement names. */
    titleOf: (id: string) => string;
    /** Whether every item a requirement draws on is a drill, which has no tempo. */
    drillsOnly: (ids: readonly string[]) => boolean;
    /** A skill's display name. */
    skillName: (id: string) => string;
    /** The rung's own options, for a pool. */
    exercises: readonly string[];
    songs: readonly string[];
  },
): string {
  const r = reading.requirement;
  switch (r.kind) {
    case 'runs': {
      const pool = r.items ?? (r.from === 'exercises' ? context.exercises : r.from === 'songs' ? context.songs : [...context.exercises, ...context.songs]);
      let what: string;
      if (r.items !== undefined) {
        const titles = r.items.map(context.titleOf);
        what =
          r.items.length === 1
            ? (titles[0] as string)
            : r.count === r.items.length
              ? `All of ${titles.join(', ')}`
              : `${countWord(r.count)} of ${titles.join(', ')}`;
      } else {
        const noun = r.from === 'exercises' ? 'exercise' : r.from === 'songs' ? 'song' : 'piece';
        what = `${countWord(r.count)} ${noun}${r.count === 1 ? '' : 's'} from this page`;
      }
      const share = `at ${percent(r.accuracy ?? context.accuracy)} of the notes`;
      const tempo =
        context.tempoPct > 0 && !context.drillsOnly(pool)
          ? `, in Keep tempo at ${String(Math.round(context.tempoPct))} % of the written tempo or faster`
          : '';
      const perform = r.performance === true ? ', played with Perform on' : '';
      return `${what} ${share}${tempo}${perform}.`;
    }
    case 'reads':
      return `${countWord(r.count)} new phrases of this rung’s sight-reading, read at sight in Keep tempo${
        r.standard === 'full' ? ' with the keys guide off' : ''
      }, ${percent(r.share)} right and in time.`;
    case 'skill':
      return `${context.skillName(r.skill)}: ${r.state} or better, from what your reads show wherever you read.`;
    case 'done':
      return `${context.titleOf(r.item)}, finished.`;
    case 'measure':
      return `The ${r.measure} measure met, in a run from this page.`;
    case 'unjudged':
      return `${RUNG_TEXT.unjudged} ${r.says}`;
  }
}

/** What the evidence shows for one requirement, beside its sentence; `''` for one the app cannot judge. */
export function requirementState(reading: RequirementReading, titleOf: (id: string) => string): string {
  if (reading.holds === 'unjudged') return '';
  if (reading.requirement.kind === 'skill') {
    // What the reads show, once: "not yet — now not shown yet" said it twice.
    const shows = ladderWords(reading.state ?? 'not introduced');
    return reading.holds ? `${RUNG_TEXT.counted} — ${shows}` : shows;
  }
  if (reading.holds) {
    return reading.items.length > 0 ? `${RUNG_TEXT.counted}: ${reading.items.map(titleOf).join(', ')}` : RUNG_TEXT.counted;
  }
  return reading.need > 1 ? `${String(reading.have)} of ${String(reading.need)}` : RUNG_TEXT.notYet;
}

/** The badge a rung wears on Plan and on its page: the evidence's word first, then the learner's. */
export function rungBadge(state: Pick<RungReading, 'status' | 'judged' | 'word' | 'carried'>): string {
  if (state.status === 'met') return RUNG_TEXT.met;
  if (state.word !== undefined) return state.word.kind === 'known' ? RUNG_TEXT.known : RUNG_TEXT.done;
  if (state.carried) return RUNG_TEXT.carried;
  if (!state.judged) return RUNG_TEXT.notJudged;
  return state.status === 'in progress' ? RUNG_TEXT.inProgress : RUNG_TEXT.notStarted;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** When a read was, as a person says it the next morning. */
function readDay(at: string, today: Date): string {
  const then = new Date(at);
  const startOf = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(then)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `on ${WEEKDAYS[then.getDay()] ?? 'an earlier day'}`;
  return `on ${String(then.getDate())} ${MONTHS[then.getMonth()] ?? ''}`;
}

const KEY_NAMES: Readonly<Record<string, string>> = {
  '0': 'C major',
  '1': 'G major',
  '-1': 'F major',
  '2': 'D major',
  '-2': 'B♭ major',
  '3': 'A major',
  '-3': 'E♭ major',
  '4': 'E major',
  '-4': 'A♭ major',
};
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four'];

/** A key and what its signature asks: "G major, one sharp". A name, never a rank. */
export function keyWords(fifths: number): string {
  if (fifths === 0) return 'C major';
  const count = Math.abs(fifths);
  const sign = fifths > 0 ? 'sharp' : 'flat';
  return `${KEY_NAMES[String(fifths)] ?? 'another key'}, ${COUNT_WORDS[count] ?? String(count)} ${sign}${count === 1 ? '' : 's'}`;
}

/**
 * How the reason line names a demand's notes, and what turning its control on
 * or off makes the phrase ("with dotted quarters", "by step only"). Keyed by
 * vocabulary demand id; the hands, the key and the range are worded from the
 * move itself (`moveWords`).
 */
export const DEMAND_WORDS: Readonly<Record<string, { name: string; on: string; off: string; lesson?: string }>> = {
  'clef.bass': { name: 'the bass-staff notes', on: 'with both hands', off: 'right hand only' },
  'pitch.ledger': { name: 'the ledger-line notes', on: 'with a ledger-line note', off: 'without ledger lines' },
  'interval.step': { name: 'steps', on: 'with steps', off: 'without steps' },
  'interval.skip': { name: 'skips', on: 'with skips', off: 'by step only' },
  'interval.leap': { name: 'leaps', on: 'with a leap', off: 'without leaps' },
  'rhythm.eighths': { name: 'the eighth notes', on: 'with eighth notes', off: 'without eighth notes' },
  'rhythm.shorter-than-quarter': { name: 'the eighth notes', on: 'with eighth notes', off: 'without eighth notes' },
  'rhythm.sixteenths': { name: 'the sixteenth notes', on: 'with sixteenth notes', off: 'without sixteenth notes' },
  'rhythm.dotted-quarter': { name: 'the dotted quarters', on: 'with dotted quarters', off: 'without dotted quarters' },
  'rhythm.ties': { name: 'the tied notes', on: 'with tied notes', off: 'without ties' },
  'rhythm.syncopation': { name: 'the syncopation', on: 'with syncopation', off: 'without syncopation' },
  'rhythm.triplets': { name: 'the triplets', on: 'with triplets', off: 'without triplets' },
  'metre.compound': { name: 'the bars in 6/8', on: 'in 6/8', off: 'in 4/4' },
  'key.signature': { name: 'the key signature', on: 'with a key signature', off: 'in C major' },
  'pitch.chromatic': { name: 'the notes outside the key', on: 'with a note outside the key', off: 'without notes outside the key' },
  'range.beyond-position': {
    name: 'the notes beyond the hand position',
    on: 'beyond C position',
    off: 'in C position',
    lesson: 'can reach beyond C position',
  },
  'texture.hands-together': { name: 'both hands together', on: 'with both hands', off: 'right hand only' },
  'texture.left-hand-pattern': { name: 'the moving left hand', on: 'with a moving left hand', off: 'with held notes in the left hand' },
  'texture.walking-bass': { name: 'the walking bass', on: 'with a walking bass', off: 'without a walking bass' },
};

/** What a move makes the phrase, in a teacher's words. */
export function moveWords(move: Pick<ReadingMove, 'demand' | 'direction' | 'patch' | 'recipe' | 'key'>): string {
  const hands = move.patch.hands;
  if (hands !== undefined) return hands === 'both' ? 'with both hands' : hands === 'left' ? 'in the left hand' : 'right hand only';
  if (move.demand === 'key.signature') return move.direction === 'on' && move.key !== undefined ? keyWords(move.key) : 'in C major';
  if (move.demand === 'range.beyond-position') {
    const fifths = move.recipe.moved?.fifths;
    const home = fifths === undefined || fifths === 0 ? 'C position' : 'one hand position';
    return move.direction === 'on' ? `beyond ${home}` : `in ${home}`;
  }
  const words = DEMAND_WORDS[move.demand];
  if (!words) return move.direction === 'on' ? 'with something new' : 'with something left out';
  return move.direction === 'on' ? words.on : words.off;
}

/**
 * The reason line for a reading offer. `today` is the morning the line is
 * read, for "yesterday"; the evidence carries its own date.
 */
export function readingReason(why: ReadingWhy, purpose: 'daily' | 'slot', today: Date): string {
  const measured = (last: { at: string; right: number; n: number }): string =>
    `${String(last.right)} of ${String(last.n)} ${READING_TEXT.rightInTime} ${readDay(last.at, today)}`;
  const wentWrong = (finding: { demand: string; phrasesBelow: number }): string =>
    `${DEMAND_WORDS[finding.demand]?.name ?? 'those notes'} ${READING_TEXT.wentWrong} ${String(finding.phrasesBelow)} phrase${finding.phrasesBelow === 1 ? '' : 's'}`;
  switch (why.kind) {
    case 'rung':
      return purpose === 'daily' ? READING_TEXT.rungDaily : READING_TEXT.rungSlot;
    case 'met':
      return why.read ? READING_TEXT.metRead : READING_TEXT.metHeard;
    case 'hold':
      if (why.wrong) return `${READING_TEXT.hold} — ${wentWrong(why.wrong)}`;
      return why.key === undefined
        ? `${READING_TEXT.hold} — ${measured(why.last)}`
        : `${READING_TEXT.hold}: ${keyWords(why.key)} — ${measured(why.last)}`;
    case 'forward':
      return why.move.demand === 'key.signature' && why.move.key !== undefined
        ? `${READING_TEXT.keySignature}: ${keyWords(why.move.key)} — ${measured(why.last)}`
        : `Now ${moveWords(why.move)} — ${measured(why.last)}`;
    case 'back':
      return `This one ${moveWords(why.move)} — ${wentWrong(why.because)}`;
    case 'unsure':
      return why.easy
        ? `${READING_TEXT.easyUnsure}: ${moveWords(why.easy)} — ${READING_TEXT.unsure}`
        : `${READING_TEXT.hold} — ${READING_TEXT.unsure}`;
    case 'kept':
      return `${READING_TEXT.hold} — ${wentWrong(why.because)}, ${READING_TEXT.kept}`;
    case 'lesson': {
      const demand = why.demands[0] ?? '';
      const words = DEMAND_WORDS[demand];
      return `${READING_TEXT.lesson} ${words?.lesson ?? `can have ${words?.name ?? 'something new'}`}`;
    }
    case 'easy':
      return `${READING_TEXT.easy}: ${moveWords(why.move)}`;
    case 'stay':
      return `${READING_TEXT.stayTaught} — ${measured(why.last)}`;
  }
}

/**
 * A reading row's title with the hands its recipe plays (C4). A row named
 * for one hand ("…, level 2, right hand") whose recipe added the other must
 * not say "right hand" over a two-hand phrase; a row named for neither says
 * the hand where the recipe took one away. Every other title is the row's.
 */
export function readingTitle(title: string, ownHands: string, recipe: Pick<ReadingRecipe, 'moved'> | undefined): string {
  const hands = recipe?.moved?.hands;
  if (hands === undefined || hands === ownHands) return title;
  const bare = title.replace(/, (right|left) hand$/, '');
  return hands === 'both' ? bare : `${bare}, ${hands} hand`;
}

/**
 * Why a slot on Today's card holds its item, in one line (C6; `04` §2, backlog
 * I1, T19): drawn from the claim that chose it (`session.SlotClaim`) — what the
 * lesson asks and what has counted, the skill the reads have not shown lately,
 * when a learned piece was last played, the family of material played least
 * lately, or the step of the fallback ladder — and nothing else. The session
 * row cuts a reason to one line at the owner's width, so what the item is for
 * comes first. Printed in `04` §2.
 */
export const SLOT_TEXT = {
  thisLesson: 'This lesson',
  nextLesson: 'The next lesson',
  /** "This lesson asks for an exercise — not counted yet": the requirement's words (`rungState`). */
  asksFor: 'asks for',
  notCounted: 'not counted yet',
  /** A `runs` requirement that asks for a performance (`04` §5e). */
  performed: 'played with Perform on',
  counted: 'counted',
  /** New, when what is left on the learner's rung is its reads (the reader's): the next lesson, said as such. */
  nextUp: 'Next lesson',
  /** A project stage's rung (Stage 9): a piece to live with, never a rung to pass. */
  project: 'A piece to live with',
  waitsForReads: 'this one waits for your reads',
  /** Skill retention: "Bass clef: not shown in 4 weeks" — what the reads have not shown. */
  notShown: 'not shown in',
  notShownSince: 'not shown since',
  /** Repertoire retention: the piece's words, never a skill's. */
  keepPlayable: 'Keeping this piece playable',
  lastPlayed: 'last played',
  /** A piece whose measured demands the reads support, one the lesson has just taught. */
  readyWith: 'A piece with',
  readySupported: 'your reads support them',
  /** The review, when neither reason finds anything. */
  nothingDue: 'Nothing due for review',
  /** The fallback ladder's steps. */
  fromThisLesson: 'From this lesson',
  moreFromThisLesson: 'more from this lesson',
  moreMusic: 'More music from this lesson',
  /**
   * A rung whose every piece for an ask is one the learner paused or put away (G1e, the reviewer's ruling):
   * "This lesson waits on pieces you paused or put away — more from this lesson", on the row that brings
   * the rung's other material. Said once; the paused pieces are never offered in its place.
   */
  heldByPause: 'waits on pieces you paused or put away',
  trains: 'Trains',
  has: 'Has',
  whichAsked: 'which this lesson asks for',
  whichBuildsOn: 'which this lesson builds on',
  /** The exposure rule (L26). */
  forVariety: 'For variety',
  fromLessonsSoFar: 'from your lessons',
  notPlayedYet: 'not played yet',
  nonePlayedYet: 'none played yet',
  nonePlayedSince: 'none played since',
  earlierSong: 'a song from an earlier lesson',
  /** Said of a mastered piece and only of one (L18). */
  pieceYouKnow: 'A piece you know',
  jam: 'Chords, form and feel',
  free: 'Play anything you like — no scoring, no cursor',
  /** After a swap: the learner's choice, and the tier it came from. */
  chose: 'You chose this one',
  /**
   * The transfer offer (D4): "Shifting position: something new, for a skill you have shown — it should
   * feel different". What it is for, as an invitation; never that it will prove, test or has shown
   * anything (the ladder's words for its v0 state stay C7's, `SKILL_TEXT.transfer`).
   */
  somethingNew: 'something new, for a skill you have shown',
  feelDifferent: 'it should feel different',
  /** The same line's head, which is all the card's one line holds at 342 px (U71; the invitation is on the transition sheet). */
  somethingNewHead: 'something new',
} as const;

/**
 * A row's line on Today's card (U71). The composition's own words (`slotReason`), whole, except the transfer
 * offer's: its line is the skill and "something new", cut at the clause rather than by an ellipsis, because at
 * 342 px the card kept "Shifting position: something n…" and lost the words that make it an invitation. The
 * whole line is what the transition sheet says when the offer is next (the composition's words, unchanged).
 */
export function cardLine(reason: string, claim: { kind: string; skill?: string } | undefined): string {
  if (claim?.kind !== 'transfer' || claim.skill === undefined) return reason;
  return `${bareSkill(claim.skill)}: ${SLOT_TEXT.somethingNewHead}`;
}

/**
 * Today's session as it is run (X1; Part 18; `04` §2 and §5): the transition after each activity, the resume
 * line, the finish line and the runner's adaptations — the one voice between activities. The transition's
 * reason is never here: it is the composition's own words for the slot (`slotReason`, the reader's line), the
 * reviewer's ruling, so nothing on this sheet adds a relationship the composition did not claim. None of it
 * judges the learner or claims a competence; ending early marks nothing failed and says what waits, without
 * guilt.
 */
export const SESSION_TEXT = {
  /** Today, while a session is running: its one filled box. */
  continue: 'Continue',
  /** "Continue today's session · 18 of 30 min · next: Minuet excerpt". */
  continueLine: (elapsedMin: number, plannedMin: number, next: string | undefined): string =>
    `Continue today’s session · ${String(elapsedMin)} of ${String(plannedMin)} min${next === undefined ? '' : ` · next: ${next}`}`,
  /** The quiet way out, beside it. */
  endSession: 'End today’s session',
  /** The transition's line: "Next: Minuet excerpt, 4 min — <the composition's words>". */
  nextLine: (title: string, minutes: number, reason: string): string => `Next: ${title}, ${String(minutes)} min — ${reason}`,
  /** Elapsed of planned, from the visible-time clock (never wall time since *Start session*). */
  timeLine: (elapsedMin: number, plannedMin: number): string => `${String(elapsedMin)} of ${String(plannedMin)} min so far`,
  start: 'Start',
  skipOrChange: 'Skip or change',
  tryAgain: 'Try again',
  moveOn: 'Move on anyway',
  /** Failure keeps the learner here (the reviewer's bounded rule). */
  keptHere: 'Still unstable, so we’re not moving on',
  /** Easy first-attempt success skipped the controlled practice after it (the reviewer's bounded rule). */
  easier: (skipped: string): string => `Easier than expected — ${skipped} is skipped`,
  /** A first-contact activity whose material was met after the card was composed (G2's adapter at its start). */
  repurposed: (how: string): string =>
    `You ${how === 'played' ? 'played' : how === 'viewed' ? 'saw' : 'heard'} this one earlier today, so it is practice now, not a first read`,
  /** After the last activity. */
  lastOne: 'That was the last one — today’s session is done',
  done: 'Done',
  /** The finish line on Today: the head, then what each activity came to. */
  finishedHead: (minutes: number): string => `Today’s session done · ${String(minutes)} min`,
  endedHead: (minutes: number): string => `Today’s session ended · ${String(minutes)} min`,
  /** What each activity came to, in the finish line and on the running card: done, played (tried and moved on), skipped. */
  stateDone: 'done',
  statePlayed: 'played',
  stateSkipped: 'skipped',
  /** The running card's current row. */
  stateNext: 'next',
  /** A row of a card composed after today's session, done in it. */
  doneToday: 'done today',
  /** An early end: what waits, and no more than that. */
  deferred: 'left for another day',
  /** A write the runner refused (a stale tab, an older screen): the view is reloaded, and says so. */
  moved: 'Today’s session moved on elsewhere; this is where it is now',
  /** The transfer offer could not be kept before opening (U73): nothing opened, said on Today. */
  offerNotKept: 'This offer could not be kept on this phone, so it was not opened. Try again.',
} as const;

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A skill's name as a person says it (`skills.json`'s `display`). */
function skillName(id: string): string {
  return VOCABULARY_V0.skills.find((skill) => skill.id === id)?.display ?? id;
}

/** A demand's notes without the article: "dotted quarters", "eighth notes". */
function demandName(id: string): string {
  return (DEMAND_WORDS[id]?.name ?? id).replace(/^the /, '');
}

/**
 * What a family of exercises is called (`drill.kind`), for the exposure
 * rule's line. A kind with no row reads as its own name, and should be given
 * one.
 */
export const FAMILY_WORDS: Readonly<Record<string, string>> = {
  scale: 'scales',
  arpeggio: 'arpeggios',
  hanon: 'Hanon exercises',
  comping: 'comping patterns',
  'five-finger': 'five-finger patterns',
  'seventh-voicing': 'seventh chords',
  accompaniment: 'accompaniment patterns',
  boogie: 'boogie patterns',
  'broken-seventh': 'broken seventh chords',
  cadence: 'cadences',
  'ii-V-I': 'ii–V–I progressions',
  progression: 'chord progressions',
  'walking-bass': 'walking bass lines',
  rhythm: 'rhythm drills',
  inversion: 'inversions',
  'blues-scale': 'blues scales',
  'open-voicing': 'open voicings',
  'interval-reading': 'reading by interval',
  montuno: 'montunos',
  'octave-scale': 'scales in octaves',
  'hand-independence': 'hand-independence exercises',
  trill: 'trills',
  'repeated-notes': 'repeated notes',
  tremolo: 'tremolos',
  turnaround: 'turnarounds',
  'broken-octaves': 'broken octaves',
  clave: 'clave patterns',
  coordination: 'coordination exercises',
  'position-shift': 'position shifts',
  shaping: 'phrase shaping',
  articulation: 'articulation exercises',
  pedal: 'pedalling',
  rotation: 'rotation exercises',
  'backing-track': 'playing over a loop',
  chord: 'chord drills',
  'note-flash': 'note reading',
  'latin-groove': 'Latin grooves',
  tumbao: 'tumbaos',
  voicing: 'voicing exercises',
  'find-key': 'finding notes on the keyboard',
  'double-sixth': 'double sixths',
  'double-third': 'double thirds',
  'half-pedal': 'half pedalling',
  'pedal-held': 'held-pedal exercises',
  'slash-bass': 'slash-chord basses',
  stride: 'stride patterns',
  'tritone-sub': 'tritone substitutions',
  'ear-progression': 'hearing progressions',
  simon: 'Simon',
  meter: 'odd metres',
  syncopation: 'syncopation',
  'ear-interval': 'hearing intervals',
  'ear-chord': 'hearing chords',
  'call-response': 'playing back by ear',
  'ear-tune': 'playing tunes by ear',
  'extended-chord': 'extended chords',
  transposition: 'transposition',
  'harmonic-dictation': 'harmonic dictation',
  mode: 'modes',
  'roman-numeral': 'Roman numerals',
  dynamics: 'dynamics',
  'chord-scale': 'chord–scales',
  placement: 'the placement test',
  checklist: 'the posture checklist',
  walkthrough: 'the tour',
  study: 'studies',
};

function familyWords(family: ExposureFamily): string {
  if (family.by === 'earlier') return SLOT_TEXT.earlierSong;
  if (family.by === 'track') return `a ${family.title ?? family.id} piece`;
  return FAMILY_WORDS[family.id] ?? family.id.replace(/-/g, ' ');
}

/** "not shown in 4 weeks", or since the day, for longer than ten weeks: in figures, so the line's first words hold it. */
function spanWords(since: string, today: Date): string {
  const startOf = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const weeks = Math.floor(Math.round((startOf(today) - startOf(new Date(since))) / 86_400_000) / 7);
  return weeks <= 10
    ? `${SLOT_TEXT.notShown} ${String(weeks)} week${weeks === 1 ? '' : 's'}`
    : `${SLOT_TEXT.notShownSince} ${readDay(since, today).replace(/^on /, '')}`;
}

/**
 * What the lesson asks, in a line: who asked, then what has counted
 * (`rungState`). The session row is one line at the owner's width and its end
 * is cut (seen on the glass at 342 px), so the claim comes in the first words:
 * "This lesson asks for it" — the row's title is the "it" — and what has
 * counted after the dash. A track names itself, the core path is "this
 * lesson"; a project is a piece to live with, never a rung that asks.
 */
function askedWords(claim: Extract<SlotClaim, { kind: 'asked' }>): string {
  const who =
    claim.strand === undefined
      ? claim.next
        ? SLOT_TEXT.nextLesson
        : SLOT_TEXT.thisLesson
      : claim.next
        ? `${claim.strand}’s next lesson`
        : claim.strand;
  if (claim.project) return `${claim.strand ?? SLOT_TEXT.thisLesson}: ${lowerFirst(SLOT_TEXT.project)}`;
  if (claim.skill !== undefined) {
    const whose = claim.next ? (claim.strand === undefined ? 'the next lesson' : `${claim.strand}’s next lesson`) : (claim.strand ?? 'this lesson');
    return `${SLOT_TEXT.trains} ${lowerFirst(bareSkill(claim.skill))}, for ${whose}`;
  }
  const r = claim.requirement;
  // A performance is what counts where the lesson asks for one: said, or a learner playing it daily never learns why nothing counts.
  const perform = r.kind === 'runs' && r.performance === true ? `, ${SLOT_TEXT.performed}` : '';
  if (claim.need > 1) return `${who}: ${String(claim.have)} of ${String(claim.need)} ${SLOT_TEXT.counted}${perform}`;
  switch (r.kind) {
    case 'done':
      return `${who} ${SLOT_TEXT.asksFor} it — finished, nothing left undone`;
    case 'measure':
      return `${who} ${SLOT_TEXT.asksFor} it — its ${r.measure} measure met`;
    default:
      return `${who} ${SLOT_TEXT.asksFor} it${perform} — ${SLOT_TEXT.notCounted}`;
  }
}

/** A skill's name without its article, for the start of a short line: "Bass clef", "Subdivision". */
function bareSkill(id: string): string {
  return upperFirst(skillName(id).replace(/^The /, ''));
}

/**
 * The reason line for a slot (C6). `today` is the morning it is read, for
 * "last played on Tuesday". `known`: the repertoire slot's piece is one the
 * learner mastered, and only then does the line say so (L18).
 */
export function slotReason(kind: SlotKind, claim: SlotClaim | undefined, today: Date, options: { known?: boolean } = {}): string {
  if (kind === 'free' || claim === undefined) return SLOT_TEXT.free;
  const nothingDue = (rest: string): string => (kind === 'review' ? `${SLOT_TEXT.nothingDue} — ${lowerFirst(rest)}` : rest);
  const line = ((): string => {
    switch (claim.kind) {
      case 'asked':
        if (kind === 'new' && claim.next) {
          // The row's title is the item; the next lesson's own title would be cut, so the line says why it is early.
          const up = claim.strand === undefined ? SLOT_TEXT.nextUp : `${SLOT_TEXT.nextUp} in ${claim.strand}`;
          return claim.waitsForReads ? `${up} — ${SLOT_TEXT.waitsForReads}` : up;
        }
        return askedWords(claim);
      case 'skill-retention':
        return `${bareSkill(claim.skill)}: ${spanWords(claim.lastShown, today)}`;
      case 'piece-retention':
        return `${SLOT_TEXT.keepPlayable} — ${SLOT_TEXT.lastPlayed} ${readDay(claim.lastPlayed, today)}`;
      case 'ready':
        return `${SLOT_TEXT.readyWith} ${demandName(claim.demand)} — ${SLOT_TEXT.readySupported}`;
      case 'rung': {
        // The rung waits on the learner's pause (G1e): said as such, whatever the slot, with where the row is from.
        if (claim.held === true) {
          return claim.strand === undefined
            ? `${SLOT_TEXT.thisLesson} ${SLOT_TEXT.heldByPause} — ${SLOT_TEXT.moreFromThisLesson}`
            : `${claim.strand} ${SLOT_TEXT.heldByPause} — more from ${claim.strand}`;
        }
        // "this lesson" is the core path's; a track's own rung is named by its track.
        if (claim.strand !== undefined) {
          if (kind === 'review') return `${SLOT_TEXT.nothingDue} — more from ${claim.strand}`;
          return kind === 'repertoire' ? `More music from ${claim.strand}` : kind === 'new' ? `More from ${claim.strand}` : `From ${claim.strand}`;
        }
        if (kind === 'review') return `${SLOT_TEXT.nothingDue} — ${SLOT_TEXT.moreFromThisLesson}`;
        if (kind === 'repertoire') return SLOT_TEXT.moreMusic;
        return kind === 'new' ? upperFirst(SLOT_TEXT.moreFromThisLesson) : SLOT_TEXT.fromThisLesson;
      }
      case 'skill':
        return nothingDue(`${SLOT_TEXT.trains} ${lowerFirst(skillName(claim.skill))}, ${SLOT_TEXT.whichAsked}`);
      case 'demand':
        return nothingDue(`${SLOT_TEXT.has} ${demandName(claim.demand)}, ${SLOT_TEXT.whichAsked}`);
      case 'prerequisite':
        return nothingDue(`From ${claim.rung.title}, ${SLOT_TEXT.whichBuildsOn}`);
      case 'exposure': {
        // The family first, in its own words (a proper name — Simon, Hanon, Latin — keeps its capital),
        // then when; the same line in the warm-up and in a review with nothing due.
        const words = familyWords(claim.family);
        if (claim.family.by !== 'kind') {
          const since = claim.lastPlayed === undefined ? SLOT_TEXT.nonePlayedYet : `${SLOT_TEXT.nonePlayedSince} ${readDay(claim.lastPlayed, today).replace(/^on /, '')}`;
          return `${SLOT_TEXT.forVariety}: ${words} — ${since}`;
        }
        if (claim.lastPlayed === undefined) return `${upperFirst(words)}, ${SLOT_TEXT.fromLessonsSoFar} — ${SLOT_TEXT.notPlayedYet}`;
        const yours = words.startsWith('the ') ? words : `your ${words}`;
        return `Keeping ${yours} warm — ${SLOT_TEXT.lastPlayed} ${readDay(claim.lastPlayed, today)}`;
      }
      case 'jam':
        // Only chord-and-feel material is promised as such (G61); anything else says where it is from.
        return claim.plain === true ? `From ${claim.rung.title}` : `${SLOT_TEXT.jam}: from ${claim.rung.title}`;
      case 'transfer':
        // The skill first, where the line is cut; an invitation, never a test (D4).
        return `${bareSkill(claim.skill)}: ${SLOT_TEXT.somethingNew} — ${SLOT_TEXT.feelDifferent}`;
    }
  })();
  return kind === 'repertoire' && options.known === true ? `${SLOT_TEXT.pieceYouKnow} — ${lowerFirst(line)}` : line;
}

/**
 * The swap sheet's words for a tier (C6 item 6): printed once over the options
 * that came from it, stating the strongest fact known (Part 23; E0). The skill and
 * demand tiers passed the one gate (`eligibility.ts`): the option provides the
 * skill's or the demand's opportunity at a useful density, and every other demand
 * it measures is one the learner has met — in the lessons up to their rung, or in
 * their own evidence. Never "similar difficulty" from a level, never "practises X"
 * because X occurs somewhere in the file.
 */
export function swapTierWords(tier: AlternativeTier | 'kind', shared?: string): string {
  switch (tier) {
    case 'lesson':
      return 'From the same lesson';
    case 'alternative':
      return 'Named as a stand-in for it';
    case 'skill':
      return `Also trains ${shared === undefined ? 'the same skill' : lowerFirst(skillName(shared))}, with the other demands you have met`;
    case 'demand':
      // The demand's name with its article ("the key signature", "the moving left hand", "skips").
      return `Also practises ${shared === undefined ? 'the same demand' : (DEMAND_WORDS[shared]?.name ?? shared)}, with the other demands you have met`;
    case 'kind':
      return 'The same kind, from your lessons so far';
  }
}

/** A swapped row's reason: the learner's choice, and the claim the option had. */
export function swapChoiceWords(tier: AlternativeTier | 'kind'): string {
  const why: Record<AlternativeTier | 'kind', string> = {
    lesson: 'from the same lesson',
    alternative: 'a stand-in for the one offered',
    skill: 'it also trains the same skill',
    demand: 'it also practises the same demand',
    kind: 'the same kind, from your lessons so far',
  };
  return `${SLOT_TEXT.chose} — ${why[tier]}`;
}

/**
 * Every drill kind, in the learner's words.
 *
 * Exhaustive by type: a `DrillKind` added without a row here does not compile,
 * which is the same guard `STAFF_POLICY` uses one file over.
 *
 * `now` is what the card says before it has asked anything. Once a card is up,
 * the screen's own `howText` says how to answer *this* card — how many notes,
 * in what order — and the strip follows it, because a count that changes per
 * card cannot live in a table.
 */
export const DRILL_HELP: Readonly<Record<DrillKind, HelpEntry>> = {
  'note-flash': {
    title: 'Note flash',
    what: 'A note on the staff, one at a time, for you to play on the piano.',
    now: 'Play the note that is on the staff, in any octave.',
    counts: 'Your score is the share of cards you get right. Asking to be shown the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the answer on the keys. This card then does not count as right.' },
      { name: 'Skip', does: 'Leaves this card unanswered and brings the next one.' },
      { name: 'End drill', does: 'Stops here. Nothing is recorded unless you keep it.' },
    ],
    elsewhere: 'Find the key is the same fact the other way round: a name to find on the keyboard. Both are on the Skills screen under reading.',
  },
  'find-key': {
    title: 'Find the key',
    what: 'A note name, for you to find on the piano without counting up from a landmark.',
    now: 'Press that key, on the piano or on the keys below.',
    counts: 'Your score is the share of cards you get right. Asking to be shown the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the key. This card then does not count as right.' },
      { name: 'Skip', does: 'Leaves this card and brings the next.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Note flash is the same fact read off the staff instead. Both sit on the reading skill in Skills review.',
  },
  chord: {
    title: 'Chord drill',
    what: 'A chord named in words — C major, A minor — for you to play.',
    now: 'Play all the notes of the chord together, in any octave.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the notes on the keys and writes them on a small staff. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays the chord. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The inversion drill asks for the same chord with a different note at the bottom; Chords with more notes add a fourth. Every chord card shows you the chord on a staff once it is judged.',
  },
  inversion: {
    title: 'Inversion drill',
    what: 'The same chord with a different note at the bottom — first, second or root position.',
    now: 'Play the three notes together, with the one it names at the bottom.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the shape on the keys. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays it. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The chord drill is the same chords in root position. Inversions are what let one hand move between chords without jumping.',
  },
  'ear-interval': {
    title: 'Ear drill — intervals',
    what: 'Two notes played to you, for you to play back — the gap between them is what is being trained.',
    now: 'Listen, then play the two notes back.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being played the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays it again, as often as you like. It costs nothing.' },
      { name: 'Hear it', does: 'Plays the answer. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The chord and progression ear drills are the same ear on more notes at once. Simon is the one with nothing to choose between.',
  },
  'ear-chord': {
    title: 'Ear drill — chords',
    what: 'A chord played to you, for you to play back.',
    now: 'Listen, then play the chord back.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being played the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays it again, as often as you like.' },
      { name: 'Hear it', does: 'Plays the answer. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The chord appears on a staff as soon as it is judged, right or wrong, so you can see what you heard. The progression ear drill strings several together.',
  },
  'ear-progression': {
    title: 'Ear drill — progressions',
    what: 'A few chords in a row played to you, for you to play back in order.',
    now: 'Listen, then play the chords back in the order you heard them.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being played the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays the whole progression again.' },
      { name: 'Hear it', does: 'Plays the answer. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It is written out on a staff once judged, one chord to the bar. Roman numerals is the same progression named rather than played.',
  },
  rhythm: {
    title: 'Rhythm drill',
    what: 'A written rhythm, for you to tap against the click on any key at all.',
    now: 'Tap the rhythm on any key. Your first tap starts it.',
    counts: 'Your score is how close your taps were to the written rhythm. Which key you tap does not matter.',
    controls: [
      { name: 'Done', does: 'Ends this card when you have finished tapping it.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Rhythm only, on the Score screen, is the same idea over a real piece. Nothing here looks at which key you tap.',
  },
  pedal: {
    title: 'Pedal-change drill',
    what: 'Chords to play with the sustain pedal, changing it cleanly between them.',
    now: 'Play the first chord and put the pedal down. Changes are marked from the second chord on.',
    counts: 'Your score is the share of changes that were clean. It needs a pedal on a piano over its cable.',
    controls: [
      { name: 'Next', does: 'Moves to the next change when you are ready.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It needs a pedal on a piano over its cable: the screen keys cannot send one. Half pedal is measured where the pedal sends more than off and on.',
  },
  dynamics: {
    title: 'Dynamics drill',
    what: 'A phrase to play softly and then loudly, with the difference measured.',
    now: 'Play the phrase at the volume it asks for.',
    counts: 'Your score is how far apart the loud and the soft were, against what the card asked for.',
    controls: [
      { name: 'Next', does: 'Moves on when you have played it.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It needs a piano over its cable: every note from the screen keys arrives at the same volume, and the card says so rather than marking you down.',
  },
  'call-response': {
    title: 'Play it back',
    what: 'A short phrase played to you, for you to play back by ear.',
    now: 'Listen, then play it back.',
    counts: 'Your score is the share of phrases you play back right. Asking to be shown the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Repeats it, as often as you like.' },
      { name: 'Show me', does: 'Lights the notes on the keys. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The five-finger and accompaniment patterns are built this way too. Simon is the same thing growing a note at a time.',
  },
  'backing-track': {
    title: 'Backing track',
    what: 'A bass-and-drums loop to play over. Nothing you play is marked right or wrong.',
    now: 'Play over the loop. Nothing here is judged.',
    counts: 'Nothing here is counted: it is a loop to play over.',
    controls: [
      { name: 'Done', does: 'Ends the card when you have had enough.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The Accompaniment lab is the same idea with every setting in your hands — key, chords, both hands, tempo.',
  },
  mode: {
    title: 'Modes',
    what: 'A mode named — D dorian, G mixolydian — for you to play up the keyboard.',
    now: 'Play its notes from the bottom up, one at a time, at any speed.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the notes in order. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays it up. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Chord–scale asks for the same scales from a chord instead of by name. Both belong to the improvising tracks.',
  },
  'chord-scale': {
    title: 'Chord–scale',
    what: 'A chord, for you to play the scale that goes over it.',
    now: 'Play the scale that fits the chord, from the bottom up.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the scale. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays it. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Modes is the same scales asked for by name. This is the one you use while somebody else is playing the chord.',
  },
  'extended-chord': {
    title: 'Chords with more notes',
    what: 'Chords of four notes — sevenths and ninths — named for you to play.',
    now: 'Play every note of the chord together, in any octave.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights all four notes. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays the chord. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'The chord drill is the three-note version. The chord is written on a staff as soon as it is judged, which is the quickest way to learn how one looks.',
  },
  'harmonic-dictation': {
    title: 'Harmonic dictation',
    what: 'A progression played to you, for you to play back as chords.',
    now: 'Listen, then play the progression back as chords.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being played the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays the progression again.' },
      { name: 'Hear it', does: 'Plays the answer. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It is written out on a staff once judged, one chord to the bar with its numeral above. Roman numerals asks for the same thing from the page instead of the ear.',
  },
  transposition: {
    title: 'Transposition',
    what: 'A phrase written in one key, for you to play in another.',
    now: 'Play the phrase in the key it names, reading from the notation.',
    counts: 'Your score is the share of cards you get right. Asking to be shown the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the notes in the new key. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'It is the reading drills and the chord drills used together, which is why it comes late in a track.',
  },
  'roman-numeral': {
    title: 'Roman numerals',
    what: 'A chord written as a numeral — I, vi, V7 — for you to play in the key given.',
    now: 'Play the chord the numeral names, in the key at the top of the card.',
    counts: 'Your score is the share of cards you get right. Asking to be shown or played the answer costs that card.',
    controls: [
      { name: 'Show me', does: 'Lights the chord. The card then does not count as right.' },
      { name: 'Hear it', does: 'Plays it. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Numerals are how the Accompaniment lab and the chord charts name chords, so this is the drill that makes both readable.',
  },
  'ear-tune': {
    title: 'Play back a tune',
    what: 'A short tune played to you, for you to find by ear.',
    now: 'Listen, then play the tune back.',
    counts: 'Your score is the share of cards you get right. Playing it again costs nothing; being shown the answer costs that card.',
    controls: [
      { name: '▶ Play again', does: 'Plays it again, as often as you like.' },
      { name: 'Show me', does: 'Lights the notes. The card then does not count as right.' },
      { name: 'End drill', does: 'Stops here.' },
    ],
    elsewhere: 'Play it back is the same ear on a phrase with no tune to recognise. Simon is the one that grows until you lose it.',
  },
  simon: {
    title: 'Simon',
    what: 'One note, then that note and one more, then three — a chain that grows until you break it.',
    now: 'Listen to the chain, then play it back in the octave you heard it.',
    counts: 'Your score is the longest chain you echoed. How much help you take does not change it.',
    controls: [
      { name: 'Keys shown / After a miss / Ear only', does: 'How much help the game gives. None of them changes the score.' },
      { name: 'End drill', does: 'Stops here. The score is the longest chain you echoed.' },
    ],
    elsewhere: 'Every other ear drill hands you a small set to choose between. This one asks you to have held what you heard, which is what playing by ear is.',
  },
};

/** The practising tools with a route of their own. */
export const TOOL_HELP: Readonly<Record<ToolKey, HelpEntry>> = {
  lab: {
    title: 'Accompaniment lab',
    what: 'A backing you write yourself: a key, some chords, a shape for each hand, and a tempo.',
    now: 'Pick a style to start from, then Read it or Jam it.',
    counts: 'Nothing in the lab is counted or recorded.',
    controls: [
      { name: 'Read it', does: 'Writes the settings out as a score and opens it on the Score screen.' },
      { name: 'Jam it', does: 'Plays them as a loop you can play over. Nothing is judged.' },
      { name: 'What the app plays', does: 'How much of it the app takes: the bed only, the chords, the tune, or turns with you.' },
    ],
    elsewhere: 'It is in the Library, beside Import a score and Score folder. The Play over the loop drill is the same idea with the settings already chosen.',
  },
  chart: {
    title: 'Chord chart',
    what: 'The same piece as a lead sheet: one big chord symbol a bar, a tracker that moves through the form, and a count-off.',
    now: 'Press Count off and play from the chords.',
    counts: 'Nothing here is counted: there is no right or wrong to mark.',
    controls: [
      { name: 'Count off ▶', does: 'Counts you in and starts the tracker. Pressing it again goes back to bar 1.' },
      { name: 'Bass + drums', does: 'Plays a rhythm section under you, or leaves you the room.' },
    ],
    elsewhere: 'For playing from the chords rather than reading the notes. The same piece opens on the Score screen from its row in the Library.',
  },
  play: {
    title: 'Free play',
    what: 'An empty screen that names what you are holding. Nothing is scored, counted or recorded.',
    now: 'Play anything. It names the chord under your hands.',
    counts: 'Nothing is counted or recorded.',
    controls: [
      { name: 'The keys', does: 'Work with no piano connected, so this is also how to try the app out.' },
    ],
    elsewhere: 'It is one of the doors on Today, beside the Metronome and the Accompaniment lab. Free play on a piece is the same idea with a page to turn.',
  },
  metronome: {
    title: 'Metronome',
    what: 'A click, on its own, with the first beat of each bar accented.',
    now: 'Set a speed and start it, or tap a few beats to set the speed by hand.',
    counts: 'Nothing is counted: it is a click and nothing else.',
    controls: [
      { name: 'Tap tempo', does: 'Takes the speed from four taps rather than a number.' },
      { name: 'Metronome sound', does: 'Use High when the microphone is listening: it sits above every piano note, so the detector can filter it out.' },
    ],
    elsewhere: 'Every practising screen has a click of its own, so this is for playing away from the app — scales, or a piece on paper.',
  },
  paper: {
    title: 'Practise from the book',
    what: 'A timer, a click and a count of what the app hears, for music it cannot see.',
    now: 'Open the book at the page, press play, and play. Nothing here says whether the notes were right.',
    counts: 'Minutes, notes heard and steadiness are recorded; whether the notes were right is your own verdict at the end.',
    controls: [
      { name: 'Play', does: 'Starts the click and the counting.' },
      { name: 'Rough · OK · Clean', does: 'Your own verdict at the end. It is the only judgement of the notes there is.' },
    ],
    elsewhere: 'It comes from a piece on your Shelf. If the same piece is in the app, link it as a twin and it can be played and scored properly.',
  },
  pdf: {
    title: 'PDF viewer',
    what: 'A bought score shown one line at a time, full width, so it is readable on a phone.',
    now: 'Tap the right half of the page for the next line, the left half to go back.',
    counts: 'Nothing here can be counted: a PDF is pages and not notes.',
    controls: [
      { name: 'Timed', does: 'Turns the lines on its own, learning the pace from your last two taps.' },
      { name: 'Adjust cuts', does: 'Drag the lines if the viewer split a page in the wrong place. The correction is kept with the score.' },
    ],
    elsewhere: 'A PDF is pages and not notes, so nothing in it can be listened to or scored. To have the app follow it, turn it into MusicXML on a computer and import that.',
  },
};

/** Every key this table answers. */
export type HelpKey = `mode:${ScoreMode}` | `drill:${DrillKind}` | `tool:${ToolKey}`;

/**
 * The entry for one key, or `undefined`.
 *
 * A lookup rather than a throw: a blank strip is a better failure inside a
 * render than an exception that takes the screen with it, and the keys are
 * typed, so a wrong one does not compile.
 */
export function help(key: HelpKey): HelpEntry | undefined {
  const [family, rest] = splitKey(key);
  if (family === 'mode') return MODE_HELP[rest as ScoreMode];
  if (family === 'drill') return DRILL_HELP[rest as DrillKind];
  if (family === 'tool') return TOOL_HELP[rest as ToolKey];
  return undefined;
}

function splitKey(key: string): [string, string] {
  const at = key.indexOf(':');
  return at === -1 ? [key, ''] : [key.slice(0, at), key.slice(at + 1)];
}

/**
 * What a drill's own extra measurements are called, in words.
 *
 * `DrillResult.detail` is a bag of numbers each kind fills with what it
 * measured, and the summary sheet used to print the field names with the
 * capitals turned into spaces: *boundary ms*, *soft velocity*, *flat
 * velocity*, *count in beats*. That is the code's own word for the thing shown
 * to a learner, which `00-invariants` §1 rules out and which the owner
 * (2026-09-22) called weird and unhelpful. So the names are said here, once.
 *
 * A key with no row falls back to the old spacing rather than disappearing: a
 * new measurement should show up unlabelled and be fixed, not be silently
 * dropped from the sheet.
 */
export const DRILL_DETAIL_LABEL: Readonly<Record<string, string>> = {
  boundaryMs: 'Time allowed per chord',
  chordsHeard: 'Chords you played',
  chordsExpected: 'Chords asked for',
  extraTaps: 'Taps too many',
  meanOffsetMs: 'Average distance from the beat',
  bpm: 'Beats per minute',
  countInBeats: 'Count-in beats',
  cleanChanges: 'Clean pedal changes',
  scoredChanges: 'Pedal changes marked',
  // The exercise's range, not readings the player sent (F0, T51).
  halfPedalLow: 'Part way counts from',
  halfPedalHigh: 'Part way counts up to',
  pedalMessages: 'Pedal readings in all',
  heldMessages: 'Readings with the pedal down',
  inRange: 'Readings inside that range',
  softVelocity: 'How hard the soft notes were played',
  loudVelocity: 'How hard the loud notes were played',
  ratio: 'Loud against soft',
  targetRatio: 'Loud against soft, asked for',
  flatVelocity: 'Every note the same volume',
  partialPedalMessages: 'Readings neither fully up nor fully down',
  binaryPedal: 'This pedal only sends down and up',
  longestChain: 'Longest chain',
  notesPlayed: 'Notes played',
};

/** The words for one of a drill's extra measurements. */
export function drillDetailLabel(key: string): string {
  return DRILL_DETAIL_LABEL[key] ?? key.replace(/([A-Z])/g, ' $1').toLowerCase();
}

// --- an import, in the learner's words (X3; E21, U72, U75) ------------------------------------

/**
 * Whose a fact about an import is, as the store holds it (`Provenance.facts`): `inferred` is the
 * app's guess, `authored` is the file's — or the learner's, where the provenance names the learner
 * as its source (the store's own reading, `importStore.withMeasurement`; the reviewer's rule for a
 * stated tempo, `responses/ef80e86.md`: `authored`, with the learner in `via`). A fact the row does
 * not carry is not recorded. Never promoted: a guess is never said as the file's.
 */
export type Whose = 'guess' | 'file' | 'yours' | 'unknown';

export function whoseFact(fact: Provenance['facts'][string] | undefined): Whose {
  if (!fact) return 'unknown';
  if (fact.kind === 'inferred') return 'guess';
  if (fact.kind === 'authored') return /learner/.test(fact.via ?? '') ? 'yours' : 'file';
  return 'unknown';
}

const MAJOR_BY_FIFTHS = ['C♭', 'G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯'];
const MINOR_BY_FIFTHS = ['A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯'];
const SIGNATURE_COUNTS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];

/**
 * The key signature a score printed: "one sharp", "no sharps or flats" — and the key's name only
 * where the file states its mode ("E minor: one sharp"). A signature alone does not say whether a
 * piece is in G major or E minor, so the name is never guessed from it (nothing taught wrong).
 */
export function signatureWords(fifths: number, mode?: string): string {
  const count = Math.abs(fifths);
  const signature =
    count === 0 ? 'no sharps or flats' : `${SIGNATURE_COUNTS[count] ?? String(count)} ${fifths > 0 ? 'sharp' : 'flat'}${count === 1 ? '' : 's'}`;
  const names = mode === 'major' ? MAJOR_BY_FIFTHS : mode === 'minor' ? MINOR_BY_FIFTHS : undefined;
  const name = names?.[fifths + 7];
  return name && mode ? `${name} ${mode}: ${signature}` : signature;
}

/**
 * A tempo as the score carries it (X3c; the fractional policy the X3b review asked for,
 * `responses/f9d36867.md`): to the store's own three places (`importStore.round3`), so 72.5 is 72.5, and
 * where the file carries more than that — a MIDI file's microseconds a beat, 90.00009000009 — the whole
 * beat, marked as not exact. Never a whole number the score does not carry. `exact` false marks the
 * second; `figure` is the number said, and the one the tempo field starts at.
 */
export function tempoFigure(bpm: number): { figure: number; exact: boolean } {
  const three = Math.round(bpm * 1000) / 1000;
  return Math.abs(three - bpm) < 1e-9 ? { figure: three, exact: true } : { figure: Math.round(bpm), exact: false };
}

/** A tempo in words (`tempoFigure`): "72.5", or "about 90" where the file carries more than three places. */
export function tempoNumber(bpm: number): string {
  const { figure, exact } = tempoFigure(bpm);
  return exact ? String(figure) : `about ${String(figure)}`;
}

/**
 * The import sheet's words and the Library's for an import (X3; E21, U72, U75): one table, so the
 * sheet, the row and `04` §4 say one thing. What the app read from the file, what it guessed, whose
 * each fact is (`whoseFact`), and what a learner can do about a piece the catalogue wants and does
 * not bundle. Nothing here says "approved" or "counts": an import is the learner's own material,
 * measured, and it goes where they put it (T52's sentence on the assign sheet's body says what a
 * rung does with it).
 */
export const IMPORT_TEXT = {
  read: 'What the app read',
  guessed: 'What the app guessed',
  notes: 'What the notes ask',
  belongs: 'Where does it belong?',
  /** The sheet's lead line: the learner's own material, measured, never graded or placed for them. */
  own: 'Your own score. The app measures what its notes ask and does not grade the piece; where it belongs is yours to choose.',
  ownPdf: 'Your own PDF. The app shows its pages and reads no notes from it; where it belongs is yours to choose.',
  composer: 'Composer',
  length: 'Length',
  signature: 'Key signature',
  bars: (count: number): string => (count === 1 ? '1 bar' : `${String(count)} bars`),
  pdfRead: 'A PDF: pages, not notes — the app reads no notes from it.',
  pdfGuessed: 'Nothing about the notes: the app reads none from a PDF.',
  /** Whose a fact is, beside it. */
  whose: { guess: 'the app’s guess', file: 'from the file', yours: 'yours', unknown: 'not recorded' } satisfies Record<Whose, string>,
  hands: 'Hands',
  handsSplit: 'Split by the shape of the lines, not at a fixed middle C.',
  handsTracks: 'The file’s own two tracks, kept as recorded: the first is the upper staff.',
  handsStaves: 'The file’s own staves.',
  handsStamped: 'Written by the command-line converter from a MIDI file, which does not say whether it kept the tracks or split one line.',
  handsYours: 'You corrected them, and the notes were measured again on your score.',
  handsUnknown: 'Not recorded: imported before the app kept track of whose the hands are.',
  tempo: 'Tempo',
  /*
   * The tempo line's words. Every number is a tempo as the score carries it (`tempoNumber`), in quarter
   * notes a minute — "♩ =" — unless a printed mark's own note is named beside it (X3c).
   */
  tempoFile: (bpm: number): string => `The file says ♩ = ${tempoNumber(bpm)}.`,
  /** The first bar's printed mark counts another note (X3c): the mark as printed, then the tempo the score opens at. */
  tempoFileMark: (mark: string, bpm: number): string => `The file says ${mark} (${tempoNumber(bpm)} quarter notes a minute).`,
  /** The printed mark and the tempo the file plays at disagree (X3c): each said apart, never as a conversion. */
  tempoFileApart: (mark: string, bpm: number): string => `The file prints ${mark}; its playback tempo is ${tempoNumber(bpm)} quarter notes a minute.`,
  /** A printed mark in the first bar with no playback tempo there (X3c): the mark alone. */
  tempoFileMarkOnly: (mark: string): string => `The file says ${mark}.`,
  /** A tempo the file writes only after its first bar (X3c): never said as the opening. */
  tempoFileLater: 'The file writes no tempo at its opening, only later in the piece.',
  /** A metronome mark the door read from the file's text (E32): as the file printed it, then as the app read it. */
  tempoTextMark: (text: string, bpm: number): string => `The file’s mark says “${text}”; the app reads it as ${tempoNumber(bpm)} quarter notes a minute.`,
  /** The same, where the mark printed no note and the app read the metre's beat (E32). */
  tempoTextMarkNoNote: (text: string, unit: string, bpm: number): string =>
    `The file’s mark says “${text}”, with no note; the app reads it as a ${unit} note, the metre’s beat: ${tempoNumber(bpm)} quarter notes a minute.`,
  tempoChosen: (bpm: number): string => `The file states no tempo, so the app chose ♩ = ${tempoNumber(bpm)}.`,
  tempoYours: (bpm: number | undefined): string => (bpm === undefined ? 'You stated it.' : `You stated ♩ = ${tempoNumber(bpm)}.`),
  /** A printed metronome mark (X3c): its note, a dot for each dot, "=", its number — a half note "= 60", "♩. = 60". */
  tempoMark: (note: string, dots: number, perMinute: number): string => `${note}${'.'.repeat(dots)} = ${tempoNumber(perMinute)}`,
  /**
   * The note symbol for each `<beat-unit>` the sheet prints (X3c): the Unicode symbols `textGlyphs.ts` maps
   * SMuFL's metronome notes to, so a mark from a `<metronome>` and a mark read from text look alike.
   */
  noteSymbols: { whole: '\u{1D15D}', half: '\u{1D15E}', quarter: '♩', eighth: '♪', '16th': '\u{1D161}' },
  /**
   * The learner's tempo, on the tempo line of every MusicXML import — the app's guess, the file's, or one
   * the learner already stated (X3a, X3b; E48): the field's label, in the line's own notation, and the
   * button. A tempo the store refuses is said in the store's words (`stateImportTempo`); `tempoFailed`
   * only where the store saved nothing and said no reason.
   */
  tempoField: '♩ =',
  tempoUse: 'Use this tempo',
  tempoFailed: 'The tempo could not be saved; the score is as it was.',
  key: 'Key',
  keyEstimated: (signature: string): string => `Estimated from the notes; the app printed ${signature}.`,
  keyStamped: 'The command-line converter may have estimated it from the notes; the file does not say.',
  swap: 'Swap the hands',
  swapHint: 'If the upper staff is really the left hand’s, this gives each staff’s notes to the other hand. Each staff keeps its clef.',
  swapping: 'Swapping…',
  swapped: 'Swapped: the hands are yours now, and the notes were measured again.',
  swapFailed: 'The hands could not be swapped; the score is as it was.',
  swapOneStaff: 'One staff: there is no other hand to swap with.',
  swapParts: 'The file writes its hands as separate parts; the app swaps only a piano’s two staves.',
  swapUnmarked: 'The file does not say which staff every note is on, so the app cannot swap them.',
  /** U72: the conversion note once the learner has corrected the hands. */
  conversionHandsYours: 'You corrected the hands after the conversion, so what the converter decided about them no longer stands: the hands are yours.',
  /** Where an import's notes came from, on its Library row's detail line (`importSourceWords`). */
  source: { file: 'read from the file', midi: 'converted from MIDI' },
  /**
   * The Library row's state, a token each (`importStateWords`). *Tempo guessed*, not "tempo not
   * stated": the sheet's word for the same fact (`whose.guess`), and short enough that the line is
   * whole at 342 px.
   */
  state: {
    handsCorrected: 'hands corrected',
    handsGuessed: 'hands guessed',
    measured: 'measured',
    notYet: 'not measured yet',
    notMeasurable: 'could not be measured',
    tempoGuessed: 'tempo guessed',
    tempoYours: 'tempo yours',
  },
  /** The placeholder sheet for a piece the catalogue wants and does not bundle (U75). */
  wanted: 'Import your own copy; the app reads MusicXML, MXL and MIDI.',
  formats: 'The app reads MusicXML, MXL and MIDI; a PDF opens as pages.',
  importButton: 'Import a score',
} as const;

/**
 * Where an import's notes came from, for its Library row's detail line in place of the type every
 * import shares ("song"): converted from MIDI — by the app, or by the command-line converter whose
 * stamp the file carries — or read from the file. `''` where the row does not say (a PDF, whose
 * badge does; a row imported before the app kept provenance).
 */
export function importSourceWords(row: { kind?: string; provenance?: Provenance }): string {
  if (row.kind === 'pdf' || !row.provenance) return '';
  const converted = row.provenance.source === 'imported-midi' || row.provenance.converter !== undefined;
  return converted ? IMPORT_TEXT.source.midi : IMPORT_TEXT.source.file;
}

/**
 * One line of an import's state for its Library row, in the words above: whose the hands are where
 * they are not the file's, whether the app has measured it, and the tempo where the file states
 * none. From the row's provenance, the facts the import sheet renders; `''` for a PDF, whose badge
 * already says what it is.
 */
export function importStateWords(row: { kind?: string; demands?: unknown; measurement?: Measurement; provenance?: Provenance }): string {
  if (row.kind === 'pdf') return '';
  const words = IMPORT_TEXT.state;
  const facts = row.provenance?.facts;
  const tokens: string[] = [];
  const hands = whoseFact(facts?.hands);
  if (hands === 'yours') tokens.push(words.handsCorrected);
  else if (hands === 'guess') tokens.push(words.handsGuessed);
  if (row.measurement === undefined || row.demands === undefined) tokens.push(words.notYet);
  else tokens.push(row.measurement.status === 'measured' && Array.isArray(row.demands) ? words.measured : words.notMeasurable);
  const tempo = whoseFact(facts?.tempo);
  if (tempo === 'yours') tokens.push(words.tempoYours);
  else if (tempo === 'guess') tokens.push(words.tempoGuessed);
  return tokens.join(' · ');
}
