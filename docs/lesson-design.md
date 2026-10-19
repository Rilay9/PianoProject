# How to plan and write a lesson

A guide for whoever writes the app's lessons (Claude, for now). The learner is the owner: an adult and a total
beginner, learning for themselves first. They asked for good teaching in content, style and tone, for pictures or
animations wherever technique is shown, and for this guide, with teaching thought through first and the app's modes
second (`docs/inputs/2026-10-15.md`, entries of 2026-10-16). Later the same day they added that the first rung or two
must be easy to play without a MIDI keyboard, on the app's own keys.

`docs/app-features.md` §8c holds the lesson format (blocks: text, image, video, score, keys, animation, step, tip).
This guide is about what goes into those blocks and in what order.

## 0. The rule this guide exists for

**Every claim about how to teach, and every musical claim, rests on a source that was opened and read**: a
publisher's own teacher guide or pedagogy page, the book's own contents or sample pages, a peer-reviewed paper or its
authors' own copy or summary, or a handbook's freely readable text. A search snippet, a retailer's listing or an
anonymous summary is a lead to the source, never the source. Cite the source beside the claim, with its link, and
say when only part of it could be read. Where sources disagree, say so. Where nothing was found, say UNKNOWN or label
the line as teaching judgment. The first lesson-1 plan broke this rule: it took a method's order from a retailer's
listing and got it wrong.

What that means in practice (ChatGPT's review, 2026-10-16): **teaching-method claims need a reliable pedagogical
source; facts about a particular piece, the keyboard's layout or the app's behaviour are verified against the actual
score, the instrument or the code.** Research citations live in the lesson plan and its notes, not in the lesson:
the text the learner reads is natural prose.

The sources behind this guide, with what each supports and how much of each was read, are listed in
`design/2026-10-16-lesson1/guide-notes.md` (outside the repo). Lines marked **Judgment** are mine, reasoned from the
sources but not stated by them.

---

## 1. Planning a rung and a lesson

**Start from the methods' own order, read from their own pages.** For the very start, the methods agree on the
first things and differ on when rhythm notation comes:

| Method (as its publisher shows it) | Opening order |
|---|---|
| Faber, Piano Adventures Primer ([teacher guide contents][faber-toc]; children) | Unit 1: sitting, a round hand shape, finger numbers, then short pieces played by finger number with no staff, mostly on the black-key groups. Unit 2: rhythm (quarter, half, whole note). Unit 3: key names A–G. Unit 4: the grand staff. Unit 5: middle C to G. |
| Faber, Adult Piano Adventures Book 1 ([contents][faber-adult]) | Unit 1 packs much of the Primer's Units 1–5: Introduction to Playing, "Raindrops" (RH) and "Thunder" (LH), "Amazing Grace", the music alphabet, C–D–E in each hand, C pentascale, "Ode to Joy". Unit 2: the staff. Nearly every unit ends with a "3-Minute Technique". (Which keys "Raindrops" and "Thunder" use: UNKNOWN from the [QR page][faber-adult-p11].) |
| Alfred's Basic Adult Piano Course 1 ([publisher's sample pages][alfred]) | How to sit; finger numbers; the keyboard; naming keys; then C position with the treble clef and quarter and half notes by page 9, the grand staff on page 12. |
| Frances Clark, The Music Tree: Time to Begin ([publisher's sample pages][musictree]; children) | Unit 1: higher and lower, quarter and half notes, played on the groups of two black keys with the pointer fingers, before any staff; intervals 2nds to 5ths read off the staff; the grand staff in Unit 9. |

So: sitting, finger numbers and the layout of the keyboard come first in all four, where the pages show that much; of the pages I read, only Faber's Primer guide teaches the hand shape there in detail. The adult books
move much faster than the children's ones, and the methods disagree on when rhythm symbols arrive: at once (Music Tree's Unit 1; Alfred's first playing pages) or
in a unit of their own after the black-key pieces (Faber Primer). Rung 1's plan (four short pre-reading lessons, rhythm in
lesson 2) follows Faber's order at an adult pace. **Judgment**: that suits a learner who wants to understand what they
are doing, but it is a choice; the owner decides scope.

**One sitting's load.** Working memory holds only a few new things at once; the review the NSW education department
published puts it at "about four chunks of information" (citing Cowan 2001; [CESE 2017][cese], p. 2), and too much new material at once confuses
([Rosenshine 2012][rosenshine], principle 2). The most effective teachers "only present small amounts of new material
at any time, and then assist the students as they practice this material" (ibid.). So a lesson brings **one or two
new ideas and one new physical skill**, and spends most of its time practising them (**Judgment** on the numbers). No
source I read gives a lesson length for an adult beginner: length is UNKNOWN; take the owner's experience of a
sitting and adjust.

**A clear outcome, as what the learner can then do.** Explicit teaching states the learning intentions and success
criteria and makes them visible to the learner ([CESE 2017][cese], p. 2, quoting Hattie 2009). Write it at the top of the
lesson as an action: "By the end you can find every group of three black keys, high and low, without hints" rather
than "Black keys". (On a real keyboard a lesson might add "with your eyes closed after the first one"; on a screen
that isn't a fair test.) The step targets (§6) test the same action.

**Prerequisites.** How hard new material is depends on what the learner already knows ([CESE 2017][cese], p. 4).
Teach the names and parts before the task that uses them: learners understand a presentation better when they already
know "the names and behaviors of the components" ([Mayer & Moreno 2003][mayer-moreno], pretraining, d = 1.00 over 3
experiments). Faber does the same: finger numbers and finger games come before the pieces played by finger number
([Finger Numbers][faber-fingers], [Finger Flashcards][faber-flash]). List each lesson's prerequisites in the plan and
check that an earlier lesson taught each one.

**Review earlier material, every lesson.** Begin with a short review of previous learning; review weekly and monthly
([Rosenshine 2012][rosenshine], principles 1 and 10). Faber's Unit 1 pieces end with a technique review (Technique Secrets
1–3 in [Two Black Ants][faber-ants]; one Secret, named by the student, in [Pecking Rooster][faber-rooster]); its adult book says each unit introduces a
concept "and reviews earlier topics" ([Top Things to Know][faber-adult-ttk]). So each lesson opens with one short
step or paragraph that uses last lesson's skill, and folds older skills into new material.

**Spacing and variation across lessons, after the basics hold.** Spacing practice, mixing (interleaving) different
skills and varying the task make practice feel harder and look worse, but improve retention and transfer; "Marked
improvements in performance during an acquisition phase can be accompanied by little or no learning" ([Bjork
2018][bjork], on Schmidt & Bjork 1992). But "if a learner does not have the background knowledge or skills to respond
successfully to a given difficulty, it becomes an undesirable difficulty" (ibid.), and practice should run at a high
success rate, about 80 % ([Rosenshine 2012][rosenshine], principle 7). The two fit together: **a new skill is first
practised in a block, with help, until it mostly succeeds; then it comes back in later lessons mixed with other skills
and in varied forms** (other octaves, other hand, other order). Don't read "it went well today" as learned; read the
next lesson's review.

