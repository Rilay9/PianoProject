"""G1e, the reviewer's required change: the one predicate in usable(), every automatic path through it; a rung's
ask held by the learner's pause said once. Each anchor must be found exactly once."""
from pathlib import Path

p = Path("app/src/curriculum/session.ts")
raw = p.read_bytes()
crlf = b"\r\n" in raw
t = raw.decode("utf-8").replace("\r\n", "\n")

R = []

# --- the import comment
R.append((
"""// read of the learner's projects (G1d, the reviewer's G82 ruling; G1e, its review's required change):
// `buildSession` looks each piece's project up with `projectIn` over the rows Today hands in
// (`BuildInput.projects`), once, as the card's one rule for automatic offers (`SlotContext.pausedOrPutAway`),
// and every chooser that offers a piece of its own accord reads that. Nothing here opens the store.""",
"""// read of the learner's projects (G1d, the reviewer's G82 ruling; G1e, its review's required change and the
// reviewer's ruling on G1e): `buildSession` looks each piece's project up with `projectIn` over the rows Today
// hands in (`BuildInput.projects`), once, as the card's one rule for automatic selection
// (`SlotContext.pausedOrPutAway`), which `usable()` asks for every slot. Nothing here opens the store."""))

# --- BuildInput.projects
R.append((
"""   * The learner's projects (G1b's `projects` store), read for one thing: automatic eligibility (G1d, the
   * reviewer's G82 ruling; G1e, the G1d review's required change). A piece whose project is `paused` or
   * `retired` is offered by no automatic chooser — the review's repertoire retention (*Keeping this piece
   * playable* would contradict what the learner said on the sheet), the repertoire slot's demand-based
   * choice, the fallback ladder's skill, demand and prerequisite steps, the exposure rule, the jam slot
   * and the transfer offer — never among their candidates; nothing on the card says why. A rung's
   * own ask (`runs`, `done`, `measure`, this lesson's or the next's) and the ladder's rung step are the
   * curriculum assigning material and do not read it (G1e item 3, a question for the reviewer). Every
   * other state, `maintaining` and `refreshing` among them, and no project leave every offer as it was.
   * Read once per card, in `buildSession` (`SlotContext.pausedOrPutAway`). Absent: nothing withdrawn.
   * Today loads it (`projectStore.allProjects`); the session never opens the store.""",
"""   * The learner's projects (G1b's `projects` store), read for one thing: automatic selection (G1d, the
   * reviewer's G82 ruling; G1e, the G1d review's required change; the reviewer's ruling on G1e,
   * `responses/questions-ea14b1fe.md`). A piece whose project is `paused` or `retired` is chosen by no slot of
   * the card — the review's repertoire retention (*Keeping this piece playable* would contradict what the
   * learner said on the sheet), the repertoire slot's demand-based choice, every step of the fallback ladder,
   * the exposure rule, the jam slot, the transfer offer, and a rung's own ask (`runs`, `done`, `measure`, this
   * lesson's or the next's): a rung assigning a piece does not override the learner's later pause. The rung's
   * other options are chosen; a rung ask whose every candidate is paused or put away revives none, is not
   * taken as met, and is said once, on the row that brings the rung's other material (`Want.held`). Otherwise
   * nothing on the card says why. Every other state, `maintaining` and `refreshing` (the learner's own
   * *Bring it back*) among them, and no project leave every offer as it was. Read once per card, in
   * `buildSession` (`SlotContext.pausedOrPutAway`), and asked in `usable()`. Absent: nothing withdrawn. Today
   * loads it (`projectStore.allProjects`); the session never opens the store. Opening a piece by hand, the
   * Library, the sheet and the history never read it."""))

# --- the rung claim
R.append((
"""  /** The fallback ladder's first step: the rung's own option, and the strand it is on (a track's title; absent for core). */
  | { kind: 'rung'; rung: Lesson; strand?: string }""",
"""  /**
   * The fallback ladder's first step: the rung's own option, and the strand it is on (a track's title; absent
   * for core). `held`: the rung asks for pieces the learner has every one paused or put away (`Want.held`), and
   * this row, the rung's other material, is the one that says the rung waits (G1e, the reviewer's ruling).
   */
  | { kind: 'rung'; rung: Lesson; strand?: string; held?: true }"""))

