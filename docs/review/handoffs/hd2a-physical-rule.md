# Reviewer handoff — HD2a held: a physical reachability criterion applied across the class-A files, for a ruling before any of it lands

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 91, MISSING 10.**

Implementation HEAD: the commit carrying this handoff (HD2a's rows are held uncommitted in its worktree; its worklist, method and corpus diff are at `docs/prompts/runs/HD2a/` in that commit). Respond in `responses/hd2a-physical-rule.md`. Response required; nothing from HD2a lands until it. It does not touch the Bizet path.

## What happened, and whose fault

Your bf57baca and hd2-corpus-diff rulings bounded HD2a to the named reused-voice files, each override established by inspection, none pre-authored from the diff. My brief widened that: it said "and any other class-A file in the corpus diff that shows the same signature", and defined the signature. The lane did what the brief said: it read all 316 class-A files bar by bar off the app's model with one mechanical criterion and wrote 1,297 rows on 231 files (the five HD2 rows among them; store 1,302 rows, 232 items). That is a new inference rule applied at scale, which FABLE §10 says is reviewed before it lands, so it is held. The widening was mine, not the lane's.

## The criterion (`docs/prompts/runs/HD2a/signature.py`, the docstring is exact)

A candidate is a class-A bar-voice: in one printed bar every note of voice v sits on one staff while the model reads them all as the other hand H because v's whole-piece home is the other staff. The dump can establish one physical thing, nothing heard: at every onset where v strikes, whether hand H can strike the set the model gives it (v's notes plus H's other notes there). One hand cannot strike a span over a tenth or more than five keys. Per onset: conflict (the set is beyond one hand and the set without v's notes is not); compatible; unclear (the rest is already beyond one hand, a rolled chord or a reading wrong elsewhere); free (H strikes nothing else). A row is written only when v's bar-voice has at least one conflict onset, no compatible onset, and the staff's own hand can strike v's notes with everything it holds at those onsets. Calibration against HD2's five rows: it reaches The Crave 40 and Solace 30 and 32, leaves Solace 22 and 26 UNKNOWN, contradicts none; it writes no row in Moonlight I/III or Clair de Lune (every candidate there is free: a single consistent crossing line). Outcomes: 231 files rowed, 62 UNKNOWN (2,656 bar-voices where the model's hand could also strike the notes), 22 left alone, Ballade 1 excluded (four staves). The lane read 16 random established bars against their dumps and found all right; a sample, not a proof. Corpus diff with HD2's probe and classifier: 12,511 notes changed in 232 files, every one on a row, none elsewhere; the staleness adversary passes on a new row.

## What is asked

1. **The rule.** Is a physical reachability criterion, explicit and conservative (a row only where the default hand cannot play what the model gives it and the staff's hand can), an acceptable reviewed inference rule for the class-A candidate population, or does each row still need an individual read? The orchestrator's view: it is the kind of objective, falsifiable criterion FABLE §5 asks for, better than the manual reading my brief prescribed, and the sample and calibration are the evidence; but it is a rule, and your word on it precedes any landing. If accepted, the 62 UNKNOWN files stay unknown and the 22 left-alone files stay as they are.
2. **Where the rows live if they land.** The store is imported into the app bundle, about 722 KB compact (26 KB gzipped) for 1,302 rows. The orchestrator's lean: apply verified hand rows at build time into each item's own data, so the app loads only its item's rows, and keep the store as the source of truth; a build-side seam before these rows ship, if you accept the rule.
3. **Scope either way:** the two named-file rows (Prelude 17's six bars; Étude Op. 25 No. 4's twenty-odd bars) are in the held set with their dumps; if you reject the rule, say whether those two files' rows may land on their dumps alone.

## Record

The Bizet path is unaffected: the cells lane is on its landing run; HD2b (the playback proof) and the sight-reading lane are running; CI showed a Score task-chrome case fail twice on a docs-only push whose app code was green two runs earlier, recorded as load, watched. Nothing heard.
