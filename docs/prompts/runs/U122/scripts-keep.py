# U122: copy the pictures and cells the design cites into the run folder, then check the run folder for
# machine paths and sizes (no kept file over 300 KB; machine paths as <worktree>/<home>).
import pathlib, shutil, re

WT = pathlib.Path(__file__).resolve().parents[2]
P = WT / 'build/u122/probe-out'
R = WT / 'docs/prompts/runs/U122'
(R / 'pictures').mkdir(parents=True, exist_ok=True)
(R / 'cells').mkdir(parents=True, exist_ok=True)
CELLS = [
    'paused-paused-780x360-t100-stack-hcb',
    'paused-paused-568x320-t115-wider-hcb',
    'refusal-refusal-568x320-t115-stack-hcb',
    'refusal-refusal-740x342-t100-wider-hcb',
    'refusal-refusal-667x375-t115-wider-moon',
    'upright-upright-342x740-t100-stack-hcb',
    'small-paused-780x360-t90-stack-hcb',
]
for c in CELLS:
    shutil.copy(P / f'f-{c}.png', R / 'pictures' / f'{c}-today.png')
    shutil.copy(P / f'f-{c}-model.png', R / 'pictures' / f'{c}-model.png')
    shutil.copy(P / f'f-{c}.json', R / 'cells' / f'{c}.json')
home = str(pathlib.Path.home())
pats = [str(WT), str(WT).replace('\\', '/'), str(WT).replace('\\', '\\\\'), home, home.replace('\\', '/'), home.replace('\\', '\\\\')]
for f in sorted(R.rglob('*')):
    if not f.is_file():
        continue
    size = f.stat().st_size
    if size > 300_000:
        print('OVER 300 KB:', f.relative_to(R), size)
    if f.suffix in ('.png',):
        continue
    text = f.read_text(encoding='utf-8', errors='replace')
    new = text
    for p, rep in zip(pats, ['<worktree>', '<worktree>', '<worktree>', '<home>', '<home>', '<home>']):
        new = new.replace(p, rep)
    if new != text:
        f.write_text(new, encoding='utf-8')
        print('paths replaced:', f.relative_to(R))
total = sum(f.stat().st_size for f in R.rglob('*') if f.is_file())
print(f'{sum(1 for f in R.rglob("*") if f.is_file())} files, {total / 1024:.0f} KB')
