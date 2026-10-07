# The owner, 2026-10-07: placement by rules, a classifier and a verifier

Verbatim, in order (the chat, 2026-10-07).

1. "the only way this is fixed is if yiu were literally to go through rung by rung, song by song, exercise by exercise, read the music xml file to get the characteristics to push to a file, so that we can move them to the right place."
2. "What characteristics of songs and exercises (think about each separatelt, as ones generated and one uses the noisy pdmx data and music xml) can we extract by code from the music and what characteristics would we need to correctly place them into the right skills, genres, abilities, difficulty levels, and rungs, and stages, etc (basically put them in the right place in the entire curriculum). And what's the gap"
3. "since yiu obviously can't tell something as subjective as genre, what can't and can we detect by code in terms of all the determinations of which track!, genre, ability, rung, and stage"
4. "First we make the rules that cover everything, then we'll make the code"
5. "Ideally we could use libraries for some of the characteristics and detection so we don't have to rely on your shitty code"
6. "can I ask you to put together a comprehensive rules and characteristics per place in curriculum matrix or graph or whatever, and anything we can't do by code well have your shitty agent try to research, so mark those down somewhere too. We basically want to build the architecture for a classifier and verifier."

Before these, the owner stopped all running work ("Don't duck ing do anything until i say so@!"); message 6 is the go for this task only.

The result is `docs/classifier/` (README.md for the architecture) and `tools/classifier/build_matrix.py`.
