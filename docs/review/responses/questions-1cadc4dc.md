# Reviewer response — U118b stop condition

## Decision

**Do not remove the band from turned/folded pricing. Also do not keep the current sixteen-digit overbound. Tighten the synthetic away value to the maximum that the product can actually produce: fourteen copies of the chip font's widest decimal digit, then rerun the same grid.**

This is the "something else" branch of the stop condition, and it is still inside U118b's fast-path required change.

## Why fourteen, not sixteen

The second read established a stronger fact than the brief initially used:

- the learner-facing away count has one production source: `Math.max(1, Math.round((Date.now() - awayFromMs) / 1000))`;
- it is therefore a non-negative integer derived from two valid JavaScript `Date` values;
- within the runtime's finite Date range, that difference is at most fourteen decimal digits in seconds;
- the chip has no tabular figures, so the conservative width is fourteen copies of whichever decimal digit is widest in the chip's actual font/geometry.

Sixteen widest digits proves a broader `number`/safe-integer type domain, but it is not the tight bound of a legitimate product state. That distinction was harmless while the sentinel affected nothing; it is no longer harmless now that the sixteen-digit value measurably changes the folded/turned layout. The reserve should price the tallest state the product can actually show, not two unreachable digits beyond it.

Keep the real learner copy unchanged. This remains synthetic layout-measurement input only.

## What the stop-condition measurements mean

The sixteen-digit run does **not** justify taking the band out of folded pricing. That alternative knowingly brings back the chip/score overlap class U118 exists to close.

It also does not show a product reason to accept the unreachable sixteen-digit cost as-is:

- the two five-finger cells keep the same three systems but shrink from 1.3173 to 1.2803; both remain larger than the ordinary start, so no emergency product choice is exposed, but the shrink is still unnecessary if it is caused only by an unreachable value;
- the 360 × 844 Twinkle cell moves from four active systems to the exact ordinary-start shape of three systems plus the greyed next row; that outcome is valid, and arguably better look-ahead, but again it should occur only if the truthful maximum needs it.

So rerun with the fourteen-digit widest-digit sentinel before accepting any of those differences as product behavior.

## Acceptance after the tighter bound

Use the same 224 cell-arms and the existing U118/U118b guards. The lane may continue to its normal post-build handoff without another product pre-review if all of these hold:

1. ordinary starts remain unchanged;
2. no chip ink overlaps score ink and no score ink leaves the usable stage;
3. a size taken while already folded never produces a worse fit than an ordinary start at the same geometry — no smaller/readability-poorer result, and no loss of requested/useful music beyond what the ordinary start already chooses;
4. any changed turned cell is explainable by the truthful reserve, not by a synthetic value outside the reachable product domain;
5. the corrected width-change unit case still kills the mutant that removes the held-size release.

If the fourteen-digit run creates a genuinely worse-than-ordinary-start slot/readability trade, stop and return that measured cell. Otherwise proceed.

## Vacuous width-change unit case

The built repair stands. Establishing the first observation before changing width and killing the mutant that removes the release is exactly the required mechanical correction; do not reopen it or create a separate row.