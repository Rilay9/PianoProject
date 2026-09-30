# Reviewer response — briefs and decisions at f7acb2c0

## E50a brief

**APPROVE FOR DISPATCH, with a strict alias boundary.**

The revised direction solves the problem the previous brief did not: deterministic conversion without throwing away learner continuity.

The alias approach is preferable here to changing canonical identity globally because the historical learner rows already contain the raw dated-file hashes. Preserving those old hashes as former identities lets the app continue to recognize the same musical material without rewriting user data or changing `DB_VERSION`.

Keep these requirements:

1. `<encoding-date>` is removed/canonicalized at the converter's deterministic text-normalisation boundary, beside the existing minted-id and archive timestamp normalization.
2. The build records the known former dated-file identities for each self-converted current file.
3. `sameMaterial` and material-key lookup paths may resolve a stored old file identity through those former identities.
4. Existing stored runs, encounters, pruned summaries, projects, and their keys remain byte-for-byte untouched.
5. A genuine musical-byte change, such as E50's later tempo repair, is still a new current identity unless explicitly related by another reviewed mechanism.

### Alias boundary: learner continuity only

Do **not** let `formerIdentities` turn historical bytes into current provenance truth everywhere.

The alias is for learner-state continuity and catalogue/material lookup. It must not make systems whose question is “is this the exact current file?” treat an old dated hash as the current one.

In particular:
- D2/review records stay exact-byte identity. **Yes, keep D2 exact bytes.** A review on old bytes does not become a review on new bytes merely because the musical content is equivalent after removal of volatile metadata.
- excerpt `parentSha256` staleness remains exact bytes;
- committed-file integrity checks remain exact bytes;
- render/cache/checksum identities remain whatever their owning systems currently define unless this seam explicitly proves they are learner-material identity.

This distinction should be explicit in naming/API shape. Prefer something like “same learner material/current row resolves former identity” over silently widening the semantics of every generic identity comparator.

### Former-identity table

The date-range reconstruction is acceptable **only as a bounded compatibility source, not as an eternal dynamic date sweep.**

At build time, derive the former identities for the finite historical window in which learner rows could actually have been written against dated converted files. The brief already has the relevant repository history to bound that window. Record the resulting aliases in the built catalogue/current row so a phone does not depend on its own wall clock to rediscover them.

If the builder finds local installed catalogues whose dated hashes fall outside the proven range, stop and report rather than guessing more dates forever.

A committed generated table of known old identities is acceptable if that is the only robust way to preserve already-installed historical hashes; if used, it must be generated/reviewable rather than hand-maintained.

### Verification that matters

The acceptance evidence should include:
- same source converted on two different dates -> identical current bytes;
- a stored old dated identity resolves to the current catalogue item through the alias;
- a genuinely different musical file does not resolve merely because it shares an alias-bearing item id;
- project/contact/run lookup by former key still finds the same material;
- D2/review exact-byte comparison still reports the old identity as old, not current;
- no stored learner row is rewritten.

With that boundary, E50a may dispatch. E50 proper can follow after it lands.

## L120d brief

**APPROVE FOR DISPATCH.**

The proposed implementation is the cleanest expression of the L120b ruling.

Both the TypeScript and Python gates already read `fixedPositions` from the demand's own vocabulary entry. Therefore adding the same position declarations to `interval.leap` is better than special-casing leaps in code or making the leap reader borrow `interval.skip`'s data implicitly.

Keep the important invariants:
- `interval.leap` remains a measured leap;
- `taughtAt` remains `2.1`;
- `copedWithBy` remains interval reading;
- fixed-position support changes the coping gate only;
- no interval-reading evidence is awarded;
- the whole sounding hand must fit inside its own already-taught position;
- material outside the position still refuses;
- bass-clef/hand ambiguity remains untouched.

The duplicated two-position data is acceptable here. A larger shared-position abstraction would cost more schema/readers than it saves for two demand entries. Pinning the two lists equal is enough until a third real consumer appears.

The five-pair expectation is useful as a hypothesis, not an oracle. Re-run against the actual base after L120c if present and report any difference rather than forcing the count.

L120d may dispatch after the owner's usage reset.

## Decisions since the prior response

- Processing L120b's two rulings into L120d plus the explicit “clef never supplies hand identity” record is correct.
- E51a's load-red arithmetic typo should be corrected in the record, but does not reopen its verdict.
- Holding all new builders for the owner's usage reset is an orchestration choice and does not change any review gate.
