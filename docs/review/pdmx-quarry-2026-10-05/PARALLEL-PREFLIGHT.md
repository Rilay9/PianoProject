# Parallel content preflight while wave one builds

Date: 2026-10-05
Branch: `chatgpt/pdmx-dump-2026-10-05`

Purpose: resolve open musical/content questions that can be decided without touching Claude's active wave-one build files.

## 1. Blues Riff in C — B-natural question

Candidate: `Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi`.

### Exact notation observation

The harmonic bed is explicitly dominant-seventh harmony:
- bars 1-4, 7-8, 11-12: C bass plus `Bb-E-G` = C7;
- bars 5-6, 10: F bass plus `Eb-A-C` = F7;
- bar 9: G bass plus `F-B-D` = G7.

The separate riff part does **not** contain a one-off B-natural. It repeats B natural structurally:
- bar 3: `C5 B4 B4 B4`;
- bar 4: four B4 quarters;
- bars 7-8: the same two-bar pattern;
- bar 12: four B4 quarters.

Therefore the open issue is **not plausibly a single transcription typo inside one event**. The score consistently places sustained/repeated B natural against C7 harmony.

### Decision

**Do not silently correct B natural to B-flat.** The repeated pattern means an editor/source check is required before changing notes.

For curriculum use, this candidate should remain **TRANSFER-CANDIDATE WITH HARMONIC CAVEAT** rather than a clean canonical first model of C-blues note choice. It can still demonstrate a complete 12-bar form and coordination over a harmonic bed, but a beginner-facing explanation must not present those repeated B naturals as the ordinary C7 chord tone.

If a clean pedagogical 12-bar transfer score is required before the source can be checked, prefer another candidate rather than rewriting this edition from theory alone.

### Rights/provenance warning

The PDMX summary labels this CID `license=publicdomain`, but the discoverable MuseScore source for the matching `12 Bar Blues / Lessons - Blues` page currently reports **All rights reserved**. That is a provenance conflict, so the PDMX `publicdomain` field is **not sufficient public-export evidence** for this item. Treat public export as **NO / unresolved** until provenance is reconciled.

Source found: https://musescore.com/user/955021/scores/454946

## 2. La Negra Tiene Tumbao — selected piano-figure classification

Candidate: `QmbYzj8P6PbJ9DwbepDeMSHTVoHyEEMhQRsuTLcqf3bqyd`.

### Exact notation observation

The strongest recurring piano texture is block-chord attack based rather than arpeggiated note-by-note motion. Examples:

- bars 1-3: RH repeats full `D-F-A` chord attacks in syncopated dotted-eighth/sixteenth groupings while LH supplies D/C/A bass attacks;
- bars 21-32: RH repeatedly strikes dyads such as `D-F` and `E-G`; LH likewise uses repeated dyads (`F-A`, `A-C#`) rather than an arpeggiated melodic line;
- bars 37-39 and 43 onward: full `D-F-A` block-chord attacks recur with bass punctuations;
- later bars 52-67 continue repeated dyadic block attacks through changing harmony.

The score also contains linear passages (for example bars 4 and 36), so the whole arrangement should not be given one label. But the retained repeated comping passages are structurally **non-arpeggiated block-chord figures**.

### External terminology boundary

Kevin Moore's *Beyond Salsa Piano* series is a dedicated Cuban-piano instructional source and explicitly treats historical/contemporary piano tumbaos as a broad repeating-figure tradition: https://www.timba.com/piano

For the narrower label, reference material citing Kevin Moore and David Peñalosa defines **ponchando** as a non-arpeggiated guajeo using block chords, where the attack-point sequence is foregrounded rather than a changing pitch sequence: https://en.wikipedia.org/wiki/Guajeo#Ponchando

### Decision

**Promote selected La Negra bars as a PONCHANDO / block-chord-guajeo MODEL candidate, not as an arpeggiated guajeo.**

This directly supports the current correction that the shipped block-chord material must not be called an arpeggiated guajeo. It also gives the curriculum a real notation example for the block-chord branch of Cuban piano vocabulary.

Do **not** use the song title as proof of `tumbao` in the bass-specific sense. If the curriculum wants `piano tumbao` terminology, state explicitly that this is the broader contemporary usage and source that claim separately.

Recommended excerpt search window for a later build brief: start with bars 21-32 (clear repeated dyadic/block attacks under changing harmony) and compare against bars 37-39 / 43-50 for the cleaner full-triad attack version. Exact excerpt should be chosen by readability and clave alignment, not by title.

## 3. What this changes for Claude

No wave-one builder needs to stop.

For later content waves:
- Blues Riff in C stays useful for full-form transfer but is **not yet a clean harmony-teaching model** and is **not cleared for public export** from its current metadata alone.
- La Negra now has a defensible concrete role: **real block-chord/ponchando MODEL candidate**. G15 must not be scoped as an arpeggiated-guajeo-only generator if the learner-facing gap includes the shipped block-chord figure.
- Keep the distinction between source definition, exact score observation, curriculum admission, and public-export rights.