# --- SlotContext
R.append((
"""   * `paused` or `retired`. Built once per card in `buildSession`, the only place the session looks a
   * project up. Every chooser that offers a piece of its own accord reads it and steps past such a
   * piece; a rung's own ask and the ladder's rung step do not.
   */
  pausedOrPutAway: (item: CatalogItem) => boolean;""",
"""   * `paused` or `retired`. Built once per card in `buildSession`, the only place the session looks a
   * project up, and asked in `usable()`, the one door every slot's choice goes through: no slot chooses
   * such a piece (the reviewer's ruling on G1e: a rung's own ask included).
   */
  pausedOrPutAway: (item: CatalogItem) => boolean;
  /** The strands whose rung's held ask (`Want.held`) a row on the card already says: said once. */
  saidHeld: Set<string>;"""))

# --- usable()
R.append((
"""/**
 * A slot's eye on an item: playable, not on the card, never a reading row (the reading slot is the
 * reader's, L65), and admitted for teaching use (D3b): a generated item whose family promises music is
 * offered by no slot until a person's `yes` on its teaching use is built (`eligibility.admittedForTeaching`,
 * the gate's own reading). Every slot that takes an item from a rung's list without asking the gate — a
 * want's `offer` (`runs`, `done`, `measure`), the ladder's rung and prerequisite steps, the jam slot, the
 * exposure rule — chooses only through here, so a rung listing one is not a decision to teach it; where it
 * was a row's only candidate the row takes the next step that passes, or is dropped.
 *
 * Not the learner's projects (G1e): a rung's own ask takes its items through here too, and a rung's ask
 * is not an automatic offer (G1e item 3), so each automatic chooser reads `ctx.pausedOrPutAway` beside
 * this instead.
 */
function usable(ctx: SlotContext, item: CatalogItem | undefined, songs: 'any' | 'none' | 'only'): item is CatalogItem {
  if (!item || !playable(item) || ctx.used.has(item.id) || isReadingRow(item) || !admittedForTeaching(item)) return false;
  // A slot that leaves songs out leaves excerpts out (a passage of a piece is not technique); a slot
  // that wants songs wants the piece — the repertoire lifecycle keeps to songs (E1, adversary 10).
  if (songs === 'none' && isPieceMaterial(item)) return false;
  if (songs === 'only' && item.type !== 'song') return false;
  return true;
}""",
"""/**
 * A slot's eye on an item: playable, not on the card, never a reading row (the reading slot is the
 * reader's, L65), admitted for teaching use (D3b): a generated item whose family promises music is
 * offered by no slot until a person's `yes` on its teaching use is built (`eligibility.admittedForTeaching`,
 * the gate's own reading) — and not a piece the learner paused or put away (G1e; `ctx.pausedOrPutAway`).
 * Every slot chooses only through here: a want's `offer` (`runs`, `done`, `measure`, this lesson's and the
 * next's), every step of the fallback ladder, the jam slot, the exposure rule, retention, the repertoire
 * slot's claim and the transfer offer — so a rung listing an item is not a decision to teach it, nor to
 * override the learner's pause of it (the reviewer's ruling on G1e); where it was a row's only candidate the
 * row takes the next step that passes, or is dropped.
 */
function usable(ctx: SlotContext, item: CatalogItem | undefined, songs: 'any' | 'none' | 'only'): item is CatalogItem {
  return item !== undefined && !ctx.used.has(item.id) && candidate(item, songs) && !ctx.pausedOrPutAway(item);
}

/**
 * What `usable` asks of an item before the card and the learner's word: playable, never a reading row,
 * admitted for teaching use, and of the slot's kind. Asked alone only to tell whether a rung's ask is held by
 * the learner's pause (`Want.held`), never to choose.
 */
function candidate(item: CatalogItem, songs: 'any' | 'none' | 'only'): boolean {
  if (!playable(item) || isReadingRow(item) || !admittedForTeaching(item)) return false;
  // A slot that leaves songs out leaves excerpts out (a passage of a piece is not technique); a slot
  // that wants songs wants the piece — the repertoire lifecycle keeps to songs (E1, adversary 10).
  if (songs === 'none' && isPieceMaterial(item)) return false;
  if (songs === 'only' && item.type !== 'song') return false;
  return true;
}"""))

