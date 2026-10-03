# How the field tells accompaniment from parallel hands (a research note for CL10a's round two)

Gathered 2026-10-02 by a web search on the owner's suggestion ("research how this is dealt with first"), after CL10a's corpus diff showed scales, Hanon and arpeggios gaining `texture.left-hand-pattern`. Sources are named; none was run here. **Every threshold below is a judgement call:** no source gives one, except "at least two quarters" for octave doubling in Giraud et al.

## What the sources say

- **Couturier, Bigo and Levé.** Their papers: the texture syntax (SMC 2022), a dataset of 1,164 annotated Mozart bars (ISMIR 2022, K. 279, 280 and 283; archives.ismir.net/ismir2022/paper/000061.pdf) and texture distances (ISMIR 2023).
  - Texture is a set of layers, each with a function (melodic, harmonic, static), a density and a diversity.
  - **Hands in octaves, thirds or sixths form one melodic layer.** The 2023 paper calls note doubling and parallel motion "monophonic texture".
  - Melody over Alberti is two layers (M1/HS1), the commonest combination in their labels.
  - They warn that splitting by hand alone is not representative enough.
  - Their trained bar classifier reached F1 0.67 for homorhythmy, 0.57 for parallel motion and 0.54 for octaves. The task is hard even for a trained model.
- **Giraud et al., "Towards modeling texture in symbolic data"** (ISMIR 2014).
  - A melodic layer can be several voices in a homorhythmic, constant-interval, octave or unison relation. That is distinct from melody plus accompaniment.
  - Their detector finds identical starts and ends at a constant interval. Its main false positives were repeated notes in both voices.
- **Huron (1989):** texture is placed by onset synchrony and semblant (same-direction) motion.
- **jSymbolic 2.2:** parallel, similar, contrary and oblique motion fractions (features T-19 to T-22). It finds voices by pitch, not by hand. **music21** has voice-leading motion tests.
- **Skyline (the top note per onset):** it fails on accompaniment above the melody and on arpeggiated writing. The app already knows the hands, so it adds nothing here.
- **Figure definitions** (musictheory.pugetsound.edu, *Arpeggiated accompaniments*; reference pages on Alberti bass, oom-pah and stride):
  - **Alberti:** low, high, middle, high.
  - **Oom-pah, stride, waltz bass:** a bass note on the strong beat and chords on the others.
- **No newer work on automatic piano texture classification** was found for 2022 to 2024. No published bar-level Alberti or stride detector was found.

## The discriminator

- **Parallel exercises:** both hands have the same onsets, and their steps move in the same direction (or mirrored, in contrary-motion scales) at a near-constant interval.
- **Alberti** alternates direction every step, and a melody almost never tracks that.
- **Onset identity alone is not safe:** right-hand eighths over left-hand eighth broken chords share every onset, as does a quarter-note tune over oom-pah.

## The recommended conditions, per bar (all must hold; the share of eligible bars stays)

1. **Under a melody:** the right hand sounds, and the left hand sits clearly below it. The left hand's median pitch is about 5 semitones or more under the right hand's (a sanity check; 5 is a guess).
2. **A figure, not a line:**
   - the left hand has three or more onsets, or a low note followed by an upper chord (oom-pah, waltz);
   - its pitch classes fit one triad or seventh chord, allowing a passing tone;
   - at most about half its moves are steps of 2 semitones or less (this rules out scales and chromatic lines);
   - a short cell repeats within the bar or from the neighbouring bar.
3. **Not locked to the right hand. Add this first: it is the least risk to true Alberti and stride.**
   - Over the bar's coincident onsets, compare the lowest left-hand note with the top right-hand note.
   - Reject the bar when all three hold:
     - the onset sets are nearly identical (Jaccard 0.9 or more);
     - there are 4 or more steps;
     - 80 % or more of the steps move both hands with one consistent direction relation (all the same direction, or all mirrored). Oblique steps count against it.
   - Leave repeated-note steps out of the direction test: they are Giraud's false-positive source.
   - A cheaper fallback: reject when nearly every coincident pair is a unison or an octave.
4. **Optional, for the whole piece:** when more than half the bars are locked, call it a parallel-hands piece.

## For the builder

These are starting points, not settled rules. Test condition 3 on real items from both sides before relying on it:
- **should stay false:** a two-hand scale, a Hanon exercise, a two-hand arpeggio and a chromatic scale;
- **should stay true:** a classical piece with an Alberti bass, a ragtime stride, a waltz bass and a beginner tune over oom-pah.

Report what each condition decides on each. Where no fixture separates two candidate thresholds, say so and leave it open; nothing in this process can hear the music.
