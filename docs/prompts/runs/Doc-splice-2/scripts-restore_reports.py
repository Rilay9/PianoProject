"""Doc-splice-2: put back the three reports the offline content build rewrites, from the copies taken
before the build (the scratchpad folder given as the one argument), byte for byte. Run from the
worktree root:  python docs/prompts/runs/Doc-splice-2/scripts-restore_reports.py <copies-folder>
"""
import pathlib
import shutil
import sys

copies = pathlib.Path(sys.argv[1])
targets = {
    'SOURCES.md': pathlib.Path('content/scores/imported/SOURCES.md'),
    'inventory.md': pathlib.Path('docs/prompts/inventory.md'),
    'rung-claims.md': pathlib.Path('docs/prompts/rung-claims.md'),
}
for name, target in targets.items():
    before = (copies / name).read_bytes()
    changed = target.read_bytes() != before
    if changed:
        shutil.copyfile(copies / name, target)
    print(f'{target}: {"restored" if changed else "unchanged"}; now equal to the copy: {target.read_bytes() == before}')
