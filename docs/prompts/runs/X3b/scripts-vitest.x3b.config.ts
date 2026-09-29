// X3b's vitest override (Entry 128), a run harness, not the suite's config. `app/node_modules` in this
// worktree is a junction to the main checkout's install (C: had no space left for `npm ci`; the two
// package.json and package-lock.json files are byte-identical), and Vite refuses to serve a `?raw`
// import from a file outside the project's allowed folders ("Denied ID …/opensheetmusicdisplay/
// package.json?raw", `unit-junction-denied.txt`). This allows the worktree and the one folder the
// junction points at; the rest is `app/vitest.config.ts` as it stands (include, environment). No
// import, so it loads from outside `app/`. Run from `app/` with `--config` naming this file.
const WORKTREE = 'C:/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-a20bd5674e425dc2c';

export default {
  root: `${WORKTREE}/app`,
  server: { fs: { allow: [WORKTREE, 'C:/Users/yalir/repos/Piano Stuff/PianoProject/app/node_modules'] } },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
};
