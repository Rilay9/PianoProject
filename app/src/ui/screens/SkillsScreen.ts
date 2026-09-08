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
import { allProgress } from '../../data/progressStore';
import { getPlan } from '../../data/planStore';
import { activeTracksFor } from '../../curriculum/tracks';
import { nextRecommended } from '../../curriculum/session';
import { getSettings } from '../../data/settingsStore';
import { allSkills, displayState, type SkillState } from '../../data/skillsStore';
import type { SkillRow } from '../../data/db';
import { createSubScreen } from './subScreen';
import { badge, button, chip, el, levelLabel, listRow } from '../widgets';
import { openFinderSheet } from '../finderSheet';
import { openItem } from '../openItem';

const STATE_LABEL: Record<SkillState, string> = {
  unseen: 'never',
  learning: 'learning',
  known: 'measured',
  rusty: 'rusty',
};

interface ConceptEntry {
  concept: string;
  stages: number[];
  tracks: string[];
  state: SkillState;
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
 * Every concept, with where it comes from and what could drill it.
 *
 * A concept's state comes from two places: what the learner recorded in the
 * skills store, and what they actually passed. The second wins when it is
 * stronger — passing an item that teaches a concept *is* evidence about the
 * concept, and asking someone to tick a box they have already earned is the
 * kind of bookkeeping that makes a screen go unused.
 */
export function buildConcepts(
  curriculum: Curriculum,
  items: CatalogItem[],
  skills: SkillRow[],
  passedItemIds: Set<string>,
  now = new Date(),
): ConceptEntry[] {
  const byConcept = new Map<string, ConceptEntry>();
  const skillByConcept = new Map(skills.map((row) => [row.conceptId, row]));

  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        for (const concept of lesson.concepts) {
          const entry = byConcept.get(concept) ?? {
            concept,
            stages: [],
            tracks: [],
            state: displayState(skillByConcept.get(concept), now),
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
      if (passedItemIds.has(item.id) && entry.state === 'unseen') entry.state = 'learning';
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
  card.append(filters, status, list);

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
    status.textContent =
      stateFilter === 'rusty'
        ? `${String(shown.length)} rusty of ${String(entries.length)}`
        : opening !== null
          ? `${String(shown.length)} of ${String(entries.length)} concepts · stage${
              opening.length === 1 ? '' : 's'
            } ${opening.join(' and ')}`
          : `${String(shown.length)} of ${String(entries.length)} concepts`;
    list.replaceChildren(...page.map((entry) => conceptBlock(entry)));
    if (shown.length === 0) list.append(el('p.muted', { text: 'No concepts match those filters.' }));
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
    const [curriculum, items, skills, progress] = await Promise.all([
      loadCurriculum(),
      allItems(),
      allSkills(),
      allProgress(),
    ]);
    const passed = new Set(
      progress.filter((row) => row.status === 'passed' || row.status === 'mastered').map((row) => row.itemId),
    );
    conceptMeta = new Map((curriculum.concepts ?? []).map((entry) => [entry.id, entry]));
    entries = buildConcepts(curriculum, items, skills, passed);
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
      // Nothing rusty: the stage being worked on and the one below it.
      const records = progress.map((row) => ({
        itemId: row.itemId,
        passed: row.status === 'passed' || row.status === 'mastered',
        mastered: row.status === 'mastered',
      }));
      const here = nextRecommended(curriculum, records, activeTracksFor(await getPlan(), curriculum), {
        requireTwoSongs: getSettings().requireTwoSongs,
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
