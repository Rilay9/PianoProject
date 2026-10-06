// Runs HD2a's probes from `app/` (dump.probe.ts, staleness.probe.ts). A plain object: this folder has no node_modules.
export default {
  test: {
    include: ['../docs/prompts/runs/HD2a/*.probe.ts'],
    environment: 'node',
  },
};
