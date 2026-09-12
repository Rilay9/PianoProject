// @vitest-environment jsdom
/**
 * Today's card, ranked (`04` §0 R1–R4; the pass the Plan screen had first).
 *
 * Four faults, all of them the Plan screen's, read back off a 342 px phone:
 *
 *  - **The slot kind was announced twice** — a badge reading `Warm-up` on a
 *    line of its own, over a reason line opening "Warm-up in the keys you are
 *    working in". It was on *every* row, which is a mark that distinguishes
 *    nothing, and the line it occupied is the line the title needed.
 *  - **The title was the thing that got cut.** It is the name of the piece and
 *    the row is what you tap; it now takes a second line, paid for by the
 *    badge line above.
 *  - **The one filled box was below the fold.** `Start session` sat under five
 *    rows — 679 px down a 740 px screen upright, off the bottom entirely
 *    sideways. It moves above the card; the three that only change the day go
 *    under it.
 *  - **Free play was drawn as a row and was not one.** Same border, same
 *    surface, same height as the four tappable cards above it, with no click
 *    handler, no buttons and nothing to press.
 *
 * And one more of the same family: the status line printed `lesson 0.1`, an
 * internal key, beside a unit title that is the lesson's title again.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Router } from '../../src/router';

vi.mock('../../src/app/services', () => ({
  webMidiSource: { inputs: [] as unknown[], onStateChange: () => () => undefined },
  micSource: { state: { connected: false }, onStateChange: () => () => undefined },
}));

const { item, lesson } = vi.hoisted(() => ({
  item: {
    id: 'song.warmup',
    type: 'exercise',
    title: 'Posture and hand-shape checklist',
    level: 0.1,
    hands: 'both',
    tracks: ['core'],
    concepts: [],
    file: null,
    tags: [],
  },
  lesson: { id: '0.1', title: 'Your instrument and your body' },
}));

vi.mock('../../src/curriculum/load', () => ({
  loadCurriculum: () => Promise.resolve({ version: 1, tracks: [], stages: [] }),
  allItems: () => Promise.resolve([item]),
}));

// The session builder is pure and has its own tests; what is under test here
// is the card built out of its answer, so the answer is fixed.
vi.mock('../../src/curriculum/session', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/curriculum/session')>();
  return {
    ...original,
    buildSession: () => ({
      template: { minutes: 60, slots: [] },
      slots: [
        {
          kind: 'technique',
          minutes: 8,
          item,
          reason: 'Warm-up in the keys you are working in',
        },
        { kind: 'free', minutes: 4, reason: 'Play anything you like — no scoring, no cursor' },
      ],
    }),
    nextRecommended: () => ({
      stageNumber: 0,
      unit: { id: '0', title: 'Your instrument and your body', track: 'core', lessons: [lesson] },
      lesson,
    }),
    playInstead: () => undefined,
  };
});

const { TodayScreen } = await import('../../src/ui/screens/TodayScreen');

const router = { navigate: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  const section = TodayScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector('#today-card .list-row')).not.toBeNull();
  });
  return section;
}

describe("Today's card says each thing once", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('puts the slot kind on the detail line and not on a badge of its own', async () => {
    const section = await mount();
    const row = section.querySelector('#today-card .list-row[data-slot="technique"]');
    expect(row).not.toBeNull();

    // The fact is still on the row, first, where the row's own question —
    // "what is this here for?" — is answered.
    expect(row?.querySelector('.list-row__meta')?.textContent).toMatch(/^Warm-up · 8 min/);
    // And not a second time as a badge. A badge on every row is not a badge.
    const badges = [...(row?.querySelectorAll('.badge') ?? [])].map((b) => b.textContent);
    expect(badges).not.toContain('Warm-up');
    // The line the badge used to hold is gone from this row entirely, which is
    // what buys the title its second line.
    expect(row?.querySelector('.list-row__badges')).toBeNull();
  });

  it('names the rung the learner is on without printing its id', async () => {
    const section = await mount();
    await vi.waitFor(() => {
      expect(section.querySelector('#today-status')?.textContent).toContain('Working on Stage');
    });
    const text = section.querySelector('#today-status')?.textContent ?? '';
    expect(text).toContain('Your instrument and your body');
    // `lesson 0.1` is an internal key; the reader has no use for it and it was
    // printed beside a unit title that is the same words as the lesson's.
    expect(text).not.toContain('lesson 0.1');
  });
});

describe("Today's one filled box", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is above the card rather than under every row of it', async () => {
    const section = await mount();
    const body = section.querySelector('.screen-body');
    const children = [...(body?.children ?? [])].map((child) => child.id);
    expect(children.indexOf('today-actions')).toBeGreaterThanOrEqual(0);
    expect(children.indexOf('today-actions')).toBeLessThan(children.indexOf('today-card'));
    // Still exactly one filled box on the screen (R3), and still that one.
    const filled = section.querySelectorAll('.button--primary');
    expect(filled.length).toBe(1);
    expect(filled[0]?.id).toBe('today-start');
  });

  it('leaves the three that only change the day below the card, as text', async () => {
    const section = await mount();
    const body = section.querySelector('.screen-body');
    const children = [...(body?.children ?? [])].map((child) => child.id);
    expect(children.indexOf('today-tools')).toBeGreaterThan(children.indexOf('today-card'));
    for (const id of ['today-shuffle', 'today-jump', 'today-metronome']) {
      const node = section.querySelector(`#${id}`);
      expect(node, id).not.toBeNull();
      expect(node?.classList.contains('link-button'), id).toBe(true);
    }
  });
});

describe('the free-play prompt', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is not drawn as a row, because it is not one', async () => {
    const section = await mount();
    const free = section.querySelector('[data-slot="free"]');
    expect(free).not.toBeNull();
    // It carried no `onClick`, no actions and nothing to press, while wearing
    // the same card as the four tappable rows above it.
    expect(free?.classList.contains('list-row')).toBe(false);
    expect(free?.getAttribute('role')).toBeNull();
    // Every word it had is still here.
    expect(free?.textContent).toContain('Free play');
    expect(free?.textContent).toContain('Play anything you like');
    expect(free?.textContent).toContain('4 min');
  });

  it('leaves the rows that are rows tappable', async () => {
    const section = await mount();
    const row = section.querySelector('#today-card .list-row[data-slot="technique"]');
    expect(row?.getAttribute('role')).toBe('button');
  });
});

describe('nothing on Today is drawn pressed and left dead', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('gives every length chip something to do', async () => {
    const section = await mount();
    // The Plan screen's fault: `chip(…, { pressed: true })` with no listener —
    // three toggles that looked live and had no click handler at all. Pressing
    // one of these has to select it *and* clear the rest; a dead chip would
    // leave whichever was chosen before still showing as chosen.
    const chips = [...section.querySelectorAll<HTMLButtonElement>('#today-lengths [aria-pressed]')];
    expect(chips.length).toBeGreaterThan(0);
    for (const node of chips) {
      expect(node.tagName, node.outerHTML.slice(0, 80)).toBe('BUTTON');
      node.click();
      await vi.waitFor(() => {
        expect(node.getAttribute('aria-pressed'), node.id).toBe('true');
      });
      for (const other of chips) {
        if (other !== node) expect(other.getAttribute('aria-pressed'), other.id).toBe('false');
      }
    }
  });

  it('sends the input chip somewhere when it is pressed', async () => {
    const section = await mount();
    section.querySelector<HTMLButtonElement>('#today-input')?.click();
    // `router` is a `vi.fn()` bag, so `navigate` is a mock and not a method that
    // could be torn off an object — the rule cannot tell the difference.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(router.navigate).toHaveBeenCalledWith('settings', expect.anything());
  });
});
