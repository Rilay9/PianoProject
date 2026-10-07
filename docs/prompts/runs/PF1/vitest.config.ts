// Runs PF5's model dump from `app/` (see hand-dump.probe.ts for the recipe). A plain object: this folder has no
// node_modules, so `vitest/config` does not resolve from here.
export default {
  test: {
    include: ['../docs/prompts/runs/PF1/hand-dump.probe.ts'],
    environment: 'node',
  },
};
