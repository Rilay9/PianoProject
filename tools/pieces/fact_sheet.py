"""Turns one results.json (tools/pieces/characteristics output: rows E01-E46, D01, D02) into facts.md: a one-page list of
the facts a reader needs to place a piece on the skill rungs. It copies the rows' numbers and bar labels only; it parses
no music and judges nothing. A value the code did not decide is printed as UNKNOWN, never filled in.

Usage:  python tools/pieces/fact_sheet.py <bundle folder or results.json> [out.md] [--results other.json] [--trimmed "bars 1-38"]
  title, composer and published level come from info.txt beside results.json; the "use" column of docs/pieces/chosen.csv is
  looked up by level, title and source file.
  Where the use column names bars ("bars 1-38 (mvt I)") the file holds more than the chosen piece. Counts in results.json
  cover the whole file, so the sheet then says so at the top; --results takes a results.json computed (by the same rows) on a
  copy of the file cut to the piece's bars, and --trimmed says which bars that copy holds.

Staff 1 is the upper and staff 2 the lower staff of the piano part (E01); a staff is not a hand.
"""
import csv
import json
import os
import re
import sys
from fractions import Fraction

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAXB = 10  # bars listed before "..."


def note(m):
    return f"{SHARP[m % 12]}{m // 12 - 1}"


