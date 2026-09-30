from pathlib import Path

p = Path('tests/unit/lessonPageReadsTheEvidence.test.ts')
raw = p.read_bytes()
crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n')
if 'navigatePaper' in s:
    print('already applied')
    raise SystemExit(0)
edits = [
    (
        "let router: { navigate: ReturnType<typeof vi.fn>; navigateLesson: ReturnType<typeof vi.fn> };",
        "let router: { navigate: ReturnType<typeof vi.fn>; navigateLesson: ReturnType<typeof vi.fn>; navigatePaper: ReturnType<typeof vi.fn> };",
    ),
    (
        "  router = { navigate: vi.fn(), navigateLesson: vi.fn() };",
        "  router = { navigate: vi.fn(), navigateLesson: vi.fn(), navigatePaper: vi.fn() };",
    ),
    (
        "    expect(section.querySelector('#lesson-counts')?.textContent, 'the page printed an internal id').not.toContain('book.');\n  });\n",
        "    expect(section.querySelector('#lesson-counts')?.textContent, 'the page printed an internal id').not.toContain('book.');\n"
        "    // The piece's *Practise* carries the rung to the paper screen, which hands it to the twin (the door).\n"
        "    const practise = [...section.querySelectorAll<HTMLButtonElement>('#lesson-paper [data-paper] button')].find((b) => b.textContent === 'Practise');\n"
        "    practise?.click();\n"
        "    expect(router.navigatePaper).toHaveBeenCalledWith(book.id, 'study-no-3', { from: '1.3' });\n"
        "  });\n",
    ),
]
for old, new in edits:
    assert s.count(old) == 1, old
    s = s.replace(old, new)
if crlf:
    s = s.replace('\n', '\r\n')
p.write_bytes(s.encode('utf-8'))
print('ok', 'crlf' if crlf else 'lf')
