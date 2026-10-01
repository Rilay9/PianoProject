# One-off: unwrap the two lone blocks left in the U119a matrix loop and dedent its body by four spaces.
import pathlib

p = pathlib.Path(__file__).resolve().parents[2] / 'app' / 'tests' / 'e2e' / 'score.screen.spec.ts'
raw = p.read_bytes()
crlf = b'\r\n' in raw
text = raw.decode('utf-8').replace('\r\n', '\n')
head = '  for (const { width, height, face, text, long } of SIDEWAYS_PAUSED) {\n    {\n      {\n'
start = text.index(head)
tail = "          await expect(page, 'Back did not leave the screen').not.toHaveURL(/#\\/score\\//);\n        });\n      }\n    }\n  }\n"
end = text.index(tail, start) + len(tail)
block = text[start:end]
lines = block.split('\n')
# drop the two lone-block openers and two of the closers
body = lines[3:-5]  # between the openers and the "        });\n      }\n    }\n  }" closers
out = ['  for (const { width, height, face, text, long } of SIDEWAYS_PAUSED) {']
for line in body:
    out.append(line[4:] if line.startswith('    ') else line)
out += ['    });', '  }', '']
new = text[:start] + '\n'.join(out) + text[end:]
if crlf:
    new = new.replace('\n', '\r\n')
p.write_bytes(new.encode('utf-8'))
print('ok', len(block.split('\n')), '->', len(out))
