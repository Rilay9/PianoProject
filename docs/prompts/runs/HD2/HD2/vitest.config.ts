// Runs HD2's corpus diff from `app/` (see corpusDiff.probe.ts for the recipe). A plain object: this
// folder has no node_modules, so `vitest/config` does not resolve from here.
export default {
  test: {
    include: ['../docs/prompts/runs/HD2/corpusDiff.probe.ts'],
    environment: 'node',
  },
};