class Sheet:
    def __init__(self, d, title="", composer="", level="", use="", trimmed="", whole_bars=None, d02=None):
        self.d, self.title, self.composer, self.level, self.use = d, title, composer, level, use
        self.trimmed, self.whole_bars, self.d02row = trimmed, whole_bars, d02
        self.more = bool(re.match(r"\s*bars? \d+\s*[-–]\s*\d+", use or ""))
        self.out = []

    # ---- output helpers
    def add(self, s=""):
        self.out.append(s)

    def head(self, s):
        self.add()
        self.add(f"## {s}")

    @staticmethod
    def bars(lst, n=MAXB):
        lst = [str(x) for x in lst]
        if not lst:
            return "none"
        return ", ".join(lst[:n]) + (f", ... ({len(lst)} bars)" if len(lst) > n else "")

    def row(self, k):
        r = self.d.get(k)
        if not isinstance(r, dict):
            self.add(f"- {k}: UNKNOWN (no result)")
            return None
        if "ERROR" in r:
            self.add(f"- {k}: UNKNOWN (code error: {r['ERROR'][:80]})")
            return None
        return r

    @staticmethod
    def staves(r):
        return sorted((k for k in r if k.isdigit()), key=int)

    def per_staff(self, r, fn):
        parts = [f"staff {k}: {fn(r[k])}" for k in self.staves(r) if isinstance(r[k], dict)]
        return "; ".join(parts) if parts else "UNKNOWN"

    # ---- sheet
    def build(self):
        self.add(f"# Facts: {self.title} ({self.composer}), published level {self.level}")
        self.add("Source: results.json from tools/pieces/characteristics (rows E01-E46, D01, D02). Staff 1 = upper staff, staff 2 = lower staff of "
                 "the piano part; a staff is not a hand. UNKNOWN = the code could not decide. Bars are the printed bar numbers.")
        if self.trimmed:
            self.add(f"**THE FILE HOLDS MORE THAN THE CHOSEN PIECE** ({self.whole_bars} stored bars; chosen.csv use: \"{self.use}\"). "
                     f"The piece is {self.trimmed}. Every fact below was recomputed by the same rows on a copy of the file cut to those bars, "
                     "except D02, which is the model's figure on the whole file.")
        elif self.more:
            self.add(f"**THE FILE HOLDS MORE THAN THE CHOSEN PIECE.** chosen.csv use: \"{self.use}\". No cut was applied: every count below covers "
                     "the whole file, not the piece alone.")
        for fn in (self.metre, self.keys, self.range, self.rhythm, self.chords, self.texture, self.ornaments, self.articulation,
                   self.dynamics, self.pedal, self.repeats, self.tempo, self.density, self.d02):
            fn()
        return "\n".join(self.out) + "\n"

    def metre(self):
        self.head("Metre and length")
        r = self.row("E09")
        if r:
            sigs = r["signatures"]
            ch = [s for s in sigs if s["change"]]
            if sigs:
                self.add("- time: " + "; ".join(f"{s['time']}{' written as ' + s['symbol'] if s.get('symbol') else ''}, class {s['class']}, from bar {s['bar']}" for s in sigs[:6])
                         + ("; no change of time signature" if not ch else f"; {len(ch)} change(s) of time signature"))
            else:
                self.add("- time: UNKNOWN (no time signature)")
            if r.get("senza_misura_bars"):
                self.add(f"- senza misura bars: {self.bars(r['senza_misura_bars'])}")
        e32, e10, e02 = self.row("E32"), self.row("E10"), self.row("E02")
        if e32:
            self.add(f"- length: {e32['bars']} printed bars ({e32['stored_measures']} stored), {e32['quarters_decimal']} quarter notes written, repeats not expanded"
                     + (f"; bars numbered X: {self.bars(e32['excluded_from_count'])}" if e32.get("excluded_from_count") else ""))
        if e10:
            self.add(f"- pickup (anacrusis): {'confirmed' if e10['confirmed'] else 'candidate only' if e10['candidate'] else 'none'}; first bar holds {e10['first_length']} of the {e10['nominal']} quarters of a full bar")
        if e02:
            n = (e02["interior_short"], e02["interior_over"], e02["bars_with_voice_gaps"])
            self.add("- bar-length faults: " + (f"{n[0]} short bars, {n[1]} over-full bars, {n[2]} bars with voice gaps" if any(n) else "none"))

    def keys(self):
        self.head("Keys, clefs, accidentals")
        r = self.row("E06")
        if r:
            st = ", ".join(f"staff {k}: {v['fifths']:+d} fifths" + (f" {v['mode']}" if v.get("mode") else " (mode not written)") for k, v in sorted(r["start"].items()))
            self.add(f"- key signature at the start: {st}")
            self.add("- key changes: " + ("; ".join(f"staff {c['staff']} bar {c['bar']}: {c['from']['fifths']:+d} -> {c['to']['fifths']:+d}" for c in r["changes"][:MAXB])
                                          + (f" ... ({len(r['changes'])})" if len(r["changes"]) > MAXB else "") if r["changes"] else "none"))
        r = self.row("E03")
        if r:
            self.add("- clef at the start: " + ", ".join(f"staff {k}: {v}" for k, v in sorted(r["start"].items())) + " (sign/line/octave shift)")
            ch = r["changes"]
            self.add("- clef changes: " + ("; ".join(f"staff {c['staff']} bar {c['bar']}: {c['from']} -> {c['to']}{' (inside bar)' if c['inside_bar'] else ''}" for c in ch[:MAXB])
                                           + (f" ... ({len(ch)})" if len(ch) > MAXB else "") if ch else "none"))
        r = self.row("E07")
        if r:
            self.add("- accidentals written: " + self.per_staff(r, lambda v: f"{v['n']} ({', '.join(f'{k} {c}' for k, c in v['by_kind'].items()) or 'none'}), {v['per_100_notes']} per 100 notes"
                                                                  + ("; most in bars " + ", ".join(f"{b}({c})" for b, c in v["top_bars"][:4]) if v["n"] else "")))
        r = self.row("E08")
        if r:
            self.add("- letters the key signature alters that never occur altered, per signature: "
                     + "; ".join(f"{int(k):+d} fifths: {'/'.join(v['never']) or 'none (all used)'}" for k, v in sorted(r.items(), key=lambda kv: int(kv[0])) if isinstance(v, dict)))
        r = self.row("E04")
        if r:
            sp = r["spans"]
            self.add("- ottava lines (8va etc.): " + ("; ".join(f"staff {s['staff']} {s['kind']} bars {s['first_bar']}-{s['last_bar']}" for s in sp[:MAXB]) if sp else "none"))

    def range(self):
        self.head("Range and ledger lines")
        r = self.row("E33")
        if r:
            self.add("- pitch range (sounding): " + self.per_staff(r, lambda v: f"{note(v['low'])}-{note(v['high'])} ({v['span']} semitones), widest bar {v.get('widest_bar')}"))
        r = self.row("E05")
        if r:
            def g(v):
                tot = sum(c for k, c in v["by_count"].items() if k != "0")
                return (f"max {v['max_above']} above / {v['max_below']} below; {tot} notes on ledger lines; bars with 1-2 lines {self.bars(v['bars_1_2'], 6)}; "
                        f"with 3+ lines {self.bars(v['bars_3_plus'], 6)}" + ("; POSSIBLE MISSING 8va" if v["possible_missing_8va"] else ""))
            self.add("- ledger lines: " + self.per_staff(r, g))
        r = self.row("E34")
        if r:
            self.add("- pitches used: " + "; ".join(f"{'all staves' if k == 'all' else 'staff ' + k}: {v['distinct_pitches']} distinct, {v['distinct_pitch_classes']} pitch classes, "
                                                    f"{round(v['black_share'] * 100)}% on black keys" for k, v in sorted(r.items()) if isinstance(v, dict)))
        r = self.row("E35")
        if r and isinstance(r.get("all"), dict):
            self.add(f"- pitch entropy: {r['all']['pitch_entropy']} bits over {r['all']['notes']} notes (a statistic, not a grade)")

    def rhythm(self):
        self.head("Rhythm values and tuplets")
        r = self.row("E11")
        if r:
            self.add("- note values written: " + self.per_staff(r, lambda v: ", ".join(f"{k} {c}" for k, c in sorted(v["notes_by_type"].items(), key=lambda kv: -kv[1]))
                                                                 + f"; shortest {v['shortest']}; {v['dotted']} dotted, {v['double_dotted']} double-dotted"))
            self.add("- rests written: " + self.per_staff(r, lambda v: (", ".join(f"{k} {c}" for k, c in v["rests_by_type"].items()) or "none") + f"; {v['whole_bar_rests']} whole-bar rests"))
            self.add("- ties: " + self.per_staff(r, lambda v: f"{v['tie_chains']} chains, {v['tie_crossings']} across barlines"))
        r = self.row("E12")
        if r:
            self.add("- dotted figures in simple time: " + self.per_staff(r, lambda v: f"dotted quarter-eighth {v['dotted_quarter_eighth']}, dotted eighth-sixteenth {v['dotted_eighth_sixteenth']}"
                                                                          + (f"; bars {self.bars(v['bars'], 8)}" if v["bars"] else "")))
        r = self.row("E13")
        if r:
            def f(v):
                n = sum(v["notes_by_ratio"].values())
                return ((f"{n} tuplet notes ({', '.join(f'{k} x{c}' for k, c in v['notes_by_ratio'].items())}), {v['runs']} runs; bars {self.bars(v['bars'], 8)}" if n else "none")
                        + (f"; suspect ratios not counted: {v['suspect']}" if v.get("suspect") else ""))
            self.add("- tuplets: " + self.per_staff(r, f))
        r = self.row("E40")
        if r:
            self.add("- longest runs: " + self.per_staff(r, lambda v: f"longest repeat of one pitch/chord {v['repeated_pitch_run']} attacks (from bar {v['repeated_from_bar']}); "
                                                                  f"longest run of equal note value {v['equal_value_run']} notes ({v['equal_value']}, from bar {v['equal_value_from_bar']})"))

    def chords(self):
        self.head("Chords, spans, intervals")
        r = self.row("E36")
        if r:
            def f(v):
                dist = ", ".join(f"{k}-note x{c}" for k, c in sorted(v["per_staff"].items(), key=lambda kv: int(kv[0])))
                return f"largest {v['largest']} notes together; attacks: {dist}"
            self.add("- notes struck together: " + self.per_staff(r, f))
            self.add("- bars with 4+ notes together: " + self.per_staff(r, lambda v: self.bars(v["bars_4_plus"], 8) + (f" (possible encoding fault: {v['possible_encoding_fault']})" if v["possible_encoding_fault"] else "")))
            self.add("- most common two-note intervals: " + self.per_staff(r, lambda v: ", ".join(f"{k} x{c}" for k, c in sorted(v["two_note_intervals"].items(), key=lambda kv: -kv[1])[:6]) or "none"))
        r = self.row("E37")
        if r:
            self.add("- widest span of notes struck together: " + self.per_staff(r, lambda v: f"max {v['span_max']} semitones, median {v['span_median']}; over 12 semitones in bars {self.bars(v['bars_over_12'], 6)}"))
        r = self.row("E38")
        if r:
            self.add("- octaves: " + self.per_staff(r, lambda v: f"{v['octave_dyads']} octave pairs (longest run {v['octave_dyad_longest_run']}), {v['octave_span_chords']} octave-span chords, "
                                                                 f"{v['octave_doubling_inside_chord']} octave doublings inside chords" + (f"; bars {self.bars(v['bars'], 6)}" if v["bars"] else "")))
        r = self.row("E29")
        if r:
            if r["n"]:
                syms = r["symbols"][:6]
                self.add(f"- chord symbols: {r['n']} printed ({r['distinct']} distinct); first: " + ", ".join(f"{s.get('text') or s.get('symbol') or s} (bar {s.get('bar', '?')})" if isinstance(s, dict) else str(s) for s in syms))
            else:
                self.add("- chord symbols: none printed")

    def texture(self):
        self.head("Texture (voices, staves together or taking turns)")
        r = self.row("E41")
        if r:
            self.add("- written voices: " + self.per_staff(r, lambda v: f"max {v['max_note_voices']} note-holding voices (declared {v['max_declared_voices']}), {v['bars_2plus_note_voices']} bars with 2+"
                                                                  + (f": bars {self.bars(v['bars'], 8)}" if v["bars"] else "")))
        r = self.row("E42")
        if r:
            self.add("- attacks per quarter note: " + self.per_staff(r["per_staff"], lambda v: f"{v['attacks']} attacks, {v['per_quarter']} per quarter, {v['per_beat']} per beat")
                     + f"; staff 1 : staff 2 = {r['ratio_staff1_to_staff2']}; beat-onset share {r['beat_onset_share']}")
        r = self.row("E43")
        if r:
            self.add("- attacks shared by both staves: UNKNOWN (" + r["UNKNOWN"] + ")" if "UNKNOWN" in r else
                     f"- attacks shared by both staves: {round(r['shared_attack_share'] * 100)}% of attack times; both staves sound at once in {r['bars_both_sound_together']} of {r['bars_both_have_sound']} bars where both have sound")
        r = self.row("E44")
        if r:
            self.add("- staves taking turns: UNKNOWN (" + r["UNKNOWN"] + ")" if "UNKNOWN" in r else
                     f"- staves taking turns (both sound in the bar, never together): {r['turn_taking_bars']} bars ({self.bars(r['bars'], 8)}); hand-offs between bars: {r['handoffs_between_bars']} ({self.bars(r['handoff_bars'], 8)})")
        r = self.row("E45")
        if r:
            self.add("- one staff holds (>= 1 quarter) while the other plays 2+ attacks: UNKNOWN (" + r["UNKNOWN"] + ")" if "UNKNOWN" in r else
                     "- one staff holds (>= 1 quarter) while the other plays 2+ attacks: "
                     + ("; ".join(f"staff {k} holds {v['holds']}x, {float(Fraction(v['held_quarters'])):g} quarters in all, bars {self.bars(v['bars'], 8)}" for k, v in sorted(r["staff_holding"].items())) or "none"))
        r = self.row("E39")
        if r:
            def mel(v):
                g = v["voice_generic"]
                big = sum(c for k, c in g.items() if k.endswith("+") or (k.isdigit() and int(k) >= 6))
                return ("repeats %d, 2nds %d, 3rds %d, 4ths-5ths %d, 6ths or more %d; up %d, down %d; largest leap %d semitones; %d jumps of the outer note over 12 semitones within 2 quarters (bars %s)"
                        % (g.get("1", 0), g.get("2", 0), g.get("3", 0), g.get("4", 0) + g.get("5", 0), big, v["voice_directions"].get("up", 0), v["voice_directions"].get("down", 0),
                           v["voice_largest"], v["jumps_over_12_within_2q"], self.bars(v["jump_bars"], 5)))
            self.add("- melodic movement within each written voice: " + self.per_staff(r, mel))
        self.add("- Alberti bass, ostinato, waltz bass, which staff has the melody: no row decides these (read score.pdf)")

    def ornaments(self):
        self.head("Ornaments, grace notes, special marks")
        r = self.row("E14")
        if r:
            self.add("- grace notes: " + self.per_staff(r, lambda v: (f"{v['n']} ({v['slashed']} slashed, {v['unslashed']} unslashed), {v['runs']} runs, longest {v['longest_run']}; bars {self.bars(v['bars'], 8)}") if v["n"] else "none"))
        r = self.row("E15")
        if r:
            self.add("- ornament signs (trill, mordent, turn): " + self.per_staff(r["per_staff"], lambda v: (", ".join(f"{k} x{c}" for k, c in v["by_kind"].items()) + f"; bars {self.bars(v['bars'], 8)}") if v["by_kind"] else "none")
                     + f"; 'tr' words {r['trill_words']}")
        r = self.row("E16")
        if r:
            self.add("- rolled (arpeggiated) chords: " + self.per_staff(r, lambda v: (f"{v['arpeggiated_chords']}; bars {self.bars(v['bars'], 8)}") if v["arpeggiated_chords"] else "none"))
        r = self.row("E17")
        if r:
            self.add("- tremolo: " + self.per_staff(r, lambda v: (f"{v['single']} single-note, {v['two_note']} two-note; bars {self.bars(v['bars'], 8)}") if v["single"] or v["two_note"] else "none"))
        r = self.row("E18")
        if r:
            self.add(f"- glissando/slide: {r['glissando']} glissando, {r['slide']} slide" + (f" (bars {self.bars([s.get('bar', '?') for s in r['spans']], 6)})" if r["spans"] else ""))
        r = self.row("E19")
        if r:
            self.add(f"- fermatas: {r['marks']} marks at {r['time_positions']} places" + (f"; on barlines: {', '.join(b['bar'] + ' ' + b['location'] for b in r['barline_fermatas'][:6])}" if r["barline_fermatas"] else ""))

    def articulation(self):
        self.head("Articulation, slurs, fingering")
        r = self.row("E22")
        if r:
            self.add("- articulation marks: " + self.per_staff(r, lambda v: (f"{v['marked_attacks']} of {v['attacks']} attacks marked ({', '.join(f'{k} {c}' for k, c in v['by_kind'].items())}); bars {self.bars(v['bars'], 8)}") if v["marked_attacks"] else "none"))
        r = self.row("E23")
        if r:
            self.add("- slurs: " + self.per_staff(r, lambda v: (f"{v['slurs']} slurs, {round(v['share_under'] * 100)}% of attacks under a slur, average {v['avg_notes_per_slur']} notes; bars {self.bars(v['bars'], 8)}") if v["slurs"] else "none"))
        r = self.row("E27")
        if r:
            self.add("- printed fingering: " + self.per_staff(r, lambda v: f"{v['fingered_attacks']} of {v['attacks']} attacks ({round(v['share_fingered'] * 100)}%)" + (f"; {v['substitutions']} substitutions" if v["substitutions"] else "")))

    def dynamics(self):
        self.head("Dynamics")
        r = self.row("E20")
        if r:
            first = ", ".join("%s bar %s staff %s" % (m["value"], m["bar"], m["staff"]) for m in r["marks"][:6])
            self.add("- levels written: " + (", ".join(r["levels_used"]) or "none") + "; %d marks" % r["n"] + ("; first: " + first if r["marks"] else "")
                     + (f"; softest {r['softest']}, loudest {r['loudest']}" if r["marks"] else ""))
            if r.get("accent_dynamics"):
                self.add(f"- accent dynamics (sf, sfz, fz, fp ...): {r['accent_dynamics']}")
            self.add(f"- moments where the two staves carry different levels: {r.get('conflicting_marks_same_moment', 'UNKNOWN')}")
        r = self.row("E21")
        if r:
            hl = ", ".join("%s staff %s bars %s-%s" % (h["kind"][:5], h["staff"], h["first_bar"], h["last_bar"]) for h in r["hairpins"][:6])
            words = [w.get("text", w) if isinstance(w, dict) else w for w in r["words"]]
            self.add("- hairpins: %d" % len(r["hairpins"]) + (" (" + hl + ")" if r["hairpins"] else "") + "; cresc./dim. words: " + (self.bars(words, 5) if words else "none"))

    def pedal(self):
        self.head("Pedal")
        r = self.row("E24")
        if not r:
            return
        if not r["has_pedal_marks"] and not r["words"]:
            self.add("- no pedal marks or pedal words written")
            return
        for k in sorted(r["staves"]):
            v = r["staves"][k]
            if v["spans"] or v["unclosed"]:
                sp = [s["first_bar"] + ("-" + s["last_bar"] if s["last_bar"] != s["first_bar"] else "") for s in v["spans"]]
                self.add(f"- staff {k}: {len(sp)} pedal spans (bars {self.bars(sp, 8)}); starts with no stop {len(v['unclosed'])}")
        w = r["words"]
        self.add("- pedal words: " + (", ".join(f"'{x['text']}' ({x['kind']}) bar {x['bar']}" for x in w[:6]) if w else "none"))
        self.add(f"- share of bars under sustain pedal: {round(r['share_bars_under_pedal']['sustain'] * 100)}%")

    def repeats(self):
        self.head("Repeats and jumps")
        r = self.row("E31")
        if not r:
            return
        self.add("- repeat signs: " + (", ".join(f"{x['direction']} at bar {x['bar']}" for x in r["repeats"][:8]) if r["repeats"] else "none"))
        self.add("- first and second endings: " + (", ".join(f"{x['text']} bars {x['first_bar']}-{x['last_bar']}" for x in r["endings"]) if r["endings"] else "none"))
        self.add("- jump marks (D.C., D.S., Fine, Coda): " + (", ".join(f"{x['kind']} bar {x['bar']}" for x in r["marks"][:8]) if r["marks"] else "none"))

    def tempo(self):
        self.head("Tempo")
        r = self.row("E25")
        if r:
            parts = []
            for s in r["spans"][:6]:
                if s["qpm"] == "UNKNOWN":
                    parts.append(f"bar {s['bar'] or s['bar_index'] + 1}: UNKNOWN ({s['why']})")
                else:
                    src = {"metronome": "printed metronome mark" if s["printed"] is not False else "metronome mark set not to print", "sound tempo": "playback value only, no printed metronome mark"}.get(s["source"], s["source"])
                    parts.append(f"bar {s['bar']}: quarter = {s['qpm']} ({src}" + (f"; the file's playback tempo {s['sound_qpm']} DISAGREES" if s["disagree"] else "") + ")")
            self.add("- tempo: " + "; ".join(parts) + (" ..." if len(r["spans"]) > 6 else ""))
            self.add("- tempo words: " + (", ".join(f"'{t['text']}' bar {t['bar']}" for t in r["tempo_words"][:6]) if r["tempo_words"] else "none"))
        r = self.row("E26")
        if r:
            self.add("- tempo-change words: " + (", ".join(f"'{c['text']}' bar {c['bar']}" for c in r["changes"][:8]) if r["changes"] else "none") + f"; swing marked: {'yes' if r['swing_elements'] else 'no'}")
            if r["other_words"]:
                self.add("- other words (character; not classified): " + ", ".join(f"{k} (bar {v['first_bar']})" for k, v in list(r["other_words"].items())[:8]))

    def density(self):
        self.head("Density")
        r = self.row("E46")
        if r:
            self.add("- notes per quarter: " + self.per_staff(r, lambda v: f"median {v['median_notes_per_quarter']}; densest bars " + ", ".join(
                f"{b['bar']} ({b['notes']} notes, {b['notes_per_quarter']}/q)" for b in v["densest_bars"][:3])))
        r = self.row("D01")
        if r:
            if "UNKNOWN" in r:
                self.add(f"- attacks per second at the marked tempo: UNKNOWN ({r['UNKNOWN']})")
            else:
                self.add("- attacks per second at the marked tempo: " + "; ".join(f"{'all staves' if k == 'all' else 'staff ' + k}: {v['attacks_per_second']}/s, densest 4 bars from bar {v['densest_4_bars_from']} at {v['densest_4_bars_attacks_per_second']}/s"
                                                                                  for k, v in sorted(r.items()) if isinstance(v, dict)) + f"; tempo known for {round(r['known_tempo_share'] * 100)}% of the piece")

    def d02(self):
        self.head("D02 difficulty prediction (a statistic from 10 features, not a verdict)")
        r = self.d02row or self.row("D02")
        if r:
            self.add(f"- published level {r['published_level']}; model prediction {r['prediction']} ({r['prediction_kind']}); alarm: {r['alarm'] or 'none'}"
                     + (f" - drivers: {r['alarm_drivers']}" if r.get("alarm_drivers") else "") + ("; computed on the whole file" if self.trimmed else ""))
        else:
            self.add("- D02: UNKNOWN")


