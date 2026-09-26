/**
 * Skills review (docs/04 §3a).
 *
 * "Go back and practise old skills" without navigating the plan. The grid is
 * every concept the curriculum names, with the state it is in and a way to
 * drill it — and "rusty" (not practised in 30 days) is a state of its own,
 * because a skill you passed in March is not a skill you have today.
 */
import type { Router } from '../../router';
import { allItems, loadCurriculum } from '../../curriculum/load';
import type { CatalogItem, ConceptEntry as CurriculumConcept, Curriculum } from '../../curriculum/types';
import { rungRows } from '../../data/progressStore';
import { getPlan } from '../../data/planStore';
import { activeTracksFor } from '../../curriculum/tracks';
import { nextRecommended } from '../../curriculum/session';
import { getSettings } from '../../data/settingsStore';
import { allSkills, displayState, type SkillState } from '../../data/skillsStore';
import { carriedExposures, learnerRecordFrom, rungState, skillLadders } from '../../evidence/rungState';
import { ladderState, type LadderReading, type LadderState } from '../../evidence/ladder';
import { VOCABULARY_V0 } from '../../evidence/vocabulary';
import type { SkillRow } from '../../data/db';
import { createSubScreen } from './subScreen';
import { badge, button, chip, el, levelLabel, listRow } from '../widgets';
import { openFinderSheet } from '../finderSheet';
import { openItem } from '../openItem';

/**
 * What a concept's row says. The skills store's four, and the ladder's first
 * state, *introduced* (C5): met — the lesson read, the material played before
 * the app judged rungs by evidence — and nothing shown yet.
 */
export type ShownState = SkillState | 'introduced';

const STATE_LABEL: Record<ShownState, string> = {
  unseen: 'never',
  introduced: 'introduced',
  learning: 'learning',
  known: 'measured',
  rusty: 'rusty',
};

interface ConceptEntry {
  concept: string;
  stages: number[];
  tracks: string[];
  state: ShownState;
  /**
   * Everything playable that trains this concept, easiest first (replan §3.2).
   *
   * It used to be one item — whichever happened to be found first — which made
   * the screen a list of concepts with a button rather than a way to practise a
   * skill. The owner's requirement is "always something to work on for one
   * skill", and that is this list plus the level ordering: the same concept can
   * now be drilled at whatever level he is actually at.
   */
  items: CatalogItem[];
}

/** How many exercises show before the row collapses the rest. */
export const SKILL_ITEMS_SHOWN = 3;

/**
 * A skill's ladder reading as the screen's states (C5): not introduced is
 * *never*, introduced (met, nothing shown yet — a carried rung's concepts) is
 * *introduced*, tried and not yet shown is *learning*, familiar or better is
 * *measured* — which it now is — and a skill whose supporting evidence is
 * older than the ladder's retention span is *rusty*, by the evidence rather
 * than by the calendar since a page was drawn (L16's complaint, for these
 * skills).
 */
export function ladderToState(reading: Pick<LadderReading, 'state' | 'notShownRecently'> | LadderState): ShownState {
  const state = typeof reading === 'string' ? reading : reading.state;
  const stale = typeof reading === 'string' ? false : reading.notShownRecently;
  if (state === 'not introduced') return 'unseen';
  if (state === 'introduced') return 'introduced';
  if (state === 'practised') return 'learning';
  return stale ? 'rusty' : 'known';
}

/**
 * Every concept, with where it comes from and what could drill it.
 *
 * A concept that is a vocabulary skill with an observable shows what the
 * learner's evidence shows (C5: the ladder over every current-stamp record,
 * whichever rung judged the run). Every other concept shows what the learner
 * recorded in the skills store (C7 replaces it). An item's pass moves neither:
 * it used to promote every concept the item names to *learning*, an item's
 * flag standing in for a skill.
 *
 * `exposures` are the carried rungs' concepts (`carriedExposures`): a concept
 * the store has as never met is shown at the ladder's first state for them,
 * *introduced*; what the learner said or showed outranks it. (The vocabulary
 * skills have them already, through `ladders`.)
 */