**Rungs 1–2 on the app's own keys (owner, 2026-10-16).** The owner wants the first rung or two playable with no MIDI
keyboard, on the screen. So every piece and exercise there uses few keys in a narrow range that fits the keys a step
will show on each screen (§7), and nothing whose point needs real piano touch (loudness, weight, legato, held
sound). I found **no study** comparing beginners learning on a touchscreen keyboard with a real one (one search; see
the notes). The nearest evidence: the least experienced pianists transferred what they learned only to music played
with the same movements ([Palmer & Meyer 2000][palmer], abstract only, child pianists; the melodic relations had to match too). **Judgment**:
so tapping glass is unlikely to train the touch of real keys. It can teach what is the same on both: where the keys are, finger numbers, direction,
patterns, the beat, and the order of notes. One commercial app also keeps its on-screen keyboard to its first
courses only ([Simply Piano help][simply]; a product's design, not evidence). **Judgment**: when a rung is meant for
the screen, say in its lesson text what the screen trains and what waits for real keys, and keep the physical-playing
sections (§3) for a real keyboard, a table top, or the closed lid, as Faber does for finger games ([Finger
Flashcards][faber-flash]).

---

## 2. The teaching sequence inside a lesson

Put together from the sources, a lesson has this shape: **review → why → model → guided try → independent try → check
and reflect → a little play**. This is a teaching pattern, not seven mandatory blocks: combine stages when that is
natural, and let exploration come earlier when it helps the learner discover the idea (Faber's experience-first
order, below). No single source states the whole sequence; each part's support is beside it:

1. **Review** what this lesson builds on (§1; [Rosenshine][rosenshine] 1).
2. **Why it matters**, in a sentence or two, in the learner's terms. A "meaningful rationale" for a task, with support
   for the learner's own choice, helped people take it on as their own ([Ryan & Deci 2000][ryan-deci], p. 74).
3. **Model: hear it and see it before doing it.** Faber's natural learning order is Listen, Feel, Play, Recognize,
   Create: experience first, the name and symbol after ([Natural Learning Process][faber-nlp]; [Pre-Reading
   Process][faber-prereading]). In Faber's Unit 1 pages the teacher plays first while the student points and says the
   finger numbers, then the student plays ([Two Black Ants][faber-ants], [Into the Cave][faber-cave]). Rosenshine:
   provide models and worked examples, think aloud ([principle 4][rosenshine]); a worked example helps novices most
   ([CESE 2017][cese], p. 7).
4. **Guided try**, with help on: the app plays first, lights the keys, waits. Successful teachers "spent more time in
   guided practice" ([Rosenshine][rosenshine] 5). In the app this is a step at a high help level (§6).
5. **Independent try**, with help faded: the same task, help off. Scaffolds are "gradually withdrawn as learners
   become more competent" ([Rosenshine][rosenshine] 8); independent practice uses "the same material as the guided
   practice" (9). As skill grows, worked examples become redundant and independent work should grow ([CESE
   2017][cese], expertise reversal).
6. **Check and reflect.** Check understanding by asking for a demonstration or explanation, not "any questions?"
   ([Rosenshine][rosenshine] 6). In a lesson page that means a short question to answer for yourself ("Which group of
   black keys is under your 2-3-4 fingers?") and the step's result. Faber gives a
   whole unit's pedagogy article to assessment and reflective assessment (Unit 10; titles only, the articles are behind
   a login, [contents][faber-toc]).
7. **A little play.** Faber's pieces end with "explore and create": echo games, making up a pattern on the black
   keys ([Two Black Ants][faber-ants], [Three Little Kittens][faber-kittens]); Music Tree asks the learner to
   "rearrange" a piece "till you find the way you like best" ([sample pages][musictree]). Rosenshine found the best
   teachers did hands-on, experiential work "after, not before, the basic material was learned" ([p. 12][rosenshine]).
   The two agree once the play comes after the guided work: Faber's "experience first" is itself guided (the teacher
   models, the student copies).

---

## 3. Physical playing, in every early lesson

**What comes first.** Faber's Unit 1 teaches three "Technique Secrets", and its pieces come back to them: **good
posture** ("Karate Pose"), **a rounded hand shape** ("Blooming Flowers") and **firm fingertips** ("Making O's")
([Finger Flashcards][faber-flash], [Two Black Ants][faber-ants]). What the pages say, in their terms:
- **Sitting** ([Sitting at the Piano][faber-sit]): on the front half of the bench "so you can easily lean left or
  right"; distance: arms straight out with loose fists, "Your knuckles should just touch the fallboard"; elbows hang
  loosely; sit tall; arms level with the keyboard; feet supported (a footstool for children). No bench height in
  number.
- **Hand shape** ([Making a Round Hand Shape][faber-hand]): curve the fingers into a "C" so the fingertips line up;
  open and close the hand in rhythm; let the wrists hang "as if holding two apples, then drop the apples"; shake water
  off the fingertips. Faber later calls it a rounded hand over a "bridge" ([Building a Bridge][faber-bridge]).
- **Fingertips and release** (Unit 1 pieces): play on a firm fingertip, softly enough that it doesn't collapse
  ([Two Black Ants][faber-ants]); start with the middle fingers (2-3, 2-3-4), which keep the hand natural and put
  its weight in its centre; if fingers flatten, "roll them in and balance on the fingertips" ([Into the
  Cave][faber-cave]); let the hand float from group to group with a gentle wrist and spring off the last note
  ([Three Little Kittens][faber-kittens]); keep the wrist loose and lean toward where the hand travels ([Pecking
  Rooster][faber-rooster]).
- **Arm weight comes later**, once the hand can hold it: "drop with arm weight into a hand prepared to support that
  weight without tension" ([Building a Bridge][faber-bridge], through pieces in Units 4-5). A Frances Clark Center article shows
  arm-weight and freeing exercises that need a teacher's hands on the wrist ([Denenburg][denenburg]); the app can only
  describe or animate those.
- **Fingers before keys**: tap patterns on the closed lid, saying the numbers, before playing them ([Finger
  Flashcards][faber-flash]); Music Tree says the same: "play silently on the keyboard cover, saying the finger
  numbers" ([sample pages][musictree]).

