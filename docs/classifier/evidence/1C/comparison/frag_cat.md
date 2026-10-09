**Generated items against the recipe declarations: 1211 items, 46 declare syncopation (positives), 1165 do not (negatives).**

| method | TP | FP | FN | TN | no result | UNKNOWN | precision | recall | AUC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current detector (page list) | 46 | 73 | 0 | 1092 | 0 | 0 | 0.387 | 1.000 | 0.975 |
| current detector, presence without off-beat attack / bass-then-held-chord | 27 | 25 | 19 | 1140 | 0 | 0 | 0.519 | 0.587 | 0.786 |
| current detector with fix | 46 | 73 | 0 | 1092 | 0 | 0 | 0.387 | 1.000 | 0.975 |
| SynPy LHL (texture) | 37 | 116 | 9 | 1032 | 17 | 0 | 0.242 | 0.804 | 0.869 |
| SynPy LHL (lines) | 46 | 112 | 0 | 1045 | 8 | 0 | 0.291 | 1.000 | 0.983 |
| SynPy PRS (texture) | 46 | 787 | 0 | 361 | 17 | 0 | 0.055 | 1.000 | 0.698 |
| SynPy PRS (lines) | 46 | 788 | 0 | 369 | 8 | 0 | 0.055 | 1.000 | 0.677 |
| SynPy TMC (texture) | 38 | 252 | 8 | 896 | 17 | 0 | 0.131 | 0.826 | 0.864 |
| SynPy TMC (lines) | 46 | 249 | 0 | 908 | 8 | 0 | 0.156 | 1.000 | 0.971 |
| SynPy SG (texture) | 37 | 127 | 9 | 1021 | 17 | 0 | 0.226 | 0.804 | 0.866 |
| SynPy SG (lines) | 46 | 125 | 0 | 1032 | 8 | 0 | 0.269 | 1.000 | 0.982 |
| SynPy KTH (texture) | 37 | 121 | 9 | 1015 | 29 | 0 | 0.234 | 0.804 | 0.847 |
| SynPy KTH (lines) | 46 | 122 | 0 | 1014 | 29 | 0 | 0.274 | 1.000 | 0.961 |
| SynPy TOB (texture) | 6 | 685 | 40 | 479 | 1 | 0 | 0.009 | 0.130 | 0.259 |
| SynPy TOB (lines) | 6 | 696 | 40 | 468 | 1 | 0 | 0.009 | 0.130 | 0.239 |
| SynPy WNBD (texture) | 46 | 750 | 0 | 414 | 1 | 0 | 0.058 | 1.000 | 0.557 |
| SynPy WNBD (lines) | 46 | 750 | 0 | 414 | 1 | 0 | 0.058 | 1.000 | 0.525 |
| AMADS WNBD (score file) | 46 | 742 | 0 | 423 | 0 | 0 | 0.058 | 1.000 | 0.470 |
| AMADS WNBD (texture onsets) | 46 | 750 | 0 | 415 | 0 | 0 | 0.058 | 1.000 | 0.463 |
| AMADS WNBD (lines onsets) | 46 | 750 | 0 | 415 | 0 | 0 | 0.058 | 1.000 | 0.549 |
| AMADS span (texture onsets) | 36 | 69 | 10 | 1079 | 17 | 0 | 0.343 | 0.783 | 0.871 |
| AMADS span (lines onsets) | 46 | 65 | 0 | 1092 | 8 | 0 | 0.414 | 1.000 | 0.980 |

**Generated families: items flagged present by each method (families with a declared positive or with at least 4 flagged items by any of the methods shown).**

