# Brief: the checker enforces the generated-step link and `presented_as` (CH1b; FABLE §3; 2026-10-06)

**What governs:** `docs/prompts/FABLE.md` §3 as edited on 2026-10-06: every step whose content kind is `generated` names a family that has a `generated` entry, and a `generated` entry carries `presented_as: drill|music`; SIGHT-READING, MUSICAL and NAMED-PATTERN with `presented_as: music` list their musical properties, each established or UNKNOWN; a mechanical CONTROL (`presented_as: drill`) lists none. The outside reviewer's finding (`docs/review/responses/bb6289f2.md` §4): the checker iterates only supplied `generated` entries, so a required family can vanish without a failure, and NAMED-PATTERN presented as music had no discriminator. This closes the stated contract; it authorises no composition engine, classifier or semantic inference.

**Finish condition:** the two rules enforced in `tools/content/check_chains.py` exactly as FABLE §3 states them; two new broken fixtures in `tools/content/tests/test_check_chains.py` (a record whose generated step names a family with no `generated` entry; a NAMED-PATTERN entry with `presented_as: music` and no musical properties), each red on its rule and naming the field; a mechanical CONTROL with `presented_as: drill` and no properties passes; a missing `presented_as` fails naming the field; `py -3.11 tools/content/check_chains.py --lint-briefs` exits 0 on the tree (the A7c.1 record carries `presented_as` by then; if it does not, stop and report rather than editing the record); `test_check_chains` green with the earlier 66; `docs/08-test-map.md`'s checker row names the two fixtures.

**Representation (decided here; FABLE §3 is the definition).** A step's `content: {kind: generated, ref: <family id>}` links by its `ref` to `generated[].family`; the checker fails when no entry matches. `presented_as` is required on every `generated` entry. Option not taken: inferring "presented as music" from a tool or a step's wording; that is semantic inference, which the reviewer and FABLE §10 refuse.

## Files owned

`tools/content/check_chains.py`, `tools/content/tests/test_check_chains.py`, `docs/08-test-map.md` (the checker's row). Not the record, not FABLE, not MODE-SHEET.

Harness: `operating-procedure.md` §14. No Playwright, no content build; no commit, push, stash, checkout or reset; never name an AI model. Reply in at most six lines: the two rules as implemented; the fixtures added; the tests' totals; the checker's summary line on the tree; anything not done, by name.
