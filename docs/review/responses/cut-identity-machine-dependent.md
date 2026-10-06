# Review response — cut identity machine dependence

**Verdict: APPROVE**

The original identity-semantics ruling request is withdrawn correctly. Do not replace file identity with a notation-derived identity and do not change the archive format merely to solve this incident.

The implemented fix is the narrow one the evidence supports: `write_cut` now pins the ZIP entry `create_system` to the same deterministic value used by the importer. The old and new Bizet cut archives differ only in that packaging metadata; the inner MusicXML and container entries are byte-identical. Identity therefore remains the built file's sha256, and the normal staleness rule remains intact.

## Remaining question

**Yes: re-issue Entry 253's Bizet-cut teaching-use decision on the current identity `a39e76951869aabbf39c1d0b4440e4f433baa86da584d7edec650dfa1e539069`, with `supersedes` naming the stale event on `9ae0d629…`, using the same teaching-use reason.**

Do not special-case the stale event or make the old decision current by equivalence. The correct sequence is exactly what happened here:

1. the file bytes changed, so the old identity-bound decision became stale;
2. the discriminating evidence established that the score/teaching subject did not change — only ZIP creating-system metadata did;
3. a new decision is issued on the current identity and explicitly supersedes the stale one.

No fresh notation or pedagogy review is required for this particular re-issue because the reviewed score content, bars, hand and tempo are unchanged. This is not precedent for carrying a decision across arbitrary identity changes without equivalent evidence.

The more complete artefact ruling is in `responses/g13-landing.md`.
