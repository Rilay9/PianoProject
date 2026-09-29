// #/dev/microscope — the builder's review workbench (D2; G28, G29, E16, R42, Part 15 §18).
//
// Not a learner screen and not in the navigation, like `#/dev/score`: nothing links here,
// and the address is the way in (`#/dev/microscope/<item id>` opens one item, so a link in
// an entry opens it). It exists so that "how does it render" and "how does it sound" mean
// the app's renderer (`OsmdView`, `WindowRenderer`) and the app's audio (`ScoreSession`'s
// Listen run through the shared piano — the path the Score screen's Hear it takes), the
// argument `render_check.py` makes for rendering.
//
// Per item it shows the notation as the Score screen draws it; Hear it, hands together and
// each hand alone, at the written tempo; the facts — family, version, seed, role, promise
// and `heard`, the target or "not judged" with its candidate, the musical gate's verdict as the
// build's projection carries it (D5), every measured demand with its located count and the
// contract's verdict, what the notes lack of the requirements the recipe selects, the physical
// limits, the provenance facts as E0 labels them with their values, the rungs listing the item
// and what each claims of it, and every review of it. And it records a person's decisions, one
// dimension per event (`review/record.ts`).
//
// **It writes nothing of the learner's.** Its decisions live under its own localStorage keys
// (`pianopath.microscope.*`); it reads the bundled catalogue (never the learner's imports or
// overrides), plays through a session that records no run, and never opens a learner store
// for writing (`microscope.spec.ts` holds the stores byte-identical across a review). The
// decisions leave the device as an exported file, merged by `tools/content/review.py
// --merge` — no server, so an unexported decision is visible and recoverable, never lost
// in transit (the reviewer's constraint, `docs/review/responses/7ab175a.md`).

import { createSubScreen } from './subScreen';
import { onScreenDispose } from '../screenLifecycle';
import { el, button } from '../widgets';
import { barsPerWindowFor, isTablet } from '../tablet';
import { contentUrl, loadCatalog } from '../../curriculum/load';
import type { CatalogItem, FactKind, Provenance } from '../../curriculum/types';
import { DEFAULT_SETTINGS, getSettings } from '../../data/settingsStore';
import { audioEngine } from '../../audio/AudioEngine';
import type { Piano } from '../../audio/Piano';
import { getPiano } from '../../app/services';
import { toMusicXml } from '../../score/mxl';
import { OsmdView } from '../../score/OsmdView';
import { WindowRenderer } from '../../score/WindowRenderer';
import { ScoreSession, type PlaybackHands } from '../../score/ScoreSession';
import { bpmAt, type ScoreModel } from '../../score/types';
import {
  BASES,
  CATEGORIES,
  DIMENSIONS,
  VALUES,
  TRIAGE,
  eventFault,
  flagsOf,
  identityOf,
  isTriage,
  resolve,
  sameIdentity,
  serializeEvent,
  type Basis,
  type Decided,
  type Dimension,
  type EventStatus,
  type HumanEvent,
  type Identity,
  type ReviewEvent,
  type TriageEvent,
} from '../../review/record';
import type { Router } from '../../router';
import { DevExcerptView, EXCERPT_VIEW } from './DevExcerptView';

// --- the build's data -----------------------------------------------------------------

interface DemandFact {
  demand: string;
  located: number;
  verdict: 'required' | 'forbidden' | 'established' | 'incidental';
  atDensity?: boolean;
  assumed?: boolean;
  /** Present when the earliest rung listing the item has not taught it: the rung that does, or null. */
  untaught?: string | null;
  misread?: boolean;
}

interface RungFact {
  rung: string;
  title: string | null;
  claims: { kind: string; id: string; status: string }[];
  unmeasurable: string[];
  untaught: string[];
  earliest: boolean;
}

export interface ItemFacts {
  tier: string;
  identity: Identity;
  family?: string;
  promise?: 'drill' | 'music';
  target?: { primary: string | null; secondary: string[] };
  role?: string;
  notJudged?: { candidate: string | null; why: string | null };
  demands: DemandFact[];
  rungs: RungFact[];
  events?: (ReviewEvent & { line: number; status: EventStatus })[];
  /** The musical gate's verdict as the build's projection carries it (`review.musical_verdict`, D5; G55). */
  musical?: MusicalVerdict;
  /** The requirements the recipe selects (`family_contracts.selected`) and those the notes lack (D5; G56). */
  requires?: string[];
  missing?: string[];
}

/**
 * `family_contracts.musical_gate`'s answer for one generated item, carried by the projection: a
 * drill (`applies: false`), a music family the evaluator does not judge (`evaluated: false`, the
 * contract's words in `why`), or the evaluator's verdict on the written notes with the evaluator's
 * contract version and whether the build carried it or the projection recomputed it.
 */
export type MusicalVerdict =
  | { applies: false; why: string }
  | { applies: true; evaluated: false; why: string }
  | {
      applies: true;
      evaluated: true;
      passes: boolean;
      total: number;
      parts: Record<string, number>;
      wrong: string[];
      floor: number;
      why: string;
      evaluator: string;
      version: number;
      source: 'carried' | 'recomputed';
    };

/** The evaluator the projection recomputes with now (`microscope.json` `evaluator`). */
export interface EvaluatorRef {
  name: string | null;
  version: number;
}

export interface FamilyRow {
  name: string;
  version: number;
  promise: { promise: string; why: string; when?: Record<string, unknown> }[];
  heard: boolean;
  requires: { demand: string; minPer?: [string, number]; min?: number; why?: string; when?: Record<string, unknown> }[];
  forbids: { demand: string; why?: string; when?: Record<string, unknown> }[];
  assumes: string[];
  physical: {
    maxSpan: number;
    maxRate: number;
    fingering: { printed: string; source: string[] | string | null; note?: string };
    leaps?: { max: number; minSeconds: number; why?: string };
    repeatedNotes?: unknown;
    largeHand?: { span: number; prerequisite: string; alternative: string };
  };
  roles: string[];
  admission: string;
  unjudged: string[];
  judged: { quality: string; input: string; precision: string }[];
}

interface MicroscopeData {
  v: 1;
  record: { path: string; events: number; errors: { line: number; why: string }[] };
  queue: { id: string; title: string; items: string[] }[];
  families: Record<string, FamilyRow>;
  evaluator?: EvaluatorRef;
  items: Record<string, ItemFacts>;
}

let dataPromise: Promise<MicroscopeData> | null = null;

