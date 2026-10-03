# U119a: copy the run's kept files into docs/prompts/runs/U119a/, machine paths replaced, sizes checked.
import pathlib, re, shutil

here = pathlib.Path(__file__).resolve().parent
root = here.parents[1]
run = root / 'docs/prompts/runs/U119a'
pics = root / 'docs/prompts/pictures/u119a'
run.mkdir(parents=True, exist_ok=True)
pics.mkdir(parents=True, exist_ok=True)
wt = str(root)
subs = [
    (wt, '<worktree>'),
    (wt.replace('\\', '/'), '<worktree>'),
    ('/c/' + wt[3:].replace('\\', '/'), '<worktree>'),
    (str(pathlib.Path.home()), '<home>'),
    (str(pathlib.Path.home()).replace('\\', '/'), '<home>'),
]


def clean(text: str) -> str:
    for a, b in subs:
        text = text.replace(a, b)
    text = re.sub(r'C:\\Users\\[A-Za-z0-9_.-]+', '<home>', text)
    text = re.sub(r'/c/Users/[A-Za-z0-9_.-]+', '<home>', text)
    return text


logs = [
    'npm-ci.txt', 'build-app-base.txt', 'build-app-fix1.txt', 'build-app-fix2.txt', 'build-app-final.txt',
    'tsc.txt', 'lint.txt', 'unit-targeted.txt',
    'probe-smoke-run.txt', 'probe-base-paused-run.txt', 'probe-fix1-paused-run.txt', 'probe-fix2-paused-run.txt',
    'probe-base-refusal-run.txt', 'probe-base-refusal-rerun.txt', 'probe-fix1-refusal-run.txt',
    'probe-base2-refusal-run.txt', 'probe-fix2-refusal-run.txt',
    'probe-base-paused-table.txt', 'probe-fix1-paused-table.txt', 'probe-fix2-paused-table.txt',
    'probe-base-refused-play-table.txt', 'probe-base-refused-hear-table.txt',
    'probe-fix1-refused-play-table.txt', 'probe-fix1-refused-hear-table.txt',
    'probe-base2-refused-play-table.txt', 'probe-base2-refused-hear-table.txt',
    'probe-base2-refused-after-tempo-table.txt', 'probe-base2-refused-after-resize-table.txt',
    'probe-fix2-refused-play-table.txt', 'probe-fix2-refused-hear-table.txt',
    'probe-fix2-refused-after-tempo-table.txt', 'probe-fix2-refused-after-resize-table.txt',
    'compare-base-fix1-paused.txt', 'compare-fix1-fix2-paused.txt', 'compare-base-fix2-paused.txt',
    'compare-base-fix2-paused-atrest.txt', 'compare-base-fix1-refused-play.txt', 'compare-base-fix1-refused-hear.txt',
    'browser-red-base.txt', 'browser-red-base-failures.txt',
    'score-screen-whole-fix2.txt', 'score-screen-whole-final.txt', 'score-one-row.txt', 'browser-green-repeat.txt',
    'refusal-568-final-run.txt', 'refusal-568-base-run.txt',
    'assets-base.txt', 'assets-fix2.txt', 'assets-final.txt', 'source-hashes-fix.txt',
]
for m in ('m1', 'm2', 'm3', 'm4', 'm5', 'm6'):
    logs += [f'{m}-apply.txt', f'build-{m}.txt', f'{m}-run.txt', f'{m}-failures.txt']
scripts = {
    'scripts-probe.spec.ts': root / 'app/build/u119a/probe/probe.spec.ts',
    'scripts-refusal-568.spec.ts': root / 'app/build/u119a/narrow/refusal-568.spec.ts',
    'scripts-playwright.u119a-5333.config.ts': root / 'app/build/u119a/playwright.u119a-5333.config.ts',
    'scripts-table.py': here / 'table.py',
    'scripts-compare.py': here / 'compare.py',
    'scripts-failures.py': here / 'failures.py',
    'scripts-mutant.py': here / 'mutant.py',
    'scripts-run-mutant.sh': here / 'run-mutant.sh',
    'scripts-dedent.py': here / 'dedent.py',
    'scripts-keep.py': here / 'keep.py',
}
jsons = [
    'base-paused-568x320-t115-wider-hcb', 'fix2-paused-568x320-t115-wider-hcb',
    'base-paused-640x360-t115-wider-moon', 'fix2-paused-640x360-t115-wider-moon',
    'base-paused-667x375-t100-wider-hcb', 'fix2-paused-667x375-t100-wider-hcb',
    'base-paused-740x342-t100-wider-hcb', 'fix2-paused-740x342-t100-wider-hcb',
    'base2-refusal-568x320-t115-wider-hcb', 'fix2-refusal-568x320-t115-wider-hcb',
]
pictures = {
    'paused-568x320-wider-face-115-before.png': 'base-paused-568x320-t115-wider-hcb.png',
    'paused-568x320-wider-face-115-after.png': 'fix2-paused-568x320-t115-wider-hcb.png',
    'paused-667x375-wider-face-before.png': 'base-paused-667x375-t100-wider-hcb.png',
    'paused-667x375-wider-face-after.png': 'fix2-paused-667x375-t100-wider-hcb.png',
    'paused-640x360-wider-face-115-moonlight-before.png': 'base-paused-640x360-t115-wider-moon.png',
    'paused-640x360-wider-face-115-moonlight-after.png': 'fix2-paused-640x360-t115-wider-moon.png',
    'paused-568x320-115-after-narrowest-status.png': 'fix2-paused-568x320-t115-stack-hcb.png',
    'paused-640x360-wider-face-115-before.png': 'base-paused-640x360-t115-wider-hcb.png',
    'paused-640x360-wider-face-115-after.png': 'fix2-paused-640x360-t115-wider-hcb.png',
}
kept = []
for name in logs:
    src = here / name
    if not src.exists():
        print('missing', name)
        continue
    (run / name).write_text(clean(src.read_text(encoding='utf-8', errors='replace')), encoding='utf-8')
    kept.append(name)
for name, src in scripts.items():
    (run / name).write_text(clean(src.read_text(encoding='utf-8')), encoding='utf-8')
    kept.append(name)
for stem in jsons:
    src = here / 'probe-out' / f'{stem}.json'
    (run / f'probe-json-{stem}.json').write_text(clean(src.read_text(encoding='utf-8')), encoding='utf-8')
    kept.append(f'probe-json-{stem}.json')
for name, src in pictures.items():
    shutil.copyfile(here / 'probe-out' / src, pics / name)
big = [p.name for p in run.iterdir() if p.stat().st_size > 300_000]
names = (pathlib.Path.home().name, root.name)
leak = [p.name for p in run.iterdir() if p.suffix in ('.txt', '.ts', '.py', '.sh', '.json', '.md') and any(n in p.read_text(encoding='utf-8', errors='replace') for n in names)]
print(f'kept {len(kept)} files, {len(pictures)} pictures; over 300 KB: {big}; machine names left: {leak}')
