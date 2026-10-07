from pathlib import Path

p = Path('tests/unit/paperScreenTwin.test.ts')
s = p.read_text(encoding='utf-8')
marker = 'CL04, L79'
if marker in s:
    print('already applied')
    raise SystemExit(0)
old_router = "const router = { navigate: vi.fn(), navigateScore: vi.fn() } as unknown as Router;\n"
new_router = (
    "// The route the screen reads its rung from (`paperFrom`, CL04): set per case.\n"
    "const route: { tab: 'library'; paperFrom?: string } = { tab: 'library' };\n"
    "const navigateScore = vi.fn();\n"
    "const router = { navigate: vi.fn(), navigateScore, route } as unknown as Router;\n"
)
assert old_router in s
s = s.replace(old_router, new_router)
old_before = "  findItemSpy.mockClear();\n});"
new_before = "  findItemSpy.mockClear();\n  navigateScore.mockClear();\n  delete route.paperFrom;\n});"
assert old_before in s
s = s.replace(old_before, new_before, 1)
s = s.rstrip('\n')
assert s.endswith('});')
s += '''

// Added (CL04, L79): the paper route carried no rung, so the twin a lesson
// page's *Practise* led to opened on the Score screen judged by nobody, and
// its run counted for no rung. The route now carries the rung that opened it
// (`#/paper/<book>/<piece>?from=<rung>`), and the button forwards it.
describe('PaperScreen: the twin opens judged by the rung that opened the paper screen, and by none from the Shelf', () => {
  async function twinned(): Promise<HTMLElement> {
    const book = await addBook({ title: 'Method Book' });
    const piece = await addPiece(book.id, { title: 'Study No. 3', lessonIds: ['3.1'], concepts: [], itemId: 'import.alive' });
    return mountPaper(book.id, piece!.id);
  }

  it('opened from a rung (`from`): the button opens the twin with that rung', async () => {
    route.paperFrom = '3.1';
    const section = await twinned();
    section.querySelector<HTMLButtonElement>('#paper-with-score')?.click();
    expect(navigateScore).toHaveBeenCalledTimes(1);
    expect(navigateScore).toHaveBeenCalledWith('import.alive', { from: '3.1' });
  });

  it('opened from the Shelf (no `from`): the button opens the twin with no rung', async () => {
    const section = await twinned();
    section.querySelector<HTMLButtonElement>('#paper-with-score')?.click();
    expect(navigateScore).toHaveBeenCalledTimes(1);
    expect(navigateScore.mock.calls[0]).toEqual(['import.alive']);
  });
});
'''
p.write_text(s, encoding='utf-8', newline='\n')
print('ok')
