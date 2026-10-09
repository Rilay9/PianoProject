**Hand-word truth (12 files with a printed hand word; rule in section 1).**

| item | words | truth notes | of them on the other hand's staff (truth hand differs from the staff rule) | staff rule right | piano_svsep right (of notes it predicted) | svsep right on other-staff notes | svsep right on same-staff notes | truth notes in flagged bars |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| song.classical.bach-little-prelude-in-d-minor-bwv-935.pdmx |  | 12 | 0 | 12 (100.0%) | 10/12 (83.3%) | 0/0 | 10/12 | 12 |
| song.classical.chopin-etude-in-e-flat-minor-op-10-no-6.pdmx |  | 35 | 35 | 0 (0.0%) | 7/35 (20.0%) | 7/35 | 0/0 | 35 |
| song.classical.debussy-children-s-corner-doctor-gradus-ad-parnassum.pdmx |  | 35 | 35 | 0 (0.0%) | 7/35 (20.0%) | 7/35 | 0/0 | 35 |
| song.classical.debussy-clair-de-lune |  | 18 | 18 | 0 (0.0%) | 0/18 (0.0%) | 0/18 | 0/0 | 18 |
| song.classical.grieg-album-leaf-op-47-no-2.pdmx |  | 42 | 4 | 38 (90.5%) | 36/42 (85.7%) | 0/4 | 36/38 | 42 |
| song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx |  | 5 | 5 | 0 (0.0%) | 3/5 (60.0%) | 3/5 | 0/0 | 5 |
| song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx |  | 84 | 0 | 84 (100.0%) | 81/84 (96.4%) | 0/0 | 81/84 | 84 |
| song.classical.nazareth-carioca-1913.pdmx |  | 23 | 9 | 14 (60.9%) | 14/23 (60.9%) | 3/9 | 11/14 | 23 |
| song.classical.rimsky-flight-bumblebee |  | 8 | 0 | 8 (100.0%) | 8/8 (100.0%) | 0/0 | 8/8 | 8 |
| song.folk.3-variations-on-happy-birthday.pdmx |  | 8 | 4 | 4 (50.0%) | 0/8 (0.0%) | 0/4 | 0/4 | 8 |
| song.pop.laura-shigihara-loonboon.pdmx |  | 8 | 0 | 8 (100.0%) | 8/8 (100.0%) | 0/0 | 8/8 | 8 |
| song.pop.misc-cartoons-mabinogi-saga-login-theme-an-old-story-from-grandma.pdmx |  | 9 | 9 | 0 (0.0%) | 3/9 (33.3%) | 3/9 | 0/0 | 9 |
| **all** |  | 287 | 119 | 168 (58.5%) | 177/287 (61.7%) | 23/119 (19.3%) | 154/168 (91.7%) | 287 |

Agreement as confidence, not proof (word-truth notes both methods answered, 287): the staff rule and piano_svsep agree and are right on 154, agree and are both wrong on 96; they disagree on 37, of which piano_svsep is right on 23.

Other-staff truth notes inside a bar the hand-word flag raises: 119 of 119.

**Generated two-staff items, hand = written staff by construction (97 items run, 0 errors).** piano_svsep's predicted staff equals the written staff on 5017 of 5601 notes (89.6%); items with at least one differing note: 50; unmatched model rows 14, notes it gave no prediction 0. The staff rule is right on every note by construction (100%). Flags raised by the current detector on these items: 0 items.

Largest disagreements (notes, item): 68 exercise.hanon.18.both; 66 exercise.hanon.10.both; 58 exercise.hanon.02.both; 40 exercise.clave.rumba-3-2.pulse; 35 exercise.scale.c-major.4oct.similar.both.1; 34 exercise.scale.a-flat-major.4oct.similar.both.1; 21 exercise.scale.d-harmonic-minor.3oct.similar.both.2; 14 exercise.arpeggio.a-flat-major.4oct.both; 13 exercise.scale.b-major.3oct.similar.both.2; 13 exercise.arpeggio.e-minor.4oct.both; 13 exercise.arpeggio.d-minor.4oct.both; 13 exercise.arpeggio.b-flat-minor.4oct.both