# --- Want
R.append((
"""interface Want {
  rung: Lesson;
  reading: RequirementReading;
  skill?: string;
  pool: CatalogItem[];
  offer: CatalogItem[];
}""",
"""interface Want {
  rung: Lesson;
  reading: RequirementReading;
  skill?: string;
  pool: CatalogItem[];
  offer: CatalogItem[];
  /**
   * Held by the learner (G1e, the reviewer's ruling): every candidate the rung could offer for this ask but
   * for the learner's word is a piece they paused or put away, so `offer` is empty and stays empty whatever
   * the card holds. The ask is not met and not skipped over — the rung still asks — and the card revives
   * none of them; the row that brings the rung's other material says the rung waits (`fresh`, `fallbackStep`).
   */
  held: boolean;
}"""))

R.append((
"""    const want: Want = { rung, reading, ...(skill === undefined ? {} : { skill }), pool, offer: pool.filter((item) => usable(ctx, item, songs) && fromList(ctx, item, rung)) };""",
"""    const offer = pool.filter((item) => usable(ctx, item, songs) && fromList(ctx, item, rung));
    // Held (G1e): what the ask could offer but for the learner's word is all paused or put away.
    const waiting = offer.length > 0 ? [] : pool.filter((item) => candidate(item, songs) && fromList(ctx, item, rung));
    const held = waiting.length > 0 && waiting.every((item) => ctx.pausedOrPutAway(item));
    const want: Want = { rung, reading, ...(skill === undefined ? {} : { skill }), pool, offer, held };"""))

# --- fallbackStep: the automatic flag goes; the rung step says a held rung once
R.append((
"""  // The rung step offers the strand's rung's own list, the curriculum assigning material; every later step
  // chooses of the session's own accord, so a piece the learner paused or put away is not among its
  // candidates (G1e; item 3 leaves the rung's own list as it was, a question for the reviewer).
  const automatic = step !== 'rung';
  const choose = (""",
"""  const choose = ("""))
R.append((
"""    const offer = order(
      items.filter(
        (item) => usable(ctx, item, songs) && !(automatic && ctx.pausedOrPutAway(item)) && (listedOn === undefined || fromList(ctx, item, listedOn)),
      ),
    );""",
"""    const offer = order(items.filter((item) => usable(ctx, item, songs) && (listedOn === undefined || fromList(ctx, item, listedOn))));"""))
R.append((
"""      found = choose(own, () => ({ kind: 'rung', rung, ...(strand?.title === undefined ? {} : { strand: strand.title }) }), () => rung.id, rung);""",
"""      // The rung's other material; where the rung's piece ask is held by the learner's pause and no row has
      // said so yet, this row says the rung waits (G1e, the reviewer's ruling). A warm-up serves no pieces.
      const held = songs !== 'none' && strand !== undefined && !ctx.saidHeld.has(strand.track) && heldAt(ctx, strand);
      found = choose(
        own,
        () => ({ kind: 'rung', rung, ...(strand?.title === undefined ? {} : { strand: strand.title }), ...(held ? { held: true as const } : {}) }),
        () => rung.id,
        rung,
      );"""))

# heldAt helper, after servedBy
R.append((
"""/** Whether a choice already on the card came from this strand's rungs. */
function servedBy(onCard: readonly Choice[], strand: Strand): boolean {
  return onCard.some((choice) => choice.strand === strand.track);
}""",
"""/** Whether a choice already on the card came from this strand's rungs. */
function servedBy(onCard: readonly Choice[], strand: Strand): boolean {
  return onCard.some((choice) => choice.strand === strand.track);
}

/** Whether the strand's rung asks for pieces the learner has every one paused or put away (`Want.held`; G1e). */
function heldAt(ctx: SlotContext, strand: Strand): boolean {
  return wantsOf(ctx, strand.rung, 'any').some((want) => want.held);
}"""))

