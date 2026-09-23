// @vitest-environment jsdom
//
// Shard 6 of the T24 sweep. The body, and what a green run does and does not
// prove, are in `helpers/perfectSweep.ts` and `helpers/perfectRun.ts`; this
// file exists because the runner gives one worker to one file, and the whole
// catalog in one file is minutes of parsing.

import { PERFECT_SHARDS, sweepShard } from './helpers/perfectSweep';

sweepShard(6, PERFECT_SHARDS);