| family | items | declare syncopation | cur (page list) | cur, proper | SynPy LHL (texture) | SynPy LHL (lines) | SynPy SG (texture) | AMADS WNBD (score file) | AMADS span (lines onsets) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| exercise.accompaniment | 30 | 0 | 5 | 5 | 5 | 0 | 5 | 15 | 0 |
| exercise.arpeggio | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 60 | 0 |
| exercise.arpeggio7 | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 60 | 0 |
| exercise.bass-cell | 4 | 0 | 1 | 1 | 1 | 1 | 4 | 4 | 1 |
| exercise.blues | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 |
| exercise.blues-scale | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 16 | 0 |
| exercise.boogie | 36 | 0 | 0 | 0 | 0 | 0 | 0 | 36 | 0 |
| exercise.broken-octaves | 10 | 0 | 0 | 0 | 10 | 10 | 10 | 10 | 0 |
| exercise.broken7 | 36 | 0 | 0 | 0 | 0 | 0 | 0 | 36 | 0 |
| exercise.chromatic | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 16 | 0 |
| exercise.clave | 10 | 10 | 10 | 1 | 5 | 10 | 5 | 10 | 10 |
| exercise.comping | 58 | 0 | 46 | 0 | 46 | 46 | 46 | 46 | 46 |
| exercise.double-sixth | 4 | 0 | 0 | 0 | 4 | 4 | 4 | 4 | 0 |
| exercise.double-third | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 |
| exercise.hanon | 60 | 0 | 0 | 0 | 0 | 0 | 0 | 60 | 0 |
| exercise.independence | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| exercise.latin-groove | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |
| exercise.montuno | 15 | 15 | 15 | 5 | 15 | 15 | 15 | 15 | 15 |
| exercise.mordent | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 |
| exercise.octave-scale | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | 0 |
| exercise.ostinato | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 |
| exercise.pentatonic | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 |
| exercise.repeated-notes | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 12 | 0 |
| exercise.rhythm | 18 | 1 | 1 | 1 | 1 | 1 | 4 | 9 | 1 |
| exercise.riff | 4 | 0 | 4 | 4 | 4 | 4 | 4 | 2 | 4 |
| exercise.rotation | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 |
| exercise.scale | 252 | 0 | 0 | 0 | 24 | 24 | 24 | 252 | 0 |
| exercise.secondary-rag | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| exercise.shaping | 10 | 0 | 10 | 10 | 10 | 10 | 10 | 10 | 0 |
| exercise.study | 24 | 4 | 11 | 9 | 7 | 11 | 11 | 14 | 9 |
| exercise.syncopation | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 2 |
| exercise.tremolo | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 |
| exercise.tremolo-third | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 |
| exercise.tresillo | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
| exercise.trill | 6 | 0 | 0 | 0 | 6 | 6 | 6 | 6 | 6 |
| exercise.tumbao | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 |

**Real items (809: PDMX and representative, no recipe, no annotation): items flagged present, and agreement with the current detector's page-list presence (not a ground truth).**

| method | measured | present | agree with current | current present & method absent | current absent & method present |
| --- | --- | --- | --- | --- | --- |
| current detector (page list) | 805 | 540 | 805 | 0 | 0 |
| current detector, presence without off-beat attack / bass-then-held-chord | 805 | 535 | 800 | 5 | 0 |
| current detector with fix | 804 | 539 | 804 | 0 | 0 |
| SynPy LHL (texture) | 791 | 432 | 575 | 157 | 59 |
| SynPy LHL (lines) | 795 | 641 | 655 | 15 | 125 |
| SynPy PRS (texture) | 791 | 775 | 538 | 4 | 249 |
| SynPy PRS (lines) | 795 | 787 | 539 | 0 | 256 |
| SynPy TMC (texture) | 791 | 593 | 584 | 72 | 135 |
| SynPy TMC (lines) | 795 | 718 | 596 | 6 | 193 |
| SynPy SG (texture) | 791 | 550 | 571 | 100 | 120 |
| SynPy SG (lines) | 795 | 713 | 601 | 6 | 188 |
| SynPy KTH (texture) | 517 | 355 | 392 | 64 | 61 |
| SynPy KTH (lines) | 517 | 440 | 421 | 7 | 89 |
| SynPy TOB (texture) | 796 | 683 | 554 | 45 | 197 |
| SynPy TOB (lines) | 796 | 681 | 554 | 46 | 196 |
| SynPy WNBD (texture) | 796 | 752 | 557 | 9 | 230 |
| SynPy WNBD (lines) | 796 | 753 | 558 | 8 | 230 |
| AMADS WNBD (score file) | 805 | 733 | 568 | 22 | 215 |
| AMADS WNBD (texture onsets) | 805 | 762 | 567 | 8 | 230 |
| AMADS WNBD (lines onsets) | 805 | 762 | 567 | 8 | 230 |
| AMADS span (texture onsets) | 556 | 237 | 410 | 120 | 26 |
| AMADS span (lines onsets) | 667 | 451 | 570 | 34 | 63 |