def load(path):
    if os.path.isdir(path):
        path = os.path.join(path, "results.json")
    folder = os.path.dirname(os.path.abspath(path))
    d = json.load(open(path, encoding="utf-8"))
    info = {}
    try:
        for line in open(os.path.join(folder, "info.txt"), encoding="utf-8"):
            if ":" in line:
                k, v = line.split(":", 1)
                info.setdefault(k.strip(), v.strip())
    except OSError:
        pass
    use = ""
    try:
        for r in csv.DictReader(open(os.path.join(ROOT, "docs", "pieces", "chosen.csv"), encoding="utf-8")):
            if r["title"] == info.get("title") and r["level"] == info.get("published level") and r["candidate_file"] == info.get("source file"):
                use = r["use"]
    except OSError:
        pass
    return d, info, use, folder


def main():
    args = sys.argv[1:]
    opts = {}
    for key in ("--results", "--trimmed"):
        if key in args:
            i = args.index(key)
            opts[key] = args[i + 1]
            del args[i:i + 2]
    if not args:
        sys.exit(__doc__)
    d, info, use, folder = load(args[0])
    whole = (d.get("E02") or {}).get("bars")
    d02 = d.get("D02")
    if "--results" in opts:
        d = json.load(open(opts["--results"], encoding="utf-8"))
    text = Sheet(d, info.get("title", ""), info.get("composer", ""), info.get("published level", ""), use,
                 opts.get("--trimmed", ""), whole, d02 if "--results" in opts else None).build()
    if len(args) > 1:
        with open(args[1], "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
