// PreToolUse on Agent and SendMessage: a brief does not go out until it has been checked
// against the owner's goal (the owner, 2026-10-08: "why aren't you running the checklist on
// all this stuff", after briefs went out that did the next step's work and opened
// open-ended searches). The stop checklist runs only after a reply, too late for a brief.
// The brief must carry a line starting "Brief check:" answering the questions below.
let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  let text = "";
  try {
    const j = JSON.parse(input);
    const t = j.tool_input || {};
    text = String(t.prompt || t.message || "");
  } catch (e) {
    process.exit(0);
  }
  if (/^\s*Brief check:/m.test(text)) process.exit(0);
  process.stderr.write(
    [
      "Brief not sent: it has no 'Brief check:' line. Before any brief or brief change goes to an agent, answer in that line:",
      "1. The owner's goal for this step, in the owner's words. Does the brief do that step and nothing more (no later step's work, nothing the owner put after it)?",
      "2. Is the output sized to that goal, with a named end condition (no open-ended search, no catalogue dumps, no loop)?",
      "3. Are its inputs final (nothing running that changes what it reads)?",
      "4. Is every rule in it the owner's or required by the task, not one I invented?",
      "Fix the brief where an answer is no, add the line, and send again.",
    ].join("\n")
  );
  process.exit(2);
});
