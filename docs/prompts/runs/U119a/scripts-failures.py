# U119a: each failing test of a Playwright list log, with every error message it printed (soft ones too).
# python failures.py <log>
import re, sys

text = open(sys.argv[1], encoding='utf-8', errors='replace').read()
blocks = re.split(r'\n  (\d+)\) ', text)
out = []
for i in range(1, len(blocks), 2):
    body = blocks[i + 1]
    title = body.split('\n', 1)[0].strip()
    title = re.sub(r'^tests\\e2e\\score\.screen\.spec\.ts:\d+:\d+ › ▶ after the sound was suspended \(U69\) › ', '', title)
    title = re.sub(r', the bar’s left end covers no control, Back and the bar number are whole, and a real tap reaches every control', '', title)
    msgs = []
    for m in re.finditer(r'\n    (Error|TimeoutError): ([^\n]+)', body):
        msg = m.group(2).strip()
        msg = re.sub(r'C:\\Users\\[^ ]+', '<worktree>', msg)
        msgs.append(msg)
    out.append(f'{blocks[i]}) {title}')
    for msg in msgs:
        out.append(f'     - {msg}')
summary = re.findall(r'\n  (\d+ (?:failed|passed|flaky|skipped))', text)
out.append('summary: ' + ', '.join(summary))
print('\n'.join(out))
