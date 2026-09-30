"""Whether the two claims that fail in this checkout fail on line endings: their needles with LF, and with CRLF."""
score = open('app/src/ui/screens/ScoreScreen.ts', 'rb').read().decode('utf-8')
css = open('app/src/style.css', 'rb').read().decode('utf-8')
for name, text, needle in [
    ('blues.3 ScoreScreen.ts', score, "menuRow(\n    'Rhythm only'"),
    ('4.7 style.css', css, '.score-stage--blind {\n  visibility: hidden;\n}'),
]:
    print(f"{name}: LF needle found {needle in text}; CRLF needle found {needle.replace(chr(10), chr(13) + chr(10)) in text}")