export function buildConcepts(
  curriculum: Curriculum,
  items: CatalogItem[],
  skills: SkillRow[],
  ladders: ReadonlyMap<string, Pick<LadderReading, 'state' | 'notShownRecently'> | LadderState>,
  now = new Date(),
  exposures: ReadonlyMap<string, readonly string[]> = new Map(),
): ConceptEntry[] {
  const byConcept = new Map<string, ConceptEntry>();
  const skillByConcept = new Map(skills.map((row) => [row.conceptId, row]));
  const storeState = (concept: string): ShownState => {
    const stored = displayState(skillByConcept.get(concept), now);
    const exposed = exposures.get(concept);
    if (stored !== 'unseen' || !exposed || exposed.length === 0) return stored;
    return ladderToState(ladderState({ evidence: [], exposures: exposed, today: now }));
  };

  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        for (const concept of lesson.concepts) {
          const ladder = ladders.get(concept);
          const entry = byConcept.get(concept) ?? {
            concept,
            stages: [],
            tracks: [],
            state: ladder === undefined ? storeState(concept) : ladderToState(ladder),
            items: [],
          };
          if (!entry.stages.includes(stage.number)) entry.stages.push(stage.number);
          if (!entry.tracks.includes(unit.track)) entry.tracks.push(unit.track);
          byConcept.set(concept, entry);
        }
      }
    }
  }

  for (const item of items) {
    const playable = Boolean(item.file || item.imported || item.drill);
    for (const concept of item.concepts) {
      const entry = byConcept.get(concept);
      if (!entry) continue;
      // Songs are not practice for a *skill*: they are where the skill is used.
      if (playable && item.type !== 'song') entry.items.push(item);
    }
  }
  for (const entry of byConcept.values()) {
    entry.items.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
  }
  return [...byConcept.values()].sort(
    (a, b) => (a.stages[0] ?? 99) - (b.stages[0] ?? 99) || a.concept.localeCompare(b.concept),
  );
}

