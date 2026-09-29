"""Compare the FAIL names of two vitest logs: python scripts-compare-fails.py <before.txt> <after.txt> <out.txt>.

Names only (the part after ' FAIL  '), restricted to the files the before log ran, so a wider after run is
compared on the same files. The out file's first line is the command, its last line exit=<0 identical|1>.
"""
import sys
from pathlib import Path

here = Path(__file__).parent
before_path, after_path, out_path = (here / name for name in sys.argv[1:4])


def names(path: Path) -> set[str]:
    return {line.split(' FAIL  ', 1)[1].strip() for line in path.read_text(encoding='utf8').splitlines() if line.startswith(' FAIL  ')}


before, after = names(before_path), names(after_path)
files = {name.split(' > ', 1)[0] for name in before}
after_same_files = {name for name in after if name.split(' > ', 1)[0] in files}
lines = [f'$ python scripts-compare-fails.py {sys.argv[1]} {sys.argv[2]} {sys.argv[3]}']
lines.append(f'before: {len(before)} failing names in {sorted(files)}')
lines.append(f'after, same files: {len(after_same_files)}; after, every file it ran: {len(after)}')
only_before = sorted(before - after_same_files)
only_after = sorted(after_same_files - before)
lines += [f'only before: {name}' for name in only_before] + [f'only after: {name}' for name in only_after]
identical = not only_before and not only_after
lines.append('identical' if identical else 'different')
lines.append(f'exit={0 if identical else 1}')
out_path.write_text('\n'.join(lines) + '\n', encoding='utf8')
print('\n'.join(lines))
