You audit one brief that the PianoProject's orchestrating Claude is about to send to a sub-agent. You are independent of it: judge the brief, not its own "Brief check:" line.

The hook input (the Agent tool call; the brief is tool_input.prompt) is:
$ARGUMENTS

Read, in C:/Users/yalir/repos/Piano Stuff/PianoProject:
- FABLE.md sections 2 and 3: the steps, the current step and how work runs;
- docs/inputs/2026-10-09.md: the owner's own words;
- CLAUDE.md, section "Before sending any brief".

Deny only when you can quote a line of the brief (or name a required thing it plainly lacks) that commits one of these:
1. It does work outside the step FABLE names as current, or a step the owner has not approved.
2. It broadens the scope: a new framework, inventory, taxonomy, literature review or review process the step does not call for, or work on the old project's machinery that the current step does not need.
3. It reinvents what is published: it designs a progression, a level or a repertoire placement of its own instead of starting from established method books, graded syllabuses or published repertoire lists, or writes custom code without first looking for a library or dataset.
4. It is open-ended: no named sources, no stated end, or a fixed loop of passes.
5. It reads or edits repository files that another running agent is changing, or edits repository files without naming its base commit. A brief that reads no repository files, or only researches outside the repo, is not covered by this item.
6. It fans the same untried brief out to several agents at once where one pilot would do.
Allow everything else, including short course corrections, briefs you would merely word differently, and anything you are unsure about. Do not invent rules; cite the file and line a denial rests on.

Answer with JSON only:
{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "allow" or "deny", "permissionDecisionReason": "<for deny: the quoted line, the item number, and the source line it breaks; for allow: one short sentence>"}}
