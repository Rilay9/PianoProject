shapes: 35; the build agrees with the app before X31 on 13, after on 28

| Shape | App opens at | Build before | Build after | Agree after |
| --- | --- | --- | --- | --- |
| half = 60 with sound 120, cut time | 120 | 60 | 120 | yes |
| half = 60 alone, cut time | 120 | 60 | 120 | yes |
| dotted quarter = 60 with sound 90, 6/8 | 90 | 60 | 90 | yes |
| eighth = 120 alone | 60 | 120 | 60 | yes |
| whole = 30 alone | 120 | 30 | 120 | yes |
| 16th = 240 alone | 60 | 240 | 60 | yes |
| breve = 10 alone | 80 | 10 | 80 | yes |
| dotted half = 61 alone | 183 | 61 | 183 | yes |
| dotted eighth = 120 alone | 90 | 120 | 90 | yes |
| double-dotted quarter = 40 alone | 70 | 40 | 70 | yes |
| a sound alone in the bar, 72.5 | 72.5 | 100 | 72.5 | yes |
| a tempo word with its sound, 132 | 132 | 100 | 132 | yes |
| quarter = 90.00009000009 with its sound | 90.0001 | 90.0001 | 90.0001 | yes |
| dotted quarter = 67 with sound 100.49999999999999 | 100.5 | 67 | 100.5 | yes |
| a visual offset | 60 | 60 | 60 | yes |
| an opening sound, then a sounding offset | 50 | 100 | 50 | yes |
| two parts at one place: the first part's | 60 | 60 | 60 | yes |
| a metric modulation | 100 | 100 | 100 | yes |
| the metronome-note form | 100 | 100 | 100 | yes |
| a mark with no number | 100 | 100 | 100 | yes |
| a range | 100 | 100 | 100 | yes |
| a tempo word alone | 100 | 100 | 100 | yes |
| a sound in a comment | 100 | 100 | 100 | yes |
| no tempo at all | 100 | 100 | 100 | yes |
| an opening sound, a mark in bar 2 | 100 | 100 | 100 | yes |
| a tempo after an opening rest (the Fifth's shape) | 164 | 100 | 164 | yes |
| a mark on bar 2 after a cue note and rests | 72 | 72 | 72 | yes |
| E48's form: a sound opening bar 1, a mark in bar 2 | 72 | 100 | 72 | yes |
| a mark and a sound that disagree in one direction | 100 | 60 | 120 | no — music21 drops the sound in a direction that holds a mark |
| a sound standing beside a mark at one place (E32's form) | 100 | 132 | 132 | no — two tempos at one offset: music21's first in the file is the mark; the app's sound wins |
| a pickup whose mark and sound disagree | 70 | 60 | 90 | no — music21 drops the sound in a direction that holds a mark |
| 'c. 108' | 108 | 100 | 100 | no — music21 reads no number from 'c. 108' |
| a mark only in bar 2 | 100 | 132 | 132 | no — the app opens at its default before a tempo written after notes have sounded |
| a tempo after the first note of bar 1 | 100 | 100 | 90 | no — the app opens at its default before a tempo written after notes have sounded |
| an upbeat before bar 1's tempo | 100 | 60 | 90 | no — the app opens at its default before a tempo written after notes have sounded |
exit=0
