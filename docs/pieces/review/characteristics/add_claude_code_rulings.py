"""Adds my ruling per row to ChatGPT's file-by-file code review of commit a1102147 (2026-10-10).
Input: the review CSV the owner uploaded (path as argument). Output: chatgpt-code-review-with-claude.csv beside this file.
Ruling = AGREE / PARTLY / DISAGREE with ChatGPT, then FIXED (in the commit after a1102147), LATER (in the plan) or
NO CHANGE, and why."""
import csv, os, sys

R = {
"_notes.py": "PARTLY. Agree to label the rule as PRINTED notes (what a reader sees), not heard notes; the docstring says printed. Disagree that printed cue-size notes may be unplayed in OUR files: the visible ones read (Chopin Op. 25/1, K. 467 arrangement) are played. 'Every row uses it' was overstated: E11/E40/E12 rhythm rows filter hidden notes themselves. NO CHANGE to the rule; E40 now uses _keep (below).",
"_raw.py": "AGREE on the main point. FIXED: directions() now uses exact Fractions (no int(float())). FIXED, and worse than ChatGPT saw: bar_label never reached the file at all (getContextByClass(Score) returns None), so every label had fallen back to music21's number+suffix; it now finds the score through the part's sites, with a new test. pair_spans: kept, measured (ottava identical either way; hairpins 5 unclosed vs 27); ambiguous pairs as UNKNOWN is LATER. First-part bar numbers: E32 measured 0 files whose parts differ in measure count; NO CHANGE.",
"e01_layout.py": "PARTLY. '-Staff' is music21's own PartStaff id scheme, not a user id, so the split is safe for files music21 parsed. two_piano_staves rests on part names (not verified piano identity): agreed, it is a name check and says so via two_staff_reason. NO CHANGE.",
"e02_bars.py": "PARTLY. The 1/8-quarter cutoff is measured, not ad hoc: integer-duration drift is at most 0.03 quarter (16 bars, music21 right) and real stretched rests differ by 1/2 or more (30 bars). corrected_from already exposes music21's value whenever the cursor wins. Gaps are reported as observations, not errors. NO CHANGE.",
"e03_clefs.py": "AGREE. FIXED: a staff with no clef now reports start UNKNOWN instead of being missing.",
"e04_ottava.py": "AGREE with the corrected review: type=continue is an intermediate mark and ignoring it is right for complete spans. FIXED: added the start/continue/stop test (one span, 6 notes). Stop-boundary check against print: LATER (plan: printed spot-checks).",
"e05_ledger.py": "PARTLY. unclosed_ottava already flags the staff whose counts are partial; making the counts themselves UNKNOWN would hide the 939 good spans' files too. Clef context with mid-bar changes was probed (music21 finds the clef in force). NO CHANGE; printed check LATER.",
"e06_keys.py": "PARTLY. str(dict) as a dedup key is stable for these values; probed: music21 does not insert an implicit C signature when none is written. NO CHANGE.",
"e07_accidentals.py": "PARTLY. The raw cautionary/editorial counts already skip hidden notes; slash heads carry no accidentals in our files (239, one file). Reconcile music21 against raw <accidental> totals on the corpus: LATER (one script).",
"e08_signature_exercised.py": "AGREE that 'per span' was mislabelled. FIXED: docstring and comment now say per signature with all its spans merged. Per-span locations: LATER, only if a consumer needs them.",
"e09_times.py": "AGREE: real bug. FIXED: the merge key is now bar + offset + signature, each entry has its offset, and a test with 3/4 changing to 2/4 inside one bar passes.",
"e10_pickup.py": "PARTLY. Agree 'confirmed' means two file observations agree, not a printed check; FIXED in the comment. Kept the key name because E32 reads it.",
"e11_values.py": "PARTLY. notes_by_type counts note EVENTS (a chord once) while small_notes counts heads: FIXED in the docstring. Slash heads stay in this RHYTHM row on purpose (a slash shows a rhythm). Duration.linked False is music21's own type/duration-mismatch flag (probed). NO OTHER CHANGE.",
"e12_dotted.py": "AGREE minor points; NO CHANGE (bar labels are enough to find the figure).",
"e13_tuplets.py": "PARTLY. The plausibility rule never says 'not a tuplet': other ratios are reported under suspect, as ChatGPT asks. Runs reset at the barline (a tuplet across a bar counts twice): LATER, rare.",
"e14_grace.py": "AGREE: real bug. FIXED: a grace run at the end of a bar is carried to the next bar's first main note in the same voice (runs_across_barline counts them); after_runs now means no later main note at all. Two tests added.",
"e15_ornaments.py": "AGREE. Known misses (vertical-turn, haydn, trills on rests) are listed in the comment. NO CHANGE.",
"e16_arpeggiate.py": "PARTLY. Grouping by staff+onset is deliberate (fixes 30 marks -> 15 printed rolls in Schumann Op. 68/30); two different rolls at one onset on one staff is the price, rare. No aggregate across staves exists, so no double count. LATER: label as onset-grouped.",
"e17_tremolo.py": "AGREE minor. NO CHANGE (19 files have tremolos).",
"e18_glissando.py": "AGREE. FIXED: only 'chromatic' -> glissando and 'continuous' -> slide; anything else is UNKNOWN.",
"e19_fermata.py": "PARTLY. Staves of one part share barlines, so the first part covers piano files; multi-part barline differences are rare. NO CHANGE.",
"e20_dynamics.py": "AGREE. FIXED: the key is now conflicting_marks_same_moment (marks at one moment, not levels in force over a passage).",
"e21_hairpins.py": "PARTLY. continue: same as ottava, intermediate, fine for complete spans. Offsets: FIXED via _raw.directions. Pairing improved (FIFO, measured). Words without location: LATER.",
"e22_articulations.py": "AGREE. The denominator is already labelled (attacks include tie continuations, as E23/E27). Pin music21 10.5: LATER (README note). NO CODE CHANGE.",
"e23_slurs.py": "PARTLY. Ambiguous stops are counted (ambiguous_stops, ambiguous_no_winner: 7 stops in 6 files). Per-slur endpoints only if a consumer needs them. Spot-check disputed bars against print: LATER (plan).",
"e24_pedal.py": "AGREE. continue/resume are counted but do nothing to the span (0 in our files). LATER: report them as unsupported events, and say bars_under_pedal is notated-line coverage.",
"e25_tempo.py": "AGREE this is a policy choice. Ruling: the PRINTED metronome mark is the tempo a learner reads, so it stays primary; playback-only changes after it are not silently lost: FIXED in D01, which now reports playback_only_tempo_marks_set_aside. The footnote metronome case (Op. 10/3) stays a known limit.",
"e26_tempo_change.py": "AGREE minor. NO CHANGE.",
"e27_fingering.py": "AGREE. NO CHANGE.",
"e29_chord_symbols.py": "PARTLY. Merging same symbol at the same place across parts is right for piano scores (staff copies); the 7 genuine conflicts in 2 files are kept. NO CHANGE.",
"e30_slash.py": "AGREE. FIXED: a non-numeric measure-style number gives no target instead of a crash. Also FIXED: E30 now asks printed() to keep slash heads (printed() leaves them out by default).",
"e31_repeats.py": "AGREE on the label. FIXED: forward_repeats_not_closed is commented as a simple linear diagnostic. First-part scope already stated.",
"e32_length.py": "AGREE. FIXED: only MuseScore's split-bar labels (^X\\d*$) are excluded; with bar_label fixed the label is the file's 'X1'. Pickup wording inherits E10's.",
"d01_rate.py": "AGREE: two real bugs. FIXED: densest window is exactly four bars (None for shorter pieces); notes_per_second counts every head including unison doublings; plus the playback-only tempo flag. Tests added (both fail on the old code).",
"e33_range.py": "AGREE. NO CHANGE.",
"e34_pitch_inventory.py": "AGREE. NO CHANGE.",
"e35_pitch_entropy.py": "AGREE. scipy dependency: LATER (README note).",
"e36_simultaneous.py": "AGREE on the label: per_staff counts distinct pitches; doublings are reported apart. D01 now counts heads with doublings. NO OTHER CHANGE.",
"e37_span.py": "AGREE: real bug. FIXED: statistics.median, with an even-count test.",
"e38_octaves.py": "AGREE: 12 semitones is a keyboard octave; spelling is not checked. LATER: add the spelled interval only if an interval-reading rung uses it.",
"e39_movement.py": "AGREE. NO CHANGE (limits are in the comment).",
"e40_runs.py": "AGREE: real bug. FIXED: slash heads are no pitches here (_keep), with a test.",
"e41_voices.py": "CHECKED: music21 makes no Voice object for a one-voice bar, so the case did not break; still FIXED to count an explicit single Voice correctly.",
"e42_rates.py": "PARTLY. per_quarter uses music21's highestTime, which stretched whole-bar rests inflate in 10 files: LATER (use E02 lengths). NO OTHER CHANGE.",
"e43_shared_attacks.py": "PARTLY. Same 10-file stretched-rest issue in _bars: LATER (use E02 extents).",
"e44_turn_taking.py": "AGREE. NO CHANGE.",
"e45_hold_and_move.py": "AGREE: thresholds are a detector definition. NO CHANGE.",
"e46_density.py": "AGREE. Cost measured: 460 s summed over 842 files on 3 workers; acceptable. NO CHANGE.",
"run_all.py": "AGREE. FIXED: exits non-zero when any file or row fails.",
"test_characteristics.py": "AGREE. FIXED: added E04 continue, E09 two signatures in one bar, E14 cross-bar grace run, and a bar_label test (the label bug had no test).",
"test_e22.py": "AGREE. NO CHANGE.",
"test_e23.py": "AGREE: printed spot-checks of disputed slurs LATER (plan).",
"test_e24.py": "AGREE: resume/continue semantics LATER with the E24 change.",
"test_e25.py": "AGREE; policy settled as above (printed tempo primary, playback-only flagged in D01). NO CHANGE to the E25 tests.",
"test_e26.py": "AGREE. NO CHANGE.",
"test_e27.py": "AGREE. NO CHANGE.",
"test_e29.py": "PARTLY, as for E29. NO CHANGE.",
"test_e30.py": "AGREE. NO CHANGE.",
"test_e31.py": "AGREE: label fixed; nested-repeat case LATER only if a file needs it.",
"test_e32.py": "FIXED: the expectation '3X1' was music21's wrong label; now 'X1', the printed one.",
"test_e33_e46.py": "AGREE. FIXED: E37 even-count median, D01 exactly-four-bars and fewer-than-four, D01 heads with a unison doubling, E40 slash heads.",
"D02": "AGREE: not built; it is THE difficulty step and needs its own plan (work-disjoint evaluation against published levels, baselines, no 70% gate). See plan.",
"D03": "AGREE: optional, not now.",
}


def main():
    src = sys.argv[1]
    rows = list(csv.DictReader(open(src, encoding="utf-8-sig")))
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chatgpt-code-review-with-claude.csv")
    missing = []
    for r in rows:
        f = r["python_file"]
        key = os.path.basename(f) if f.endswith(".py") else ("D02" if "D02" in f else "D03" if "D03" in f else f)
        r["claude_ruling"] = R.get(key, "")
        if not r["claude_ruling"]:
            missing.append(f)
    with open(out, "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(len(rows), "rows ->", out, "missing:", missing)


if __name__ == "__main__":
    main()
