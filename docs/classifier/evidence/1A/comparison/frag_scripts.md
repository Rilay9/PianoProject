| file | what it does | writes |
| --- | --- | --- |
| `cmp_common.py` | paths; the validators' raw walk re-pointed (`validation/walk.py` executed from source); `r_sanity.py` executed from source untruncated; the note-table reader with the pickup-test fallback | - |
| `sp_lib.py` | the flag definitions: ps13 / PKSpell differences, the diatonic gate, test 2b hits with the fix verdicts | - |
| `sp_select.py` | the selection rules for the published scores and the catalogue | `sp_pieces.json` |
| `sp_prepare.py` | reads every piece into a note table | `sp_prepare.json`, `build/sp_in/` |
| `pks_run.py` | PKSpell on every note table (run in `build/venv-pkspell`) | `sp_pks.json`, `build/sp_pks/` |
| `sp_check_repro.py` | this folder's flags against the validators' own functions and the validation row's figures | `sp_check_repro.json` |
| `sp_run.py` | every method on every piece | `sp_results_<set>.json` |
| `sp_metrics.py` | false-flag tables, ASAP split, whole-piece mismatches, runtime | `sp_metrics.json`, `frag_m_*.md`, `frag_runtime.md`, `frag_m21kb_pieces.md`, `frag_metrics.md` |
| `sp_pubflags.py` | the kind-2 flags on published scores, listed | `frag_pubflags.md` |
| `sp_named.py`, `sp_named_table.py` | the validation row's named items, flag by flag; kind 1 | `sp_named.json`, `frag_named.md` |
| `sp_t2b_residual.py` | test 2b hits on the published scores by interval, before and after each fix | `sp_t2b_residual.json`, `frag_t2bres.md` |
| `sp_arp7.py` | the seventh-arpeggio family against the chord-letter rule | `sp_arp7.json`, `frag_arp7.md` |
| `sp_inject.py`, `sp_inject_metrics.py` | injected misspellings and the catch tables | `sp_inject_results.json`, `sp_inject_metrics.json`, `frag_inject.md` |
| `gere_run.py` | the Géré et al. checkers with the command line's arguments and one try/except per file (run in `build/venv-gere`) | `build/gere_published2.json`, `build/gere_cat2.json` (not committed) |
| `sp_gere.py` | digest of the Géré et al. run (`detect_errors`, in `build/venv-gere`) and of the unclosed-bracket files | `sp_gere.json`, `frag_gere.md` |
| `build_spelling.py` | assembles this page from `spelling_template.md` and the `frag_*.md` files | `spelling.md` |
| `pks_commit.txt` | the PKSpell commit | - |
