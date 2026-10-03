# Correction 1 to `responses/b47ce498.md`

This correction replaces **section 1, “U122 — one sideways Score-bar layout model,”** and amends section 2’s procedure rule. The earlier approval was too narrow because it accepted the existing surface boundary — landscape hides the normal header, therefore the bottom strip owns nearly all context/status/control information — without testing whether that boundary still served the learner-facing goal.

## 1. U122 — redesign the landscape Score chrome, not merely the bottom bar

**APPROVE WITH ONE REQUIRED CHANGE**

Do **not** continue U122 as “one allocation model for the sideways bottom bar” as previously approved. The product problem is broader: on a short landscape screen, preserve as much readable score area as possible while keeping navigation, location, actionable state, and the controls the learner actually needs understandable and reachable. The current implementation’s choice to hide the full `.score-head` in short landscape is evidence that vertical score room matters; it is **not** evidence that Back, title, `bar m / m`, status/refusal text, mode/hands/etc., play/pause, and `⋯` therefore all belong in one bottom strip.

### Required change — test the surface decomposition before the width allocator

Redraft U122 as a **landscape Score chrome** design lane. Its first design decision is *which information belongs on which surface*, before it defines any flex/grid/width-allocation model.

At minimum compare these materially different decompositions against the same measured grids and learner-facing invariants:

1. **Current-family / bottom-heavy:** context, status and controls remain principally in the bottom strip, with a coherent allocator.
2. **Split context/control:** a small defined top-edge/context zone carries suitable orientation information (for example Back/title/bar location as the evidence supports), while the bottom strip is reserved primarily for immediate playing controls.
3. **Split with transient state surface:** persistent context and controls use their appropriate edges, while exceptional actionable state such as sound refusal gets its own temporary message surface rather than consuming permanent control-row width.

These are comparison families, not prescribed final pixels. U122 may recommend another decomposition if the evidence is better.

For every candidate, measure and report:
- score/stage height and resulting readable music/look-ahead;
- whether any chrome overlaps notation, fingerings, or controls;
- Back and `bar m / m` usability/readability;
- selected mode/value readability;
- play/pause and `⋯` visibility/tap size;
- whether actionable text names only a visible/reachable control;
- refusal-state behaviour at U120’s 568×320 case;
- U121’s narrow selected-value case;
- whether anything moves unexpectedly during a run.

Do **not** simply restore the old full-height header. The existing landscape rule was introduced to recover scarce vertical room for the score. A top solution must therefore be compact/reserved/otherwise measured against the music, not assumed free. Likewise, do not float arbitrary chrome over the score unless the measured stage/renderer contract proves that region does not cover notation.

The old U122 inventory of CSS/JS rules is still useful, but it becomes evidence about the current implementation, not the boundary of the design. The output should say which existing rules disappear because information moved to a better surface, which remain because they express a real invariant, and which width-allocation logic is still needed after the decomposition is chosen.

**Acceptance.** A reviewer can explain the landscape Score screen in product terms first — what appears at the top, what appears at the bottom, what appears only transiently, and why — and only then explain the allocation mechanism within each surface. U120 and U121 are acceptance cases, not reasons to keep everything in the original strip.

**Stop condition.** If no candidate can preserve the score’s required readable area and the control/status invariants at a measured cell, report the actual product trade. Do not add another local compression/ellipsis/overflow rule to make the existing strip survive.

## 2. Procedure amendment — premise challenge before local optimization

The earlier hotspot rule remains, but add this standing gate to `docs/prompts/operating-procedure.md` before U122 resumes and apply the same gate in reviewer reasoning:

> **Challenge the container, not only its contents.** Before a redesign, and before another fix-forward in a repeated hotspot, state the user/product goal without the current implementation’s nouns. Name the current boundary/ownership assumption being preserved (surface, module, row, store, state machine, pipeline stage, etc.) and at least one materially different decomposition that could satisfy the goal. Ask what evidence makes the current boundary necessary. If the answer is only “that is where the code already puts it” or “the previous fix assumed it,” the boundary is not settled. Compare the alternatives at the learner/product level before optimizing inside the existing container.

This is not a requirement to brainstorm arbitrary architectures on every small bug. It applies when (a) a design lane is choosing a model, (b) the same surface/mechanism has accumulated repeated fixes, or (c) the proposed solution is becoming increasingly elaborate to preserve an inherited boundary.

The purpose is to catch exactly the failure here: “hide the large landscape header to save score height” was a valid local decision; “therefore all other information belongs in the bottom bar” was an inherited premise that neither the builder nor reviewer challenged.

This correction supersedes only section 1’s “dispatch U122 as written” ruling and extends the section 2 procedure rule. Sections 2’s provenance rule and section 3’s `current.md` ruling remain unchanged.