**Per evidence type, current detector (the only method here that separates the types): items with the kind, generated items (of 46 declared positives / 1,165 declared negatives) and real items.**

| evidence type | generated items with it | of which declared positive | declared negative | real items with it |
| --- | --- | --- | --- | --- |
| held over a stronger beat, beat level | 22 | 13 | 9 | 306 |
| held across the next beat from off the beat | 35 | 19 | 16 | 371 |
| held at the subdivision | 7 | 2 | 5 | 126 |
| off-beat attack | 76 | 30 | 46 | 90 |
| accent on a weak position | 0 | 0 | 0 | 228 |
| rest on a strong beat | 6 | 6 | 0 | 69 |
| bass-then-held-chord | 6 | 4 | 2 | 75 |

**The tools split by what the current detector found in the item (generated items): number of items in the class, declared positives among them, and how many each tool flags present. A tool that flags the classes other than 'tied' cannot tell tied syncopation from an accompaniment's off-beat chords or a rest.**

| class of item (by current detector's kinds) | items | declared positive | SynPy LHL (texture) | SynPy LHL (lines) | SynPy SG (texture) | SynPy PRS (texture) | AMADS WNBD (score file) | AMADS WNBD (lines onsets) | AMADS span (lines onsets) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tied (any of the three held kinds) | 46 | 21 | 41/46 | 41/46 | 41/46 | 46/46 | 42/46 | 42/46 | 31/46 |
| no tied kind; off-beat attack | 71 | 25 | 66/71 | 71/71 | 66/71 | 71/71 | 71/71 | 71/71 | 71/71 |
| no tied kind or off-beat attack; bass-then-held-chord | 2 | 0 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 0/2 |
| only rest | 0 | 0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 |
| only accent | 0 | 0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 |
| no counted kind | 1092 | 0 | 44/1075 | 44/1084 | 55/1075 | 714/1075 | 673/1092 | 681/1092 | 9/1084 |

**The tools split by what the current detector found in the item (real items): number of items in the class, declared positives among them, and how many each tool flags present. A tool that flags the classes other than 'tied' cannot tell tied syncopation from an accompaniment's off-beat chords or a rest.**

| class of item (by current detector's kinds) | items | declared positive | SynPy LHL (texture) | SynPy LHL (lines) | SynPy SG (texture) | SynPy PRS (texture) | AMADS WNBD (score file) | AMADS WNBD (lines onsets) | AMADS span (lines onsets) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tied (any of the three held kinds) | 488 | - | 354/480 | 473/481 | 404/480 | 478/480 | 468/488 | 480/488 | 359/380 |
| no tied kind; off-beat attack | 6 | - | 2/6 | 6/6 | 3/6 | 5/6 | 6/6 | 6/6 | 4/4 |
| no tied kind or off-beat attack; bass-then-held-chord | 2 | - | 1/2 | 2/2 | 1/2 | 2/2 | 2/2 | 2/2 | 2/2 |
| only rest | 4 | - | 3/3 | 3/3 | 3/3 | 3/3 | 4/4 | 4/4 | 2/3 |
| only accent | 40 | - | 13/39 | 32/39 | 19/39 | 38/39 | 38/40 | 40/40 | 21/33 |
| no counted kind | 265 | - | 59/261 | 125/264 | 120/261 | 249/261 | 215/265 | 230/265 | 63/245 |

**Named items (33; 29 with an expected answer, 4 open). Expected answers: named_items.json. Right and wrong counts are over the 29.**


*current detector and AMADS*

| item | expected | cur (page list) | cur, proper | cur with fix | AMADS WNBD (score file) | AMADS WNBD (lines onsets) | AMADS span (lines onsets) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| exercise.syncopation.tied-across-bar | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| exercise.syncopation.sixteenth | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.grieg-ase-s-tod.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.vivaldi-vivaldi-spring-simple-arrangement.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.pop.frank-sinatra-let-it-snow-leadsheet.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.chopin-waltz-op69-2.nifc | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.folk.cielito-lindo.simple | present | present (right) | present (right) | present (right) | absent (wrong) | absent (wrong) | present (right) |
| song.folk.exercise-cielito-lindo.pdmx | present | present (right) | present (right) | present (right) | absent (wrong) | absent (wrong) | present (right) |
| exercise.latin-groove.a.son-3-2 | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| exercise.tumbao.a | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.chopin-mazurka-op68-4.nifc | present | present (right) | absent (wrong) | present (right) | present (right) | present (right) | present (right) |
| song.classical.pieczonka-tarantella-in-a-minor.pdmx | present | present (right) | present (right) | present (right) | absent (wrong) | present (right) | present (right) |
| song.classical.satie-gnossienne-1 | UNKNOWN | present (wrong) | present (wrong) | UNKNOWN (right) | present (wrong) | absent (wrong) | present (wrong) |
| song.classical.satie-erik-satie-gnossienne-n1.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.ragtime.joplin-entertainer | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.alexander-s-ragtime-band.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| exercise.rhythm.syncopated.4bar | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| exercise.clave.son-3-2 | present | present (right) | absent (wrong) | present (right) | present (right) | present (right) | present (right) |
| exercise.comping.b-flat.off-beats | present | present (right) | absent (wrong) | present (right) | present (right) | present (right) | present (right) |
| song.classical.bach-wtc1-prelude-1 | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | present (wrong) |
| song.classical.bach-prelude-in-c-minor-bwv-999.pdmx | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | present (wrong) |
| exercise.broken7.a-dominant7.both | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | absent (right) |
| exercise.trill.c.4pb.right | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | present (wrong) |
| exercise.repeated-notes.c.3x.right | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | no result |
| exercise.tremolo.c.right | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | absent (right) |
| exercise.rhythm.triplet-quarters.4bar | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | no result |
| song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | absent (right) |
| song.classical.handel-georg-friedrich-handel-sarabande.pdmx | absent | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) | absent (right) |
| exercise.ii-v-i.a | absent | absent (right) | absent (right) | absent (right) | absent (right) | absent (right) | absent (right) |
| song.classical.anon-kum-ba-yah.pdmx | open | present | present | present | present | present | absent |
| song.classical.beethoven-ode-to-joy.easy | open | present | present | present | present | present | absent |
| song.folk.sakura.pdmx | open | present | present | present | present | present | absent |
| song.classical.chopin-mazurka-op17-4.nifc | open | present | present | present | present | present | no result |
| **right / wrong / no result** | | 28 / 1 / 0 | 25 / 4 / 0 | 29 / 0 / 0 | 16 / 13 / 0 | 17 / 12 / 0 | 23 / 4 / 2 |

*SynPy on the texture (every onset of either hand)*

| item | expected | LHL (texture) | PRS (texture) | TMC (texture) | SG (texture) | KTH (texture) | TOB (texture) | WNBD (texture) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| exercise.syncopation.tied-across-bar | present | absent (wrong) | present (right) | present (right) | absent (wrong) | absent (wrong) | absent (wrong) | present (right) |
| exercise.syncopation.sixteenth | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.grieg-ase-s-tod.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| song.classical.vivaldi-vivaldi-spring-simple-arrangement.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| song.pop.frank-sinatra-let-it-snow-leadsheet.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| song.classical.chopin-waltz-op69-2.nifc | present | absent (wrong) | present (right) | present (right) | present (right) | no result | present (right) | present (right) |
| song.folk.cielito-lindo.simple | present | absent (wrong) | present (right) | absent (wrong) | present (right) | no result | absent (wrong) | absent (wrong) |
| song.folk.exercise-cielito-lindo.pdmx | present | present (right) | present (right) | present (right) | present (right) | no result | absent (wrong) | absent (wrong) |
| exercise.latin-groove.a.son-3-2 | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| exercise.tumbao.a | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| song.classical.chopin-mazurka-op68-4.nifc | present | absent (wrong) | present (right) | absent (wrong) | absent (wrong) | no result | present (right) | present (right) |
| song.classical.pieczonka-tarantella-in-a-minor.pdmx | present | absent (wrong) | present (right) | present (right) | present (right) | no result | present (right) | present (right) |
| song.classical.satie-gnossienne-1 | UNKNOWN | no result | no result | no result | no result | no result | no result | no result |
| song.classical.satie-erik-satie-gnossienne-n1.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.ragtime.joplin-entertainer | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.alexander-s-ragtime-band.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| exercise.rhythm.syncopated.4bar | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| exercise.clave.son-3-2 | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| exercise.comping.b-flat.off-beats | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.bach-wtc1-prelude-1 | absent | absent (right) | present (wrong) | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) |
| song.classical.bach-prelude-in-c-minor-bwv-999.pdmx | absent | absent (right) | present (wrong) | absent (right) | absent (right) | no result | present (wrong) | present (wrong) |
| exercise.broken7.a-dominant7.both | absent | absent (right) | present (wrong) | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) |
| exercise.trill.c.4pb.right | absent | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) |
| exercise.repeated-notes.c.3x.right | absent | no result | no result | no result | no result | present (wrong) | present (wrong) | present (wrong) |
| exercise.tremolo.c.right | absent | absent (right) | present (wrong) | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) |
| exercise.rhythm.triplet-quarters.4bar | absent | no result | no result | no result | no result | present (wrong) | absent (right) | present (wrong) |
| song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx | absent | absent (right) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) |
| song.classical.handel-georg-friedrich-handel-sarabande.pdmx | absent | present (wrong) | present (wrong) | present (wrong) | present (wrong) | no result | present (wrong) | present (wrong) |
| exercise.ii-v-i.a | absent | absent (right) | absent (right) | absent (right) | absent (right) | absent (right) | absent (right) | absent (right) |
| song.classical.anon-kum-ba-yah.pdmx | open | present | present | present | present | no result | present | present |
| song.classical.beethoven-ode-to-joy.easy | open | absent | present | present | present | present | absent | present |
| song.folk.sakura.pdmx | open | absent | present | present | absent | absent | absent | present |
| song.classical.chopin-mazurka-op17-4.nifc | open | present | present | present | present | no result | present | present |
| **right / wrong / no result** | | 19 / 7 / 3 | 19 / 7 / 3 | 21 / 5 / 3 | 21 / 5 / 3 | 16 / 5 / 8 | 11 / 17 / 1 | 17 / 11 / 1 |

