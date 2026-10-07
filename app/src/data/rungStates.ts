/**
 * Where the learner is, for a screen (C5): the derived rung state, read from
 * the store's rows, the plan row (the learner's word, the carried-over rungs)
 * and the Settings pass pair, through the one derivation
 * (`evidence/rungState`). Plan, Today, the lesson page and Skills all call
 * this, so they cannot disagree about where the learner is (`04` §3). A run
 * held below the rung that judged it credits that rung nothing (SR3): which
 * runs are held is each run's own stored hold (`opened.hold`, SR4), which
 * `rungState` reads from the rows; nothing is computed here.
 */
import type { Curriculum } from '../curriculum/types';
import { learnerRecordFrom, rungState, type RungStates } from '../evidence/rungState';
import { VOCABULARY_V0 } from '../evidence/vocabulary';
import { getPlan } from './planStore';
import { rungRows } from './progressStore';
import { getSettings } from './settingsStore';

export async function loadRungStates(curriculum: Curriculum, today = new Date()): Promise<RungStates> {
  const [rows, plan] = await Promise.all([rungRows(), getPlan()]);
  return rungState(rows, curriculum, VOCABULARY_V0, today, learnerRecordFrom(plan, getSettings()));
}
