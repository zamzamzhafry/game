import { JUDGMENTS } from './JudgmentModel.js';

const POINTS_BY_JUDGMENT = Object.freeze({
  [JUDGMENTS.PERFECT]: 1000,
  [JUDGMENTS.GOOD]: 500,
  [JUDGMENTS.MISS]: 0
});

function assertJudgment(judgment) {
  if (!Object.values(JUDGMENTS).includes(judgment)) {
    throw new Error(`Unsupported judgment: ${judgment}`);
  }
}

export class ScoreModel {
  constructor() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
  }

  applyJudgment(judgment) {
    assertJudgment(judgment);

    this.score += POINTS_BY_JUDGMENT[judgment];

    if (judgment === JUDGMENTS.PERFECT) {
      this.perfectCount += 1;
      this.combo += 1;
    } else if (judgment === JUDGMENTS.GOOD) {
      this.goodCount += 1;
      this.combo += 1;
    } else {
      this.missCount += 1;
      this.combo = 0;
    }

    this.maxCombo = Math.max(this.maxCombo, this.combo);

    return this.getSnapshot();
  }

  getSnapshot() {
    return {
      score: this.score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      perfectCount: this.perfectCount,
      goodCount: this.goodCount,
      missCount: this.missCount
    };
  }
}
