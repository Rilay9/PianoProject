// What the Score screen's chrome shows in each moment (U122c, `src/ui/screens/scoreChrome.ts`;
// `docs/design/score-bar-layout.md` §10.2). The mapping is pure, so it is tested here; where each
// device draws it is the browser walk's (`tests/e2e/score.task-chrome.spec.ts`).
import { describe, expect, it } from 'vitest';
import { chromeFor, type MomentFacts } from '../../src/ui/screens/scoreChrome';

const at = (facts: Partial<MomentFacts>): MomentFacts => ({
  running: false,
  paused: false,
  hearing: false,
  hearOnRow: true,
  finished: false,
  peeking: false,
  ...facts,
});

describe('the chrome follows the moment, not whether a run exists', () => {
  it('at rest nothing folds', () => {
    expect(chromeFor(at({}))).toEqual({ handsOnKeys: false, folded: false, direct: null });
  });

  it('while a run is going — counting in, holding for the first note, playing — the controls fold to ⏸ in ▶’s place', () => {
    expect(chromeFor(at({ running: true }))).toEqual({ handsOnKeys: true, folded: true, direct: 'score-play' });
  });

  // Walk finding 5: the fold asked `session.running`, which a paused run keeps, and folded ▶ away
  // three seconds after ⏸ while the line said *▶ to carry on*.
  it('paused, nothing folds: ▶ and the setup controls are on the glass', () => {
    expect(chromeFor(at({ running: true, paused: true }))).toEqual({ handsOnKeys: false, folded: false, direct: null });
  });

  it('a peek shows every control while the hands are on the keys', () => {
    expect(chromeFor(at({ running: true, peeking: true }))).toEqual({ handsOnKeys: true, folded: false, direct: null });
  });

  it('a demonstration folds to its own Stop, the button that started it (T31 principle 5)', () => {
    expect(chromeFor(at({ running: true, hearing: true }))).toEqual({ handsOnKeys: true, folded: true, direct: 'score-hear' });
  });

  it('a demonstration started from the ⋯ sheet, whose Stop is not on the row, folds nothing: there would be no direct stop', () => {
    expect(chromeFor(at({ running: true, hearing: true, hearOnRow: false }))).toEqual({ handsOnKeys: true, folded: false, direct: null });
  });

  it('finished, nothing folds and the hands are off the keys, whatever the run object says', () => {
    expect(chromeFor(at({ running: true, finished: true }))).toEqual({ handsOnKeys: false, folded: false, direct: null });
    expect(chromeFor(at({ finished: true }))).toEqual({ handsOnKeys: false, folded: false, direct: null });
  });

  it('a peek while paused changes nothing: there was nothing folded to show', () => {
    expect(chromeFor(at({ running: true, paused: true, peeking: true }))).toEqual({ handsOnKeys: false, folded: false, direct: null });
  });
});