# --- exposure: back to usable alone
R.append((
"""  // What the rule may offer: a piece the learner paused or put away is not (G1e) — a family holding only
  // such pieces is passed over for the next, as if it held nothing. When the family was last played still
  // counts every play of it: what the learner played is history, and the pause withdraws the offer alone.
  const offerable = (item: CatalogItem): boolean => usable(ctx, item, 'any') && !ctx.pausedOrPutAway(item);
  const ranked = [...found.values()]
    .filter((entry) => entry.items.some((one) => offerable(one.item)))""",
"""  // What the rule may offer is what `usable` passes: a piece the learner paused or put away is not (G1e), and
  // a family holding only such pieces is passed over for the next. When the family was last played still
  // counts every play of it: what the learner played is history, and the pause withdraws the offer alone.
  const ranked = [...found.values()]
    .filter((entry) => entry.items.some((one) => usable(ctx, one.item, 'any')))"""))
R.append((
"""  const chosen = entry.items
    .filter((one) => offerable(one.item))""",
"""  const chosen = entry.items
    .filter((one) => usable(ctx, one.item, 'any'))"""))

# --- fresh
R.append((
"""  const served = (want: Want): boolean => onCard.some((choice) => want.pool.some((item) => item.id === choice.item.id));
  for (const strand of strands) {
    const wants = wantsOf(ctx, strand.rung, 'any');
    for (const want of [...wants.filter((want) => !served(want)), ...wants.filter(served)]) {
      const item = pick(want.offer, ctx.seed);
      if (item) return { item, claim: askedClaim(want, false, strand), lessonId: strand.rung.id, strand: strand.track };
    }
  }""",
"""  const served = (want: Want): boolean => onCard.some((choice) => want.pool.some((item) => item.id === choice.item.id));
  for (const strand of strands) {
    const wants = wantsOf(ctx, strand.rung, 'any');
    // A rung whose piece ask the learner holds (G1e, the reviewer's ruling): an ask the card already serves
    // does not take the new slot again, and the new slot says the rung waits, with the rung's other material,
    // rather than revive a paused piece or pass the rung over.
    const held = wants.some((want) => want.held);
    for (const want of held ? wants.filter((want) => !served(want)) : [...wants.filter((want) => !served(want)), ...wants.filter(served)]) {
      const item = pick(want.offer, ctx.seed);
      if (item) return { item, claim: askedClaim(want, false, strand), lessonId: strand.rung.id, strand: strand.track };
    }
    if (held) {
      const waits = fallbackStep(ctx, 'any', undefined, (items) => uncountedFirst(ctx, items), strand, 'rung');
      if (waits) return waits;
    }
  }"""))

# --- transferOffer, review, repertoire, jam: the chooser-level checks go (usable asks it)
R.append((
"""      // An offer of the session's own accord: never a piece the learner paused or put away (G1e).
      if (!usable(ctx, item, 'any') || ctx.pausedOrPutAway(item)) continue;""",
"""      if (!usable(ctx, item, 'any')) continue;"""))
R.append((
"""    // A piece: a scale or a drill passed is technique, kept warm by the exposure rule, not "a piece to keep playable".
    if (!usable(ctx, item, 'only')) continue;
    // The learner paused it or put it away on its project sheet (G1d; G82): retention does not bring it
    // back over their word, and nothing on the card says so — the sheet did. The card's one reading of
    // the projects (G1e), which every automatic chooser reads.
    if (ctx.pausedOrPutAway(item)) continue;""",
"""    // A piece: a scale or a drill passed is technique, kept warm by the exposure rule, not "a piece to keep
    // playable". Not one the learner paused or put away on its project sheet (G1d; G82): `usable` asks the
    // card's one reading of the projects (G1e), and nothing on the card says so — the sheet did.
    if (!usable(ctx, item, 'only')) continue;"""))
R.append((
"""      // A piece chosen of the session's own accord: never one the learner paused or put away (G1e).
      if (!usable(ctx, item, 'only') || ctx.pausedOrPutAway(item) || ready.some((one) => one.item.id === item.id)) continue;""",
"""      if (!usable(ctx, item, 'only') || ready.some((one) => one.item.id === item.id)) continue;"""))
R.append((
"""      // Chosen of the session's own accord, not asked by the rung: never a piece paused or put away (G1e).
      .filter((item): item is CatalogItem => usable(ctx, item, 'any') && !ctx.pausedOrPutAway(item) && fromList(ctx, item, lesson))""",
"""      .filter((item): item is CatalogItem => usable(ctx, item, 'any') && fromList(ctx, item, lesson))"""))