/**
 * A file under the builder-only root beside `content/` (D2a), base-aware as `contentUrl` is.
 * Nothing there is precached (`vite.config.ts`), so the offline invariant holds every file
 * under `content/` to the precache without an exception (`offline.spec.ts`, P19).
 */
function devUrl(path: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}dev/${path}`;
}

/** The build's microscope data (`review.write_microscope`), fetched once per page. */
function loadData(): Promise<MicroscopeData> {
  dataPromise ??= fetch(devUrl('review/microscope.json'))
    .then(async (response) => {
      if (!response.ok) throw new Error(`dev/review/microscope.json: ${String(response.status)} — run the content build`);
      return (await response.json()) as MicroscopeData;
    })
    .catch((cause: unknown) => {
      dataPromise = null;
      throw cause;
    });
  return dataPromise;
}

// --- the device's decisions -------------------------------------------------------------

const DECISIONS_KEY = 'pianopath.microscope.decisions';
const REVIEWER_KEY = 'pianopath.microscope.reviewer';

interface LocalDecision {
  event: ReviewEvent;
  /** When it last left the device in an export file; absent until then. */
  exportedAt?: string;
}

function readLocal(): LocalDecision[] {
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as { v?: number; decisions?: LocalDecision[] }) : null;
    return Array.isArray(parsed?.decisions) ? parsed.decisions.filter((one) => eventFault(one.event) === null) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: LocalDecision[]): void {
  localStorage.setItem(DECISIONS_KEY, JSON.stringify({ v: 1, decisions: list }));
}

type LocalState = 'unexported' | 'exported' | 'merged' | 'stale';

const TIER_WORDS: Record<string, string> = {
  flagged: 'Flagged',
  music: 'Music families',
  'not-judged': 'Not judged by the app',
  unmeasurable: 'Claims no detector checks',
  rest: 'Everything else',
};

const DIMENSION_WORDS: Record<Dimension, { title: string; ask: string }> = {
  usableScore: { title: 'Usable score', ask: 'Faithful and readable: the right notes, spelled and engraved so a learner can read them.' },
  goodTeachingUse: { title: 'Good teaching use', ask: 'For the role it is given here: the opportunity there, the demands right, a teacher would assign it.' },
};

const BASIS_WORDS: Record<Basis, string> = {
  inspected: 'inspected — the facts only',
  notation: 'notation — I read the page',
  heard: 'heard — complete, both hands, at the written tempo',
};

const KIND_WORDS: Record<FactKind, string> = {
  measured: 'measured',
  inferred: 'inferred',
  authored: 'authored',
  reviewed: 'reviewed',
  unmeasured: 'unmeasured',
  runtime: 'runtime',
};

// --- three lines of the facts, as text -------------------------------------------------

const UNHEARD = 'unheard: no hearing counts until a person’s decision.';

/**
 * The musical line (D5; G55): the musical gate's verdict as the build's projection carries it,
 * never computed here. A study reads passes or refused, the gate's own words (the total against
 * the floor, any wrong cadence), the evaluator with its contract version, and whether the build
 * carried the verdict or the projection recomputed it from the built notes; a verdict written
 * under another version than the evaluator's current one says so. A music family the evaluator
 * does not judge keeps the contract's "not evaluated" words. Either way "unheard" follows as a
 * sentence of its own: a notation score is never a hearing. A drill stays a drill.
 */
export function musicalLines(facts: ItemFacts, family: FamilyRow | undefined, evaluator?: EvaluatorRef): string[] {
  if (!family) return ['Not evaluated by any code.'];
  const verdict = facts.musical;
  if (!verdict) return ['The build’s data carries no musical verdict for this item: rebuild the content.'];
  if (!verdict.applies) return ['A drill: judged as a drill, never as music; its repetition is the point.'];
  if (!verdict.evaluated) return [`Promised as music — ${verdict.why}.`, UNHEARD];
  const source =
    verdict.source === 'carried' ? 'carried from the build' : 'recomputed by the projection from the built notes';
  return [
    `Evaluated from the notation by ${verdict.evaluator} v${String(verdict.version)}, ${source}: ${
      verdict.passes ? 'passes' : 'refused'
    } — ${verdict.why}${verdict.wrong.length === 0 ? '; no wrong cadence' : ''}.`,
    ...(evaluator && evaluator.version !== verdict.version
      ? [`Written by ${verdict.version < evaluator.version ? 'an earlier' : 'another'} evaluator: the evaluator is now v${String(evaluator.version)}.`]
      : []),
    UNHEARD,
  ];
}

/**
 * "Contract requires but the notes lack" (D5; G56): the projection's `missing`, the requirements
 * the recipe selects (`family_contracts.selected`) that the measured demands lack. The screen
 * never reads a family's rules for it, so a rule whose `when` the recipe does not meet is never named.
 */
export function contractWarning(facts: ItemFacts): string | null {
  const missing = facts.missing ?? [];
  return missing.length > 0 ? `Contract requires but the notes lack: ${missing.join(', ')}` : null;
}

/** The two review dimensions' facts (`review.FACT`): each printed on its own line, decided or not. */
const REVIEWED_FACTS = ['reviewedScore', 'reviewedTeaching'] as const;

/**
 * The provenance list (D5; G60): the source, then every fact with its kind, its value as the
 * record holds it — a promise's `music` or `drill`, a decision's `yes`, `no` or `fix`, never
 * reworded into a conclusion — and its `via`; a reviewed fact adds its basis, date and event.
 * A review dimension with no current decision reads "no decision".
 */
export function provenanceLines(provenance: Provenance): string[] {
  const lines = Object.entries(provenance.facts).map(([name, how]) => {
    const reviewed = how as { basis?: string; date?: string; event?: string; value?: string | null };
    const kind = KIND_WORDS[how.kind];
    const head =
      reviewed.value === null ? `no decision (${kind})` : reviewed.value !== undefined ? `${reviewed.value} (${kind})` : kind;
    const decided = [
      reviewed.basis ? `basis ${reviewed.basis}` : '',
      reviewed.date ?? '',
      reviewed.event ? `event ${reviewed.event}` : '',
    ].filter(Boolean);
    return `${name}: ${head}${how.via ? ` — ${how.via}` : ''}${how.why ? ` — ${how.why}` : ''}${
      decided.length ? ` — ${decided.join(', ')}` : ''
    }${how.untrusted?.length ? ` (untrusted: ${how.untrusted.join(', ')})` : ''}`;
  });
  const undecided = REVIEWED_FACTS.filter((name) => !(name in provenance.facts)).map((name) => `${name}: no decision`);
  return [`source: ${provenance.source}`, ...lines, ...undecided];
}

/** The handle `microscope.spec.ts` reads; attached only by this builder-only screen. */
export interface MicroscopeHandle {
  item(): string | null;
  identity(): Identity | null;
  /** The notation drawn and the facts written. */
  ready(): boolean;
  hear(): { playing: 'both' | 'R' | 'L' | null; heardComplete: boolean; pitches: number[]; tempoPct: number };
  handPitches(): { R: number[]; L: number[] };
  decisions(): { event: string; item: string; state: LocalState }[];
}

declare global {
  interface Window {
    __pianopathMicroscope?: MicroscopeHandle;
  }
}

const STYLE_ID = 'microscope-style';
const STYLE = `
.card.microscope { max-width: 1280px; display: flex; flex-direction: column; gap: 12px; }
@media (max-width: 600px) { .card.microscope { padding: 12px; } }
.microscope h2 { font-size: 1.05rem; margin: 0; }
.microscope h3 { font-size: 0.95rem; margin: 0 0 4px; }
.microscope__muted { color: var(--text-muted); font-size: 0.85rem; margin: 0; }
.microscope__tiers { display: flex; flex-wrap: wrap; gap: 6px; }
.microscope__tiers .button { font-size: 0.85rem; min-height: 36px; padding: 4px 10px; }
.microscope__tiers .button[aria-pressed='true'] { outline: 2px solid var(--accent); }
.microscope__pick { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
/* On a phone the queue is one scrolling row of tiers and one row of picking, so the item
   and its notation start in the first screenful. */
@media (max-width: 600px) {
  .microscope__tiers { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; }
  .microscope__tiers .button { white-space: nowrap; flex: 0 0 auto; }
  .microscope__pick { flex-wrap: nowrap; }
  .microscope__pick .button { min-width: 44px; padding: 4px 8px; }
  .microscope__pick [data-hook='position'] { display: none; }
}
.microscope select, .microscope input[type='text'], .microscope textarea {
  min-height: 40px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg); color: var(--text); padding: 4px 8px; max-width: 100%; font: inherit;
}
.microscope__pick select { flex: 1 1 240px; min-width: 0; }
.microscope__layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
@media (min-width: 960px) { .microscope__layout { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); } }
.microscope__side { display: flex; flex-direction: column; gap: 10px; }
.microscope__stage { height: min(62vh, 560px); min-height: 260px; border: 1px solid var(--border); border-radius: 8px; }
/* On a phone the Score screen gives the notation the whole width of the screen: so does this,
   out through the container's and the card's padding (16 + 12 + the border). */
