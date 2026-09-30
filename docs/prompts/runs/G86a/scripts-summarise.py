"""G86a: summaries of logs too large for the run folder, and copies of the small ones."""
import io
import re
import shutil
import sys

B = 'build/g86a/'
R = 'docs/prompts/runs/G86a/'


def read(path):
    return io.open(path, encoding='utf-8', errors='replace').read()


def write(path, text):
    io.open(path, 'w', encoding='utf-8', newline='\n').write(text)


def unit_all():
    log = read(B + 'unit-all.txt')
    lines = log.splitlines()
    out = ['# npx vitest run (the whole unit suite), fixed screen: summary. The full log was not kept (about 890 KB).', '']
    out += [l for l in lines if re.search(r'Test Files|^\s+Tests\s|Duration', l)]
    out += [l for l in lines if l.startswith('exit ')]
    out += ['', '## Failed in the suite']
    out += sorted(set(l for l in lines if l.startswith(' FAIL ')))
    out += ['', '## Their messages (count, message)']
    msgs = {}
    for l in lines:
        if re.match(r'^(AssertionError|Error): ', l):
            msgs[l] = msgs.get(l, 0) + 1
    out += [f'{n} x {m}' for m, n in sorted(msgs.items())]
    write(R + 'unit-all-summary.txt', '\n'.join(out) + '\n')


def e2e():
    log = read(B + 'e2e-targeted.txt')
    lines = log.splitlines()
    out = ['# The map\'s 47 e2e specs, fixed screen, two workers, port 4583: summary. Result lines and failures only; the full log was not kept.', '']
    out += [l for l in lines if l.startswith('checked ')]
    keep = re.compile(r'^\s+(x|✘)\s|^\s+\d+\) |^\s+\d+ (passed|failed|flaky|skipped|did not run)|^exit |Error: |snapshot doesn')
    out += [l for l in lines if keep.search(l)]
    write(R + 'e2e-targeted-summary.txt', '\n'.join(out) + '\n')


def copy_small(names):
    for name in names:
        shutil.copyfile(B + name, R + name)


if __name__ == '__main__':
    what = sys.argv[1]
    if what == 'unit':
        unit_all()
    elif what == 'e2e':
        e2e()
    elif what == 'copy':
        copy_small(sys.argv[2:])