**What to keep returning to.** Posture, hand shape and fingertips come back throughout Unit 1, with "frequent
gentle reminders" begun early, phrased as what to do ("Do Blooming Flowers"), not what not to do ([Making a Round
Hand Shape][faber-hand]). So every early lesson has one short physical check, and each new piece names which of the
three it leans on. Faber's adult course ends nearly every unit with a short "3-Minute Technique" ([contents][faber-adult]).

**Where to put the learner's attention: the sources disagree.** Wulf and Lewthwaite report that focusing on the
intended effect of a movement (an external focus, such as the sound to be made) beats focusing on the body, at every
skill level, including musicians focusing on the expressive sound rather than their fingers ([Wulf & Lewthwaite
2021][wulf]). A 2024 re-analysis that corrected for publication bias found the average benefit negligible and
"contradict[s] the existing consensus that an external focus is always more effective" ([McKay et al.,
preprint][mckay-focus]). **Judgment**: a beginner still has to be shown the body shape, so a cue names the body
briefly (curved fingers, loose wrist), and then the practice points attention at the result: the sound, the key
reached, the steady beat. Don't stack several body cues during playing.

**How to show it.** Posture, hand shape and movement are shown, not only described: a labelled drawing for a shape, a
short animation for a movement (§5).

---

## 4. Writing the lesson text: style and tone

The owner: "Learners aren't looking for quick short concise messages." Write the way a good teacher talks to one
adult at the piano.

- **Talk to the learner, in the second person.** Lessons written conversationally ("you", statements addressed to
  the learner, "let's") were learned from better than formal ones in short English lessons; the effect is less
  certain in other languages and in long lessons, and "too much personalization may not be always beneficial"
  ([Brom et al. 2017][brom], summarising Ginns et al. 2013 and Mayer 2009). Warm and direct, not chummy.
- **Explain why.** A meaningful rationale helps a learner adopt a task ([Ryan & Deci 2000][ryan-deci]). Explain
  the purpose of important instructions, especially when the reason isn't obvious: "Sit on the front half of the
  bench, so you can lean left and right as your hands travel." Don't interrupt straightforward practice directions
  with explanations they don't need.
