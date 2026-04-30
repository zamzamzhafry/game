function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeRating({ totalNotes, hitCount }) {
  if (totalNotes <= 0) {
    return 'N/A';
  }

  const accuracy = hitCount / totalNotes;

  if (accuracy >= 0.95) return 'S';
  if (accuracy >= 0.85) return 'A';
  if (accuracy >= 0.7) return 'B';
  if (accuracy >= 0.5) return 'C';
  return 'D';
}

export function buildFinalResultsPayload(scoreSnapshot, sessionSnapshot) {
  const safeScore = scoreSnapshot ?? {};
  const safeSession = sessionSnapshot ?? {};
  const safeNoteCounts = safeSession.noteCounts ?? {};
  const safeTotals = safeSession.totals ?? {};

  const score = Number.isFinite(safeScore.score) ? safeScore.score : 0;
  const combo = Number.isFinite(safeScore.combo) ? safeScore.combo : 0;
  const maxCombo = Number.isFinite(safeScore.maxCombo) ? safeScore.maxCombo : 0;
  const perfectCount = Number.isFinite(safeScore.perfectCount) ? safeScore.perfectCount : 0;
  const goodCount = Number.isFinite(safeScore.goodCount) ? safeScore.goodCount : 0;
  const missCount = Number.isFinite(safeScore.missCount) ? safeScore.missCount : 0;

  const groundNotes = Number.isFinite(safeNoteCounts.ground) ? safeNoteCounts.ground : 0;
  const airNotes = Number.isFinite(safeNoteCounts.air) ? safeNoteCounts.air : 0;
  const totalNotes = Math.max(0, groundNotes + airNotes);

  const hitCount = clamp(perfectCount + goodCount, 0, totalNotes);
  const rating = computeRating({ totalNotes, hitCount });

  return {
    score,
    combo,
    maxCombo,
    perfectCount,
    goodCount,
    missCount,
    totalNotes,
    hitCount,
    rating,
    debug: {
      sessionTotals: {
        Perfect: Number.isFinite(safeTotals.Perfect) ? safeTotals.Perfect : 0,
        Good: Number.isFinite(safeTotals.Good) ? safeTotals.Good : 0,
        Miss: Number.isFinite(safeTotals.Miss) ? safeTotals.Miss : 0
      }
    }
  };
}
