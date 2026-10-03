# Writes U118b's reserve input back to its 53147902 form in ScoreScreen.ts
# (the away sentence priced at a day's seconds, two candidates, not twenty).
# Run from app/; the caller restores the file from build/u125/ScoreScreen.head.ts.
p = 'src/ui/screens/ScoreScreen.ts'
s = open(p, encoding='utf8', newline='').read()
old_const = "const AWAY_PRICED_COUNTS: readonly string[] = Array.from({ length: 10 }, (_, digit) => String(digit).repeat(14));"
old_texts = (
    "      ...AWAY_PRICED_COUNTS.map((count) => STATE_TEXT.away(count, false)),\n"
    "      ...AWAY_PRICED_COUNTS.map((count) => STATE_TEXT.away(count, true)),"
)
nl = '\r\n' if '\r\n' in s else '\n'
old_texts = old_texts.replace('\n', nl)
assert s.count(old_const) == 1, 'const not found'
assert s.count(old_texts) == 1, 'texts not found'
s = s.replace(old_const, "const AWAY_PRICED_S = 86_400; // U125 variant: U118b reverted")
s = s.replace(old_texts, (
    "      STATE_TEXT.away(AWAY_PRICED_S, false),\n"
    "      STATE_TEXT.away(AWAY_PRICED_S, true),"
).replace('\n', nl))
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