*SynPy on the lines (right-hand top, left-hand bottom)*

| item | expected | LHL (lines) | PRS (lines) | TMC (lines) | SG (lines) | KTH (lines) | TOB (lines) | WNBD (lines) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| exercise.syncopation.tied-across-bar | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| exercise.syncopation.sixteenth | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.grieg-ase-s-tod.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| song.classical.vivaldi-vivaldi-spring-simple-arrangement.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| song.pop.frank-sinatra-let-it-snow-leadsheet.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| song.classical.chopin-waltz-op69-2.nifc | present | present (right) | present (right) | present (right) | present (right) | no result | present (right) | present (right) |
| song.folk.cielito-lindo.simple | present | present (right) | present (right) | present (right) | present (right) | no result | absent (wrong) | absent (wrong) |
| song.folk.exercise-cielito-lindo.pdmx | present | present (right) | present (right) | present (right) | present (right) | no result | absent (wrong) | absent (wrong) |
| exercise.latin-groove.a.son-3-2 | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| exercise.tumbao.a | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| song.classical.chopin-mazurka-op68-4.nifc | present | present (right) | present (right) | present (right) | present (right) | no result | present (right) | present (right) |
| song.classical.pieczonka-tarantella-in-a-minor.pdmx | present | present (right) | present (right) | present (right) | present (right) | no result | present (right) | present (right) |
| song.classical.satie-gnossienne-1 | UNKNOWN | no result | no result | no result | no result | no result | no result | no result |
| song.classical.satie-erik-satie-gnossienne-n1.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.ragtime.joplin-entertainer | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.alexander-s-ragtime-band.pdmx | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| exercise.rhythm.syncopated.4bar | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| exercise.clave.son-3-2 | present | present (right) | present (right) | present (right) | present (right) | present (right) | absent (wrong) | present (right) |
| exercise.comping.b-flat.off-beats | present | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) | present (right) |
| song.classical.bach-wtc1-prelude-1 | absent | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) |
| song.classical.bach-prelude-in-c-minor-bwv-999.pdmx | absent | present (wrong) | present (wrong) | present (wrong) | present (wrong) | no result | present (wrong) | present (wrong) |
| exercise.broken7.a-dominant7.both | absent | absent (right) | present (wrong) | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) |
| exercise.trill.c.4pb.right | absent | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) |
| exercise.repeated-notes.c.3x.right | absent | no result | no result | no result | no result | present (wrong) | present (wrong) | present (wrong) |
| exercise.tremolo.c.right | absent | absent (right) | present (wrong) | absent (right) | absent (right) | absent (right) | present (wrong) | present (wrong) |
| exercise.rhythm.triplet-quarters.4bar | absent | no result | no result | no result | no result | present (wrong) | absent (right) | present (wrong) |
| song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx | absent | absent (right) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) | present (wrong) |
| song.classical.handel-georg-friedrich-handel-sarabande.pdmx | absent | present (wrong) | present (wrong) | present (wrong) | present (wrong) | no result | present (wrong) | present (wrong) |
| exercise.ii-v-i.a | absent | absent (right) | absent (right) | absent (right) | absent (right) | absent (right) | absent (right) | absent (right) |
| song.classical.anon-kum-ba-yah.pdmx | open | present | present | present | present | no result | present | present |
| song.classical.beethoven-ode-to-joy.easy | open | absent | present | present | present | present | absent | present |
| song.folk.sakura.pdmx | open | absent | present | present | absent | absent | absent | present |
| song.classical.chopin-mazurka-op17-4.nifc | open | present | present | present | present | no result | present | present |
| **right / wrong / no result** | | 22 / 4 / 3 | 19 / 7 / 3 | 21 / 5 / 3 | 21 / 5 / 3 | 16 / 5 / 8 | 11 / 17 / 1 | 17 / 11 / 1 |

**Runtime per piece in the full runs (seconds; worker processes on a shared machine, so an upper bound for one process):**

| step | pieces | median | 90th percentile | max |
| --- | --- | --- | --- | --- |
| current detector (read + analyse) | 2016 | 0.018 | 2.955 | 102.40 |
| line extraction (read with the project's reader + lines) | 2016 | 0.115 | 3.301 | 93.94 |
| SynPy 7 models x (texture + lines) | 2016 | 0.060 | 0.946 | 125.63 |
| AMADS WNBD on the score file (partitura load + measure) | 2020 | 0.089 | 1.235 | 9.21 |
| AMADS WNBD on lines onsets (3 lines) | 2016 | 0.002 | 0.102 | 0.87 |
| AMADS span on lines onsets | 2016 | 0.003 | 0.113 | 1.13 |
