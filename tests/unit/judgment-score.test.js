import test from 'node:test';
import assert from 'node:assert/strict';

import { JudgmentModel, JUDGMENTS } from '../../src/models/JudgmentModel.js';
import { ScoreModel } from '../../src/models/ScoreModel.js';

test('JudgmentModel windows are Perfect ±50ms, Good ±100ms, else Miss', () => {
  assert.equal(JudgmentModel.judgeDeltaMs(0), JUDGMENTS.PERFECT);
  assert.equal(JudgmentModel.judgeDeltaMs(50), JUDGMENTS.PERFECT);
  assert.equal(JudgmentModel.judgeDeltaMs(-50), JUDGMENTS.PERFECT);

  assert.equal(JudgmentModel.judgeDeltaMs(75), JUDGMENTS.GOOD);
  assert.equal(JudgmentModel.judgeDeltaMs(-100), JUDGMENTS.GOOD);

  assert.equal(JudgmentModel.judgeDeltaMs(101), JUDGMENTS.MISS);
  assert.equal(JudgmentModel.judgeDeltaMs(-350), JUDGMENTS.MISS);
});

test('ScoreModel updates score/combo deterministically from judgments', () => {
  const score = new ScoreModel();

  score.applyJudgment(JUDGMENTS.PERFECT);
  score.applyJudgment(JUDGMENTS.GOOD);

  let snapshot = score.getSnapshot();
  assert.equal(snapshot.score, 1500);
  assert.equal(snapshot.combo, 2);
  assert.equal(snapshot.maxCombo, 2);

  score.applyJudgment(JUDGMENTS.MISS);
  snapshot = score.getSnapshot();
  assert.equal(snapshot.score, 1500);
  assert.equal(snapshot.combo, 0);
  assert.equal(snapshot.maxCombo, 2);
  assert.equal(snapshot.missCount, 1);
});

test('ScoreModel supports fever multipliers and flat bonus', () => {
  const score = new ScoreModel();

  score.applyJudgment(JUDGMENTS.PERFECT, { multiplier: 1.5, flatBonus: 250 });
  score.applyJudgment(JUDGMENTS.GOOD, { multiplier: 2 });

  const snapshot = score.getSnapshot();
  assert.equal(snapshot.score, 2750);
  assert.equal(snapshot.combo, 2);
  assert.equal(snapshot.maxCombo, 2);
});