export function SkillsScreen(router: Router): HTMLElement {
  const { section, card } = createSubScreen(router, {
    id: 'skills',
    title: 'Review a skill',
    backTo: 'plan',
    backLabel: 'Plan',
  });

  const filters = el('div.filter-row', { id: 'skills-filters' });
  const list = el('div.list', { id: 'skills-list' });
  const status = el('p.status', { id: 'skills-status', role: 'status' });
  /**
   * The way to "what is every drill, and what is it for?" (`04` §5f).
   *
   * This screen lists the skills and the drills that train them; what it never
   * said is what any of those drills *is* before you open one. The guide's own
   * list answers that, from the same table the drill screen reads.
   */
  const toGuide = el(
    'div.plan-links',
    { id: 'skills-guide-link' },
    button('What every drill is', () => router.navigate('settings', 'guide'), {
      id: 'skills-open-guide',
      variant: 'quiet',
    }),
  );
  card.append(filters, toGuide, status, list);

  let entries: ConceptEntry[] = [];

  let conceptMeta = new Map<string, CurriculumConcept>();
  let stageFilter = 'all';
  /**
   * The stages the screen opens on when nothing is rusty (decision 6b).
   *
   * The one being worked on and the one below it: the reason to come here is
   * usually that something has gone soft, and if nothing has, what is worth
   * revisiting is what was learned most recently. Cleared by "Show all", and
   * ignored the moment a stage is chosen by hand.
   */
  let openingStages: number[] | null = null;
  let trackFilter = 'all';
  let stateFilter: 'all' | SkillState = 'all';

  /**
   * How many concepts are drawn before `Show all` (`04` §3a, `00` D26).
   *
   * The whole curriculum is 266 concepts, and drawing every one of them meant
   * 478 interactive elements on arrival — an order of magnitude more than any
   * other screen in the app. The Library holds 1,533 items without doing that,
   * and this is the same shape: a page at a time.
   */
  const PAGE_SIZE = 50;
  let shownCount = PAGE_SIZE;

  function draw(): void {
    const opening = stageFilter === 'all' ? openingStages : null;
    const shown = entries.filter(
      (entry) =>
        (stageFilter === 'all' || entry.stages.includes(Number(stageFilter))) &&
        (opening === null || entry.stages.some((stage) => opening.includes(stage))) &&
        (trackFilter === 'all' || entry.tracks.includes(trackFilter)) &&
        (stateFilter === 'all' || entry.state === stateFilter),
    );
    const page = shown.slice(0, shownCount);
    // The count says what it is showing, and what it is not.
    // *Skills*, not *concepts*. The screen is called **Review a skill**, every
    // button on it offers to drill a skill, and its count line said
    // "42 of 118 concepts" — `concepts[]` is the curriculum's field name for
    // the same thing and the learner has never been shown it (`04` §3a, and
    // Entry 45's two-names list is this shape).
    status.textContent =
      stateFilter === 'rusty'
        ? `${String(shown.length)} rusty of ${String(entries.length)}`
        : opening !== null
          ? `${String(shown.length)} of ${String(entries.length)} skills · stage${
              opening.length === 1 ? '' : 's'
            } ${opening.join(' and ')}`
          : `${String(shown.length)} of ${String(entries.length)} skills`;
    list.replaceChildren(...page.map((entry) => conceptBlock(entry)));
    if (shown.length === 0) list.append(el('p.muted', { text: 'No skills match those filters.' }));
    // Two jobs, one link. While the screen is showing what it opened on, it
    // offers the whole curriculum; after that it pages through it fifty at a
    // time, the way the Library does. Resetting the page on every press — which
    // is what it did for one commit — shows the same fifty for ever.
    const restricted = opening !== null || stateFilter === 'rusty';
    const more = shown.length - page.length;
    if (restricted || more > 0) {
      list.append(
        el(
          'div.plan-links',
          {},
          button(
            restricted
              ? `Show all ${String(entries.length)}`
              : `Show ${String(Math.min(PAGE_SIZE, more))} more`,
            () => {
              if (restricted) {
                // What the screen opened on is a starting point, not a filter
                // the learner set: one link clears all of it.
                openingStages = null;
                stateFilter = 'all';
                document.getElementById('skills-rusty')?.setAttribute('aria-pressed', 'false');
                shownCount = PAGE_SIZE;
              } else {
                shownCount += PAGE_SIZE;
              }
              draw();
            },
            { id: 'skills-show-all', variant: 'quiet' },
          ),
        ),
      );
    }
  }

  /**
   * One concept: its row, then everything that trains it.
   *
   * Three shown and the rest behind a toggle (replan §3.2). A concept like
   * `scale` now has over two hundred exercises against it, and printing them
   * all would make the screen a wall — but hiding all but one, which is what
   * this did before, is what made "practise this skill at my level" impossible.
   * The first three are the easiest three, because the list is sorted by level
   * and the reason to come here is usually that something is rusty.
   */
  function conceptBlock(entry: ConceptEntry): HTMLElement {
    const first = entry.items[0];
    // The curriculum carries a display name for every concept id, because a
    // label derived from the id gives you `Cc64` and `Ii-v-i` (replan §4.1).
    const meta = conceptMeta.get(entry.concept);
    const finder = meta?.finder;
    const actions: HTMLElement[] = [];
    // Outlined, not filled (R3). One filled box per *screen*, and a list of
    // them is a list of nothing: Skills drew twenty-four.
    if (first) actions.push(button('Drill it', () => void openItem(router, first)));
    if (finder) {
      // A concept finder exists whether or not any rung is short: "find me
      // more of this" is a question about the skill, not about the ladder.
      actions.push(
        // Text, not a box: `Drill it` is the thing to do here and this is the
        // thing to do when it is not enough (`04` §0 R3). As two boxes they
        // took half the row's width and squeezed the concept's name.
        button('Find more', () => openFinderSheet(finder, meta?.display ?? entry.concept), {
          variant: 'quiet',
        }),
      );
    }
    const row = listRow({
      title: meta?.display ?? entry.concept,
      meta: `Stage ${entry.stages.join(', ')} · ${entry.tracks.join(', ')} · ${String(entry.items.length)} to practise`,
      badges: [badge(STATE_LABEL[entry.state], entry.state === 'rusty' ? 'warn' : entry.state)],
      actions,
      dataset: { 'data-concept': entry.concept, 'data-state': entry.state },
    });
    // One element per concept, not two siblings. On a tablet the list is a
    // two-column grid, and a concept's row and its drill rows were separate
    // cells — so the exercises under "The placement test" were laid out
    // *beside* it, and the "Show all 32" link landed in the middle of the
    // grid. The grid places concepts; a concept holds its own rows.
    if (entry.items.length === 0) return el('div.skill-concept', {}, row);

    const options = el('div.skill-options', { 'data-options-for': entry.concept });
    const hidden = entry.items.slice(SKILL_ITEMS_SHOWN);
    const render = (expanded: boolean): void => {
      const visible = expanded ? entry.items : entry.items.slice(0, SKILL_ITEMS_SHOWN);
      const rows = visible.map((item) =>
        listRow({
          title: item.title,
          meta: `${levelLabel(item.level, item.levelSource)} · ${item.type}`,
          dataset: { 'data-skill-item': item.id },
          onClick: () => void openItem(router, item),
        }),
      );
      if (hidden.length > 0) {
        rows.push(
          button(
            expanded ? 'Show fewer' : `Show all ${String(entry.items.length)}`,
            () => {
              render(!expanded);
            },
            { variant: 'quiet', id: `skills-more-${entry.concept}` },
          ),
        );
      }
      options.replaceChildren(...rows);
    };
    render(false);
    return el('div.skill-concept', {}, row, options);
  }

  function drawFilters(stages: number[], tracks: string[]): void {
    const stageSelect = el('select', { id: 'skills-stage', 'aria-label': 'Stage' }) as HTMLSelectElement;
    stageSelect.append(el('option', { value: 'all', text: 'All stages' }));
    for (const stage of stages) {
      stageSelect.append(el('option', { value: String(stage), text: `Stage ${String(stage)}` }));
    }
    stageSelect.addEventListener('change', () => {
      stageFilter = stageSelect.value;
      shownCount = PAGE_SIZE;
      draw();
    });

    const trackSelect = el('select', { id: 'skills-track', 'aria-label': 'Track' }) as HTMLSelectElement;
    trackSelect.append(el('option', { value: 'all', text: 'All tracks' }));
    for (const track of tracks) trackSelect.append(el('option', { value: track, text: track }));
    trackSelect.addEventListener('change', () => {
      trackFilter = trackSelect.value;
      shownCount = PAGE_SIZE;
      draw();
    });

    filters.replaceChildren(
      stageSelect,
      trackSelect,
      chip('Rusty only', {
        id: 'skills-rusty',
        onClick: () => {
          stateFilter = stateFilter === 'rusty' ? 'all' : 'rusty';
          shownCount = PAGE_SIZE;
          document.getElementById('skills-rusty')?.setAttribute('aria-pressed', String(stateFilter === 'rusty'));
          draw();
        },
      }),
    );
  }

  void (async () => {
    const [curriculum, items, skills, rows, plan] = await Promise.all([
      loadCurriculum(),
      allItems(),
      allSkills(),
      rungRows(),
      getPlan(),
    ]);
    const now = new Date();
    conceptMeta = new Map((curriculum.concepts ?? []).map((entry) => [entry.id, entry]));
    // The carried rungs' concepts, as exposures on the ladder (C5): *introduced*.
    const exposures = carriedExposures(curriculum, plan.carriedOver);
    entries = buildConcepts(curriculum, items, skills, skillLadders(rows, VOCABULARY_V0, now, exposures), now, exposures);
    drawFilters(
      curriculum.stages.map((stage) => stage.number),
      curriculum.tracks.map((track) => track.id),
    );
    // Opens on what needs attention (`04` §3a). The reason to come to this
    // screen is that something has gone rusty, and the screen already knows
    // which — so it starts there when there is anything to start on, and on
    // everything when there is not.
    if (entries.some((entry) => entry.state === 'rusty')) {
      stateFilter = 'rusty';
      document.getElementById('skills-rusty')?.setAttribute('aria-pressed', 'true');
    } else {
      // Nothing rusty: the stage being worked on and the one below it — where
      // the learner is by the evidence (C5), as Plan and Today say it.
      const states = rungState(rows, curriculum, VOCABULARY_V0, now, learnerRecordFrom(plan, getSettings()));
      const here = nextRecommended(curriculum, states, activeTracksFor(plan, curriculum), {
        // The same starting point Plan and Today use, so the three screens
        // cannot disagree about where the learner is (built 2026-09-21).
        ...(plan.placement === undefined ? {} : { startAt: plan.placement.unitId }),
      })?.stageNumber;
      if (here !== undefined) {
        openingStages = here > 0 ? [here - 1, here] : [here];
      }
    }
    draw();
  })().catch((cause: unknown) => {
    status.textContent = `Skills could not be loaded: ${String(cause)}`;
    status.classList.add('status--error');
  });

  return section;
}
