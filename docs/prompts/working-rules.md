# Working rules

Every rule here was written after breaking it, on 2026-09-18, in this repository. None is
a general exhortation; each names the failure it prevents, because "be careful" was tried
and did not work.

**If you are an agent starting work here**, read `operating-procedure.md` first: it says
what these rules are for and where they sit (evidence discipline, third of four tiers,
below product truth and technical correctness). Then this, then `docs/00-invariants.md`,
then your task brief. §1 is the one that generates all the others — if you only keep one
thing, keep that. (2026-09-25: an outside audit found these rules were being run as a
linter on the report's prose rather than as a check on the work. They are the latter.
State scope once, mark the unverified once, and spend the turn on the product.)

---

## 1. The move under every failure

**A proxy is adopted for convenience, and then its result is reported as the thing
itself.**

Every distinct failure observed reduced to this, which is why fixing them one at a time
did not stop the next one arriving in a new costume.

| the proxy | what it stood for | what it cost |
|---|---|---|
| a title | the music | four of eight songs placed on wrong rungs |
| one grep | the repository | "there is no tempo ladder" — it is spelled `LADDER_*` |
| one filtered query | the library | "no early genre repertoire" — a generator was written on it |
| `genres` | `genres` **and** `tags` | a conjunction carried an unchecked field across |
| a function name | its behaviour | `iter()` assumed to parse `{*}` like `findall()`; 1,975 rows silently empty |
| a decision record | the repository's state | "the quarry is blocked" — the shortlist was already on disk |
| a rendered crop | the whole score | a piece that modulates twice put on a rung about a figure that never changes |
| an exit code | the work being good | "validate OK, 2,169 tests" said nothing about the content |
| a cache | the source | wrong answers served until the cache was deleted |
| the first result | the best result | took the first archive copy without comparing |
| four of five | five | "rendered them" |
| the built catalog | all available music | 2,053 rows searched; 37,261 sat unpacked on disk |

**The rule.** Proxies are legitimate — reading 37,261 scores to place one song is not
sensible. What is not legitimate is letting the proxy's output inherit the authority of
the thing. So **name the proxy in the sentence**: "reading the title as a proxy for the
music", "my grep is a proxy for the repository". Once named, the gap is visible and the
next sentence has to close it or admit it is open.

---

## 2. The specific rules, each with the failure it prevents

### 2.1 An absence is a claim about a search. Give it the search's scope, no more, no less.

"grep for `tempoLadder|autoTempo` under `app/src` returned nothing" — not "there is no
tempo ladder". Before an absence means anything, run a **second search shaped
differently**: another spelling, another field, the filter removed.

*Three wrong absences in one day, two of which sent work in the wrong direction.*
`candidates.py` now runs the relaxed queries automatically when a search returns zero,
which is that second search made mechanical.

### 2.2 Do not imply broader verification than you performed.

When you write "X and Y are Z", "all N are Z", or a bare plural, you have almost certainly
checked one. Name which, check the rest, or say in the same sentence that the rest are
unchecked.

*The tell is grammatical, which is what makes it auditable by someone who knows neither
the music nor the code: if the sentence has* and*,* both*,* all*,* every *or a plural, the
evidence must be enumerated per item or the claim must admit it is partial.*

### 2.3 Never infer a property of music from a title, an id, a level or a genre tag.

Read `notation` on the catalog row, or read the MusicXML — `tools/content/archive_notation.py`
reads any of the 37,261 archive scores directly. `tags` is on 8% of rows with 16,619
distinct values; `genres` came from an import bucket and the Library's genre filters held
no songs at all until they were derived from the curriculum.

### 2.4 Place one item per tool call, with its evidence line.

```
<item id> → <rung> | <the fields actually read> | <why those fields mean it fits>
```

If the line cannot be written, the item has not been checked and must not be placed.

*Every content mistake was made inside a batch. Eight songs placed by one script, four
wrong. The rungs done one piece at a time were right. The batch was not a symptom of
carelessness — it was the mechanism that made it possible.*

### 2.5 Look at the whole artefact.

`build/previews/` are **crops**. Four faults in the generated families were found by
opening a picture; the fifth got through because the crop showed exactly what was
expected.

### 2.6 Never report a count as success. Report what is in the rows.

A build step said "1,975 read from the score" while writing empty fields into all 1,975.
Only `bars` was right, and that was enough to make the output look plausible.

### 2.7 Test every blocker before reporting one.

"This needs the owner" is a claim. The quarry was called blocked for hours; the shortlist
was on disk from two days earlier and extraction took ten seconds.

### 2.8 Make the correction mechanical, or write it down.

If the owner corrects you and you cannot turn it into a check, say so in
`docs/pending-review.md` instead of promising to remember it. **Nine rules in this
repository are enforced by the build; four are not, and all four were broken the day they
were written.** `P22` has the table.

### 2.9 Report the correction, not the contrition.

The owner: *"you're not changing your behavior at all."* Writing "you're right, I made a
mistake" and continuing is not a correction. Say what changed so it cannot recur.

### 2.10 Green is not done.