**Real two-staff items, every 20th by id (33 run, 1 errors): agreement only, no truth.** piano_svsep's staff equals the written staff on 27364 of 28294 notes (96.7%); 930 differing notes, of which 24 are in bars the current flags raise.

**Items the validation row names.**

| item | notes | svsep staff = written staff | differing notes | differing notes in flagged bars | flags (bars, 0-based) | differing bars (part:bar -> notes) |
| --- | --- | --- | --- | --- | --- | --- |
| song.classical.albeniz-asturias.pdmx | 2677 | 1861/2677 (69.5%) | 816 | 96 | {"cross_staff": 12} | 0:0->5, 0:1->5, 0:2->4, 0:3->5, 0:4->5, 0:5->5, 0:6->4, 0:7->6, 0:8->6, 0:9->6 ... |
| song.folk.amazing-grace-satb.pdmx | 127 | 112/127 (88.2%) | 15 | 15 | {"collision": 19} | 0:2->1, 0:3->2, 0:4->1, 0:5->1, 0:10->2, 0:13->1, 0:14->1, 0:15->4, 0:16->1, 0:17->1 |
| song.classical.abide-with-me-william-henry-monk.pdmx | 163 | 154/163 (94.5%) | 9 | 9 | {"collision": 16, "reach": [[0, 9]]} | 0:4->1, 0:6->1, 0:9->2, 0:10->3, 0:12->1, 0:13->1 |
| song.classical.grieg-album-leaf-op-47-no-2.pdmx | 1338 | 1251/1324 (94.5%) | 73 | 8 | {"hand_words": 8, "reach": 8} | 0:0->2, 0:1->1, 0:4->1, 0:13->3, 0:15->2, 0:16->2, 0:17->3, 0:18->1, 0:19->2, 0:20->2 ... |
| song.classical.bach-invention-no-8-in-f-major-bwv-779.pdmx | 598 | 581/598 (97.2%) | 17 | 0 | {} | 0:2->1, 0:4->7, 0:9->1, 0:10->1, 0:17->1, 0:26->2, 0:27->1, 0:31->2, 0:32->1 |
| exercise.clave.bossa.pulse | 52 | 13/52 (25.0%) | 39 | 0 | {} | 0:0->5, 0:1->4, 0:2->6, 0:3->4, 0:4->6, 0:5->4, 0:6->6, 0:7->4 |
| song.classical.bach-adagio-bwv-974-after-marcello.pdmx | 965 | 906/965 (93.9%) | 59 | 0 | {} | 0:1->6, 0:2->6, 0:3->2, 0:4->2, 0:5->1, 0:13->2, 0:14->2, 0:15->8, 0:17->10, 0:24->5 ... |
| excerpt.blues.wabash-blues.b1-4 | 19 | 19/19 (100.0%) | 0 | 0 | {} |  |
| song.classical.bach-fugue-in-g-minor-bwv-578-piano-transcription.pdmx | 1883 | 1746/1883 (92.7%) | 137 | 61 | {"cross_staff": [[0, 12], [0, 42], [0, 51]], "reach": 13} | 0:10->4, 0:11->1, 0:12->2, 0:13->2, 0:14->2, 0:15->3, 0:16->5, 0:17->1, 0:19->5, 0:20->5 ... |
| excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28 | 23 | 21/23 (91.3%) | 2 | 0 | {} | 0:2->2 |
| song.classical.bach-little-prelude-in-d-minor-bwv-935.pdmx | 449 | 447/449 (99.6%) | 2 | 2 | {"hand_words": [[0, 23], [0, 47]]} | 0:23->1, 0:47->1 |
| song.classical.chopin-etude-in-e-flat-minor-op-10-no-6.pdmx | 970 | 917/970 (94.5%) | 53 | 22 | {"cross_staff": 23, "hand_words": [[0, 26], [0, 47], [0, 48]]} | 0:7->1, 0:17->3, 0:19->2, 0:23->2, 0:24->4, 0:25->1, 0:26->7, 0:27->1, 0:28->4, 0:29->1 ... |
| song.classical.debussy-children-s-corner-doctor-gradus-ad-parnassum.pdmx | 1257 | 922/1230 (75.0%) | 308 | 41 | {"cross_staff": 9, "hand_words": [[0, 23], [0, 26]]} | 0:0->2, 0:1->2, 0:5->7, 0:6->4, 0:7->3, 0:8->4, 0:9->4, 0:10->6, 0:11->1, 0:12->7 ... |
| song.classical.debussy-clair-de-lune | 1603 | 1456/1603 (90.8%) | 147 | 94 | {"cross_staff": 22, "hand_words": [[0, 16]], "reach": [[0, 16], [0, 24], [0, 25], [0, 71]]} | 0:0->2, 0:4->2, 0:5->2, 0:6->1, 0:7->2, 0:8->2, 0:10->1, 0:14->6, 0:16->7, 0:19->4 ... |
| song.classical.grieg-album-leaf-op-47-no-2.pdmx | 1338 | 1251/1324 (94.5%) | 73 | 8 | {"hand_words": 8, "reach": 8} | 0:0->2, 0:1->1, 0:4->1, 0:13->3, 0:15->2, 0:16->2, 0:17->3, 0:18->1, 0:19->2, 0:20->2 ... |
| song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx | 1777 | 1615/1777 (90.9%) | 162 | 3 | {"hand_words": [[0, 86]]} | 0:1->7, 0:2->6, 0:3->8, 0:4->5, 0:5->7, 0:6->6, 0:7->8, 0:8->5, 0:9->5, 0:10->2 ... |
| song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx | 2369 | 2249/2304 (97.6%) | 55 | 20 | {"cross_staff": [[0, 60], [0, 64], [0, 68], [0, 113], [0, 117], [0, 121]], "hand_words": [[0, 60], [0, 64], [0, 68], [0, | 0:9->1, 0:10->1, 0:11->1, 0:22->1, 0:24->2, 0:55->3, 0:56->1, 0:58->3, 0:59->4, 0:60->2 ... |
| song.classical.nazareth-carioca-1913.pdmx | 1145 | 1128/1145 (98.5%) | 17 | 7 | {"hand_words": [[0, 32], [0, 33]]} | 0:4->1, 0:32->4, 0:33->3, 0:44->1, 0:48->4, 0:49->2, 0:50->1, 0:73->1 |
| song.classical.rimsky-flight-bumblebee | 1139 | 1116/1139 (98.0%) | 23 | 6 | {"hand_words": [[0, 49], [0, 50]]} | 0:6->1, 0:8->1, 0:10->1, 0:22->1, 0:30->3, 0:48->4, 0:49->6, 0:54->2, 0:58->1, 0:60->1 ... |
| song.folk.3-variations-on-happy-birthday.pdmx | 2554 | 2480/2554 (97.1%) | 74 | 7 | {"cross_staff": [[0, 40]], "hand_words": [[0, 162], [0, 163]], "reach": [[0, 7], [0, 179], [0, 185], [0, 215]]} | 0:0->2, 0:3->1, 0:10->1, 0:12->1, 0:36->2, 0:37->3, 0:38->3, 0:39->1, 0:40->2, 0:59->1 ... |
| song.pop.laura-shigihara-loonboon.pdmx | 516 | 497/516 (96.3%) | 19 | 4 | {"hand_words": [[0, 31], [0, 33], [0, 35], [0, 41], [0, 43]]} | 0:0->4, 0:13->1, 0:20->2, 0:24->2, 0:27->1, 0:28->1, 0:29->1, 0:30->1, 0:31->4, 0:34->1 ... |
| song.pop.misc-cartoons-mabinogi-saga-login-theme-an-old-story-from-grandma.pdmx | 1002 | 971/1002 (96.9%) | 31 | 8 | {"hand_words": [[0, 55]], "reach": [[0, 55], [0, 89]]} | 0:27->3, 0:55->3, 0:56->3, 0:57->2, 0:58->2, 0:59->5, 0:60->4, 0:61->1, 0:63->1, 0:88->2 ... |

**Runtime, piano_svsep (CPU, one process, model load 1.4 s once):** per item mean 0.20 s, median 0.06 s, max 2.58 s over 152 items (median 58 notes, max 5302).
**Runtime, the four flags of the current rule (re-implementation, after the file is read):** mean 1.2 ms, max 28 ms over 151 items (the file read and the staff rule are the project reader's: 0.55 s per piece mean in key.md section 5).
