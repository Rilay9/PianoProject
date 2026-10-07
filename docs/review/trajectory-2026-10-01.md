# The reviewer's trajectory review, 2026-10-01

Relayed by the owner in chat on 2026-10-01 (the reviewer's words, unedited below the line). Asked as a trajectory question, not a bug hunt. Its verdict: "Converging architecture with localized patch churn — not recursive vibe coding overall." Its one named hotspot, the sideways Score-screen bar (U105 → U105a–d, U119 → U119a, U120), is acted on by U122. The three trends it said to watch are the questions every handoff now answers where they apply: does a shared truth get fewer implementations or more; does a repeated hotspot collapse into a simpler model; is each new row a latent defect a better probe exposed, or a regression a recent seam caused.

---

Yes. I looked at this specifically as a trajectory question, not as "does the repo have bugs?" My read is:

This does not currently look like a recursive vibe-coding death spiral. It looks like a project that is genuinely converging, but with a couple of localized areas where the fix-forward process is starting to resemble one. I'd be concerned if those local patterns spread or continue through the final validation phase.

The strongest evidence that this is actually going somewhere is that several of the important changes are removing old models rather than layering another workaround on top. C5 is a good example: it did not create a second way of determining progression alongside the old pass-count system. It made evidence-derived rungState the source of truth and actually removed the previous lessonComplete/pass-counting machinery. The diff deletes a substantial block of the old completion logic and changes consumers to the new state model. That is the opposite of classic vibe-code entropy, where you wind up with oldComplete(), newComplete(), reallyNewComplete() and screens choosing whichever one makes their test pass.

CL23 has the same good property. There was a real domain problem — performances could fall beyond a scanning cap — and the change did not just increase the cap again. It introduced an actual byPerformance index, a single withPerformanceMark() derivation used by the migration, new writes, and imported backups, then removed the scan limit. That's a very good sign. A vibe-coded fix would have been "2,200 wasn't enough, make it 25,000." This one changes the representation so the arbitrary limit disappears.

Likewise, the content/identity work around E59 is irritatingly large, but conceptually sound: the converter's invented default tempo is being separated into playback truth rather than printed-score truth, and the change explicitly preserves learner history through material-identity relations instead of silently invalidating previous runs. The tests go through the actual sameMaterial, tempoNotComparable, evidence and contact consumers rather than merely checking that a generated file changed. That's architectural repair, not whack-a-mole.

And the planning process has started actively destroying fake work. At the first convergence pass there were 343 historical audit rows, but 90 were classified CLOSE, 52 MERGE, and 3 REJECT rather than being turned into 145 separate implementation tasks. There were zero corrected open P0s at that checkpoint. The roadmap explicitly says not to treat the backlog as FIFO and that a row is bookkeeping, not a reason for a seam. That's exactly the mechanism you'd want if you were trying to prevent an audit from recursively manufacturing years of work.

There is also a real destination now, rather than "keep polishing until nobody notices anything." The current authoritative addendum says the overhaul stops when the personal learner experience is strong/trustworthy/tested, the public subset is honest/releasable, the final suite is trustworthy, and what remains is ordinary future backlog rather than hidden architecture/teaching debt. H1/H2 are intended as final integrated validation, not another infinitely expandable design phase. That's important.

Where I do see the danger

The clearest hotspot is the Score-screen sideways/header/layout work.

Look at the ancestry: U105 → U105a → U105b → U105c → U105d, then U119 → U119a, and now U120. The current handoff inventory shows these as successive discoveries/fix-forwards around refusal text, ordinary status, folded controls and narrow sideways geometry.

And U119a's implementation is clever, but it is getting complicated. It now has behavior such as: temporarily substituting the piece's widest possible "bar m / m" into the DOM to measure whether the group fits; pushing controls into the overflow sheet based on both bar wrapping and that semantic-width measurement; special handling for refusal state; CSS that gives the title a flex-shrink weight of 1000000; separate logic to distinguish an overflowing status from the left group being clipped.

Those mechanisms are very deliberately documented and tested, so I wouldn't call them bad code outright. But this is precisely the sort of area where each correct local rule can make the combined state space harder to reason about.

So my current characterization of that area is: not "random hacks," but "too many independently reasonable layout rules are accumulating in one mechanism."

That's the main place where I could imagine us crossing over into the situation you're worried about. If U120 gets fixed, which exposes U121, which fixes one viewport but creates U122 around another status state, and each one adds another branch to ScoreScreen rather than collapsing the layout model, I would call for a redesign of that little subsystem rather than continuing the chain.

There's an important nuance, though: not every follow-up represents damage caused by the preceding fix. Some are new probes exposing an older latent edge case. For example, the U118a cycle turned out to be a test racing the existing 0.7-second start fold rather than an application regression. The current record explicitly classifies that as a test problem. U120 similarly appears as a newly exposed narrower refusal case; from what I've read so far I cannot honestly say U119a created it. So simply counting "A → Aa → Ab" chains would exaggerate the amount of implementation-induced breakage.

There is a second, different problem: the review/process layer itself has generated avoidable churn. T62 and U118b are the examples you just had Claude enumerate. Those rounds were not evidence that the application's architecture was deteriorating; they were evidence that the reviewer made an incorrect premise or prescribed the wrong bound. The new quality rules are aimed very specifically at preventing that. So some of the apparent "fix, review, fix again" history is us correcting the control system, not Claude repeatedly breaking the product.

And there is some test-infrastructure churn. U118a exposed a browser-test race; T62 has involved sharding/fresh-runner semantics. That's something to watch because a brittle suite can create enormous fake work. But the project is at least distinguishing "test wrong" from "app wrong" instead of changing production code until the flaky test happens to pass. That's a healthy behavior.

The thing I would watch from here

I wouldn't judge convergence by "how many follow-ups did the last seam produce?" Instead I'd watch three trends over the next batch of work:

1. Are shared truths getting fewer or more implementations? C5 and CL23 are good: one authoritative derivation replaces several proxies. If we start seeing duplicated state machines and parallel truth sources again, that's a major warning.

2. Does a repeated hotspot eventually collapse into a simpler abstraction? Two or three narrow UI edge fixes are normal. Seven fixes around the same geometry should eventually cause us to ask whether the geometry model itself is wrong. The U105/U119/U120 family is where I'd apply this test first.

3. Are new findings predominantly old latent defects, or regressions caused by recent seams? Those are profoundly different. A better test grid uncovering a pre-existing 568×320 problem means we're approaching the edge of the problem space. Fix A breaking B, then B breaking C, means we're digging sideways.

So, at this point, I think the implementation quality is high enough that the project is moving toward a destination rather than merely circulating. The evidence/evidence-state/content-identity parts in particular look materially more coherent than the models they replaced.

I would not yet say "everything is clean and the rest is just finishing." The Score-screen/layout area has real accretion risk, and the sheer amount of historical process/document state can itself become a source of contradictions — current.md already lagging immutable responses is an example. But the project has mechanisms for pruning both, and more importantly I've seen those mechanisms actually being used rather than merely written down.

The phrase I'd use after this pass is: Converging architecture with localized patch churn — not recursive vibe coding overall.

If a few more U-series rounds happen, I can keep an eye specifically on whether that hotspot is converging or breeding, without turning it into another giant audit.