- **Explain fully; length is not the enemy, clutter is.** The most effective teachers gave longer, clearer
  explanations with many examples; the less effective "gave much shorter presentations and explanations" and then had
  to re-explain ([Rosenshine 2012][rosenshine], principles 2, 5; "Give clear and detailed instructions and
  explanations", "Provide many examples", p. 19). What to cut is material that is interesting but beside the point
  (the coherence effect, d = 0.90 over 5 experiments) and the same words said twice in two forms (redundancy)
  ([Mayer & Moreno 2003][mayer-moreno]; [CESE 2017][cese], p. 7: "Providing unnecessary information can be a major
  reason for instructional failure").
- **One idea at a time.** Small steps, practice after each ([Rosenshine][rosenshine] 2); a lesson in learner-paced
  segments beat one continuous presentation ([Mayer & Moreno 2003][mayer-moreno], segmenting; a single study). One
  heading, one idea, then the step that uses it.
- **Concrete images and comparisons.** Faber teaches with images a body can copy: a "C" shape, dropping two apples,
  shaking off water, a bridge, a bubble ([round hand][faber-hand], [bridge][faber-bridge], [ants][faber-ants]). Use
  images an adult recognises, and only ones that show the right movement.
- **Encourage without fluff.** Feedback about competence raises motivation, negative feedback lowers it, and
  "threats, deadlines, directives, pressured evaluations, and imposed goals" lower it too ([Ryan & Deci
  2000][ryan-deci], p. 70). Wulf and Lewthwaite add that saying a task is learnable and defining success generously
  at first helps performance ([2021][wulf]). The same research group's critics found the related autonomy effects on
  motor learning small or absent after correcting for publication bias ([McKay et al. 2022][mckay-self]; [St. Germain
  et al.][stgermain]); a re-analysis of the expectancy studies exists but I did not read it. **Judgment**: encourage with true,
  specific statements the app can stand behind ("You played all five notes correctly without help"), never with
  praise the result doesn't earn, never by claiming ease ("this is easy"), and never about what the app can't observe
  (posture, hand shape, tension: §7).
- **Say what to do when it goes wrong.** Good teachers anticipate errors and warn about them ([Rosenshine
  2012][rosenshine], p. 18). Each lesson has a short "If this happens" part: the common mistake, why it happens, the
  fix. Mistakes are normal information, said plainly.
- **Plain words; musical terms introduced when first used**, with what they mean and why they matter, then used
  consistently (pretraining, above). A term the lesson doesn't need yet waits.
- **Give choices where they are real** ("Start with whichever hand feels easier"). Choice supports motivation ([Ryan
  & Deci 2000][ryan-deci]); whether it improves motor learning itself is doubtful ([McKay et al. 2022][mckay-self]),
  so offer it for the learner's sake, not as a learning trick.

**A bad paragraph and a good one.** The first lesson-1 draft's text isn't in the repo; its opening was "The black
keys come in groups of two and three…", and it read like this (reconstructed in its style):

> The black keys come in groups of two and three. Find the groups. Play each one.

It states a fact and gives orders, with no reason, no picture of what to do with the body, no sign of what success
looks like, and nothing for when it goes wrong. Better:

> Look at the black keys for a moment. They aren't spread evenly: they come in little groups, two together, then a
> gap, then three together, then a gap, all the way up the keyboard. That pattern is your map. Every key on the
> piano can be found from it, so before we name any keys, let's get to know the groups by feel.
>
> Put your right hand's fingers 2 and 3 (pointer and middle) together, gently curved, and rest them on a group of
> two black keys near the middle. Now play them together, softly, and let your hand float up to the next group of
> two to the right. That's higher. Keep going until you run out of keyboard, then come back down to the middle with
> your left hand going left: lower.
>
> If you can't tell a group of two from a group of three, look for the gaps: a gap is where two white keys sit side
> by side with no black key between them.

(Fingers and direction adapted from Faber's [Two Black Ants][faber-ants] (LH 2-3, going lower) and [Three Little Kittens][faber-kittens] (RH 2-3-4, going higher);
the "gap" description is the keyboard's layout: a black key sits between every pair of white keys except E–F and
B–C.)

---

## 5. Pictures and animations

**When a picture helps.** The multimedia research behind this is on short explanations; its results here:
- Put words next to the part of the picture they describe, not in a separate block (spatial contiguity, d = 0.48,
  one study; split attention, "should be eliminated wherever possible", [CESE 2017][cese], p. 7, quoting Sweller et
  al. 1998). In a lesson: labels on the drawing, or a caption that names what to look at.
- Cut decorative pictures (coherence, [Mayer & Moreno 2003][mayer-moreno]). A picture earns its place by showing
  what words can't: a shape, a position, a movement.
- **Movement is where animation helps most**: in a meta-analysis of 26 studies, animation beat still pictures overall
  (d = 0.37) and most for procedural-motor knowledge (d = 1.06) and realistic or video material (d = 0.76)
  ([Höffler & Leutner 2007][hoffler], abstract). A later meta-analysis of 61 studies found a smaller overall gain (g =
  0.23), larger for realistic or schematic pictures than abstract ones ([Berney & Bétrancourt 2016][berney]).
- So: **a still, labelled drawing for a shape or position** (posture, hand shape, finger numbers, black-key groups);
  **a short loop for a movement** (pressing and releasing, the hand floating to the next group, the wrist staying
  loose); **video** for a whole player in real time, and a real teacher demonstrating (the owner wants relevant
  YouTube videos at the bottom of every lesson, at reference size unless they're more than reference: 2026-10-16).
  A lesson must make sense without its videos (§8c).
- An animation in the app loops silently and gives way to controls when the phone asks for less motion (§8c), so
  its text sits beside it, in the caption or the paragraph above.

**Our own drawings or free images.** Prefer our own SVG when a found image isn't exactly right: we can draw exactly
what the lesson says (key proportions, black keys in 2 + 3, five fingers, thumb on the right side), label it, and
match it across lessons. Use a free image when it shows a real hand or body better than a drawing would, and is
correct. For lesson 1 the free images found were mostly not good enough (`design/2026-10-16-lesson1/image-candidates.md`).

**Checking a free image's licence.**
- Read the licence **on the file's own page** (on Wikimedia Commons, the licence box under "Licensing"; on Flickr,
  the licence line beside the photo), never only in a search listing.
- Usable without conditions: **CC0** and **public domain** (on Commons, a PD template that gives its reason). Flickr
  Commons' "no known copyright restrictions" is weaker than CC0: note it as such.
- An Unsplash photo is CC0 only if it was published before 5 June 2017; Commons' Unsplash template says so on the
  file page.
- **CC-BY** needs the author, the licence and a link shown where the picture is used (the image block's caption);
  **CC-BY-SA** also requires a changed version to carry the same licence. Use them only when nothing CC0 or our own
  drawing will do. Never NC or ND.
- For a photograph of a public-domain artwork, check that the particular reproduction is reusable (its own licence
  on its file page): faithful copies of flat works are often treated differently from creative photographs, and the
  rules vary by country.
- If the page can't be read (a bot check, a login), the licence is unverified: don't use the file.
- **Record it beside the file**: in `web/public/content/path/media/`, one entry per file with the file page URL, the
  author, the licence as the page states it, the date checked, and what was changed (crop, resize). Credit CC0 and
  public-domain work anyway.

---

## 6. Practice steps

**Demonstrate, then guided, then independent, with help fading.** The app's help ladder does this inside one step
(Simon and Drills: 1 music + sound + keys lit, 2 music + sound, 3 music only, 4 name only, 5 by ear; §3, §4).
A lesson usually has the same task as two or three steps at falling help levels: the guided step, then the
independent one (Rosenshine 5, 8, 9; expertise reversal, [CESE][cese]). **Judgment**: move to less help when the
guided step mostly succeeds (about 80 %: [Rosenshine][rosenshine] 7), not after a fixed number of tries.

**Targets show the skill, not that a screen was finished.** A target names what the learner can now do: "4 of 5
cards clean in one full set" at a stated help level, "a chain of 6 without help", "on time for 90 % of notes at 60".
A step with no measurable result (Free play, Watch) is *visited*, and the lesson says so; it is never presented as
proof of a skill (§8c already words results this way).

**Score the core skill only.** A lesson has one or two scored targets, on its main new skill. Material met for
the first time is tried without a target and comes back for review, with a target, in a later lesson; extras are
optional and unscored. Combine two new skills in one task (rhythm *and* which keys) only once each holds on its own
(ChatGPT's review of lesson 2, 2026-10-16: six scored sets in a second lesson was the same overload as lesson 1's
first plan).

**Keep assisted and independent success apart.** A card or chain done with help, or right only on a retry, is
practice, not a clean result; the app already keeps them apart (Drills: "right on a retry", helped cards not clean;
Simon: a helped chain is "not a best", §3, §4). Lesson text and targets use the same distinction: the target sits
on the independent step.

**Learning is shown later, not in the moment.** Today's run measures performance; learning shows in the next
lesson's review ([Bjork 2018][bjork]). So a lesson's skill gets a short review step in later lessons, and the plan
looks at those results, not only at "target met" the first day.

**Feedback words.**
- Say what happened and what to do next, specifically: "That was a group of three. The group of two is the
  smaller group right beside it." Not "Wrong!" ([Ryan & Deci 2000][ryan-deci]: competence feedback motivates, pressure doesn't.)
- Point attention at the result (the sound, the key, the beat) more than the body during playing (§3; contested).
- How often to give feedback: less frequent or summarised feedback, though it makes practice look worse, was found
  to help retention ([Bjork 2018][bjork], on Schmidt & Bjork 1992), and the "guidance hypothesis" says feedback on every
  try makes learners dependent on it (as summarised by [Marco-Ahulló et al. 2024][sensors]); a later
  meta-analysis concluded "additional research is needed ... to confirm" that (reported in [Marco-Ahulló et al.
  2024][sensors]; the meta-analysis itself not read). UNSETTLED. **Judgment**: the app's per-note marks stay, since a
  beginner needs to know which key was wrong; lesson text doesn't add more commentary on top, and a step's summary
  after the run carries the main message.

**Play every step as the learner, before the owner sees the spec.** The rules in this guide are aids, not the
test. Applied by the letter, they produced lessons that drilled what a beginner already knew: a step that asks them
to find the groups of two and three, a three-note Simon done in five seconds, a timing check that wanted a tap on
the very first click (owner, 2026-10-17: "Wtf is the point of a Simon with 3 notes?? Its not even worth loading").
So every spec gives each step three lines, written after playing it through in your head as this learner, at this
point in the path:
- **Time:** about how long it takes. A few seconds isn't worth opening a screen for: make it longer and growing
  (Simon goals of 5 or more, with Keep going), fold it into another step, or drop it.
- **New:** what it teaches that the learner can't already do. "Nothing" means it goes. Something a step teaches
  once isn't repeated just because a later lesson has the same shape; whether it's needed is judged for each lesson
  at its own stage.
- **Worth it:** whether a beginner would feel it was worth doing, and whether anything in it would confuse them (a
  tap on a beat they haven't heard yet, a hold that was never taught, a sound that isn't the piano).

These lines are for the owner to check, not a guard that works by itself. A five-agent beginner walk-through of lessons 1
and 2 (2026-10-17) didn't catch any of the faults above: the walkers called steps "box-ticking" and "a 15-second
game" but asked for more checking, which became a judged find-it step, drilling the obvious further. Agents playing a
beginner find bugs and contradictions; they don't judge whether a step is worth having (`design/lesson-notes.md`).
When a walker or I find a step thin, it goes to the owner as a question, never straight to a fix that adds a step.

---

## 7. Mapping to the app's modes, second

Plan the teaching first (§1–6); then pick the block or mode that does each job. Facts below are from
`docs/app-features.md`; check them there before relying on them.

| Teaching moment | Block or mode | Notes |
|---|---|---|
| Explaining why, how, what to look for | **text**, **tip** | Short headed sections (§4). A tip where an app feature first appears (onboarding decision, 2026-10-15). |
| Showing a shape or position | **image** (own SVG or checked free image) | Labels on the picture (§5). |
| Showing a movement | **animation** (SVG with its own animation, GIF, WebP, mp4/webm) | Loops, muted; text beside it. |
| The same point as text or as a video, the learner's choice (posture, finger numbers) | **read-watch** block (two tabs, Read open first; owner, 2026-10-17) | Read is the lesson's own text and must teach the point alone (Watch needs the internet; offline the tab says so). One video per box, the full player; the page does not remember the tab. |
| Trying the keyboard freely right where it is explained (the groups, high and low, "the black keys make a tune") | **keyboard** block (a playable keyboard in the page; owner, 2026-10-17) | Every key sounds; groups outlined (`groups: false` off), labels off with `names: false`; a MIDI keyboard's keys show on it. Nothing judged or recorded and not a step: pair it with a step if the moment needs evidence. Two octaves at most on a phone upright (white keys 25 px at 360). Options (lesson 2, 2026-10-18): `names: "letters"` (a letter on every white key) with `hide` (Hide names); `fingers` (and with letters a Finger numbers \| Key names switch, for showing a known tune's keys both ways); `play` (Hear it for a few notes); `find` (Find a key: an endless, unscored prompt by letter, with Show me; for trying names without labels right where they're taught). |
| A real player or teacher | **video** (YouTube, start/end; `size: row` for a compact reference row) | Beside the section it shows (walk-through 2026-10-16: a video at the bottom, away from its section, went unwatched); a row for extra references. The lesson must work without it. |
| Showing which keys and fingers | **keys** block | Up to 12 keys, fingers 1–5 on them, drawn over the octaves they need. `names: false` before names are taught, `"letters"` to show just the letters (C, D, E). Exact notes, checked (§8). |
| Hearing and seeing a short passage | **score** block (▶ Hear it, moving marker, lit keys) | The "model" step. Notation only once the lesson has taught it; before the staff, use keys. |
| Exploring the keyboard freely, naming what you play | **Free play** step (visited after a key; nothing judged) | Two octaves on a phone, three on a tablet, ‹ › moves by an octave, with the whole piano drawn small and the part shown named (the middle, higher…). A step can: outline the black-key groups (on by default in a step; `groups: false`), show finger numbers (`fingers`), hide names (`names: false`), and run a click (`click: {bpm}`) for making up rhythms. Exploring only: pair it with a step that can come out wrong. |
| An extra for those who want more (a harder variant, a challenge) | **step** with `"optional": true` | Marked Optional, unnumbered; never needed for the lesson to be done, never suggested while a needed step is left. Teach nothing in it the next lessons rely on. |
| Remembering a short sequence by ear and eye, growing | **Simon** step (target `chain`; `goal` 5–50) | Small units only. Help levels 0–5, each cohesive (0 and 5: never a staff or a name; 5: nothing lit, ever; Hear it gives it the level's own way). With a `goal`: misses before it are free (the whole pattern again), at it "You did it" and the step done, then Keep going (to the first miss) or Back. A key during any playback starts the try (no waiting). By ear a miss replays the whole pattern. Matching can accept any octave. `fingers` and `names` as in Free play. |
| Finding a place on the keyboard by its pattern (a group of two or three, a letter) | **Drills, find-it set** (`kind: find`: "a group of three, higher up", "a D, lower down"; target `clean`) | Untimed; names and octave labels never shown on its keys. Cards count places over the set's whole `keys` span, even when only part shows. Wider than the screen's window (below) with no MIDI keyboard: each card starts with the keys at a different place and the learner moves them with ‹ ›, so the place is found by the black-key pattern and the small whole piano, not a spot on the screen; the card adds what its place means ("Lower down: the lowest D you can reach with ‹ ›"). |
| Moving around more of the keyboard than fits on a phone (finding places across octaves, notes spread wide) | **Simon and Drills keys with ‹ ›** (no setting: the reach is the set's notes, a find set's `keys`, or a step's `keys`) | Only with no MIDI keyboard (with one the reach is drawn whole). Window: two octaves on a phone upright (white keys 24 px at 360), three sideways and on a tablet; a reach that fits shows whole with no arrows. Lit and outlined keys (help 0–1, Show me, misses) are always brought on screen; at help 2–5 the window stays where the learner left it. Arrows are never notes. For every key in view at once upright, keep the step within two octaves. |
| Reading rhythm at sight, keeping a pulse across bar after bar (a trainer, not a one-off check) | **Read in time** with a rhythm set (step activity `screen: "flow"`; generated levels, a list of specs for mixed metres) | Count-in once, then continuous exercises on a running click; a mark on every tap; Tap along / Read; tempo, Speed up by itself, Loop; lengths judged only if asked. Done with a round of 8 exercises. Best as a daily habit step, not a one-off. |
| Sight-reading notes in time (both clefs, a hand position) | **Read in time** with made-up tunes (`kind: melodies`, `generate` with a `position`; a list for either hand) | Fresh cards every time; the next card faded to read ahead, a bar between cards; the keys show the card's own position. Untimed reading first: the same set in Drills (music only, notes only). |
| Reading notes untimed, fresh every card | **Drills** with made-up tunes (`generate` with a `position`) | 200 different cards, never remembered; Keep going after the set. |
| Keeping a beat, then rhythms of note values, on a tap pad | **Drills, rhythm set** (`kind: rhythm`, generated or MusicXML; target `clean`) | One pad (or any key); a one-line staff, or at help 0 no music with the taps marked on a beat line. Timing check offered once. The demo can be skipped after a set's first card. "You sped up / slowed down" is named on timed cards. |
| A first tune by finger numbers (before letters or the staff) | **Drills, finger-number cards** (`view: "fingers"`: each card `notes`, `fingers` by phrase with "/", `hand`; the activity's `fingers` for the keys) | Untimed, notes in order; the numbers by phrase, the next highlighted; the hand's five keys shaded and numbered, none lit; a wrong key flashes red with the right one outlined, then it waits. "✓ Clean" / "✓ Done, n wrong keys". The card's fingers must agree with the activity's map (checked). Done when the set is played through (no target) or by `clean`. |
| A tune by its key names (after the names are taught, before the staff) | **Drills, letter-name cards** (`view: "names"`: each card `notes` with "/" between phrases, `hand`, `beats` for the rhythm it's played in) | As finger-number cards, with letters: untimed, the next letter highlighted, nothing on the keys; Hear it lights each letter and its key. The activity sets the miss (`miss: "quiet"`: named, nothing outlined; `"outline"`) and the help (`help: ["show-key", "names"]`). Clean only with no help; hearing it isn't help. The same letters an octave lower for the other hand shows that a letter doesn't change with the hand. |
| A first tune before the staff (letters and note shapes) | **Drills, letters view** (`view: "letters"` on a set of MusicXML items) | The one-line rhythm staff with the letter under each note, played on the keys, judged for key and timing. A 4-bar card draws as two lines of two on a phone upright, one line sideways; split longer tunes into 4-bar cards. |
| Playing one complete short thing at once, judged | **Drills** step (target `clean`) | A target counts only runs played as the step sets them; the step's result shows its best such run. An unscored Drills step is done when its set is played through. Name, by ear, or music cards. |
| Learning the notes of a piece without time pressure | **score, Wait for me** | On the screen's keys (upright, two octaves that follow the music; sideways only when the keys are shown in Display, which is off by default). |
| Playing at tempo / rhythm alone / building speed | **score, Play along / Rhythm / Ladder** (targets `onTime`, `bpm`) | Need a MIDI keyboard today; the screen's keys only show. For rhythm on a phone, use the Drills rhythm sets (above). |
| Keeping a beat with no music | **Metronome** (nothing judged) | Visited only. |
| Learning by heart | **Memorise** | Later rungs. |

**Choosing the range of keys for each step (owner, 2026-10-16).** For rungs that must work on the screen, each step's
plan says which keys it needs and checks they fit what each screen shows: phone upright, phone sideways, tablet.
What's known now: Wait for me plays on the screen's keys upright (two octaves that follow the music) and sideways only
when the keys are shown in Display (off by default); Free play shows two octaves on a phone and three on a tablet; Simon and Drills take the screen's keys when
"Keyboard" is under the music: the keys the set's notes need, rounded out to whole octaves, or the step's `keys` for that
screen grown to hold the notes, or a find set's `keys` exactly; with no MIDI keyboard, when that is more than the screen's
window (two octaves on a phone upright, three on a phone sideways or a tablet), a window of it with ‹ › an octave at a time
and the whole piano drawn small above (app-features §4 "Moving the keys", 2026-10-17). Keep
early material inside one or two octaves and say in the step which keys to use. **A visible range is not
necessarily playable**: check that the keys a step needs are large enough to tap reliably at each screen size, and
that notes meant to sound together register when tapped together. The owner suggested a step could
carry which keys are visible and how wide they are; that is a capability to add when a lesson needs it.

**What the screen can't do, and how a lesson handles it.** Glass has no key travel, weight or loudness, and a tap
has no real touch. So on-screen lessons don't teach or judge loudness, arm weight, legato or tone; where a mode judges a
note's length, it is judged from how long the tap is held. Say so in the lesson ("On the screen, hold your finger down for the
whole note; on a piano you'd also feel the key"), and keep touch and tone for when a keyboard is available.

**Gaps to name, not paper over.** When the teaching needs something no mode does, write the lesson without it, say
what's missing in the plan, and add capability only when this lesson needs it (`CLAUDE.md`). Known gaps today:
- Nothing checks posture, hand shape or tension: no camera or listening. Physical practice has no judged
  result: it is self-checked against a picture and a short checklist in the text (or a *visited* step where a mode
  fits), and the app never claims to have judged it.
- Touch input in Rhythm and Play along is not built (planned for the beat lesson).
- A per-step "visible keys" setting does not exist yet (above).

---

## 8. Checking musical truth

- **Read the notation** of every score, set item or keys block a lesson uses, at the exact bars; never infer from a
  title, grade or metadata (`CLAUDE.md`, Musical and product truth).
- **Verify every note, finger and claim**: key names against the keyboard layout, fingerings against a published
  edition or a method's own page, rhythm against the time signature. A generator or the app's own output never
  certifies itself.
- **Every teaching claim has its source** (§0), and every technique instruction quotes or follows a method's own
  page. If a sentence in a lesson can't be traced, it is cut, narrowed, or marked UNKNOWN in the plan.
- **Scope every musical statement to what is taught**, so nothing has to be unlearned: "in the 4/4 music we're
  playing today, a quarter note gets one beat" (in 2/2 the half note does); "for now we keep the beat steady" (music
  can speed up or slow down on purpose). An absolute is written only when it is always true.
- **An instruction borrowed from acoustic practice must work on the app's input**: "let your tap cover the click"
  needs a tap that sounds. Check what the app does before writing it.
- **Free images and drawings are checked too**: a hand with the thumb on the wrong side, a black key in the wrong
  place, or a flat hand labelled "round" teaches a wrong thing.

---

## 9. Checklist: run it on every lesson before the owner sees it

Fix every fault the checklist finds before the owner or a reviewer sees the plan; a known fault is not an "open
question" to hand on (owner, 2026-10-16: "You shouldn't be making the same mistakes. Be better.").

1. **Outcome**: does the lesson say, at the top, what the learner can do by the end, as an action?
2. **Order**: does its place follow a method's own order (read on the publisher's pages), or is a departure stated
   with its reason?
3. **Prerequisites**: is each one taught in an earlier lesson, and are new names taught before the task that uses
   them?
4. **Load**: one or two new ideas and one new physical skill at most, with most of the time spent practising? One
   or two scored targets, on the core skill; new extras unscored?
5. **Review**: does it open by using the last lesson's skill, and bring back an older one? (Not for the very first
   lesson.)
6. **Sequence**: why → model (hear or see) → guided → independent → check → a little play, or a stated reason for
   another shape?
7. **Physical**: is there a posture / hand / fingertip / release point, shown in a picture or animation, phrased as
   what to do?
8. **Text**: second person, every instruction with its reason, plain words with terms explained when first used,
   concrete images, an "If this happens" part, nothing decorative, nothing said twice?
9. **Tone**: encouragement that is specific and true, no "easy", no pressure?
10. **Pictures**: does each one show something words can't, with labels on it; is each free image's licence read
    on its file page and recorded beside the file?
11. **Steps**: help fades from guided to independent; the target names the skill at a stated help level; assisted
    and independent results are kept apart?
12. **Modes**: is each block or mode chosen for the teaching moment, and is every gap stated rather than worked
    around?
13. **Screen**: if the rung must be playable without a MIDI keyboard, does every step play on the app's keys at every
    screen size (phone upright, phone sideways, tablet), with the keys it needs visible, large enough to tap
    reliably, and notes meant together registering when tapped together?
14. **Truth**: every note, finger and key name checked against the notation and the keyboard; every teaching claim
    linked to a source that was read; anything unverified marked UNKNOWN?
15. **Videos**: relevant videos at the bottom (reference size unless central), and the lesson complete without them?
16. **Played as the learner**: does every step in the spec have its Time, New and Worth it lines (§6), written after
    playing it through, and does none of them say "a few seconds", "nothing" or "no"?

---

## Sources (all opened and read, in the parts stated)

- [Faber, Primer Teacher Guide, table of contents (read; later-unit articles are login-gated)](https://primerguide.pianoadventures.com/)
- [Faber, The Pre-Reading Process (read)](https://primerguide.pianoadventures.com/units/the-pre-reading-process/)
- [Faber, Sitting at the Piano (read; video not watched)](https://primerguide.pianoadventures.com/units/sitting-at-the-piano/)
- [Faber, Making a Round Hand Shape (read)](https://primerguide.pianoadventures.com/units/making-a-round-hand-shape/)
- [Faber, Finger Numbers (read)](https://primerguide.pianoadventures.com/units/finger-numbers/)
- [Faber, Finger Flashcards (read)](https://primerguide.pianoadventures.com/units/finger-flashcards/)
- [Faber, Two Black Ants (read)](https://primerguide.pianoadventures.com/units/two-black-ants/)
- [Faber, Three Little Kittens (read)](https://primerguide.pianoadventures.com/units/three-little-kittens/)
- [Faber, Into the Cave (read)](https://primerguide.pianoadventures.com/units/into-the-cave/)
- [Faber, The Pecking Rooster/Hen (read)](https://primerguide.pianoadventures.com/units/the-pecking-rooster-hen/)
- [Faber, The Natural Learning Process (read)](https://primerguide.pianoadventures.com/units/the-natural-learning-process/)
- [Faber blog, Building a Bridge, 2018 (read)](https://pianoadventures.com/?p=9252)
- [Faber, Adult Piano Adventures Course Book 1 contents (read)](https://pianoadventures.com/qr/ff1302/)
- [Faber, Adult Book 1 QR page p11 (read)](https://pianoadventures.com/qr/ff1302/p11/)
- [Faber, Adult Book 1 Top Things to Know (read)](https://pianoadventures.com/piano-books/adult-piano-adventures/level-1/things-to-know/)
- [Alfred's Basic Adult Piano Course 1, publisher's sample pages (read)](https://content.alfred.com/catpages/00-2236.pdf)
- [Clark, Goss & Holland, The Music Tree: Time to Begin, publisher's sample pages (read)](https://content.alfred.com/catpages/00-0685S.pdf)
- [Denenburg, Exercising in the Name of Music, Frances Clark Center (read)](https://pianoinspires.com/video/exercising-in-the-name-of-music/)
- [Rosenshine, Principles of Instruction, American Educator 2012 (read in full)](https://www.aft.org/sites/default/files/periodicals/Rosenshine.pdf)
- [Mayer & Moreno, Nine Ways to Reduce Cognitive Load, Educational Psychologist 2003 (read in full)](https://www.uky.edu/~gmswan3/575/9_ways_to_reduce_CL.pdf)
- [NSW CESE, Cognitive load theory: Research that teachers really need to understand, 2017 (read sections 1-7)](https://education.nsw.gov.au/content/dam/main-education/about-us/educational-data/cese/2017-cognitive-load-theory.pdf)
- [Brom et al., personalization principle, Computers & Education 2017, authors' manuscript (read abstract, introduction, background)](https://artemis.ms.mff.cuni.cz/main/papers/personaliz_manuscript_161226_CE_for_web.pdf)
- [Ryan & Deci, Self-Determination Theory, American Psychologist 2000 (read pp. 70-73)](https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf)
- [Wulf & Lewthwaite, Current Directions in Psychological Science 2021 (read pp. 1-4)](https://gwulf.faculty.unlv.edu/wp-content/uploads/2021/11/Wulf_Lewthwaite_OPTIMAL_Current_Directions_2021.pdf)
- [McKay et al., Reporting bias, not external focus, preprint 2024, Psychological Bulletin (abstract read)](https://sportrxiv.org/index.php/server/preprint/view/304)
- [McKay et al., self-controlled motor learning meta-analysis, Meta-Psychology 2022 (abstract read)](https://conferences.lnu.se/index.php/metapsychology/article/view/2803)
- [St. Germain et al., autonomy-supportive language, preprint (abstract read)](https://sportrxiv.org/index.php/server/preprint/view/298)
- [Bjork, Looking Back at Schmidt and Bjork (1992), Perspectives on Psychological Science 2018 (read in full)](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2018/02/BjorkCommentaryOnSchmidtBjork.pdf)
- [Marco-Ahulló et al., Sensors 2024 (introduction read; reports McKay et al. 2022 on feedback frequency)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10933749/)
- [Palmer & Meyer, Conceptual and Motor Learning in Music Performance, Psychological Science 2000 (abstract only)](https://www.psychologicalscience.org/journals/psychological-science/1467-9280.00216/)
- [Simply Piano help: using the app without a piano (read; a product's own page)](https://piano-help.hellosimply.com/en/articles/14588159-can-i-use-simply-piano-without-a-piano)
- [Höffler & Leutner, animation vs static pictures meta-analysis, Learning and Instruction 2007 (abstract read)](https://www.leibniz-ipn.de/en/research/publications/instructional-animation-versus-static-pictures-a-meta-analysis)
- [Berney & Bétrancourt, Does animation enhance learning? A meta-analysis, EARLI 2016 summary (read in full)](https://tecfa.unige.ch/perso/sandra/pdf/Earli2016_berney_betrancourt_FINAL.pdf)

[faber-toc]: https://primerguide.pianoadventures.com/ "Faber, Primer Teacher Guide, table of contents (read; later-unit articles are login-gated)"
[faber-prereading]: https://primerguide.pianoadventures.com/units/the-pre-reading-process/ "Faber, The Pre-Reading Process (read)"
[faber-sit]: https://primerguide.pianoadventures.com/units/sitting-at-the-piano/ "Faber, Sitting at the Piano (read; video not watched)"
[faber-hand]: https://primerguide.pianoadventures.com/units/making-a-round-hand-shape/ "Faber, Making a Round Hand Shape (read)"
[faber-fingers]: https://primerguide.pianoadventures.com/units/finger-numbers/ "Faber, Finger Numbers (read)"
[faber-flash]: https://primerguide.pianoadventures.com/units/finger-flashcards/ "Faber, Finger Flashcards (read)"
[faber-ants]: https://primerguide.pianoadventures.com/units/two-black-ants/ "Faber, Two Black Ants (read)"
[faber-kittens]: https://primerguide.pianoadventures.com/units/three-little-kittens/ "Faber, Three Little Kittens (read)"
[faber-cave]: https://primerguide.pianoadventures.com/units/into-the-cave/ "Faber, Into the Cave (read)"
[faber-rooster]: https://primerguide.pianoadventures.com/units/the-pecking-rooster-hen/ "Faber, The Pecking Rooster/Hen (read)"
[faber-nlp]: https://primerguide.pianoadventures.com/units/the-natural-learning-process/ "Faber, The Natural Learning Process (read)"
[faber-bridge]: https://pianoadventures.com/?p=9252 "Faber blog, Building a Bridge, 2018 (read)"
[faber-adult]: https://pianoadventures.com/qr/ff1302/ "Faber, Adult Piano Adventures Course Book 1 contents (read)"
[faber-adult-p11]: https://pianoadventures.com/qr/ff1302/p11/ "Faber, Adult Book 1 QR page p11 (read)"
[faber-adult-ttk]: https://pianoadventures.com/piano-books/adult-piano-adventures/level-1/things-to-know/ "Faber, Adult Book 1 Top Things to Know (read)"
[alfred]: https://content.alfred.com/catpages/00-2236.pdf "Alfred's Basic Adult Piano Course 1, publisher's sample pages (read)"
[musictree]: https://content.alfred.com/catpages/00-0685S.pdf "Clark, Goss & Holland, The Music Tree: Time to Begin, publisher's sample pages (read)"
[denenburg]: https://pianoinspires.com/video/exercising-in-the-name-of-music/ "Denenburg, Exercising in the Name of Music, Frances Clark Center (read)"
[rosenshine]: https://www.aft.org/sites/default/files/periodicals/Rosenshine.pdf "Rosenshine, Principles of Instruction, American Educator 2012 (read in full)"
[mayer-moreno]: https://www.uky.edu/~gmswan3/575/9_ways_to_reduce_CL.pdf "Mayer & Moreno, Nine Ways to Reduce Cognitive Load, Educational Psychologist 2003 (read in full)"
[cese]: https://education.nsw.gov.au/content/dam/main-education/about-us/educational-data/cese/2017-cognitive-load-theory.pdf "NSW CESE, Cognitive load theory: Research that teachers really need to understand, 2017 (read sections 1-7)"
[brom]: https://artemis.ms.mff.cuni.cz/main/papers/personaliz_manuscript_161226_CE_for_web.pdf "Brom et al., personalization principle, Computers & Education 2017, authors' manuscript (read abstract, introduction, background)"
[ryan-deci]: https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf "Ryan & Deci, Self-Determination Theory, American Psychologist 2000 (read pp. 70-73)"
[wulf]: https://gwulf.faculty.unlv.edu/wp-content/uploads/2021/11/Wulf_Lewthwaite_OPTIMAL_Current_Directions_2021.pdf "Wulf & Lewthwaite, Current Directions in Psychological Science 2021 (read pp. 1-4)"
[mckay-focus]: https://sportrxiv.org/index.php/server/preprint/view/304 "McKay et al., Reporting bias, not external focus, preprint 2024, Psychological Bulletin (abstract read)"
[mckay-self]: https://conferences.lnu.se/index.php/metapsychology/article/view/2803 "McKay et al., self-controlled motor learning meta-analysis, Meta-Psychology 2022 (abstract read)"
[stgermain]: https://sportrxiv.org/index.php/server/preprint/view/298 "St. Germain et al., autonomy-supportive language, preprint (abstract read)"
[bjork]: https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2018/02/BjorkCommentaryOnSchmidtBjork.pdf "Bjork, Looking Back at Schmidt and Bjork (1992), Perspectives on Psychological Science 2018 (read in full)"
[sensors]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10933749/ "Marco-Ahulló et al., Sensors 2024 (introduction read; reports McKay et al. 2022 on feedback frequency)"
[palmer]: https://www.psychologicalscience.org/journals/psychological-science/1467-9280.00216/ "Palmer & Meyer, Conceptual and Motor Learning in Music Performance, Psychological Science 2000 (abstract only)"
[simply]: https://piano-help.hellosimply.com/en/articles/14588159-can-i-use-simply-piano-without-a-piano "Simply Piano help: using the app without a piano (read; a product's own page)"
[hoffler]: https://www.leibniz-ipn.de/en/research/publications/instructional-animation-versus-static-pictures-a-meta-analysis "Höffler & Leutner, animation vs static pictures meta-analysis, Learning and Instruction 2007 (abstract read)"
[berney]: https://tecfa.unige.ch/perso/sandra/pdf/Earli2016_berney_betrancourt_FINAL.pdf "Berney & Bétrancourt, Does animation enhance learning? A meta-analysis, EARLI 2016 summary (read in full)"

Each link's title text says what it is and how much was read (all read on 2026-10-16); the notes file has the
details and what each supports.

**Not read, so not relied on**: Faber's Technique Secrets, Measured Flow, Rhythm and Pulse and Directional Reading
articles (login); the full text of Faber Adult Book 1 and its 3-Minute Technique (online pages hold only audio);
Mayer's 2008 and 2017 summaries of the multimedia principles (paywalled; the multimedia and personalization
principles are cited here through Mayer & Moreno 2003 and Brom et al. 2017); Duke, Simmons & Cash 2009 on piano
practice (paywalled); McKay et al. 2022 on feedback frequency (seen only as reported); Pike's full 2021 article on
adult learners (subscriber-only; a Frances Clark Center summary was read but is about group teaching, so it isn't
used above); no adult-specific piano study was read in full, so claims about adult learners here rest on general
motivation research and on what the adult methods' own pages show (they move faster than the children's books).
