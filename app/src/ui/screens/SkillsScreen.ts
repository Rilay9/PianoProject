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
import type { CatalogItem, Curriculum } from '../../curriculum/types';
import { allProgress } from '../../data/progressStore';
import { allSkills, displayState, type SkillState } from '../../data/skillsStore';
import type { SkillRow } from '../../data/db';
import { createSubScreen } from './subScreen';
import { badge, button, chip, el, levelLabel, listRow } from '../widgets';
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
  let stageFilter = 'all';
  let trackFilter = 'all';
  let stateFilter: 'all' | SkillState = 'all';

  function draw(): void {
    const shown = entries.filter(
      (entry) =>
        (stageFilter === 'all' || entry.stages.includes(Number(stageFilter))) &&
        (trackFilter === 'all' || entry.tracks.includes(trackFilter)) &&
        (stateFilter === 'all' || entry.state === stateFilter),
    );
    status.textContent = `${String(shown.length)} of ${String(entries.length)} concepts`;
    list.replaceChildren(...shown.flatMap((entry) => conceptBlock(entry)));
    if (shown.length === 0) list.append(el('p.muted', { text: 'No concepts match those filters.' }));
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
  function conceptBlock(entry: ConceptEntry): HTMLElement[] {
    const first = entry.items[0];
    const row = listRow({
      title: entry.concept,
      meta: `Stage ${entry.stages.join(', ')} · ${entry.tracks.join(', ')} · ${String(entry.items.length)} to practise`,
      badges: [badge(STATE_LABEL[entry.state], entry.state === 'rusty' ? 'warn' : entry.state)],
      actions: first
        ? [button('Drill it', () => void openItem(router, first), { variant: 'primary' })]
        : [],
      dataset: { 'data-concept': entry.concept, 'data-state': entry.state },
    });
    if (entry.items.length === 0) return [row];

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
    return [row, options];
  }

  function drawFilters(stages: number[], tracks: string[]): void {
    const stageSelect = el('select', { id: 'skills-stage', 'aria-label': 'Stage' }) as HTMLSelectElement;
    stageSelect.append(el('option', { value: 'all', text: 'All stages' }));
    for (const stage of stages) {
      stageSelect.append(el('option', { value: String(stage), text: `Stage ${String(stage)}` }));
    }
    stageSelect.addEventListener('change', () => {
      stageFilter = stageSelect.value;
      draw();
    });

    const trackSelect = el('select', { id: 'skills-track', 'aria-label': 'Track' }) as HTMLSelectElement;
    trackSelect.append(el('option', { value: 'all', text: 'All tracks' }));
    for (const track of tracks) trackSelect.append(el('option', { value: track, text: track }));
    trackSelect.addEventListener('change', () => {
      trackFilter = trackSelect.value;
      draw();
    });

    filters.replaceChildren(
      stageSelect,
      trackSelect,
      chip('Rusty only', {
        id: 'skills-rusty',
        onClick: () => {
          stateFilter = stateFilter === 'rusty' ? 'all' : 'rusty';
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
    entries = buildConcepts(curriculum, items, skills, passed);
    drawFilters(
      curriculum.stages.map((stage) => stage.number),
      curriculum.tracks.map((track) => track.id),
    );
    draw();
  })().catch((cause: unknown) => {
    status.textContent = `Skills could not be loaded: ${String(cause)}`;
    status.classList.add('status--error');
  });

  return section;
}
