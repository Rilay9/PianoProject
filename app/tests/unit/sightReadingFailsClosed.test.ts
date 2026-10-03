/**
 * Version 2 never hands back a phrase it did not check (D1a; the reviewer's
 * finding 1 on D1, `docs/review/responses/b15758e.md`).
 *
 * D1's `compose` overwrote the hands on every draw and, when no draw in the
 * budget kept every promise and the hard layer, left the last draw standing —
 * "as in version 1" — so a phrase that broke a promise the row asked for, or a
 * rule the level sets, could reach the learner. The policy decided for D1a:
 * **continue, then refuse.** The search keeps drawing within the redraw budget
 * (`PROMISE_ATTEMPTS`), scores only valid draws, and keeps the best of the
 * first window that yields one — the window opens at the first valid draw, so
 * a valid draw found late moves it; if the whole budget yields none, it throws
 * `SightReadingRefusal` with sentences a caller can show, never a phrase.
 *
 * Each phrase that comes back is checked here from its page (the MusicXML read
 * back), not from the generator's own account: the hard layer by
 * `hardViolations`, the promises by counting them on the written notes. So a
 * red run on D1's `compose` names the rule its last draw broke.
 *
 * Two of the cases use the test seam (`sightReadingReportWithin`): in D1a's
 * sweep (every level, hand and metre, each control on and off, six seeds each)
 * every phrase found a valid draw, and version 2's walk broke no hard rule in
 * a draw that kept its promises, so without the seam a test reaches the
 * zero-valid path only through options that contradict themselves (the first
 * case). Nothing here is heard.
 */
import { describe, expect, it } from 'vitest';
import {
  CANDIDATE_WINDOW,
  generateSightReading,
  phraseRules,
  SightReadingRefusal,
  sightReadingReport,
  sightReadingReportWithin,
  unrealisable,
  type SightReadingOptions,
} from '../../src/engine/sightReading';
import { hardViolations, sounded } from '../../src/engine/sightReadingScore';
import { DIVISIONS } from '../../src/engine/musicXmlWriter';
import { phraseFromXml, readWritten } from './helpers/sightReadingPage';

type Promised = 'skips' | 'eighths' | 'accidentals' | 'ties' | 'dottedQuarters' | 'leaps';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

/**
 * What a phrase handed back breaks, read from its page: every hard violation,
 * and every promise asked with nothing on the page to keep it. Empty for a
 * phrase version 2 checked.
 */
function brokenOnThePage(xml: string, options: SightReadingOptions, promised: readonly Promised[], maxLeap?: number): string[] {
  const rules = phraseRules(options);
  const cap = maxLeap ?? rules.maxLeap;
  const leftHandMelody = options.hands === 'L' && options.level === 1;
  const model = phraseFromXml(xml, { level: options.level, maxLeap: cap, restsAllowed: rules.restsAllowed, leftHandMelody });
  // The cap reaches the check on the model (`phraseModel`'s `maxLeap`).
  const out = hardViolations(model, rules);
  const page = readWritten(xml);
  const melody = (leftHandMelody ? page.lines[1] : page.lines[0]).flat().filter((note) => note.chord !== true);
  const moves = sounded(model)
    .slice(1)
    .map((event, i) => Math.abs(event.step - (sounded(model)[i]?.step ?? event.step)));
  const tonic = (((page.fifths * 7) % 12) + 12) % 12;
  const compound = page.metre.beatType === 8 && page.metre.beats % 3 === 0;
  const found: Record<Promised, boolean> = {
    skips: moves.includes(2) && moves.includes(1),
    leaps: moves.some((size) => size >= 3),
    eighths: melody.some((note) => note.midi !== null && note.duration === DIVISIONS / 2 && note.tuplet !== true),
    ties: melody.some((note) => note.tie === 'start' || note.tie === 'both'),
    dottedQuarters: !compound && melody.some((note) => note.midi !== null && note.duration === DIVISIONS * 1.5),
    accidentals: melody.some((note) => note.midi !== null && !MAJOR.includes((((note.midi - tonic) % 12) + 12) % 12)),
  };
  for (const promise of promised) if (!found[promise]) out.push(`promised ${promise}: none on the page`);
  return out;
}

/** What a call gave: a phrase, or what it threw. */
function attempt<T>(write: () => T): { phrase?: T; thrown?: unknown } {
  try {
    return { phrase: write() };
  } catch (thrown) {
    return { thrown };
  }
}

/** Level 2's right hand held to steps and promised a leap: no draw can keep both (`unrealisable` says so). */
const CONTRADICTION: SightReadingOptions = { level: 2, hands: 'R', bars: 4, skips: false, leaps: true, seed: 20260927, version: 2 };

/**
 * The rarest recipe found in D1a's probe: 2.5's right-hand row in G, promised
 * an accidental (C sharp, at the bottom of level 2's range), ties, dotted
 * quarters, skips and eighths. At this seed the first draw that keeps them all
 * is draw 187, after a first window's worth of draws.
 */
const RARE: SightReadingOptions = {
  level: 2,
  hands: 'R',
  bars: 4,
  fifths: 1,
  ties: true,
  dottedQuarters: true,
  skips: true,
  eighths: true,
  accidentals: true,
  seed: 15839,
  version: 2,
};
const RARE_PROMISES: Promised[] = ['ties', 'dottedQuarters', 'skips', 'eighths', 'accidentals'];