@media (max-width: 600px) {
  .microscope__stage { margin: 0 -29px; height: calc(100svh - 210px); border-radius: 0; border-left: none; border-right: none; }
}
.microscope__row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.microscope__facts { display: flex; flex-direction: column; gap: 10px; font-size: 0.9rem; }
.microscope__facts section { border-top: 1px solid var(--border); padding-top: 6px; }
.microscope__facts ul { margin: 0; padding-left: 18px; }
.microscope__facts table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
.microscope__facts td, .microscope__facts th { text-align: left; padding: 2px 6px 2px 0; vertical-align: top; }
.microscope__warn { color: var(--danger, #b3261e); }
.microscope__decide { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
.microscope fieldset { border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.microscope fieldset label { display: inline-flex; gap: 4px; align-items: center; margin-right: 10px; }
.microscope fieldset label[aria-disabled='true'] { color: var(--text-muted); }
.microscope textarea { min-height: 56px; }
.microscope__decisions li[data-state='unexported'] { font-weight: 600; }
`;

// --- the screen -------------------------------------------------------------------------

export function DevMicroscopeScreen(router: Router): HTMLElement {
  // The excerpt view (E1): the proposer's candidates, beside the item view, by address.
  if (router.route.devItem === EXCERPT_VIEW) return DevExcerptView(router);
  const { section, card } = createSubScreen(router, {
    id: 'dev-microscope',
    title: 'Microscope (dev)',
    backTo: 'today',
    backLabel: 'Today',
  });
  card.classList.add('microscope');
  if (!document.getElementById(STYLE_ID)) {
    document.head.append(el('style', { id: STYLE_ID, text: STYLE }));
  }

  const status = el('p.microscope__muted', { id: 'microscope-status', text: 'Loading the catalogue and the review data…' });
  card.append(status);

  let disposed = false;
  let renderer: WindowRenderer | null = null;
  let session: ScoreSession | null = null;
  let model: ScoreModel | null = null;
  let identity: Identity | null = null;
  let ready = false;
  let playing: 'both' | 'R' | 'L' | null = null;
  let heardComplete = false;
  let starting = false;
  const scheduled = new Set<number>();
  let rerenderDecisions: () => void = () => undefined;

  const handle: MicroscopeHandle = {
    item: () => router.route.devItem ?? null,
    identity: () => identity,
    ready: () => ready,
    hear: () => ({ playing, heardComplete, pitches: [...scheduled].sort((a, b) => a - b), tempoPct: 100 }),
    handPitches: () => {
      const out = { R: new Set<number>(), L: new Set<number>() };
      for (const step of model?.steps ?? []) for (const note of step.notes) out[note.hand === 'L' ? 'L' : 'R'].add(note.midi);
      return { R: [...out.R].sort((a, b) => a - b), L: [...out.L].sort((a, b) => a - b) };
    },
    decisions: () => [],
  };
  window.__pianopathMicroscope = handle;

  onScreenDispose(section, () => {
    disposed = true;
    session?.dispose();
    session = null;
    renderer?.dispose();
    renderer = null;
    if (window.__pianopathMicroscope === handle) delete window.__pianopathMicroscope;
    document.getElementById(STYLE_ID)?.remove();
  });

  void (async () => {
    let catalog: CatalogItem[];
    let data: MicroscopeData;
    try {
      [catalog, data] = await Promise.all([loadCatalog(), loadData()]);
    } catch (cause) {
      status.textContent = `Could not load: ${cause instanceof Error ? cause.message : String(cause)}`;
      return;
    }
    if (disposed) return;
    const byId = new Map(catalog.map((item) => [item.id, item]));
    const buildIdentity = (id: string): Identity | undefined => (byId.has(id) ? data.items[id]?.identity : undefined);
    const recordEvents: ReviewEvent[] = Object.values(data.items).flatMap((facts) => facts.events ?? []).map((row) => {
      const { line: _line, status: _status, ...event } = row;
      return event;
    });
    const merged = new Set(recordEvents.map((event) => event.event));

    let local = readLocal();
    const stateOf = (decision: LocalDecision): LocalState => {
      if (merged.has(decision.event.event)) return 'merged';
      const event = decision.event;
      if (event.identity !== undefined && !sameIdentity(event.identity, buildIdentity(event.item))) return 'stale';
      return decision.exportedAt ? 'exported' : 'unexported';
    };
    /** The record as it will be once this device's decisions are merged. */
    const allEvents = (): ReviewEvent[] => [
      ...recordEvents,
      ...local.filter((one) => !merged.has(one.event.event)).map((one) => one.event),
    ];
    const current = (): { decided: Map<string, Decided>; status: Map<string, EventStatus> } => resolve(allEvents(), buildIdentity);
    handle.decisions = () => local.map((one) => ({ event: one.event.event, item: one.event.item, state: stateOf(one) }));

    const requested = router.route.devItem;
    const flagged = (): string[] => [...new Set(flagsOf(allEvents(), buildIdentity).map((flag) => flag.item))];
    if (requested === undefined || !byId.has(requested)) {
      const first = flagged()[0] ?? data.queue.find((tier) => tier.items.length > 0)?.items[0];
      status.textContent =
        requested === undefined ? 'Opening the first item of the queue…' : `${requested} is not in the catalogue; opening the queue.`;
      if (first) router.navigateDev('microscope', first);
      return;
    }
    const item = byId.get(requested)!;
    const facts = data.items[item.id];
    if (!facts) {
      status.textContent = `${item.id} has no review data: rebuild the content.`;
      return;
    }
    status.remove();

    // --- the queue ------------------------------------------------------------------
    const tiers: { id: string; title: string; items: string[] }[] = [
      ...(flagged().length > 0 ? [{ id: 'flagged', title: 'Flagged by triage: never counted', items: flagged() }] : []),
      ...data.queue,
    ];
    let shownTier = tiers.find((tier) => tier.id === facts.tier) ?? tiers[0]!;
    const decidedCount = (ids: string[]): number => {
      const { decided } = current();
      return ids.filter((id) => Object.keys(decided.get(id) ?? {}).length === DIMENSIONS.length).length;
    };
    const queueBlock = el('section.microscope__queue', { 'data-hook': 'queue' });
    const tierRow = el('div.microscope__tiers', { role: 'group', 'aria-label': 'Queue tiers' });
    const picker = el('select', { id: 'microscope-item', 'aria-label': 'Item' }) as HTMLSelectElement;
    const position = el('span.microscope__muted', { 'data-hook': 'position' });
    const drawQueue = (): void => {
      tierRow.replaceChildren(
        ...tiers.map((tier, index) => {
          const chip = button(
            `${String(index + 1)}. ${TIER_WORDS[tier.id] ?? tier.id} · ${String(tier.items.length)} · decided ${String(decidedCount(tier.items))}`,
            () => {
              shownTier = tier;
              drawQueue();
            },
            { id: `microscope-tier-${tier.id}` },
          );
          chip.title = tier.title;
          chip.setAttribute('aria-pressed', String(tier === shownTier));
          chip.dataset.tier = tier.id;
          return chip;
        }),
      );
      const { decided } = current();
      picker.replaceChildren(
        ...shownTier.items.map((id) => {
          const count = Object.keys(decided.get(id) ?? {}).length;
          const mark = count === DIMENSIONS.length ? '✓✓' : count === 1 ? '✓·' : '··';
          const option = el('option', { value: id, text: `${mark} ${byId.get(id)?.title ?? id}` }) as HTMLOptionElement;
          option.selected = id === item.id;
          return option;
        }),
      );
      const at = shownTier.items.indexOf(item.id);
      position.textContent =
        at >= 0
          ? `${String(at + 1)} of ${String(shownTier.items.length)} in ${TIER_WORDS[shownTier.id] ?? shownTier.id}`
          : `${item.id} is not in this tier`;
    };
    const step = (delta: number): void => {
      const list = shownTier.items;
      const at = list.indexOf(item.id);
      const next = list[at < 0 ? 0 : Math.min(list.length - 1, Math.max(0, at + delta))];
      if (next && next !== item.id) router.navigateDev('microscope', next);
    };
    picker.addEventListener('change', () => router.navigateDev('microscope', picker.value));
    queueBlock.append(
      tierRow,
      el(
        'div.microscope__pick',
        {},
        button('◀', () => step(-1), { id: 'microscope-prev', ariaLabel: 'Previous item in this tier' }),
        picker,
        button('▶', () => step(1), { id: 'microscope-next', ariaLabel: 'Next item in this tier' }),
        position,
      ),
    );
    card.append(queueBlock);
    drawQueue();

    // --- the item -------------------------------------------------------------------
    const source = item.provenance?.source ?? 'unknown';
    card.append(
      el(
        'section',
        { 'data-hook': 'item', 'data-item': item.id },
        el('h2', { id: 'microscope-title', text: item.title }),
        el('p.microscope__muted', {
          text: `${item.id} · ${source} · ${item.type} · level ${String(item.level)}${item.levelSource === 'estimated' ? ' (estimated)' : ''} · ${item.hands} hand${item.hands === 'both' ? 's' : ''}`,
        }),
      ),
    );

    // The music across the whole width first, as the Score screen gives it the whole width;
    // then the facts beside the decision (stacked on a phone).
    const music = el('section.microscope__music', { 'data-hook': 'music' });
    const layout = el('div.microscope__layout');
    const factsBlock = el('section.microscope__facts', { 'data-hook': 'facts' });
    const side = el('section.microscope__side', { 'data-hook': 'side' });
    layout.append(factsBlock, side);
    card.append(music, layout);

    const stage = el('div.microscope__stage', { id: 'microscope-stage' });
    const windowWords = el('span.microscope__muted', { 'data-hook': 'window' });
    const hearStatus = el('p.microscope__muted', { id: 'microscope-hear-status', 'aria-live': 'polite' });
    const hearBoth = button('Hear it — both hands', () => void hear('both'), { id: 'microscope-hear', variant: 'primary' });
    const hearRight = button('Right hand alone', () => void hear('R'), { id: 'microscope-hear-right' });
    const hearLeft = button('Left hand alone', () => void hear('L'), { id: 'microscope-hear-left' });
    const stopButton = button('Stop', () => stop(), { id: 'microscope-stop' });
    for (const control of [hearBoth, hearRight, hearLeft, stopButton]) control.disabled = true;
    music.append(
      stage,
      el(
        'div.microscope__row',
        {},
        button('◀ Bars', () => pageWindow(-1), { id: 'microscope-window-prev' }),
        button('Bars ▶', () => pageWindow(1), { id: 'microscope-window-next' }),
        windowWords,
      ),
      el('div.microscope__row', {}, hearBoth, hearRight, hearLeft, stopButton),
      hearStatus,
    );

    const writtenBpm = (): number | null => (model ? Math.round(bpmAt(model.tempoMap, 0)) : null);
    const drawWindow = (): void => {
      const shown = renderer?.currentWindow;
      windowWords.textContent =
        shown && model
          ? `bars ${String(shown.fromMeasure + 1)}–${String(shown.toMeasure + 1)} of ${String(model.sourceMeasureCount)}`
          : '';
    };
    function pageWindow(delta: number): void {
      if (!renderer || !model || playing) return;
      const shown = renderer.currentWindow;
      if (!shown) return;
      // The window is in printed bars (`MeasureRange`), so the page turns on them too.
      const span = shown.toMeasure - shown.fromMeasure + 1;
      const from = delta > 0 ? shown.toMeasure + 1 : Math.max(0, shown.fromMeasure - span);
      if (delta < 0 && shown.fromMeasure === 0) return;
      const target = model.steps.find((one) => one.sourceMeasureIndex >= from);
      if (!target) return;
      renderer.showStep(target.index);
      drawWindow();
    }

    /** The shared piano, counted: which pitches the app scheduled, for the hook. */
    const counted = (piano: Piano): Piano =>
      ({
        start: (note: Parameters<Piano['start']>[0]) => {
          scheduled.add(note.midi);
          return piano.start(note);
        },
        stop: (midi?: number) => piano.stop(midi),
      }) as unknown as Piano;

    async function hear(which: 'both' | 'R' | 'L'): Promise<void> {
      if (!model || !renderer || starting) return;
      starting = true;
      hearStatus.textContent = 'Starting the sound…';
      try {
        // Inside the tap: the context is made and resumed by the gesture, and the session
        // is built with it (a session built before any gesture holds no context and plays
        // nothing).
        const context = await audioEngine.ensureStarted();
        const piano = await getPiano();
        if (disposed || !model || !renderer) return;
        session ??= new ScoreSession({
          model,
          renderer,
          piano: counted(piano),
          audioContext: context,
          destination: audioEngine.masterGain,
          // The window follows the cursor while it plays; the bar line under the stage with it.
          onChange: () => drawWindow(),
          onFinished: (_score, looped) => {
            if (looped) return;
            const finished = playing;
            playing = null;
            if (finished === 'both') {
              heardComplete = true;
              hearStatus.textContent = `Played to the end: complete, both hands, at the written tempo (♩ = ${String(writtenBpm())}). A decision may rest on hearing for this visit.`;
            } else {
              hearStatus.textContent = `Played to the end: the ${finished === 'R' ? 'right' : 'left'} hand alone. Hand-alone playback supports a notation review; it is not heard.`;
            }
            drawControls();
            rerenderDecisions();
          },
        });
        scheduled.clear();
        playing = which;
        // Each hand alone is the app's own playback of "the hand you are not practising":
        // focusing the left hand plays the right, and the other way round.
        const playbackHands: PlaybackHands = which === 'both' ? 'both' : 'non-focused';
        session.start({
          mode: 'listen',
          hands: which === 'both' ? 'both' : which === 'R' ? 'L' : 'R',
          tempoPct: 100,
          countInBars: 0,
          playbackHands,
          metronome: false,
          latchStart: false,
          holdAtStart: false,
          judging: false,
        });
        hearStatus.textContent =
          which === 'both'
            ? `Playing both hands at the written tempo (♩ = ${String(writtenBpm())}, 100%).`
            : `Playing the ${which === 'R' ? 'right' : 'left'} hand alone at the written tempo.`;
      } catch (cause) {
        playing = null;
        hearStatus.textContent = `No sound: ${cause instanceof Error ? cause.message : String(cause)}. Decisions from this visit stay notation or inspected.`;
      } finally {
        starting = false;
        drawControls();
      }
    }

    function stop(): void {
      if (!session || !playing) return;
      session.stop();
      const was = playing;
      playing = null;
      hearStatus.textContent =
        was === 'both'
          ? 'Stopped part way: a partial playback stays notation.'
          : 'Stopped.';
      drawControls();
    }

    function drawControls(): void {
      const hands = handle.handPitches();
      const loaded = model !== null && renderer !== null;
      hearBoth.disabled = !loaded || starting || playing !== null;
      hearRight.disabled = !loaded || starting || playing !== null || hands.R.length === 0;
      hearLeft.disabled = !loaded || starting || playing !== null || hands.L.length === 0;
      stopButton.disabled = playing === null;
    }

    // --- notation ---------------------------------------------------------------------
    async function loadNotation(): Promise<void> {
      if (!item.file) {
        stage.replaceChildren(
          el('p.microscope__muted', {
            text: `No score to render: ${item.measurement && 'reason' in item.measurement ? item.measurement.reason : 'no notation is bundled'}.`,
          }),
        );
        identity = identityOf(item, null);
        return;
      }
      const response = await fetch(contentUrl(item.file));
      if (!response.ok) throw new Error(`${item.file}: ${String(response.status)}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const sha = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      identity = identityOf(item, sha);
      const musicXml = toMusicXml(bytes);
      // The model from an instance with no draw range, as the Score screen does: a windowed
      // OSMD clamps its cursor iterator.
      const probe = new OsmdView(document.createElement('div'));
      await probe.load(musicXml);
      const loaded = probe.extractModel({ id: item.id });
      probe.dispose();
      if (disposed) return;
      if (loaded.steps.length === 0) {
        stage.replaceChildren(el('p.microscope__muted', { text: 'The score has no notes to play.' }));
        return;
      }
      model = loaded;
      const settings = { ...getSettings() };
      if (isTablet()) {
        settings.barsPerWindow = barsPerWindowFor(settings.barsPerWindow, {
          tablet: true,
          storedIsDefault: settings.barsPerWindow === DEFAULT_SETTINGS.barsPerWindow,
        });
      }
      // What the Score screen engraves, from the same settings (`ScoreScreen.ts`).
      renderer = await WindowRenderer.create({
        container: stage,
        model: loaded,
        musicXml,
        barsPerWindow: settings.barsPerWindow,
        zoom: settings.zoom,
        layout: settings.layout,
        handsFocus: 'both',
        drawFingerings: settings.showFingering,
        drawMetronomeMarks: false,
        drawLyrics: false,
        drawChordSymbols: settings.showChordSymbols,
        onWindow: () => drawWindow(),
      });
      if (disposed) {
        renderer.dispose();
        renderer = null;
        return;
      }
      renderer.showStep(0);
      drawWindow();
    }

    try {
      await loadNotation();
    } catch (cause) {
      stage.replaceChildren(
        el('p.microscope__warn', { text: `The app could not render it: ${cause instanceof Error ? cause.message : String(cause)}` }),
      );
      identity ??= identityOf(item, null);
    }
    if (disposed) return;
    drawControls();
    hearStatus.textContent = model
      ? `Hear it plays the whole piece at the written tempo (♩ = ${String(writtenBpm())})${
          item.tempoBpm && writtenBpm() !== null && Math.round(item.tempoBpm) !== writtenBpm()
            ? `; the catalogue says ♩ = ${String(item.tempoBpm)}`
            : ''
        }. Only a complete both-hands playback lets a decision rest on hearing.`
      : 'Nothing to hear.';

    // --- facts ------------------------------------------------------------------------
    const family = facts.family ? data.families[facts.family] : undefined;
    const fact = (key: string, heading: string, ...body: (Node | string)[]): HTMLElement =>
      el('section', { 'data-fact': key }, el('h3', { text: heading }), ...body);
    const list = (lines: string[]): HTMLElement => el('ul', {}, ...lines.map((line) => el('li', { text: line })));
    const text = (line: string, className = ''): HTMLElement => el(className ? `p.${className}` : 'p', { text: line });

    const identityWords = (one: Identity | null): string => {
      if (!one) return 'unknown';
      if (one.kind === 'file') return `the built file, sha256 ${one.sha256.slice(0, 16)}…`;
      if (one.kind === 'generator') return `generator ${one.family} v${String(one.version)}, seed ${String(one.seed)}, recipe ${JSON.stringify(one.recipe)}, ♩ = ${String(one.tempoBpm)}`;
      return `none (${one.why ?? 'no file'}): a decision here cannot go stale and is shown as weaker`;
    };
    const buildAgrees = identity === null || sameIdentity(identity, facts.identity);
    factsBlock.append(
      fact(
        'identity',
        'Identity a decision binds to',
        text(identityWords(identity)),
        ...(buildAgrees ? [] : [text(`The build recorded ${identityWords(facts.identity)}: rebuild before deciding, or the merge will refuse it.`, 'microscope__warn')]),
      ),
    );

    const generator = identity?.kind === 'generator' ? identity : null;
    factsBlock.append(
      fact('family', 'Family', text(family ? `${facts.family ?? ''} — ${family.name}` : `not generated (${source})`)),
      fact('version', 'Version', text(generator ? `v${String(generator.version)}` : '—')),
      fact('seed', 'Seed', text(generator ? `${String(generator.seed)}${generator.seed === null ? ' (a deterministic family: the recipe is the identity)' : ''}` : '—')),
      fact('role', 'Role', text(facts.role ?? item.role ?? '— (no role: not a generated item)')),
    );
    if (family) {
      const promise = family.promise.find((rule) => rule.promise === facts.promise) ?? family.promise[family.promise.length - 1];
      factsBlock.append(
        fact('promise', 'Promise', text(`${facts.promise ?? '?'}: ${promise?.why ?? ''}`), text(family.admission, 'microscope__muted')),
        fact(
          'heard',
          'Heard',
          text(family.heard ? 'heard: a person has heard this family (the record holds a heard decision)' : 'unheard: no person has heard this family'),
        ),
        fact(
          'target',
          'Target',
          facts.target?.primary
            ? text(`${facts.target.primary}${facts.target.secondary.length ? `; also ${facts.target.secondary.join(', ')}` : ''}`)
            : text(`not judged by the app — candidate ${facts.notJudged?.candidate ?? '?'}: ${facts.notJudged?.why ?? ''}`),
        ),
        fact(
          'musical',
          'Musical quality',
          ...musicalLines(facts, family, data.evaluator).map((line) => text(line)),
          list(family.unjudged.map((line) => `unjudged: ${line}`)),
        ),
      );
    } else {
      factsBlock.append(
        fact('promise', 'Promise', text('— (a family contract states a promise; this item has none)')),
        fact('heard', 'Heard', text('— (heard is a family declaration)')),
        fact('target', 'Target', text('— (declared by a family contract or a reading row; not this item)')),
        fact('musical', 'Musical quality', ...musicalLines(facts, undefined).map((line) => text(line))),
      );
    }

    const verdictWords = (one: DemandFact): string => {
      const parts: string[] = [];
      if (one.verdict === 'required') parts.push(one.atDensity ? 'required, at density' : 'required, below density');
      else if (one.verdict === 'forbidden') parts.push('forbidden by the contract');
      else if (one.verdict === 'established') parts.push('established (useful density; not the point)');
      else parts.push('incidental (below useful density)');
      if (one.assumed) parts.push('assumed');
      if ('untaught' in one) parts.push(`untaught on the earliest rung (taught at ${one.untaught ?? 'no rung'})`);
      if (one.misread) parts.push('misread by the detectors on this file');
      return parts.join('; ');
    };
    const demandsBody: HTMLElement =
      facts.demands.length > 0
        ? el(
            'table',
            {},
            el('tr', {}, el('th', { text: 'Demand' }), el('th', { text: 'Located' }), el('th', { text: 'Verdict' })),
            ...facts.demands.map((one) =>
              el(
                'tr',
                { 'data-demand': one.demand, 'data-verdict': one.verdict },
                el('td', { text: one.demand }),
                el('td', { text: String(one.located) }),
                el('td', { text: verdictWords(one) }),
              ),
            ),
          )
        : text(
            item.measurement && 'reason' in item.measurement
              ? `Not measured: ${item.measurement.reason}`
              : 'No demands measured.',
          );
    const warning = contractWarning(facts);
    factsBlock.append(
      fact(
        'demands',
        'Measured demands (the app’s detectors) and the contract’s verdict',
        demandsBody,
        ...(warning ? [text(warning, 'microscope__warn')] : []),
      ),
    );

    const physicalLines: string[] = [];
    if (family) {
      const p = family.physical;
      physicalLines.push(`widest one-hand span allowed: ${String(p.maxSpan)} semitones; fastest rate: ${String(p.maxRate)} notes a second`);
      if (p.leaps) physicalLines.push(`leaps up to ${String(p.leaps.max)} semitones with at least ${String(p.leaps.minSeconds)} s: ${p.leaps.why ?? ''}`);
      physicalLines.push(`fingering: ${p.fingering.printed}${p.fingering.source ? ` (${String(p.fingering.source)})` : ''}${p.fingering.note ? ` — ${p.fingering.note}` : ''}`);
    }
    const declared = item.provenance?.physical;
    if (declared) {
      physicalLines.push(
        `declared large-hand voicing${declared.largeHandSpan ? ` (${String(declared.largeHandSpan)} semitones)` : ''}: needs ${declared.prerequisite}; instead, ${declared.alternative}`,
      );
    }
    factsBlock.append(fact('physical', 'Physical flags', physicalLines.length ? list(physicalLines) : text('No contract: no physical limits stated.')));

    const provenance = item.provenance;
    factsBlock.append(
      fact(
        'provenance',
        'Provenance (as E0 labels each fact)',
        provenance ? list(provenanceLines(provenance)) : text('No provenance record.'),
      ),
    );

    factsBlock.append(
      fact(
        'rungs',
        'Rungs listing it, and what each claims of it',
        facts.rungs.length
          ? el(
              'div',
              {},
              ...facts.rungs.map((rung) =>
                el(
                  'div',
                  { 'data-rung': rung.rung },
                  text(`${rung.rung} — ${rung.title ?? ''}${rung.earliest ? ' (the earliest rung listing it)' : ''}`),
                  list([
                    ...rung.claims.map((claim) => `${claim.kind} ${claim.id}: ${claim.status}`),
                    ...(rung.unmeasurable.length ? [`needs a person’s judgement: ${rung.unmeasurable.join(', ')}`] : []),
                    ...(rung.untaught.length ? [`untaught here: ${rung.untaught.join(', ')}`] : []),
                  ]),
                ),
              ),
            )
          : text('No rung lists it: it reaches a learner only through the Library or a swap.'),
      ),
    );

    const reviewsBody = el('div', { 'data-hook': 'reviews' });
    factsBlock.append(fact('reviews', 'Reviews of it', reviewsBody));

    // --- deciding ---------------------------------------------------------------------
    const decideBlock = el('section.microscope__decide', { 'data-hook': 'decide' });
    const reviewer = el('input', {
      id: 'microscope-reviewer',
      type: 'text',
      placeholder: 'Your name, as the record should give it',
      'aria-label': 'Reviewer',
    }) as HTMLInputElement;
    try {
      reviewer.value = localStorage.getItem(REVIEWER_KEY) ?? '';
    } catch {
      reviewer.value = '';
    }
    reviewer.addEventListener('change', () => localStorage.setItem(REVIEWER_KEY, reviewer.value.trim()));
    side.append(
      el('h2', { text: 'Decide' }),
      el('div.microscope__row', {}, el('label', { htmlFor: 'microscope-reviewer', text: 'Reviewer' }), reviewer),
      decideBlock,
    );

    const forms = new Map<Dimension, { heard: HTMLInputElement; heardLabel: HTMLElement; now: HTMLElement; message: HTMLElement }>();
    for (const dimension of DIMENSIONS) {
      const words = DIMENSION_WORDS[dimension];
      const now = el('p.microscope__muted', { 'data-hook': `now-${dimension}` });
      const valueRow = el(
        'div',
        { role: 'radiogroup', 'aria-label': `${words.title}: value` },
        ...VALUES.map((value) =>
          el('label', {}, el('input', { type: 'radio', name: `value-${dimension}`, value, id: `value-${dimension}-${value}` }), value),
        ),
      );
      const category = el(
        'select',
        { id: `category-${dimension}`, 'aria-label': `${words.title}: category` },
        el('option', { value: '', text: 'Category…' }),
        ...CATEGORIES[dimension].map((one) => el('option', { value: one, text: one })),
      ) as HTMLSelectElement;
      const makeBasis = (basis: Basis): { input: HTMLInputElement; label: HTMLElement } => {
        const input = el('input', { type: 'radio', name: `basis-${dimension}`, value: basis, id: `basis-${dimension}-${basis}` }) as HTMLInputElement;
        return { input, label: el('label', {}, input, BASIS_WORDS[basis]) };
      };
      // In the order `BASES` gives, weakest first.
      const bases = { inspected: makeBasis('inspected'), notation: makeBasis('notation'), heard: makeBasis('heard') };
      const basisRow = el(
        'div',
        { role: 'radiogroup', 'aria-label': `${words.title}: basis` },
        ...BASES.map((basis) => bases[basis].label),
      );
      const heard = bases.heard.input;
      const heardLabel = bases.heard.label;
      const reason = el('input', { id: `reason-${dimension}`, type: 'text', placeholder: 'Reason', 'aria-label': `${words.title}: reason` }) as HTMLInputElement;
      const note = el('textarea', { id: `note-${dimension}`, placeholder: 'Note (optional): what you auditioned, what to fix', 'aria-label': `${words.title}: note` }) as HTMLTextAreaElement;
      const message = el('p.microscope__muted', { 'data-hook': `message-${dimension}`, 'aria-live': 'polite' });
      const record = button(`Record: ${words.title.toLowerCase()}`, () => {
        const checked = (name: string): string | undefined =>
          decideBlock.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;
        const value = VALUES.find((one) => one === checked(`value-${dimension}`));
        const basis = BASES.find((one) => one === checked(`basis-${dimension}`));
        const by = reviewer.value.trim();
        if (!by) return void (message.textContent = 'Give your name first: the record says who decided.');
        if (!value || !basis || !category.value || !reason.value.trim()) {
          return void (message.textContent = 'Choose a value, a category and a basis, and give a reason.');
        }
        if (basis === 'heard' && !heardComplete) {
          return void (message.textContent = 'Heard needs a complete both-hands playback at the written tempo in this visit.');
        }
        const previous = current().decided.get(item.id)?.[dimension];
        const event: HumanEvent = {
          v: 1,
          event: `ev-${crypto.randomUUID()}`,
          item: item.id,
          identity: identity ?? identityOf(item, null),
          dimension,
          value,
          basis,
          category: category.value,
          reason: reason.value.trim(),
          ...(note.value.trim() ? { note: note.value.trim() } : {}),
          by,
          at: new Date().toISOString(),
          ...(previous ? { supersedes: previous.event } : {}),
        };
        const fault = eventFault(event);
        if (fault) return void (message.textContent = `Not recorded: ${fault}.`);
        local = [...local, { event }];
        writeLocal(local);
        message.textContent = `Recorded on this device: ${value} (${basis}). Export it to put it in the record.`;
        reason.value = '';
        note.value = '';
        rerenderDecisions();
        drawQueue();
      }, { id: `record-${dimension}`, variant: 'primary' });
      decideBlock.append(
        el(
          'fieldset',
          { id: `decide-${dimension}`, 'data-dimension': dimension },
          el('legend', { text: words.title }),
          el('p.microscope__muted', { text: words.ask }),
          now,
          valueRow,
          category,
          basisRow,
          reason,
          note,
          record,
          message,
        ),
      );
      forms.set(dimension, { heard, heardLabel, now, message });
    }

    const flagReason = el('input', { id: 'microscope-flag-reason', type: 'text', placeholder: 'Why it should be looked at', 'aria-label': 'Flag reason' }) as HTMLInputElement;
    const flagMessage = el('span.microscope__muted', { 'aria-live': 'polite' });
    side.append(
      el(
        'div.microscope__row',
        {},
        flagReason,
        button('Flag (triage: never counts)', () => {
          if (!flagReason.value.trim()) return void (flagMessage.textContent = 'Give the flag a reason.');
          const event: TriageEvent = {
            v: 1,
            event: `ev-${crypto.randomUUID()}`,
            item: item.id,
            identity: identity ?? identityOf(item, null),
            reason: flagReason.value.trim(),
            by: TRIAGE,
            from: reviewer.value.trim() || 'the microscope',
            at: new Date().toISOString(),
          };
          local = [...local, { event }];
          writeLocal(local);
          flagReason.value = '';
          flagMessage.textContent = 'Flagged on this device.';
          rerenderDecisions();
        }, { id: 'microscope-flag' }),
        flagMessage,
      ),
    );

    const decisionsList = el('ul.microscope__decisions', { id: 'microscope-decisions' });
    const exportButton = button('Export', () => exportDecisions(), { id: 'microscope-export', variant: 'primary' });
    const exportMessage = el('p.microscope__muted', { id: 'microscope-export-status', 'aria-live': 'polite' });
    side.append(
      el(
        'section',
        { 'data-hook': 'device' },
        el('h2', { text: 'Decisions on this device' }),
        decisionsList,
        el('div.microscope__row', {}, exportButton),
        exportMessage,
      ),
    );

    const describe = (event: ReviewEvent): string =>
      isTriage(event)
        ? `flag: ${event.reason}`
        : `${DIMENSION_WORDS[event.dimension].title}: ${event.value} (${event.basis}, ${event.category}) — ${event.reason}`;

    rerenderDecisions = (): void => {
      const { decided, status: statuses } = current();
      const mine = decided.get(item.id) ?? {};
      for (const dimension of DIMENSIONS) {
        const form = forms.get(dimension)!;
        const now = mine[dimension];
        form.now.textContent = now
          ? `Now: ${now.value} (${now.basis}) · ${now.by} · ${now.at.slice(0, 10)} · ${merged.has(now.event) ? 'in the record' : 'on this device, not yet merged'}${now.identity.kind === 'none' ? ' · identity none (weaker)' : ''}`
          : 'Now: undecided.';
        form.heard.disabled = !heardComplete;
        form.heardLabel.setAttribute('aria-disabled', String(!heardComplete));
        form.heardLabel.title = heardComplete ? '' : 'Play the whole piece with both hands first (Hear it).';
      }
      const rows: HTMLElement[] = [];
      const recordRows = facts.events ?? [];
      for (const row of recordRows) {
        rows.push(el('li', { 'data-status': row.status, text: `record line ${String(row.line)} — ${describe(row)} · ${row.by === TRIAGE ? (row as TriageEvent).from ?? 'triage' : row.by} · ${row.at.slice(0, 10)} · ${row.status}` }));
      }
      for (const one of local.filter((decision) => decision.event.item === item.id && !merged.has(decision.event.event))) {
        rows.push(el('li', { 'data-status': statuses.get(one.event.event) ?? 'local', text: `this device — ${describe(one.event)} · ${stateOf(one)}` }));
      }
      const keep = (provenance as { quarryKeep?: string } | undefined)?.quarryKeep;
      if (keep) rows.push(el('li', { text: `PDMX quarry: ${keep} (tools/content/pdmx/review.py) — a source-level decision, neither bit` }));
      reviewsBody.replaceChildren(rows.length ? el('ul', {}, ...rows) : text('No review of it yet.'));

      decisionsList.replaceChildren(
        ...local.map((one) =>
          el('li', { 'data-state': stateOf(one), 'data-event': one.event.event }, `${stateOf(one)} — ${byId.get(one.event.item)?.title ?? one.event.item}: ${describe(one.event)}`),
        ),
      );
      const exportable = local.filter((one) => {
        const state = stateOf(one);
        return state === 'unexported' || state === 'exported';
      });
      exportButton.textContent = `Export ${String(exportable.length)} decision${exportable.length === 1 ? '' : 's'}`;
      exportButton.disabled = exportable.length === 0;
      const waiting = local.filter((one) => stateOf(one) === 'unexported').length;
      if (!exportMessage.dataset.exported) {
        exportMessage.textContent = waiting
          ? `${String(waiting)} decision${waiting === 1 ? '' : 's'} not yet exported: they live only on this device until exported and merged.`
          : local.length
            ? 'Nothing waiting to export.'
            : 'No decisions on this device.';
      }
    };

    function exportDecisions(): void {
      const exportable = local.filter((one) => {
        const state = stateOf(one);
        return state === 'unexported' || state === 'exported';
      });
      if (exportable.length === 0) return;
      const textOut = exportable.map((one) => serializeEvent(one.event)).join('\n') + '\n';
      const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, '');
      const name = `review-decisions-${stamp}.jsonl`;
      const url = URL.createObjectURL(new Blob([textOut], { type: 'application/x-ndjson' }));
      const link = el('a', { href: url, download: name }) as HTMLAnchorElement;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      const at = new Date().toISOString();
      const ids = new Set(exportable.map((one) => one.event.event));
      local = local.map((one) => (ids.has(one.event.event) ? { ...one, exportedAt: at } : one));
      writeLocal(local);
      exportMessage.dataset.exported = 'true';
      exportMessage.textContent = `Exported ${String(exportable.length)} as ${name}. Merge it: python tools/content/review.py --merge ${name} — rerunning it appends nothing.`;
      rerenderDecisions();
    }

    rerenderDecisions();
    ready = true;
    section.dataset.ready = 'true';
  })();

  return section;
}
