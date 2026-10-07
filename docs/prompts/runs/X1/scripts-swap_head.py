"""Swap X1's changed sources for HEAD's bytes (and take its new sources away), and put them back.

For the red lines: X1's new and revised tests run against the committed code. `swap` backs up every file
below with its sha256 into a folder in the scratch area, writes HEAD's version of each changed file
(`git show HEAD:<path>`, CRLF as the working tree keeps it), and moves each new source file into the
backup; `restore` writes every file back and checks each sha256. Run from the worktree root.

    python docs/prompts/runs/X1/scripts-swap_head.py swap <backup-dir>
    python docs/prompts/runs/X1/scripts-swap_head.py restore <backup-dir>
"""
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys

CHANGED = [
    'app/src/router.ts',
    'app/src/curriculum/session.ts',
    'app/src/curriculum/eligibility.ts',
    'app/src/ui/help.ts',
    'app/src/ui/screens/TodayScreen.ts',
    'app/src/ui/screens/ScoreScreen.ts',
    'app/src/ui/screens/DrillScreen.ts',
    'app/src/ui/screens/LessonScreen.ts',
    'app/src/style.css',
    'docs/04-ui-spec.md',
]
NEW = ['app/src/data/sessionRun.ts', 'app/src/ui/sessionRunner.ts']


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def swap(backup: pathlib.Path) -> None:
    if (backup / 'manifest.json').exists():
        raise SystemExit(f'{backup} already holds a swap; restore it first')
    backup.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for rel in CHANGED + NEW:
        src = pathlib.Path(rel)
        manifest[rel] = sha(src)
        dst = backup / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
    (backup / 'manifest.json').write_text(json.dumps(manifest, indent=1), encoding='utf-8')
    for rel in CHANGED:
        head = subprocess.run(['git', 'show', f'HEAD:{rel}'], check=True, capture_output=True).stdout
        pathlib.Path(rel).write_bytes(head.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n'))
        print(f'HEAD  {rel}')
    for rel in NEW:
        pathlib.Path(rel).unlink()
        print(f'gone  {rel}')


def restore(backup: pathlib.Path) -> None:
    manifest = json.loads((backup / 'manifest.json').read_text(encoding='utf-8'))
    bad = []
    for rel, digest in manifest.items():
        shutil.copy2(backup / rel, rel)
        ok = sha(pathlib.Path(rel)) == digest
        print(f'{"back " if ok else "DIFF "} {rel} {digest[:12]}')
        if not ok:
            bad.append(rel)
    if bad:
        raise SystemExit(f'restored with a different sha256: {bad}')
    (backup / 'manifest.json').unlink()
    print('restored, every sha256 equal')


if __name__ == '__main__':
    mode, where = sys.argv[1], pathlib.Path(sys.argv[2])
    swap(where) if mode == 'swap' else restore(where)
