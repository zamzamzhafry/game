const PERFECT_WINDOW_MS = 50;
const GOOD_WINDOW_MS = 100;

export const JUDGMENTS = Object.freeze({
  PERFECT: 'Perfect',
  GOOD: 'Good',
  MISS: 'Miss'
});

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

export class JudgmentModel {
  static getPerfectWindowMs() {
    return PERFECT_WINDOW_MS;
  }

  static getGoodWindowMs() {
    return GOOD_WINDOW_MS;
  }

  static judgeDeltaMs(deltaMs) {
    assertFiniteNumber(deltaMs, 'deltaMs');

    const absDeltaMs = Math.abs(deltaMs);

    if (absDeltaMs <= PERFECT_WINDOW_MS) {
      return JUDGMENTS.PERFECT;
    }

    if (absDeltaMs <= GOOD_WINDOW_MS) {
      return JUDGMENTS.GOOD;
    }

    return JUDGMENTS.MISS;
  }

  static judgeNoteHit({ note, inputLane, hitTimeMs }) {
    if (note === null || typeof note !== 'object' || Array.isArray(note)) {
      throw new Error('note must be an object.');
    }

    if (typeof inputLane !== 'string' || inputLane.length === 0) {
      throw new Error('inputLane must be a non-empty string.');
    }

    assertFiniteNumber(hitTimeMs, 'hitTimeMs');
    assertFiniteNumber(note.hitTimeMs, 'note.hitTimeMs');

    if (note.lane !== inputLane) {
      return {
        judgment: JUDGMENTS.MISS,
        deltaMs: null,
        laneMatched: false
      };
    }

    const deltaMs = hitTimeMs - note.hitTimeMs;
    const judgment = JudgmentModel.judgeDeltaMs(deltaMs);

    return {
      judgment,
      deltaMs,
      laneMatched: true
    };
  }
}