State what is **unverified** as prominently as what passes. Anything about music you have
not heard is unverified; say so. `validate.py` OK and 2,169 tests passing said nothing
about whether the content was any good — that was measured separately and one claim in
twenty was false.

### 2.11 Verify once per chunk, not per edit.

A content build is two minutes. Several were run for seven-line changes. A chunk is *what
must land together* — a re-level and its rung placement, or seventeen rungs — not *what
you just typed*. This is not in tension with 2.4: place one item at a time, verify once at
the end.

### 2.12 Proportion.

If you are three tool-files deep and no rung has changed, stop and do the content. Every
tool built on 2026-09-18 was individually defensible and the aggregate was not what was
asked for.

---

### 2.13 A request names examples, not boundaries.

Before acting, **restate the goal in one sentence that reuses none of the requester's
words**, and check the plan against the restatement. If the plan satisfies the literal
phrasing and not the restatement, an example has been mistaken for a specification.

*This failed four times in one day, and each time the literal reading was narrower than
the ask:*

| said | taken as | meant |
|---|---|---|
| "the early stages" | Stage 0 and 1 | as early as is *honest* for each element |
| "genres across stages" | stages 1–5, which is what got measured | every stage |
| "the modes you suggested" | a brainstorm from three days earlier | yesterday's list |
| "more diverse content" | four new rungs, two of them in a module that is off by default | every stage more interesting, wherever it fits |

*And the inverse is a failure too.* "Not where it's forcing" is not licence to skip the
hard cases; it means **do not put a mode on a rung it does not suit**, while still
covering the ones it does. Ten rungs were skipped on those grounds and each skip is
written down with a reason, which is what makes it a judgement rather than an omission.

*The tell: if you find yourself defending a plan by quoting the request back, you are
reading the letter.*

### 2.14 Consult what you produced, at the moment of choosing.

*So Danço Samba* was placed on a rung it was already on. The session had generated a
"not on any rung" list an hour earlier and **that list was correct**; at the moment of
choosing it reached for a level table instead. This is not "acted without looking" — the
looking had already been done. The evidence existed, in the right form, and was not
opened.

*Before a decision, re-open the artefact you made for that decision. Producing it is not
using it.*

### 2.15 A change has more than one consumer. Name them.

"Re-levelling these families is free, because none is on a rung" was true of
`levelBand` containment and false of `alternativesFor`, which matches within 0.5 of *the
item being swapped* and would have made every moved family unreachable in the app while
`validate.py` stayed green.

*One consumer was checked and the conclusion was stated for the field. Before changing a
field, grep for every reader of it and say what each does with it.*

### 2.16 A right action with a wrong reason is still a fault.

*When Johnny Comes Marching Home* was added to core `4.5` on the stated grounds that the
rung had nothing in compound time. It already had four things in 6/8. The piece is a fine
option at the right level, so nothing looked wrong — **and the false reason survives into
the record and gets reused.**

*Record the reason separately from the outcome, and check the reason. A review that only
looks at outcomes cannot catch this, which is why it is dangerous.*

### 2.17 Your own prose about your own code is a claim.

`make_tresillo`'s docstring said it wrote tied eighths; it writes dotted quarters. A cell
named `minor-hook` rendered in C major. A docstring promised four bars over music that was
two. All three passed every mechanical check because comments are not executed.

*When the code and the comment disagree, the code is usually right — fix the comment, per
`00-invariants` §4 — but you have to look at both to find out.*

---

## 3. What this does not cover

These are shapes already seen. **There will be a fourth shape**, and it will look like
none of the above until it is named. The pattern on 2026-09-18 was that each new one only
became visible when the owner pushed on something specific — the `tags` question is the
only reason §2.2 exists at all.

Which is the argument for the thing that actually works: **have the evidence reviewed as
it is produced, per item, rather than the output at the end.** Not because it catches
everything, but because a wrong line is visible in two minutes and before anything is
built on top of it. Every failure on 2026-09-18 cost hours because it surfaced after work
had already been stacked on it.

---

## 4. How this document was written, which is part of the evidence

**The first draft of §1 and §2.1–§2.12 was written from memory.** It claimed "every
distinct failure reduces to one move" — a plural claim, asserted of all after examining
the ones that came to mind. The owner asked whether the same rules had been applied to
the document itself.

They had not. Re-reading `docs/pending-review.md` instead of recalling it produced **four
shapes that had been left out**: §2.14, §2.15, §2.16 and §2.17. Each was recorded in the
file at the time it happened; none survived into the summary.

Two things follow, and they are the most useful part of this document:

1. **A summary written from memory of a record is a proxy for the record** (§1), and it
   fails in the ordinary direction: it keeps the vivid failures and drops the quiet ones.
   §2.16 — a right action with a wrong reason — is exactly the kind that leaves no
   impression, which is why it was the easiest to lose.
2. **The rules were capable of catching this and did not fire on their own.** They fired
   when somebody asked. That is the honest measure of what a written rule is worth
   compared to a check that runs, and the reason §2.8 says to make the correction
   mechanical wherever it can be made mechanical at all.