describe('version 2 fails closed: a phrase it did not check never comes back', () => {
  it('a promise no draw can keep: refused with the reason, and the same refusal every time', () => {
    const outcome = attempt(() => generateSightReading(CONTRADICTION));
    if (outcome.phrase) {
      expect(brokenOnThePage(outcome.phrase.musicXml, CONTRADICTION, ['leaps']), 'version 2 handed back a phrase it had not checked').toEqual([]);
    }
    expect(outcome.thrown).toBeInstanceOf(SightReadingRefusal);
    const refusal = outcome.thrown as SightReadingRefusal;
    expect(refusal.reasons[0]).toBe('No phrase could be written for level 2, right hand, 4 bars of 4/4 with no sharps or flats.');
    expect(refusal.reasons[1]).toBe(
      'In 4096 draws none kept its promise (a leap of a fourth or wider) within the level’s rules (no interval wider than a step).',
    );
    expect(refusal.reasons[2]).toBe('None kept every promise; the last draw lacked a leap of a fourth or wider.');
    // The generator's own declared reason, where the options contradict themselves.
    for (const reason of unrealisable(CONTRADICTION)) expect(refusal.reasons).toContain(reason);
    expect(refusal.reasons).toContain('A melody held to steps cannot leap.');
    expect(refusal.message).toBe(refusal.reasons.join(' '));
    expect(refusal.attempts).toBe(4096);
    expect(refusal.generator).toEqual({ family: 'sight-reading', version: 2, seed: 20260927 });
    // Deterministic from the seed, like the phrase it stands in for.
    const again = attempt(() => generateSightReading(CONTRADICTION)).thrown as SightReadingRefusal;
    expect(again.reasons).toEqual(refusal.reasons);
    // The report refuses the same way: it has no phrase to report.
    expect(attempt(() => sightReadingReport(CONTRADICTION)).thrown).toBeInstanceOf(SightReadingRefusal);
  });

  it('a leap cap the walk does not respect: every draw that keeps the promise breaks it, so the phrase is refused (seam)', () => {
    const options: SightReadingOptions = { level: 2, hands: 'R', bars: 4, skips: true, seed: 20260927, version: 2 };
    const outcome = attempt(() => sightReadingReportWithin(options, { attempts: 64, maxLeap: 1 }));
    if (outcome.phrase) {
      expect(brokenOnThePage(outcome.phrase.result.musicXml, options, ['skips'], 1), 'version 2 handed back a phrase that broke its hard layer').toEqual([]);
    }
    expect(outcome.thrown).toBeInstanceOf(SightReadingRefusal);
    const refusal = outcome.thrown as SightReadingRefusal;
    expect(refusal.reasons[1]).toBe('In 64 draws none kept its promise (a skip beside a step) within the level’s rules (no interval wider than a step).');
    expect(refusal.reasons[2]).toBe('63 kept every promise and broke a rule, the last with a leap of 2 scale steps in bar 1, beyond the cap of 1.');
    expect(refusal.attempts).toBe(64);
  });

  it('a valid draw first found after the first window is kept, and the window moves with it', () => {
    const report = sightReadingReport(RARE);
    const first = report.candidates.find((candidate) => candidate.valid)?.attempt ?? -1;
    expect(first, 'this seed finds a valid draw inside the first window, so the case proves nothing').toBeGreaterThan(CANDIDATE_WINDOW);
    expect(report.chosen).toBeGreaterThanOrEqual(first);
    expect(report.candidates.find((candidate) => candidate.attempt === report.chosen)?.valid).toBe(true);
    // The window is the first valid draw's: the search stops a window after it.
    expect(report.attempts).toBeLessThanOrEqual(first + CANDIDATE_WINDOW + 1);
    expect(brokenOnThePage(report.result.musicXml, RARE, RARE_PROMISES)).toEqual([]);
    // The app's call writes the phrase the search kept.
    expect(generateSightReading(RARE).musicXml).toBe(report.result.musicXml);
  });

  it('continue, then refuse: a budget that ends one draw before the first valid refuses; one draw more returns that draw (seam)', () => {
    const first = sightReadingReport(RARE).candidates.find((candidate) => candidate.valid)?.attempt ?? -1;
    expect(first).toBe(187);
    const short = attempt(() => sightReadingReportWithin(RARE, { attempts: first }));
    if (short.phrase) {
      expect(brokenOnThePage(short.phrase.result.musicXml, RARE, RARE_PROMISES), 'the budget ran out and its last draw came back').toEqual([]);
    }
    expect(short.thrown).toBeInstanceOf(SightReadingRefusal);
    const refusal = short.thrown as SightReadingRefusal;
    expect(refusal.reasons[0]).toBe('No phrase could be written for level 2, right hand, 4 bars of 4/4 with 1 sharp.');
    expect(refusal.reasons[1]).toBe(
      'In 187 draws none kept its promises (a skip beside a step, an eighth note, the raised fourth, a tie over the bar line and a dotted quarter) within the level’s rules (no interval wider than a third, a tie only from a note on the beat).',
    );
    expect(refusal.reasons[2]).toMatch(/^None kept every promise; the last draw lacked /);
    const enough = sightReadingReportWithin(RARE, { attempts: first + 1 });
    expect(enough.chosen).toBe(first);
    expect(brokenOnThePage(enough.result.musicXml, RARE, RARE_PROMISES)).toEqual([]);
  });

  it('version 1 is what it was: the same contradiction still writes its last draw, without the leap, and never refuses', () => {
    const v1 = generateSightReading({ ...CONTRADICTION, version: 1 });
    expect(v1.generator).toEqual({ family: 'sight-reading', version: 1, seed: 20260927 });
    expect(brokenOnThePage(v1.musicXml, { ...CONTRADICTION, version: 1 }, ['leaps'])).toEqual(['promised leaps: none on the page']);
  });
});