# --- the comments on review() and repertoire()
R.append((
""" *   exposure rule keeps warm, not a piece to keep playable. Never a piece
 *   the learner paused or put away (G1d; `ctx.pausedOrPutAway`, G1e).""",
""" *   exposure rule keeps warm, not a piece to keep playable. Never a piece
 *   the learner paused or put away (G1d; `usable`, G1e)."""))
R.append((
""" * keeping it playable is the review's repertoire retention. A piece the learner
 * paused or put away is chosen by neither the claim nor the fallback's automatic
 * steps (G1e; `ctx.pausedOrPutAway`); the rung step is the rung's own list (G1e item 3).""",
""" * keeping it playable is the review's repertoire retention. A piece the learner
 * paused or put away is chosen by neither the claim nor any step of the fallback
 * (G1e and the reviewer's ruling on it; `usable`)."""))

# --- the context: saidHeld, and keep() records a held row
R.append((
"""    pausedOrPutAway,
    lastPlayed,""",
"""    pausedOrPutAway,
    saidHeld: new Set<string>(),
    lastPlayed,"""))
R.append((
"""  const keep = (slotIndex: number, kind: SlotKind, choice: Choice): void => {
    ctx.used.add(choice.item.id);
    chosen.push(choice);""",
"""  const keep = (slotIndex: number, kind: SlotKind, choice: Choice): void => {
    ctx.used.add(choice.item.id);
    chosen.push(choice);
    // A row that says a rung waits on the learner's pause says it for the card (G1e).
    if (choice.claim.kind === 'rung' && choice.claim.held === true && choice.strand !== undefined) ctx.saidHeld.add(choice.strand);"""))
R.append((
"""  // The card's one reading of the learner's projects (G1e; the G1d review's required change): each piece's
  // project looked up once, by the identity the lesson page and Progress use, and the answer kept for the
  // card. The only `projectIn` in the session; the choosers read the answer, never the rows.""",
"""  // The card's one reading of the learner's projects (G1e; the G1d review's required change): each piece's
  // project looked up once, by the identity the lesson page and Progress use, and the answer kept for the
  // card. The only `projectIn` in the session; `usable()` reads the answer, never the rows."""))

for old, new in R:
    n = t.count(old)
    assert n == 1, f"anchor found {n} times: {old[:90]!r}"
    t = t.replace(old, new)
p.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
print("session.ts: ok")

# --- help.ts: the held line
h = Path("app/src/ui/help.ts")
hraw = h.read_bytes()
hcrlf = b"\r\n" in hraw
ht = hraw.decode("utf-8").replace("\r\n", "\n")
H = [
("""  moreMusic: 'More music from this lesson',""",
"""  moreMusic: 'More music from this lesson',
  /**
   * A rung whose every piece for an ask is one the learner paused or put away (G1e, the reviewer's ruling):
   * "This lesson waits on pieces you paused or put away — more from this lesson", on the row that brings
   * the rung's other material. Said once; the paused pieces are never offered in its place.
   */
  heldByPause: 'waits on pieces you paused or put away',"""),
("""      case 'rung': {
        // "this lesson" is the core path's; a track's own rung is named by its track.
        if (claim.strand !== undefined) {""",
"""      case 'rung': {
        // The rung waits on the learner's pause (G1e): said as such, whatever the slot, with where the row is from.
        if (claim.held === true) {
          return claim.strand === undefined
            ? `${SLOT_TEXT.thisLesson} ${SLOT_TEXT.heldByPause} — ${SLOT_TEXT.moreFromThisLesson}`
            : `${claim.strand} ${SLOT_TEXT.heldByPause} — more from ${claim.strand}`;
        }
        // "this lesson" is the core path's; a track's own rung is named by its track.
        if (claim.strand !== undefined) {"""),
]
for old, new in H:
    n = ht.count(old)
    assert n == 1, f"help anchor found {n} times: {old[:90]!r}"
    ht = ht.replace(old, new)
h.write_bytes((ht.replace("\n", "\r\n") if hcrlf else ht).encode("utf-8"))
print("help.ts: ok")
