"""U118b: copy a run log into docs/prompts/runs/U118b/ with machine paths replaced and the size capped.

Usage (from app/): python keep.py <source> <name in the run folder> [--utf16]
Paths: the worktree becomes <worktree>, the home folder <home>. A log over 300 KB keeps its last 300 KB
and says so on its first line.
"""
import re
import sys
from pathlib import Path

src, name = Path(sys.argv[1]), sys.argv[2]
raw = src.read_bytes()
text = raw.decode('utf-16') if '--utf16' in sys.argv or raw[:2] in (b'\xff\xfe', b'\xfe\xff') else raw.decode('utf-8', errors='replace')
text = text.replace('\r\n', '\n')
worktree = Path.cwd().parent
home = Path.home()
for form in (str(worktree), str(worktree).replace('\\', '/'), worktree.as_uri().replace('%20', ' '), worktree.as_uri()):
    text = text.replace(form, '<worktree>')
for form in (str(home), str(home).replace('\\', '/')):
    text = text.replace(form, '<home>')
text = re.sub(r'C:[\\/]Users[\\/][^\\/\s]+', '<home>', text)
limit = 300 * 1024
if len(text.encode('utf-8')) > limit:
    text = '[trimmed: the last 300 KB of the log are kept]\n' + text.encode('utf-8')[-limit:].decode('utf-8', errors='ignore')
dest = worktree / 'docs' / 'prompts' / 'runs' / 'U118b' / name
dest.write_text(text, encoding='utf-8')
print(f'{dest.name}: {len(text.encode("utf-8"))} bytes')
