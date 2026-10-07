"""
G1c: revise G1b's one-reader walk in app/tests/unit/projectLifecycle.test.ts. The walk named every file
importing projectStore a reader of projects; G1c item 1 has session.ts (and Plan) import the store's
`PROJECT_STAGES` — the stage numbers, no project. The walk now tells an import of that constant alone
from a read of the store, and names both lists, so the guard still holds that no session code reads
a project (and would go red if session.ts imported anything else from the store). Keeps CRLF.
Idempotent by its marker. Run from the repository root.
"""
from pathlib import Path

P = Path("app/tests/unit/projectLifecycle.test.ts")
MARKER = "const stageReaders: string[] = [];"

OLD_WALK = """    const readers: string[] = [];
    const actors: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts')) {
          const text = readFileSync(path, 'utf8');
          const name = relative(src, path).split(sep).join('/');
          if (name === 'data/projectStore.ts') continue;
          if (/from '[./]*(data\\/)?projectStore'/.test(text) || /from '[./]*projectSheet'/.test(text)) readers.push(name);
          if (text.includes('applyProjectAction(')) actors.push(name);
        }
      }
    };
"""
NEW_WALK = """    const readers: string[] = [];
    // Revised (G1c item 1; G84): the files that import the project stages' numbers and nothing else
    // from the store — which stages are projects, never a project row.
    const stageReaders: string[] = [];
    const actors: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.ts')) {
          const text = readFileSync(path, 'utf8');
          const name = relative(src, path).split(sep).join('/');
          if (name === 'data/projectStore.ts') continue;
          const fromStore = text.match(/from '[./]*(data\\/)?projectStore'/g) ?? [];
          const named = [...text.matchAll(/import \\{([^}]*)\\} from '[./]*(?:data\\/)?projectStore'/g)].map((found) =>
            (found[1] ?? '').split(',').map((binding) => binding.trim()).filter((binding) => binding !== ''),
          );
          const stagesOnly =
            fromStore.length > 0 && named.length === fromStore.length && named.every((names) => names.length === 1 && names[0] === 'PROJECT_STAGES');
          if (/from '[./]*projectSheet'/.test(text) || (fromStore.length > 0 && !stagesOnly)) readers.push(name);
          else if (stagesOnly) stageReaders.push(name);
          if (text.includes('applyProjectAction(')) actors.push(name);
        }
      }
    };
"""
OLD_END = """      'ui/screens/SettingsScreen.ts',
    ]);
  });
});
"""
NEW_END = """      'ui/screens/SettingsScreen.ts',
    ]);
    // The session and Plan read which stages are projects (`PROJECT_STAGES`, the one constant) and
    // import nothing else from the store: neither reads a project.
    expect(stageReaders.sort()).toEqual(['curriculum/session.ts', 'ui/screens/PlanScreen.ts']);
  });
});
"""

raw = P.read_bytes().decode("utf-8")
crlf = "\r\n" in raw
text = raw.replace("\r\n", "\n")
if MARKER in text:
    print("already revised")
else:
    assert text.count(OLD_WALK) == 1, "walk not found"
    assert text.count(OLD_END) == 1, "end not found"
    text = text.replace(OLD_WALK, NEW_WALK).replace(OLD_END, NEW_END)
    P.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
    print("revised")
