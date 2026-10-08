# Concept map, iteration 1: independent check

**What was checked.** Every entry of `docs/classifier/concepts.yaml` `concepts:` at origin 883adf70. A script counts **286** entries (`yaml.safe_load(...)['concepts']`). The same script walked `content/curriculum/stage-*.json` and found 110 lessons whose `concepts` lists use exactly those 286 names (none missing, none extra), and every lesson's `textFile` exists (each `content/lessons/<id>.md` tested with `os.path.isfile`; no concept has a missing lesson file). Every characteristic id the map uses exists in `characteristics.yaml` (202 ids).

**How.** Every lesson file was read whole. For each concept, every rung that names it is listed; the evidence column quotes the line that shows its meaning. Every quote was checked by script against the cited file and line (a three-line window, markdown emphasis stripped): all match. Where a rung names a concept its lesson never discusses, the evidence says so with the exact grep. Three citations are to a lesson that is not the concept's rung, and say so (`diminuendo`, `mordent`, `octave-scale`).

**The reading of the map used here** (from the yaml header): for `notes`, an item exercises the concept when it shows *all* the listed characteristics; for `played`, the listed signs choose the items; for `activity` / `drill` / `app`, the `instead` rule chooses them. A concept named on a rung is judged against what that rung's lesson means by it.

**Verdicts.** OK; WRONG (material): the mapping would count an item as exercising a concept it does not teach on that rung, or would keep out items the lesson uses for it; WRONG (minor): a wrong kind, a missing or wrong `amb`, or a needless characteristic, where the items selected barely change; UNSURE: the lesson does not say enough to judge, with the reason.

**Limits.** Score files were opened only for `phrasing` (four authored ABC files). Every other claim about what the rung's items print (pedal marks, swing marks, chord symbols, slurs) rests on the lesson's own statement about its items, quoted. Musical judgment here is my reading of the lesson text, not a measurement.

