"""Copy CL04's run files into docs/prompts/runs/CL04/, machine paths replaced, the suite logs trimmed.

Run from the worktree root. Idempotent: every file is rewritten from build/cl04 each time.
"""
import re
import shutil
from pathlib import Path

SRC = Path('build/cl04')
DST = Path('docs/prompts/runs/CL04')
WORKTREE = str(Path.cwd())
HOME = str(Path.home())


def clean(text: str) -> str:
    variants = []
    for base, token in ((WORKTREE, '<worktree>'), (HOME, '<home>')):
        forms = {base, base.replace('\\', '/'), base.replace('\\', '\\\\')}
        drive = re.match(r'^([A-Za-z]):', base)
        if drive:
            rest = base[2:].replace('\\', '/')
            forms.add(f'/{drive.group(1).lower()}{rest}')
            forms.add(f'/{drive.group(1).upper()}{rest}')
        for form in sorted(forms, key=len, reverse=True):
            variants.append((form, token))
    for form, token in variants:
        text = re.sub(re.escape(form), token, text, flags=re.IGNORECASE)
    return text


def keep(name: str, out: str | None = None, text: str | None = None) -> None:
    body = text if text is not None else (SRC / name).read_text(encoding='utf-8', errors='replace')
    target = DST / (out or name)
    target.write_text(clean(body), encoding='utf-8', newline='\n')
    size = target.stat().st_size
    assert size < 300_000, f'{target} is {size} bytes'


def suite_summary(name: str) -> str:
    lines = (SRC / name).read_text(encoding='utf-8', errors='replace').splitlines()
    out = [f'# {name}: the whole unit suite, trimmed to its failures and its totals (the full log was not kept: over 300 KB)', '']
    start = next((i for i, line in enumerate(lines) if 'Failed Tests' in line), None)
    if start is not None:
        out += lines[start:]
    else:
        out += [line for line in lines if line.startswith(' FAIL ') or 'Test Files' in line or 'Tests ' in line or line.startswith('exit ')]
    return '\n'.join(out) + '\n'


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    for name in [
        'red-unit-committed.txt',
        'red-readerAdversarial-case6-committed-evidence.txt',
        'green-unit-targeted.txt',
        'rerun-4.txt',
        'mutants.txt',
        'mutant-G70.txt',
        'mutant-L70.txt',
        'mutant-L73.txt',
        'mutant-L79.txt',
        'mutant-L73-overlap.txt',
        'mutant-L79-title.txt',
        'fixture-write.txt',
        'checks-for-paths.txt',
        'e2e-targeted.txt',
        'content-build-base.txt',
        'parity.txt',
        'npm-ci.txt',
        'lint.txt',
        'build-app.txt',
    ]:
        keep(name)
    keep('vitest-all-1.txt', 'vitest-all-1-summary.txt', suite_summary('vitest-all-1.txt'))
    keep('vitest-all-2.txt', 'vitest-all-2-summary.txt', suite_summary('vitest-all-2.txt'))
    for script, out in [
        ('scripts/mutants.py', 'scripts-mutants.py'),
        ('scripts/keep_logs.py', 'scripts-keep-logs.py'),
        ('scripts/edit_paper_test.py', 'scripts-edit-paper-test.py'),
        ('scripts/edit_lesson_test.py', 'scripts-edit-lesson-test.py'),
    ]:
        keep(script, out)
    app_build = Path('app/build/cl04')
    for name, out in [
        ('playwright.cl04-5073.config.ts', 'scripts-playwright.cl04-5073.config.ts'),
        ('playwright.cl04-pictures.config.ts', 'scripts-playwright.cl04-pictures.config.ts'),
        ('specs/zz-cl04-skills-picture.spec.ts', 'scripts-zz-cl04-skills-picture.spec.ts'),
    ]:
        keep('', out, (app_build / name).read_text(encoding='utf-8'))
    pictures = DST / 'pictures'
    pictures.mkdir(exist_ok=True)
    for picture in sorted((app_build / 'pictures').iterdir()):
        if picture.suffix == '.json':
            (pictures / picture.name).write_text(clean(picture.read_text(encoding='utf-8')), encoding='utf-8', newline='\n')
        else:
            shutil.copyfile(picture, pictures / picture.name)
    print('\n'.join(sorted(str(p.relative_to(DST)) + f' {p.stat().st_size}' for p in DST.rglob('*') if p.is_file())))


if __name__ == '__main__':
    main()
