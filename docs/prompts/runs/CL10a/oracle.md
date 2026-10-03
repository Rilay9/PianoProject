# CL10a's acceptance set for texture.left-hand-pattern, chosen by the orchestrator, not the builder

The owner, 2026-10-03: *flawed tests don't tell us if a flawed process is correct.* A builder's own fixtures show only that the code does what the builder meant. So round two is judged on real catalogue items the builder did not choose, read through the detector at its head, and on the corpus counts by family.

The expected answers are the orchestrator's, from the textbook meaning of each texture. **They are inferred, not read on these scores**, and nobody in this process can hear them. Where an item's notation could go either way, the expectation says *read the score*.

## Must read FALSE (one line in both hands, or no tune)

| Item | Why |
| --- | --- |
| `exercise.scale.a-flat-major.2oct.similar.both.2` | both hands play the same scale in parallel |
| `exercise.scale.a-flat-major.2oct.contrary.both.2` | the same scale mirrored; still one line, not a tune with accompaniment |
| `exercise.hanon.01.both` | Hanon in both hands, the same figure an octave apart |
| `exercise.arpeggio.a-major.2oct.both` | both hands arpeggiate together |
| `exercise.chromatic.c.2oct.both` | a chromatic scale in both hands |
| `exercise.accompaniment.alberti.c-major.left` | an Alberti figure with no tune over it: a lower line alone |
| `song.folk.hot-cross-buns.lh` | one hand only |

## Must read TRUE (an accompaniment figure under a tune)

| Item | Why |
| --- | --- |
| `exercise.accompaniment.alberti.c-major.both` | Alberti under a melody |
| `exercise.accompaniment.waltz.c-major.both` | waltz bass under a melody |
| `song.folk.greensleeves.waltz` | a waltz bass under the tune |
| `song.ragtime.joplin-maple-leaf-rag` | stride bass under the melody in most strains |
| `exercise.stride.c`, `exercise.oompah.c.octave` | true **if** a right-hand tune sounds over them; read the score, since an exercise may be the left hand alone |
| `song.classical.clementi-sonatina-no-1-muzio-clementi.pdmx` | broken-chord and block-chord accompaniment under the melody in parts; read the score and say which bars qualify |

## Corpus counts

After round two, the corpus diff by family must show:
- the parallel-exercise families (scale, hanon, arpeggio, chromatic) gaining no left-hand pattern;
- each classical, pop, folk and ragtime gain sampled. For two items from each family, give the bars that qualify and what makes each a tune with an accompaniment.

A rule that passes the builder's fixtures but fails this set does not land.