| concept | rungs | verdict | correct mapping | evidence (lesson file:line and quote) |
| --- | --- | --- | --- | --- |
| `3/4` | 1.4 | OK | as mapped | content/lessons/1.4.md:23 "3/4 time has three beats in a bar instead of four" |
| `4/4` | 1.1 | OK | as mapped; notation.times carries the metre value, so the rule must name 4/4 (3/4 has its own row, 4/4 does not) | content/lessons/1.1.md:21 "4/4 at the start means four beats in a bar" |
| `6/8` | 4.5 | OK | as mapped | content/lessons/4.5.md:15 "6/8 is compound time." |
| `8va` | 3.4 | OK | as mapped | content/lessons/3.4.md:28 "8va written above a passage means play it an octave higher than printed" |
| `B-flat-major` | 4.2 | OK | as mapped | content/lessons/4.2.md:20 "B flat major starts the right hand on finger 4" |
| `C-major-scale` | 2.5 | OK | as mapped | content/lessons/2.5.md:21 "Thumb under is the smooth one, and it is how scales work." |
| `C-position` | 1.1 | OK | as mapped | content/lessons/1.1.md:13 "one finger per key, no finger moves, no thumb passing under" |
| `CC64` | 3.5, technique.6 | WRONG (minor) | k app (the MIDI pedal signal the app reads and scores), instead app; the skill is legato-pedalling's row. technique.6 never mentions it | content/lessons/3.5.md:31 "Sustain is MIDI controller 64 (CC64). PianoPath reads it"; technique.6: grep "CC64\|controller" in content/lessons/technique.6.md, no match |
| `E-flat-major` | 4.2 | OK | as mapped | content/lessons/4.2.md:13 "E flat (B♭ E♭ A♭). The flats always arrive in the order" |
| `E7` | 3.3 | OK | as mapped | content/lessons/3.3.md:31 "Raise the seventh and you get E major, or better E7" |
| `F-major` | 4.2 | OK | as mapped | content/lessons/4.2.md:18 "F major's right hand is 1-2-3-4-1-2-3-4" |
| `I-IV-V` | 2.3, chords-pop.3 | OK | as mapped | content/lessons/2.3.md:25 "so these three are called I, IV and V"; content/lessons/chords-pop.3.md:31 "I, IV and V in five keys." |
| `I-IV-V7` | 3.2 | OK | as mapped | content/lessons/3.2.md:18 "put I, IV and V7 of the new key under it" |
| `LH-C-position` | 1.3 | OK | as mapped | content/lessons/1.3.md:14 "Left-hand C position is C3 D3 E3 F3 G3" |
| `accidentals` | 3.3 | OK | as mapped | content/lessons/3.3.md:27 "it appears as an accidental every time it is used" |
| `add9` | chords-pop.5, chords-pop.7 | OK | as mapped | content/lessons/chords-pop.5.md:27 "add9 keeps the third and adds the ninth"; content/lessons/chords-pop.7.md:21 "add9 is a major triad with the ninth added" |
| `alberti` | technique.6 | OK | as mapped; amb (duplicate of alberti-bass) is right | content/lessons/technique.6.md:18 "The Alberti figures here are the same shapes you played" |
| `alberti-bass` | 3.6 | OK | as mapped | content/lessons/3.6.md:22 "lowest, highest, middle, highest" |
| `alberti-bass-HT` | classical.5 | OK | as mapped | content/lessons/classical.5.md:32 "here it runs continuously under a melody for pages" |
| `alternating-hands` | 1.4 | OK | as mapped | content/lessons/1.4.md:19 "On this rung the hands never play together" |
| `anacrusis` | 1.4 | OK | as mapped | content/lessons/1.4.md:29 "An anacrusis (or upbeat) is when a tune starts before beat one" |
| `anticipation` | jam.5 | WRONG (material) | a comping rhythm (the chord pushed ahead of the beat), not a melodic non-chord tone: k activity (comping), instead lead-sheet, or the written comp exercises by rhythm.syncopation; drop melody.chord-relation | content/lessons/jam.5.md:28 "The off-beat and anticipated patterns push the chord ahead" |
| `approach-note` | jazz.6, blues.6, jam.6 | WRONG (material) | a bass note a step from the next root in a walking line: ch [harmony.bass-behaviour, texture.walking-bass]; melody.chord-relation selects melodies, not bass lines | content/lessons/jam.6.md:24 "one step above or below the new root"; content/lessons/jazz.6.md:86 "semitone above or below the next bar's root"; content/lessons/blues.6.md:36 "then a semitone below the next bar's" |
| `arpeggio` | technique.4 | OK | as mapped | content/lessons/technique.4.md:31 "The C major arpeggio hands together is the arpeggio" |
| `arpeggio-fingering` | 4.3 | WRONG (minor) | technique.arpeggio-run only; the lesson teaches the fingering itself, so printed fingering (mark.fingering) is not required of the item | content/lessons/4.3.md:34 "In C the right hand plays 1-2-3 on C, E and G" |
| `arpeggio-texture` | rock.6 | OK | as mapped | content/lessons/rock.6.md:13 "a slow broken chord running through whole bars" |
| `arranging` | holiday.4, hymns.6, chords-pop.9, improv.9 | WRONG (material) | activity, but the input is a written piano setting with no chord symbols on holiday.4, hymns.6 and chords-pop.9 (the learner varies or re-derives it), so instead lead-sheet selects the wrong items; improv.9 has no item | content/lessons/holiday.4.md:33 "Four options, each with its left hand written out"; content/lessons/hymns.6.md:15 "not one of them prints a chord symbol"; content/lessons/chords-pop.9.md:31 "none of the six prints chord symbols"; improv.9: grep "arrang" in improv.9.md, no match |
| `articulation` | classical.3, technique.4 | WRONG (material) | per rung (amb missing): technique.4 notes mark.articulation (printed legato/staccato pairs); classical.3 played, the marks are absent and chosen by the player, so items are unmarked Baroque two-voice pieces (meta.composer-era, texture.two-voice) | content/lessons/classical.3.md:28 "almost no marks in the original, so articulation is your decision"; content/lessons/technique.4.md:36 "The articulation exercises on this rung come in pairs" |
| `balance` | technique.6 | WRONG (minor) | played is right; duplicate of voicing / melody-projection / tone on technique.6 with no amb | content/lessons/technique.6.md:34 "melody has to be louder"; the word "balance" is not in technique.6.md (grep) |
| `baroque-dance` | classical.3 | OK | as mapped | content/lessons/classical.3.md:15 "The Minuet is a French court dance in 3/4" |
| `bass-clef` | 1.3 | OK | as mapped | content/lessons/1.3.md:19 "The bass clef is the curled symbol with two dots." |
| `bass-walk-up` | hymns, hymns.5 | WRONG (material) | activity: the learner adds walk-ups under chord-symbol hymns (instead lead-sheet); the written study is a drill; texture.bass-walk-up only where it is written out | content/lessons/hymns.md:46 "print the chords above the tune, which is where a walk-up goes"; content/lessons/hymns.5.md:14 "the point is what you add in the gaps" |
| `beams` | 2.2 | OK | as mapped | content/lessons/2.2.md:13 "in pairs or fours they are joined by a beam" |
| `black-key-groups` | 0.2 | WRONG (minor) | drill (the key-naming drill, meta.generator-params): keyboard geography; difficulty.features is no selector | content/lessons/0.2.md:16 "The black keys come in groups of two and three." |
| `block-chords` | 2.3, holiday.4 | OK | as mapped (holiday.4 uses it as a device the learner applies) | content/lessons/2.3.md:32 "writes the left hand out as blocks"; content/lessons/holiday.4.md:24 "Break the chords where it is quiet, block them where it is loud." |
| `blue-note` | blues.3, blues.4, blues.5, improv.5 | WRONG (minor) | notes on blues.3/4/5; on improv.5 it is the learner's improvised line (activity); amb missing | content/lessons/blues.3.md:16 "In C: the flat third, E flat, leaning against the"; content/lessons/improv.5.md:31 "Play the left hand as written and make up the right." |
| `blues-scale` | blues.3, blues.4, improv.5 | WRONG (minor) | notes (or the Simon drill) on blues.3/4; activity on improv.5, where the item is a written left hand and the scale is what the learner improvises with; amb missing | content/lessons/blues.4.md:38 "The blues scale. C–E♭–F–F♯–G–B♭–C."; content/lessons/improv.5.md:31 "Play the left hand as written and make up the right." |
| `boogie` | blues.6, blues.7, blues.8, blues.9 | OK | as mapped | content/lessons/blues.6.md:20 "It climbs root, third, fifth, sixth, flat seventh"; blues.9: grep "boogie" in blues.9.md, no match |
| `boogie-bass` | blues.4 | OK | as mapped | content/lessons/blues.4.md:32 "The left hand plays the chord's root, fifth, sixth, fifth" |
| `bossa-nova` | latin | UNSURE | texture.bossa only if the files write a bossa accompaniment; the lesson says the songs are mostly one staff, in which case it is a style label (style.genre-label). The files were not opened | content/lessons/latin.md:58 "The rung's songs are mostly printed on one staff"; content/lessons/latin.md:42 "where the syncopation goes quiet and the chords do the work" |
| `broken-chord` | technique.6 | OK | as mapped; amb right (on technique.6 it is the Alberti figure at speed) | content/lessons/technique.6.md:18 "The Alberti figures here are the same shapes you played" |
| `broken-chord-accompaniment` | 3.6 | OK | as mapped | content/lessons/3.6.md:16 "Broken chord (root–third–fifth–third)." |
| `broken-chords` | 3.6, holiday.4 | OK | as mapped | content/lessons/3.6.md:16 "Broken chord (root–third–fifth–third)."; content/lessons/holiday.4.md:37 "Its left hand is a broken chord in nearly every bar." |
| `broken-octaves` | technique.7 | OK | as mapped | content/lessons/technique.7.md:28 "The broken form, the same notes in turn" |
| `build-and-release` | rock.7 | OK | as mapped | content/lessons/rock.7.md:31 "And it needs a release." |
| `cadences` | theory.4 | WRONG (minor) | on theory.4 a by-ear drill (the cadence drill, played back); notes harmony.cadence fits repertoire only | content/lessons/theory.4.md:41 "Identifying these by ear is the single most useful listening skill"; content/lessons/theory.4.md:61 "Cadences played back at 80 % accuracy in the" |
| `call-and-response` | improv.3, jazz.3, improv.4, blues.5 | WRONG (material) | activity: the learner answers a phrase (improv.3, improv.4, blues.5) or plays it back (jazz.3 Answer the phrase, a by-ear drill); texture.call-response in an item is not what these rungs teach | content/lessons/improv.3.md:29 "something that answers the first phrase"; content/lessons/jazz.3.md:27 "Answer the phrase plays you two bars"; content/lessons/improv.4.md:31 "of your own, then a two-bar answer"; content/lessons/blues.5.md:33 "A blues chorus is a conversation" |
| `call-response` | blues.9 | OK | as mapped; amb (duplicate) right; blues.9 reads written pieces for answering phrases | content/lessons/blues.9.md:35 "for how a right hand answers its own phrases" |
| `cantabile` | classical.7 | WRONG (minor) | played; the selector is a singing line over an accompaniment (slurred melody); texture.melody-in-chords is narrower than the rung's nocturnes and K. 545, whose tune sits over an arpeggio or Alberti left hand, and ANDing three signs keeps them off | content/lessons/classical.7.md:2 "and a line that sings"; content/lessons/classical.7.md:34 "A Chopin nocturne writes the tune once plainly" |
| `carols` | holiday, holiday.3, holiday.4, holiday.5, holiday.6 | OK | as mapped | content/lessons/holiday.md:12 "Carols are the most useful repertoire a beginner can own" |
| `charleston` | jazz.4, jazz.5, jam.5, jazz.6 | OK | as mapped (the written comping exercises carry it; the songs are lead sheets) | content/lessons/jam.5.md:23 "the Charleston and it is the first thing every comping player learns" |
| `chord-charts` | 3.2, jam.7 | OK | as mapped | content/lessons/3.2.md:38 "A chart gives you the symbol and the beat" |
| `chord-identification` | theory.3 | WRONG (minor) | by-ear homework, no drill exists on theory.3: instead by-ear, not drill | content/lessons/theory.3.md:40 "so this one is homework for your listening" |
| `chord-progression` | theory.6 | WRONG (minor) | drill (harmonic dictation) on theory.6, which has no repertoire | content/lessons/theory.6.md:20 "The drill plays a progression and waits for"; content/lessons/theory.6.md:39 "None, and none is wanted" |
| `chord-scale` | improv.6, jazz.7, theory.7 | WRONG (minor) | activity / drill (a scale chosen per chord to improvise from; theory.7's drill), not an item property; jazz.7 never mentions it | content/lessons/improv.6.md:21 "Modes are a note pool, not the melody."; content/lessons/theory.7.md:31 "which pairs each chord with a scale to improvise from"; jazz.7: grep "chord.scale" in jazz.7.md, no match |
| `chord-symbols` | 2.3, holiday, hymns.2, chords-pop.3, blues.3, holiday.3, jazz.3, jazz.4 | OK | as mapped. jazz.3 lists it but tells the learner to ignore the symbols | content/lessons/2.3.md:30 "Chord symbols are the letters printed above the staff"; content/lessons/jazz.3.md:36 "Leave them alone here." |
| `chromatic` | technique.4 | OK | as mapped | content/lessons/technique.4.md:51 "The chromatic scale from C takes every key" |
| `chromatic-harmony` | ragtime.8 | OK | as mapped | content/lessons/ragtime.8.md:13 "the harmony moves further from the key" |
| `chunking` | practice.1 | OK | as mapped | content/lessons/practice.1.md:17 "A chunk is the smallest unit that still makes sense." |
| `circle-of-fifths` | 4.1, theory.4 | OK | as mapped | content/lessons/4.1.md:12 "The circle of fifths is the order the sharps arrive in." |
| `clave` | latin.3, latin | OK | as mapped | content/lessons/latin.3.md:16 "A clave is two bars, not two rhythms." |
| `comping` | jazz.4, jam, jazz.5, latin, jam.5, jazz.6, improv.6, blues.8, jazz.9, chords-pop.9 | WRONG (minor) | activity lead-sheet with ch [notation.chord-symbols] only: charleston, four-to-the-bar and voicing are what the learner produces (their own rows cover the written exercises); chords-pop.9's items print no symbols; latin never discusses comping | content/lessons/jazz.4.md:21 "Accompanying a tune from its chord symbols"; content/lessons/chords-pop.9.md:31 "none of the six prints chord symbols"; latin: grep "comp" in latin.md, no match |
| `composition` | improv.9 | OK | as mapped | content/lessons/improv.9.md:12 "One piece, finished." |
| `contrary` | technique.4 | OK | as mapped; amb right | content/lessons/technique.4.md:26 "Contrary motion is easier than it sounds" |
| `contrary-motion` | 4.1 | OK | as mapped | content/lessons/4.1.md:29 "Contrary motion is the trick." |
| `coordination` | technique.4 | UNSURE | technique.4 never discusses coordination, so the meaning cannot be read from the lesson; if it means hands together it is a score property (notes, texture.hands-together), not played | grep "coordinat" in technique.4.md, no match |
| `counterpoint` | classical.7 | OK | as mapped | content/lessons/classical.7.md:16 "Counterpoint means both hands are the tune." |
| `crescendo` | technique.5 | OK | as mapped | content/lessons/technique.5.md:28 "A crescendo is not two dynamics, it is a journey between them." |
| `crushed-note` | blues.3, blues.4, blues.5 | WRONG (minor) | played: a crush the learner makes on blue notes; texture.crushed-note (a printed grace) is only the sign where one is printed | content/lessons/blues.3.md:23 "Strike the flat third and the natural third together"; blues.4: the word "crush" does not occur; it says grinding (blues.4:41) |
| `damper-pedal` | 3.5 | WRONG (material) | played; items chosen by harmony changes under held or broken textures, mark.pedal where printed: a mark.pedal requirement keeps the unmarked pieces the lesson expects | content/lessons/3.5.md:28 "Many editions of the pieces here have none at all" |
| `diminuendo` | technique.5 | OK | as mapped | content/lessons/2.4.md:34 "hairpins for crescendo (getting louder) and diminuendo"; technique.5 (its rung) teaches the crescendo; diminuendo is not named there |
| `dom7` | chords-pop.5 | OK | as mapped | content/lessons/chords-pop.5.md:18 "Dominant 7 (G7) = G–B–D–F." |
| `dotted-quarter` | 2.4 | OK | as mapped | content/lessons/2.4.md:27 "The dotted quarter. A dot adds half the note's value" |
| `double-notes` | technique.7 | OK | as mapped | content/lessons/technique.7.md:12 "Nearly everything on this rung is one hand doing two things at once" |
| `dramatic-contrast` | classical.9 | OK | as mapped; classical.9 never discusses it, so the reading is from the name | grep "contrast\|dramatic" in classical.9.md, no match |
| `dynamic-build` | rock.7 | WRONG (minor) | mapping right; duplicate of build-and-release on the same rung with no amb | content/lessons/rock.7.md:13 "making a passage grow" |
| `dynamics` | 2.4, technique.5 | OK | as mapped | content/lessons/2.4.md:33 "Dynamics are how loud" |
| `ear-training` | theory.6, theory.7, theory.8, theory.9 | OK | as mapped | content/lessons/theory.7.md:49 "The secondary-dominant ear drill until" |
| `eighth-note-ostinato` | rock.4 | OK | as mapped; the lesson does not say the figure is in eighths | content/lessons/rock.4.md:26 "The ostinato exercises put a figure in the right hand" |
| `eighth-notes` | 2.2 | OK | as mapped | content/lessons/2.2.md:12 "An eighth note lasts half a beat" |
| `endurance` | practice.4, technique.8 | WRONG (minor) | per rung (amb missing): technique.8 notes technique.endurance; practice.4 is session length and rest, activity level-only | content/lessons/technique.8.md:30 "What endurance means here. Four octaves up and down"; content/lessons/practice.4.md:39 "Long sessions at weekends after a week of none." |
| `etude` | classical.8 | OK | as mapped (none of classical.8's six pieces is an étude; they are in the Library) | content/lessons/classical.8.md:16 "An étude is a piece about one problem." |
| `evenness` | practice.2, 4.4, technique.5 | WRONG (minor) | played; the streams are Hanon cells and repeated notes, not scale runs: drop technique.scale-run (rhythm.sixteenths or a continuous equal-value stream); practice.2 never mentions it | content/lessons/4.4.md:20 "That makes unevenness audible"; content/lessons/technique.5.md:19 "keep a fast repeated note even"; practice.2: grep "even" in practice.2.md, no match |
| `extended-chords` | jazz.7, chords-pop.7, improv.7, jazz.8, blues.8, theory.8, improv.8 | OK | as mapped (harmony.voicing adds nothing to the selection) | content/lessons/jazz.8.md:13 "A thirteenth chord is a seventh chord with the ninth and the thirteenth added"; theory.8: grep "ninth\|extend\|eleventh" in theory.8.md, no match |
| `finger-independence` | technique.4 | UNSURE | technique.4 never discusses it; the characteristic (held note plus moving notes in one hand) is one narrow sense, and 4.4's sense (even weak fingers in a stream) is another | grep "independ" in technique.4.md, no match |
| `finger-numbers` | 0.1 | WRONG (minor) | drill (drill.technique.finger-numbers): body knowledge; the lesson says many pieces print none, so mark.fingering is no selector | content/lessons/0.1.md:39 "thumb is 1, index 2, middle 3, ring 4"; content/lessons/0.1.md:42 "many pieces print none" |
| `five-finger` | technique.4 | OK | as mapped; technique.4 never discusses it, the reading is from the name | grep "five.finger" in technique.4.md, no match |
| `flats` | 3.1 | OK | as mapped | content/lessons/3.1.md:16 "a flat (♭) lowers it by one" |
| `forearm` | technique.7 | OK | as mapped | content/lessons/technique.7.md:29 "is often helped by a small forearm rotation" |
| `form` | theory.9, improv.9 | WRONG (minor) | amb wrong: both rungs name the forms. theory.9: form.binary-ternary and form.thirty-two-bar; improv.9: ABA the learner composes (activity) | content/lessons/theory.9.md:23 "Three useful form names here are ABA"; content/lessons/improv.9.md:15 "ABA is enough." |
| `four-chord-loop` | hymns.2, chords-pop.6, chords-pop.8 | WRONG (material) | per rung (amb missing): chords-pop.6/8 harmony.progression (I–V–vi–IV); on hymns.2 it means a hymn on three or four chords, a chord-vocabulary count no row holds | content/lessons/hymns.2.md:13 "Many of them use three"; content/lessons/chords-pop.6.md:12 "You know the loop." |
| `four-chord-progression` | chords-pop.4 | OK | as mapped; amb right. Most of chords-pop.4's songs do not contain the loop | content/lessons/chords-pop.4.md:25 "is the progression"; content/lessons/chords-pop.4.md:41 "is not the four-chord loop" |
| `four-part-harmony` | hymns, hymns.4 | WRONG (minor) | a four-voice texture, two voices per staff (no such row) plus harmony.voice-leading; difficulty.features selects nothing | content/lessons/hymns.md:15 "Four-part (SATB) texture."; content/lessons/hymns.4.md:12 "A hymn is four singers written on two staves." |
| `four-to-the-bar` | jazz.4, jazz.6, blues.8 | OK | as mapped | content/lessons/jazz.4.md:28 "Four to the bar: a short, light chord on every beat." |
| `grand-staff` | 1.4 | OK | as mapped | content/lessons/1.4.md:12 "Piano music is written on two staves joined by a brace" |
| `guide-tones` | improv.6 | WRONG (minor) | activity: the learner plays thirds and sevenths over changes; improv.6 has no repertoire | content/lessons/improv.6.md:15 "Play only the third and seventh of each" |
| `guitar-keys` | jam, jam.5, jam.6, jam.7 | WRONG (material) | per rung (amb missing): jam/jam.5/jam.6 key.set-membership; on jam.7 the charts are in flat keys and the task is moving them to a guitar key (activity), so the right items fail the membership test | content/lessons/jam.md:15 "Guitars are built around open strings in E, A, D and G"; content/lessons/jam.7.md:32 "Four of these five sit in flat keys" |
| `habanera` | latin.4, ragtime.7 | OK | as mapped | content/lessons/latin.4.md:14 "The habanera fills a 2/4 bar with a dotted eighth, a sixteenth" |
| `half-notes` | 1.2 | OK | as mapped | content/lessons/1.2.md:17 "Half note — hollow head, stem: 2 beats." |
| `half-pedal` | technique.7 | WRONG (minor) | drill: an exercise scored on pedal depth from the MIDI pedal; no printed sign, so mark.pedal is no selector | content/lessons/technique.7.md:37 "The damper pedal need not be up or down." |
| `half-time-feel` | rock.6 | OK | as mapped; rock.6 never discusses it, the reading is from the name | grep "half.time\|half time" in rock.6.md, no match |
| `hand-independence` | technique.5 | OK | as mapped | content/lessons/technique.5.md:23 "Two hands at different speeds." |
| `hand-shape` | 0.1 | OK | as mapped | content/lessons/0.1.md:26 "Curved fingers." |
| `hands-together` | 2.1, holiday | OK | as mapped | content/lessons/2.1.md:15 "The left hand holds; the right hand moves." |
| `hanon` | 4.4, technique.5 | OK | as mapped | content/lessons/4.4.md:12 "Charles-Louis Hanon's The Virtuoso Pianist has sixty exercises" |
| `harmonic-dictation` | jazz.6, theory.6, jazz.8, theory.8, theory.9 | OK | as mapped | content/lessons/theory.6.md:20 "The drill plays a progression and waits for" |
| `harmonic-minor` | 3.3, 4.2 | OK | as mapped | content/lessons/3.3.md:25 "Harmonic minor raises it to G sharp" |
| `head-and-chorus` | jam, jam.5, jam.7 | OK | as mapped | content/lessons/jam.md:25 "The head is the tune, played at the start and" |
| `held-LH` | 2.1 | OK | as mapped | content/lessons/2.1.md:15 "The left hand holds; the right hand moves." |
| `held-melody` | technique.6, holiday.6 | OK | as mapped | content/lessons/technique.6.md:41 "Holding a melody note while the harmony changes underneath" |
| `ii-V-I` | jazz.5, jazz.6, improv.6 | OK | as mapped | content/lessons/jazz.5.md:32 "ii–V–I. The backbone progression." |
| `improvisation` | improv.3, improv.6, improv.7, jazz.9, blues.9, improv.9 | WRONG (minor) | activity, instead per rung: loop drills and the lab (improv.3, improv.6), the learner's own (improv.7, blues.9), lead sheets only on jazz.9 | content/lessons/improv.3.md:15 "The app loops I–IV–V in C"; content/lessons/improv.6.md:32 "Not required; the changes are the material." |
| `injury` | practice.4 | OK | as mapped | content/lessons/practice.4.md:31 "Pain — stop." |
| `interleaving` | practice.3 | OK | as mapped | content/lessons/practice.3.md:16 "Interleaving is switching between several things in one session." |
| `interpretation` | classical.9 | OK | as mapped | content/lessons/classical.9.md:21 "after you have made your own decisions about tempo, dynamics and pedalling" |
| `interval-reading` | 1.5 | OK | as mapped | content/lessons/1.5.md:13 "From here you read by interval" |
| `intervals` | theory.3 | OK | as mapped | content/lessons/theory.3.md:12 "An interval is the distance between two notes" |
| `inversions` | 4.3, chords-pop.4, technique.4, chords-pop.6 | OK | as mapped | content/lessons/4.3.md:12 "An inversion is the same chord with a different note at the bottom." |
| `inversions-by-ear` | theory.4 | WRONG (minor) | the rung's drill is a reading drill and hearing is self-checked: instead drill, not by-ear | content/lessons/theory.4.md:29 "The inversion drill on this rung is a reading drill" |
| `key-signature` | 3.1 | OK | as mapped | content/lessons/3.1.md:28 "A key signature is those accidentals collected at the front" |
| `key-signatures` | theory.3 | WRONG (minor) | no drill: naming signatures is self-checked (activity, level-only); amb right | content/lessons/theory.3.md:30 "Key signatures to three sharps and flats."; content/lessons/theory.3.md:67 "and the key signatures, are" |
| `landmark-notes` | 1.3, 3.4 | OK | as mapped | content/lessons/3.4.md:14 "you learn landmarks instead and read" |
| `large-form` | classical.8, classical.9 | WRONG (material) | form.length + form.sections; form.sonata is wrong for both rungs (rondo, waltz, nocturne, Clair de lune; ballade, polonaise, impromptu) | content/lessons/classical.8.md:35 "A long piece needs a written plan."; content/lessons/classical.9.md:39 "the first Ballade, the" |
| `leap` | 2.1 | OK | as mapped on 2.1; the amb (duplicate of leaps) is wrong: leaps means something else | content/lessons/2.1.md:41 "Its moves from C to F and from C to G are leaps" |
| `leaps` | blues.7, ragtime.9 | WRONG (material) | technique.leap-size (left-hand jumps from bass to chord); interval.leap (a 4th or wider) is in almost every item | content/lessons/ragtime.9.md:29 "the leaps have to be automatic first"; content/lessons/blues.7.md:38 "its left hand is this rung's leap" |
| `ledger-lines` | 3.4 | OK | as mapped | content/lessons/3.4.md:12 "Ledger lines are the short lines drawn above or below the staff" |
| `left-hand` | blues.6, holiday.7, latin.7 | WRONG (minor) | amb partly wrong: blues.6 (driving boogie and walking patterns) and holiday.7 (bass then chord) name it; latin.7 differs per piece. texture.left-hand-pattern per rung | content/lessons/blues.6.md:12 "which stops holding chords and starts driving"; content/lessons/holiday.7.md:19 "a low note, then a chord, then the same chord again" |
| `legato` | classical.4, technique.4, hymns.4 | WRONG (material) | per rung: classical.4/technique.4 printed slurs and finger legato; hymns.4 four voices joined with no slurs, so mark.slur keeps every hymn off; k played | content/lessons/classical.4.md:15 "Legato means connected"; content/lessons/hymns.4.md:33 "Every voice has to be joined." |
| `legato-pedalling` | 3.5, technique.6 | WRONG (material) | played (change just after the new chord), items chosen by harmony changes under held or broken textures; coordination.pedal-with-hands is the nearer row; mark.pedal optional | content/lessons/3.5.md:18 "change the pedal just after the new chord sounds"; content/lessons/technique.6.md:42 "The pedal has to lift and fall without breaking the held" |
| `letter-names` | 0.2 | OK | as mapped | content/lessons/0.2.md:35 "Say the letter out loud as you play it." |
| `looping` | practice.1, holiday.5 | OK | as mapped | content/lessons/practice.1.md:25 "How to loop it." |
| `maj7` | chords-pop.5 | OK | as mapped | content/lessons/chords-pop.5.md:15 "Major 7 (Cmaj7) = C–E–G–B." |
| `major-scale-formula` | 3.1 | OK | as mapped | content/lessons/3.1.md:21 "The major scale formula is W–W–H–W–W–W–H." |
| `mazurka-rhythm` | classical.7 | OK | as mapped | content/lessons/classical.7.md:48 "that leans on beat two or three" |
| `melodic-minor` | 4.2 | OK | as mapped | content/lessons/4.2.md:31 "Melodic minor raises the sixth and seventh going up" |
| `melody-in-octaves` | technique.7 | OK | as mapped | content/lessons/technique.7.md:55 "under right-hand octaves and thirds" |
| `melody-projection` | technique.6 | WRONG (minor) | played is right; duplicate of voicing / balance on technique.6 with no amb | content/lessons/technique.6.md:32 "Voicing is the skill this whole track exists to reach" |
| `melody-writing` | improv.5 | OK | as mapped | content/lessons/improv.5.md:34 "Writing eight bars." |
| `memorising` | 4.7, holiday.6, ragtime.9 | OK | as mapped | content/lessons/4.7.md:21 "How to do it. Not by repetition." |
| `meter-5-4` | technique.5 | OK | as mapped | content/lessons/technique.5.md:43 "5/4 is here rather than later" |
| `meter-7-8` | technique.6 | OK | as mapped | content/lessons/technique.6.md:45 "7/8 is counted 2 + 2 + 3" |
| `middle-C` | 0.2 | OK | as mapped | content/lessons/0.2.md:26 "Middle C is the C nearest the middle of the instrument" |
| `min7` | chords-pop.5 | OK | as mapped | content/lessons/chords-pop.5.md:16 "Minor 7 (Dm7) = D–F–A–C." |
| `minor-triads` | 3.3 | OK | as mapped | content/lessons/3.3.md:12 "A minor triad is a major triad with its middle note lowered" |
| `modal-minor` | rock.4 | UNSURE | rock.4 never says modal: its figures are in A, D and E minor, and whether they use a mode (harmony.modal) or plain minor is not stated; the files were not opened | grep "modal\|dorian\|aeolian" in rock.4.md, no match |
| `modes` | theory.5, theory.6, improv.6, theory.7, improv.7, jazz.8 | WRONG (minor) | per rung (amb missing): theory.5/6/7 a modes drill; improv.6/7 a note pool to improvise from (activity); jazz.8 never mentions modes | content/lessons/theory.7.md:41 "The modes drill on this rung asks for"; content/lessons/improv.6.md:21 "Modes are a note pool, not the melody."; jazz.8: grep "mode" in jazz.8.md, no match |
| `modulation` | jazz.8, theory.8, improv.8, theory.9 | WRONG (minor) | per rung: theory.8/jazz.8 a modulating dictation drill (by-ear); key.change fits repertoire; improv.8 and theory.9 never mention it | content/lessons/theory.8.md:12 "A modulation is a change of home."; content/lessons/jazz.8.md:23 "The dictation drill on this rung changes key partway through."; improv.8, theory.9: grep "modulat" in improv.8.md and theory.9.md, no match |
| `montuno` | latin, latin.6 | OK | as mapped | content/lessons/latin.md:28 "Montuno is the right-hand pattern" |
| `mordent` | technique.5 | WRONG (minor) | technique.5's mordent is written out in eighth notes with no sign: a drill; mark.ornament reads signs | content/lessons/technique.5.md:55 "Printed at two per beat so you can count it"; content/lessons/classical.3.md:40 "written out as eighth notes rather than as a sign"; classical.3 is not its rung; it describes the technique.5 drill |
| `motif` | improv.3 | OK | as mapped | content/lessons/improv.3.md:33 "A motif is a short idea, two or three notes" |
| `motif-development` | improv.4 | OK | as mapped | content/lessons/improv.4.md:41 "Motif development. Take a three-note idea" |
| `motivation` | practice.5 | OK | as mapped | content/lessons/practice.5.md:16 "This is normal and it is not a sign you have reached your limit." |
| `multi-strain-form` | ragtime.6, ragtime.9 | OK | as mapped | content/lessons/ragtime.6.md:17 "A rag is a set of tunes, not one tune." |
| `not-fast` | ragtime.5, ragtime.6, ragtime.7, ragtime.8 | WRONG (minor) | played (hold a moderate tempo); mark.tempo-text is true of any item with a written tempo | content/lessons/ragtime.5.md:28 "Joplin wrote that at the head of many of his rags" |
| `note-length` | technique.4 | WRONG (material) | played articulation: how long each key is held against the written value (mark.articulation, mark.slur); rhythm.values (the rhythmic vocabulary) is true of every item | content/lessons/technique.4.md:39 "The app measures how long you hold each key" |
| `octave-scale` | technique.7 | OK | as mapped | content/lessons/rock.7.md:41 "The octave scale is the density half"; technique.7 (its rung) does not name an octave scale; rock.7 is not its rung |
| `octaves` | 0.2, holiday.4, technique.7, latin.7 | WRONG (minor) | amb incomplete: besides 0.2, on holiday.4 the octave is a device the learner adds, not a property of the item | content/lessons/0.2.md:22 "An octave is the distance from one C to the next C"; content/lessons/holiday.4.md:21 "Add an octave under the bass on the strong beats." |
| `odd-meter` | technique.5 | WRONG (minor) | mapping right; duplicate of meter-5-4 on the same rung with no amb | content/lessons/technique.5.md:43 "odd meters are easier than they look" |
| `oom-pah-bass` | ragtime.5, ragtime.6, ragtime.7 | OK | as mapped | content/lessons/ragtime.5.md:15 "Bass note on beats 1 and 3, chord on beats 2 and 4" |
| `open-voicing` | chords-pop.7, chords-pop.9 | OK | as mapped; amb right | content/lessons/chords-pop.7.md:27 "The open voicings on this rung are written the second way"; chords-pop.9: grep "open" in chords-pop.9.md, no match |
| `open-voicings` | rock.4, rock.5 | OK | as mapped (rock.4 never mentions it) | content/lessons/rock.5.md:22 "The exercises write these voicings wide" |
| `ornamentation` | technique.5 | WRONG (minor) | technique.5's ornament is the written-out mordent drill (no sign); duplicate of mordent with no amb | content/lessons/technique.5.md:50 "Mordents. Three notes in the time of one" |
| `ornamented-melody` | classical.7 | OK | as mapped | content/lessons/classical.7.md:35 "then again with a spray of small notes over it" |
| `ornaments` | classical.4 | OK | as mapped | content/lessons/classical.4.md:33 "Ornaments. An appoggiatura (small note, no stroke through the stem)" |
| `ostinato` | rock.4, holiday.5, latin.7 | OK | as mapped | content/lessons/rock.4.md:25 "The figure that repeats is called an ostinato"; content/lessons/latin.7.md:46 "That opening is an ostinato" |
| `passing-chords` | hymns, hymns.5 | WRONG (minor) | per rung: hymns.5 prints them in the symbols (notes); on hymns the learner adds them (activity) | content/lessons/hymns.md:39 "first; add the passing chords afterwards"; content/lessons/hymns.5.md:23 "A passing chord is the same idea with the whole hand." |
| `pedal` | classical.5 | WRONG (material) | played: the rung's miniatures print no pedal, the learner chooses it; mark.pedal keeps them off | content/lessons/classical.5.md:46 "Neither Schumann's First Loss nor"; content/lessons/classical.5.md:47 "Song marks pedal here, so it is your choice" |
| `pedal-bass` | rock.4, rock.6 | OK | as mapped | content/lessons/rock.6.md:17 "A pedal bass is a bass note that stays while the harmony changes" |
| `pedalling` | classical.4.shelf, classical.6, classical.8 | WRONG (material) | played: pedal used where marked or where the learner adds it; mark.pedal keeps unmarked pieces off; classical.8 never mentions it | content/lessons/classical.4.shelf.md:50 "where the page marks it or where you choose to add it"; classical.8: grep "pedal" in classical.8.md, no match |
| `pentatonic-scale` | improv.4 | WRONG (minor) | activity / drill: improvising over the loop with the pentatonic and the Answer-the-phrase drill drawn from it; not a property of a placed item | content/lessons/improv.4.md:21 "Use C major" |
| `performance-mode` | 4.6, 4.7, holiday.6, holiday.7, latin.7, ragtime.9 | OK | as mapped | content/lessons/4.6.md:43 "Perform in the ⋯ controls gives you one pass" |
| `phrase-shaping` | 4.6, 4.7 | WRONG (minor) | played with ch [form.phrase]: the learner decides the peak and writes the dynamics plan, so printed slurs and hairpins should not be required of the item | content/lessons/4.6.md:29 "Phrase shaping. A phrase is a musical sentence"; content/lessons/4.6.md:35 "A dynamics plan. Write it on the score" |
| `phrasing` | 1.2, technique.5 | WRONG (material) | played with ch [form.phrase] only: on 1.2 phrasing is breathing at the long note that ends each phrase of unslurred folk tunes, so mark.slur keeps them off; technique.5 never mentions phrasing | content/lessons/1.2.md:38 "fall into four-bar phrases ending on a long"; technique.5: grep "phras" in technique.5.md matches only line 47 ("phrase every time you open it", sight-reading); the authored 1.2 scores lightly-row.abc, twinkle-rh.abc, frere-jacques.abc and jingle-bells-rh.abc (content/scores/authored/) contain no ABC slur |
| `pivot-chord` | theory.8 | WRONG (minor) | drill (modulating dictation) on theory.8, which has no repertoire | content/lessons/theory.8.md:16 "The pivot is a chord that belongs to both keys" |
| `placement` | 0.4 | OK | as mapped | content/lessons/0.4.md:12 "The test is eight short items" |
| `plagal-cadence` | hymns | OK | as mapped | content/lessons/hymns.md:25 "The plagal cadence. IV–I, the "amen"." |
| `plateau` | practice.5 | OK | as mapped | content/lessons/practice.5.md:12 "Sooner or later something stops improving." |
| `playing-by-ear` | jazz.9, blues.9, chords-pop.9, theory.9, improv.9 | OK | as mapped | content/lessons/jazz.9.md:19 "The ear-tune drill gives you eight bars" |
| `polyrhythm-2:1` | technique.5 | WRONG (material) | coordination.unequal-rates (eighths over quarters); texture.polyrhythm is defined as 2:3, 3:2, 3:1, so 2:1 is not in it | content/lessons/technique.5.md:23 "Start with 2:1, eighths over quarters" |
| `polyrhythm-2:3` | technique.7 | OK | as mapped | content/lessons/technique.7.md:31 "Two against three, in both directions." |
| `polyrhythm-3:1` | technique.6 | OK | as mapped | content/lessons/technique.6.md:57 "none of the three has the 3:1 rhythm" |
| `polyrhythm-3:2` | technique.7 | OK | as mapped | content/lessons/technique.7.md:31 "Two against three, in both directions." |
| `position-shift` | 2.5 | OK | as mapped | content/lessons/2.5.md:15 "A position shift is the crude one: lift, move, land." |
| `posture` | 0.1 | OK | as mapped | content/lessons/0.1.md:16 "Sit so your forearms are level." |
| `power-chord` | rock.4 | OK | as mapped | content/lessons/rock.4.md:18 "A power chord is root, fifth, octave, and no third." |
| `progressions-by-ear` | theory.5 | OK | as mapped | content/lessons/theory.5.md:24 "Progressions by ear." |
| `quartal` | jazz.7, improv.7 | OK | as mapped | content/lessons/jazz.7.md:21 "Quartal voicings are stacked fourths." |
| `quarter-notes` | 1.1 | OK | as mapped | content/lessons/1.1.md:21 "A quarter note — a filled note head with a stem" |
| `reading-ahead` | 4.6 | OK | as mapped | content/lessons/4.6.md:15 "By now your eyes should be a bar ahead of your hands" |
| `reduction` | rock.overview | WRONG (material) | activity, instead lead-sheet (melody and chord symbols reduced to melody, bass and one texture); by-ear and meta.genre-tags are wrong: the items are deliberately not rock and are scores, not recordings | content/lessons/rock.overview.md:22 "Doing it from a chord symbol."; content/lessons/rock.overview.md:28 "Four options, none of them rock, on purpose" |
| `register` | holiday.4, rock.7 | WRONG (minor) | rock.7: a register widening across a section (a trend over hands.per-bar-range, part of texture.build), not a per-bar range; holiday.4: a device the learner applies (the word is not used) | content/lessons/rock.7.md:18 "Register — the same idea moved down an octave"; holiday.4: grep "register" in holiday.4.md, no match |
| `reharmonisation` | hymns.6, improv.8 | WRONG (material) | per rung: hymns.6 plays written arrangements with no chord symbols (the reharmonisation is already printed: notes, harmony.applied/harmony.chromatic-share); improv.8 activity lead-sheet | content/lessons/hymns.6.md:31 "an arranger fills that gap with chords"; content/lessons/improv.8.md:12 "Reharmonising is composition with the melody already written" |
| `relative-minor` | 3.3 | OK | as mapped | content/lessons/3.3.md:17 "The relative minor. A minor uses exactly the same notes as C major" |
| `repeated-notes` | technique.5, holiday.7, latin.7 | OK | as mapped | content/lessons/technique.5.md:18 "Repeated notes are the first exercise here" |
| `rests` | 1.2 | OK | as mapped | content/lessons/1.2.md:25 "Rests are silences with the same values" |
| `review-queue` | 0.3, practice.3 | OK | as mapped | content/lessons/0.3.md:39 "Review brings back a piece you learned" |
| `rhythm` | technique.5 | UNSURE | technique.5 never says which rhythm skill is meant (the amb is right); rhythm.values + rhythm.syncopation is a guess | grep "rhythm" in technique.5.md, no match |
| `rhythm-changes` | jazz.7 | OK | as mapped | content/lessons/jazz.7.md:48 "Rhythm changes. I Got Rhythm (1930) gave jazz its second standard form" |
| `riff` | rock.4 | WRONG (minor) | mapping right; duplicate of ostinato (and vamp) on rock.4 with no amb | content/lessons/rock.4.md:33 "That is how a riff actually lives" |
| `roman-numerals` | chords-pop.6, theory.6, theory.7, chords-pop.8 | OK | as mapped | content/lessons/theory.6.md:15 "Roman numerals name the job." |
| `romantic-miniature` | classical.6 | OK | as mapped | content/lessons/classical.6.md:17 "In a Romantic miniature the right hand often holds a melody" |
| `rootless-voicings` | jazz.7, jazz.8 | OK | as mapped (jazz.7 shows them written in two arrangements as well as asking the learner to voice them); jazz.8 never mentions them | content/lessons/jazz.7.md:16 "Rootless A and B. Drop the root"; jazz.8: grep "rootless" in jazz.8.md, no match |
| `rotation` | technique.6, holiday.7 | OK | as mapped | content/lessons/technique.6.md:19 "rotation of the forearm" |
| `rubato` | classical.6, classical.7 | OK | as mapped; classical.7 never mentions rubato | content/lessons/classical.6.md:26 "Rubato, and what it is not."; classical.7: grep "rubato" in classical.7.md, no match |
| `scale` | technique.4, technique.8 | OK | as mapped | content/lessons/technique.8.md:12 "Four octaves, in sixteenths, at a quarter-note pulse of 120." |
| `scale-in-3rds` | technique.7 | OK | as mapped | content/lessons/technique.7.md:16 "Scales in thirds and sixths." |
| `scale-in-6ths` | technique.7 | OK | as mapped | content/lessons/technique.7.md:16 "Scales in thirds and sixths." |
| `scales-HT` | 4.1 | OK | as mapped | content/lessons/4.1.md:35 "Each key: contrary motion one octave, then similar" |
| `secondary-dominants` | hymns.5, theory.7, chords-pop.8, improv.8, jazz.9 | WRONG (minor) | per rung (amb missing): hymns.5 printed in the symbols (notes); theory.7 and jazz.9 drills; improv.8 activity (the learner inserts them) | content/lessons/hymns.5.md:31 "can be preceded by its own five chord"; content/lessons/theory.7.md:49 "The secondary-dominant ear drill"; content/lessons/improv.8.md:23 "Insert V7/x before chord x" |
| `secondary-rag` | ragtime.8, ragtime.9 | OK | as mapped | content/lessons/ragtime.8.md:18 "the secondary rag — sixteenths grouped in threes across the bar line"; content/lessons/ragtime.9.md:35 "The secondary-rag study is" |
| `self-assessment` | 0.4 | OK | as mapped | content/lessons/0.4.md:40 "You have a starting rung and you agree with" |
| `semitones` | technique.4 | OK | as mapped; technique.4 never mentions semitones, the reading is from the name (its chromatic scale) | grep "semitone\|half step" in technique.4.md, no match |
| `session-planning` | practice.3, practice.5 | OK | as mapped | content/lessons/practice.3.md:21 "One way to shape a session." |
| `seventh-chord` | technique.6, chords-pop.8 | WRONG (minor) | technique.6 means seventh arpeggios: technique.arpeggio-run + harmony.chord-quality; chords-pop.8 never discusses it | content/lessons/technique.6.md:12 "Seventh arpeggios are the shapes"; chords-pop.8: grep "seventh" in chords-pop.8.md, no match |
| `seventh-qualities` | theory.5 | OK | as mapped | content/lessons/theory.5.md:12 "Four seventh-chord qualities" |
| `shaping` | technique.5 | OK | as mapped | content/lessons/technique.5.md:28 "Shaping. A crescendo is not two dynamics" |
| `sharps` | 3.1 | OK | as mapped | content/lessons/3.1.md:16 "A sharp (♯) raises a note by a half step" |
| `shell-voicings` | jazz.5, jazz.6, blues.7 | WRONG (material) | activity: the learner voices chord symbols as shells over lead sheets (instead lead-sheet), the shell exercise a drill; harmony.voicing on the written notes selects only items that print shells; blues.7 never mentions shells | content/lessons/jazz.5.md:21 "A seventh chord has four notes; the two that define it are"; content/lessons/jazz.6.md:101 "Every song here is a single stave with its"; blues.7: grep "shell" in blues.7.md, no match |
| `shuffle` | blues.3, blues.4, blues.6, blues.7 | WRONG (material) | played feel: items are blues/boogie items with eighth runs (rhythm.eighths, style), the shuffle mark optional; rhythm.shuffle (a notated figure or mark) keeps the unmarked items off; blues.6 never mentions it | content/lessons/blues.4.md:29 "Nothing in the notation says so"; content/lessons/blues.7.md:34 "written in straight eighths with no swing or"; blues.6: grep "shuffle\|swing" in blues.6.md, no match |
| `sight-reading` | 1.5, chords-pop.8, theory.9 | OK | as mapped | content/lessons/1.5.md:35 "The sight-reading generator makes a new four-bar melody"; chords-pop.8: grep "sight" in chords-pop.8.md matches only "by sight" (line 21) |
| `similar` | technique.4 | OK | as mapped; technique.4 never mentions similar motion, the reading is from the name | grep "similar" in technique.4.md, no match |
| `sixteenth-notes` | 4.4, ragtime.5, technique.6 | OK | as mapped | content/lessons/4.4.md:43 "Every note but the last is a sixteenth" |
| `skips` | 1.5 | OK | as mapped | content/lessons/1.5.md:19 "A skip is a 3rd" |
| `slash-chord` | hymns, chords-pop.6 | OK | as mapped; amb right | content/lessons/chords-pop.6.md:24 "C/B and knowing it is still a C chord" |
| `slash-chords` | 4.3, chords-pop.4 | OK | as mapped | content/lessons/4.3.md:20 "a slash chord when the bass matters" |
| `slow-practice` | practice.1, practice.2 | OK | as mapped | content/lessons/practice.2.md:13 "if you can play it faster than you are practising it" |
| `slur` | 2.4 | OK | as mapped | content/lessons/2.4.md:22 "A slur is the same curve joining notes of different pitch" |
| `sonata-form` | classical.7 | OK | as mapped | content/lessons/classical.7.md:29 "Sonata form is a map, not a rule." |
| `sonatina-form` | classical.5 | OK | as mapped | content/lessons/classical.5.md:14 "A sonatina is a small sonata" |
| `staccato` | classical.4, technique.4 | OK | as mapped | content/lessons/classical.4.md:19 "Staccato means detached" |
| `steps` | 1.1, 1.5 | OK | as mapped | content/lessons/1.5.md:16 "A step is a 2nd" |
| `stop-time` | ragtime.8 | OK | as mapped | content/lessons/ragtime.8.md:30 "Stop-time. Bars where the accompaniment stops" |
| `stride` | jazz.7, holiday.7, blues.7, jazz.9, blues.9 | WRONG (minor) | mapping right; duplicate of stride-bass with no amb | content/lessons/blues.7.md:12 "Stride. Bass note, chord, tenth, chord" |
| `stride-bass` | ragtime.7, ragtime.8 | OK | as mapped | content/lessons/ragtime.7.md:15 "From oom-pah to stride."; ragtime.8: grep "stride" in ragtime.8.md matches only the video label (line 6) |
| `subdivision` | 2.2 | WRONG (material) | rhythm.shorter-than-quarter (the row whose decision is "subdivision"), or rhythm.eighths: 2.2 teaches counting "and"; requiring rhythm.sixteenths keeps every eighth-note item off | content/lessons/2.2.md:18 "This is subdivision: keeping a faster pulse" |
| `sus` | chords-pop.5 | OK | as mapped; amb right | content/lessons/chords-pop.5.md:24 "sus4 replaces the third with the fourth" |
| `sus-chords` | chords-pop.7 | OK | as mapped | content/lessons/chords-pop.7.md:15 "Sus chords have no third" |
| `sustain-pedal` | technique.6 | WRONG (minor) | played (pedal under a held melody note), coordination.pedal-with-hands / texture.held-under-moving; same pedal family as damper-pedal | content/lessons/technique.6.md:41 "Holding a melody note while the harmony changes underneath" |
| `sustained-chords` | rock.5, rock.6 | OK | as mapped | content/lessons/rock.5.md:36 "chords held for whole bars" |
| `swing` | 4.5 | OK | as mapped | content/lessons/4.5.md:27 "Swing is a performance convention, not a notation" |
| `swing-eighths` | jazz.3, jazz.4, jazz.5, jazz.6 | WRONG (material) | played: items with eighth runs in jazz tunes (rhythm.eighths, style), the swing mark optional; notation.swing-mark keeps the rung's unmarked tunes off; jazz.6 never teaches it | content/lessons/jazz.5.md:60 "and none of this rung's pieces does"; content/lessons/jazz.3.md:40 "they have eighth notes in them" |
| `syncopation` | latin.3, 4.5, jazz.4, ragtime.5, latin, ragtime.6, ragtime.7, ragtime.8 | OK | as mapped | content/lessons/4.5.md:37 "Syncopation puts the accent where the beat is not" |
| `tango` | latin, latin.6 | OK | as mapped | content/lessons/latin.6.md:32 "The tango's left hand is a pattern." |
| `tempo-ladder` | practice.2, holiday.5 | OK | as mapped | content/lessons/practice.2.md:37 "The score screen will run the ladder for you." |
| `tempo-mode` | 0.3 | OK | as mapped | content/lessons/0.3.md:20 "Keep tempo moves on whether you are with it or not" |
| `tension` | practice.4 | OK | as mapped | content/lessons/practice.4.md:23 "Tension. Three places it often shows" |
| `texture` | chords-pop.7, improv.7, chords-pop.9 | WRONG (minor) | amb partly wrong: chords-pop.7 names the spread (open) voicing and improv.7 the quartal one, both harmony.voicing; chords-pop.9 is generic | content/lessons/chords-pop.7.md:27 "with the ninth up an octave are a texture"; content/lessons/improv.7.md:14 "Quartal voicings are a texture you can own." |
| `thumb-under` | 2.5 | OK | as mapped | content/lessons/2.5.md:21 "Thumb under is the smooth one" |
| `tie` | 2.4 | OK | as mapped | content/lessons/2.4.md:17 "A tie is a curved line joining two notes of the same pitch" |
| `tied-across-bar` | technique.5 | WRONG (minor) | rhythm.ties restricted to ties that cross a bar line; the row does not distinguish | content/lessons/technique.5.md:39 "Ties across the bar line are where a steady pulse goes to die." |
| `tone` | classical.4.shelf, technique.6 | WRONG (minor) | played level-only: arm-weight singing tone on any melody; texture.melody-in-chords selects chordal melodies only; technique.6 never mentions it | content/lessons/classical.4.shelf.md:44 "A singing melody comes from arm weight transferred slowly"; technique.6: grep "tone" in technique.6.md, no match |
| `tonicisation` | theory.7 | OK | as mapped | content/lessons/theory.7.md:22 "Tonicisation is not modulation." |
| `trading-fours` | jam, jam.7 | OK | as mapped | content/lessons/jam.7.md:16 "Trading fours is a conversation with a rule." |
| `transposing` | chords-pop.3 | OK | as mapped | content/lessons/chords-pop.3.md:35 "Because you are reading roles rather than notes" |
| `transposing-for-singers` | holiday.3 | OK | as mapped | content/lessons/holiday.3.md:17 "The key is theirs, not yours." |
| `transposition` | 4.4, chords-pop.6, theory.6, blues.8, chords-pop.8, theory.8 | WRONG (material) | activity, instead level-only (any written item in the band, transposed at the keyboard): 4.4 transposes Hanon and chords-pop.8 written songs, neither a lead sheet; theory.6 never mentions it | content/lessons/4.4.md:39 "Transpose them. Hanon wrote them in C."; content/lessons/chords-pop.8.md:33 "play it as written, then a tone lower"; theory.6: grep "transpos" in theory.6.md, no match |
| `treble-clef` | 1.1 | OK | as mapped | content/lessons/1.1.md:17 "treble clef at the left marks the second line up as G" |
| `tremolo` | technique.7 | OK | as mapped | content/lessons/technique.7.md:46 "The octave tremolo in the left hand shakes between" |
| `tremolo-thirds` | blues.5 | OK | as mapped | content/lessons/blues.5.md:29 "Tremolo thirds. Two notes a third apart, alternated rapidly" |
| `tresillo` | latin.3, latin.4, latin.6 | OK | as mapped | content/lessons/latin.4.md:21 "The tresillo is three, three, two (3+3+2)." |
| `triads` | 2.3, jazz.4 | OK | as mapped | content/lessons/2.3.md:12 "A triad is three notes stacked in thirds" |
| `trill` | technique.6 | WRONG (minor) | technique.6's trills are written out as measured notes: a drill; mark.ornament reads signs; amb right | content/lessons/technique.6.md:25 "The number of notes to the beat is written above the" |
| `trills` | classical.5 | OK | as mapped | content/lessons/classical.5.md:43 "in a piece it is a sign" |
| `trio-key-change` | ragtime.6, ragtime.7 | OK | as mapped | content/lessons/ragtime.6.md:25 "The trio and its key change."; ragtime.7: grep "trio" in ragtime.7.md, no match |
| `triplets` | 4.5 | OK | as mapped | content/lessons/4.5.md:23 "A triplet is three notes played in the time of two" |
| `tritone-substitution` | jazz.7, jazz.8, improv.8 | WRONG (minor) | activity on jazz.7/improv.8 (the learner substitutes the dominants of a lead sheet); harmony.applied only where printed; jazz.8 never mentions it | content/lessons/jazz.7.md:41 "Take a standard and reharmonise its"; content/lessons/improv.8.md:15 "Every dominant chord can become the"; jazz.8: grep "tritone" in jazz.8.md, no match |
| `tumbao` | latin, latin.6 | OK | as mapped | content/lessons/latin.md:23 "Tumbao is the bass pattern: not on beat one." |
| `turnaround` | blues.5, blues.6, blues.7, jam.7, improv.8 | OK | as mapped | content/lessons/blues.5.md:14 "The turnaround is the last two bars"; blues.6, improv.8: grep "turnaround" in blues.6.md and improv.8.md, no match |
| `twelve-bar` | blues.6, jam.6, blues.8, blues.9 | OK | as mapped; amb right | content/lessons/blues.6.md:12 "The twelve-bar form is settled." |
| `twelve-bar-blues` | blues.3, blues.4 | OK | as mapped. blues.3 lists it but its lesson defers the form to blues.4 (a curriculum point, not a map error) | content/lessons/blues.4.md:12 "The blues is a form before it is a style"; content/lessons/blues.3.md:47 "The form is the next rung" |
| `twelve-bar-improv` | improv.5 | WRONG (minor) | activity, instead: the written twelve-bar shuffles (left hand written, right hand improvised), not lead sheets | content/lessons/improv.5.md:31 "Play the left hand as written and make up the right." |
| `two-hand-independence` | technique.5 | OK | as mapped; amb right | content/lessons/technique.5.md:23 "Two hands at different speeds." |
| `two-voice-texture` | classical.3 | OK | as mapped | content/lessons/classical.3.md:23 "is written as two independent melodic" |
| `vamp` | rock.4, theory.5 | WRONG (minor) | a repeated chord loop (harmony.progression over a short loop), not a melodic figure; on theory.5 the learner plays it (activity); on rock.4 it is the lab's chord loop and duplicates ostinato/riff without amb | content/lessons/theory.5.md:61 "play a Dorian vamp (Dm to G) for two minutes"; content/lessons/rock.4.md:37 "Rock — the minor vamp preset" |
| `velocity` | classical.8, technique.8 | OK | as mapped | content/lessons/technique.8.md:13 "notes a second in each hand" |
| `vertical-alignment` | 2.1 | OK | as mapped | content/lessons/2.1.md:24 "Vertical alignment. Notes printed in the same column sound together." |
| `virtuoso-technique` | classical.9 | OK | as mapped; classical.9 never discusses it beyond a piece purely about the hands | content/lessons/classical.9.md:42 "a piece that is purely about the hands" |
| `voice-leading` | 3.2, hymns, hymns.4, chords-pop.6 | WRONG (material) | per rung (amb missing): hymns/hymns.4 harmony.voice-leading (four-part); 3.2 and chords-pop.6 mean smooth chord connection through inversions and common tones (harmony.inversion plus a chord-connection measure no row holds) | content/lessons/3.2.md:32 "Keeping common tones removes the jumps"; content/lessons/chords-pop.6.md:17 "with the top voices held still barely move at all"; content/lessons/hymns.md:18 "each voice moves smoothly, mostly by step" |
| `voicing` | classical.4.shelf, technique.6, jazz.7, chords-pop.7, improv.7, chords-pop.9, improv.9 | OK | as mapped; amb right (chords-pop.9 and improv.9 never discuss it) | content/lessons/classical.4.shelf.md:46 "Playing one note of a chord louder than the others" |
| `voicing-melody` | classical.6, holiday.6, hymns.6, classical.8 | OK | as mapped | content/lessons/classical.6.md:17 "holds a melody in the top note and an accompaniment underneath it" |
| `wait-mode` | 0.3 | OK | as mapped | content/lessons/0.3.md:16 "Wait for me holds the score still until you play the right note." |
| `walking-bass` | jazz.6, blues.6, jam.6, blues.8, jazz.9 | OK | as mapped | content/lessons/jam.6.md:16 "A walking bass is one note per beat" |
| `waltz-bass` | 3.6 | OK | as mapped | content/lessons/3.6.md:28 "Waltz bass ("oom-pah-pah") is for 3/4" |
| `warm-up` | practice.4 | OK | as mapped | content/lessons/practice.4.md:19 "Warming up. Start with something easy and slow" |
| `whole-notes` | 1.2 | OK | as mapped | content/lessons/1.2.md:18 "Whole note — hollow head, no stem: 4 beats." |
| `wrist` | technique.6 | WRONG (material) | played, ch [texture.alberti, texture.broken-chord]: the rotating wrist of the fast Alberti figures; texture.octaves and mark.articulation select other items | content/lessons/technique.6.md:2 "the rotating wrist" |

## Counts

| verdict | concepts |
| --- | --- |
| OK | 204 |
| WRONG (material) | 27 |
| WRONG (minor) | 50 |
| UNSURE | 5 |
| **total** | **286** |

**WRONG (material), 27:** anticipation, approach-note, arranging, articulation, bass-walk-up, call-and-response, damper-pedal, four-chord-loop, guitar-keys, large-form, leaps, legato, legato-pedalling, note-length, pedal, pedalling, phrasing, polyrhythm-2:1, reduction, reharmonisation, shell-voicings, shuffle, subdivision, swing-eighths, transposition, voice-leading, wrist.

**UNSURE, 5:** bossa-nova, coordination, finger-independence, modal-minor, rhythm.

## Patterns behind the errors

1. **A performed skill mapped to a printed mark.** The pedal family (`damper-pedal`, `pedal`, `pedalling`, `legato-pedalling`), `articulation` on classical.3, `legato` on hymns.4, `shuffle`, `swing-eighths`, `phrasing`: each lesson says its items do not print the mark and the learner supplies it, so a mark requirement keeps out the items the lesson uses.
2. **A learner activity mapped to an item texture.** `call-and-response`, `bass-walk-up`, `shell-voicings`, `guide-tones`, `tritone-substitution`, `pentatonic-scale`, `blues-scale` and `blue-note` on improv.5: the learner produces it; an item that already contains it is not what the rung teaches.
3. **The `lead-sheet` rule applied where the input is written music.** `arranging` (holiday.4, hymns.6, chords-pop.9 print no chord symbols), `transposition` (Hanon, written songs), `reharmonisation` on hymns.6, `twelve-bar-improv`.
4. **One name, different meanings, no `amb`.** `voice-leading` (four-part on the hymn rungs, common-tone chord connection on 3.2 and chords-pop.6), `four-chord-loop` (I–V–vi–IV, but "three or four chords" on hymns.2), `leaps` (left-hand jumps, not intervals), `guitar-keys` on jam.7, `endurance` on practice.4, `modes`, `modulation`, `secondary-dominants`.
5. **A characteristic whose own definition excludes the case.** `polyrhythm-2:1` (texture.polyrhythm is defined as 2:3, 3:2, 3:1), `subdivision` (requires sixteenths on an eighth-note rung; `rhythm.shorter-than-quarter` is the row whose decision is "subdivision"), `large-form` (form.sonata on rungs of ballades, rondos and waltzes), `note-length` (rhythm.values is true of every item), `wrist` (octaves, where the lesson means the rotating wrist of Alberti figures).
6. **Duplicates without `amb`:** balance / melody-projection / voicing / tone on technique.6; dynamic-build / build-and-release; stride / stride-bass; odd-meter / meter-5-4; riff / vamp / ostinato on rock.4; ornamentation / mordent.

## Characteristics that do not exist in characteristics.yaml and should

| needed by | characteristic | why no existing row serves |
| --- | --- | --- |
| voice-leading (3.2, chords-pop.6) | smooth chord connection: common tones held and the distance the hand moves between successive chords | harmony.voice-leading is four-part (parallels, motion) on four-voice textures; harmony.inversion says which inversion, not how far the hand travels |
| four-part-harmony | voice count: four voices, two per staff (SATB layout) | harmony.voice-leading presupposes it; difficulty.features selects nothing; texture.two-voice stops at two |
| four-chord-loop (hymns.2) | chord vocabulary size: number of distinct chords in an item | harmony.progression names sequences; harmony.rhythm counts changes per bar, not distinct chords |
| tied-across-bar | ties that cross a bar line | rhythm.ties counts every tie |
| mordent, ornamentation, trill (technique.5, technique.6) | written-out (measured) ornament figures | mark.ornament reads signs and grace notes only |
| damper-pedal, pedal, pedalling, legato-pedalling, sustain-pedal | pedal need without a mark: harmony changes under held or broken-chord textures, so unmarked items can be chosen | mark.pedal reads printed marks; coordination.pedal-with-hands is derived from marks too |
| register (rock.7) | register trajectory across a section (widening or dropping), not a per-bar range | hands.per-bar-range is per bar; texture.build names density and dynamics, not register |
| evenness (4.4) | a continuous stream of equal note values in one hand | technique.scale-run is scale passages only; rhythm.sixteenths is a value, not a stream |
