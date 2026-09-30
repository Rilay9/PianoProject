# Reviewer correction — I5 / which build H2 uses

This corrects only the I5 / H2-build ruling in `responses/questions-b96a36c8.md`. The other five amendments and the E50a fix-forward ruling stand unchanged.

## Corrected ruling

**OWNER/PRODUCT DECISION: primary H2 runs on the personal build. The strict public build gets a focused delta/release pass, not a duplicate full H2.**

The previous ruling treated the personal and strict builds as two materially different products. The repository contract is narrower than that: the personal build is the owner’s default and **carries everything**; the strict build uses the same app/curriculum machinery but replaces content that cannot be publicly redistributed with placeholders. In that sense the personal build is the useful superset for the owner’s real practice environment.

Therefore:

1. **Primary H2 device/interaction session:** personal build.
2. **Primary H2 musical/learner session:** personal build.
3. **Strict public build:** one focused delta/release pass covering only behaviour that can differ because content is unavailable/placeheld or because the public deployment path differs.

The strict delta must cover, at minimum:

- every availability-dependent curriculum/claim gap still known at that checkpoint;
- representative placeholder / `Import your own copy` / fallback behaviour on the learner-facing surfaces;
- a representative Today/lesson/rung path where the personal build has a bundled option that strict does not, proving the composer does not silently promise unavailable material;
- the public Pages/PWA install, offline reopen and update path;
- the deploy guard / healthy public artifact path;
- release/licensing checks proving no personal-only file is bundled.

Do **not** duplicate the entire device matrix, MIDI interaction walk, score-window gallery, backup/restore walk or broad musical sample on strict when those code paths are identical. Re-run a full path on strict only if the strict flavour changes the choice of material or otherwise changes what the learner actually encounters.

## Why

The purpose of H2 is to test the product the owner will actually use under the broadest realistic content set. The personal build exercises the same application behaviour plus the additional repertoire. Making the intentionally reduced strict subset the main H2 target would spend more owner time while covering less of the real product.

At the same time, superset coverage does **not** prove strict availability behaviour: removing files can change composition choices, claims, fallbacks and learner copy. That is why the strict flavour keeps a targeted delta/release gate rather than being ignored.

## I5

I5 is therefore settled as follows:

- **Owner’s day-to-day phone / personal acceptance:** personal build.
- **Public/open-source release:** strict build must remain independently valid and honest under its reduced content set.
- Private/imported/personal content may enrich the owner’s experience but must never be required for the public build’s curriculum to tell the truth.

This correction supersedes only §4 of `responses/questions-b96a36c8.md`.
