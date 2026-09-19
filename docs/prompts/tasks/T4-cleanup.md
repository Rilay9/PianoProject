# T4 — The findings the 2026-09-18 session left against its own work

**Read `docs/prompts/working-rules.md` first.** This task is small and entirely
corrective; do it before T1 so the new rungs are not built beside the faults.

`docs/audit-2026-09-18.md` is the source. `python3 tools/content/rung_audit.py` reproduces
the first three findings on demand.

## 1. `rock.4` owns none of its material — HIGH

Its four exercises (`power-chord.a`, `ostinato.a.fifths`, `ostinato.a.arpeggio`,
`modal-vamp.a`) were placed by the same session on core rungs `2.1`, `2.3` and `3.3`. A
learner who did the core path arrives at `rock.4` and is offered the same four again.

**Decide which home is right, and remove it from the other.** The argument for core: those
exercises are all-white-key and teach a texture the core rung is already about. The
argument for `rock.4`: the rock track is where a learner goes *for* that texture. Both are
defensible; having both is not. If it stays on core, `rock.4` needs its own material —
`docs/genre-plans/rock.md` lists `IN ARCHIVE` candidates including *House of the Rising
Sun*, already verified as D minor, 17 bars, 16 chord symbols.

## 2. `hymns.2` owns none of its material — HIGH

Four songs from the `hymns` list rung, three exercises from core rungs. It was created as a
**placement fix** — those four songs are Stage 2 music that had been sitting on a Stage 3
rung — and that is a real fault it really fixes. Decide whether a placement fix justifies a
rung, or whether the songs should simply move and the rung go.

## 3. `4.7` offers three reading drills — HIGH, and it predates this work

"Learning it from memory" offers three `drill.reading` items. That is not what the rung
teaches. Not caused by the 2026-09-18 session; found by its audit.

## 4. `content/sources/pdmx.json` is unreviewable

It shows **8,186 changed lines to alter three rows**, because a `JSON.stringify` rewrite
reformatted the whole 533-row table.

**Verified semantically already**: 533 rows before and after, none removed, none added,
exactly three changed — `tracks` added to *El Choclo*, *Malagueña* and *Carioquinha*. It is
diff noise, not data loss. Restore the original formatting from `git show HEAD:` and
re-apply those three edits surgically, then re-verify the same way rather than trusting
this paragraph (§1: this paragraph is a proxy for the file).

## 5. Two lab buttons with no explanation — LOW

`rock.6` and `jam.6` each declare a lab tool that their "Tools for this rung" paragraph
never mentions. Either explain it or drop it; a control the prose ignores is a control the
learner will not understand.

## 6. `rock.7`'s band spans 3.2 levels — MED

The lesson page prints the band. `rock.6` spans 4.0 and argues for it in a paragraph;
`rock.7` does not. Either narrow it or say why in the prose.

## Not a finding

`rock.5` was called out by hand as "four options that are one exercise" and **that was
wrong**. sus2, sus4 and add9 are three different chords, and the rung is called "Open
voicings". `rung_audit.py` does not flag it once the check asks whether the rung is *about*
the family. Left here so the correction is not lost.

## Done

`build.py --offline`, `ladder_report.py`, `validate.py`, `rung_audit.py`, `npx vitest run`,
`npx tsc -b`, `npm run lint`. One entry in `docs/pending-review.md` saying which of the two
homes you chose for `rock.4`'s exercises and why, since that is the judgement, not the edit.
