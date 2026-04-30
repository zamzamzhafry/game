import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFinalResultsPayload } from '../../src/services/buildFinalResultsPayload.js';

test('buildFinalResultsPayload derives required fields from score and session snapshots', () => {
  const payload = buildFinalResultsPayload(
    {
      score: 4500,
      combo: 3,
      maxCombo: 8,
      perfectCount: 3,
      goodCount: 3,
      missCount: 2
    },
    {
      totals: { Perfect: 4, Good: 2, Miss: 3 },
      noteCounts: { ground: 4, air: 4 }
    }
  );

  assert.equal(payload.score, 4500);
  assert.equal(payload.combo, 3);
  assert.equal(payload.maxCombo, 8);
  assert.equal(payload.perfectCount, 3);
  assert.equal(payload.goodCount, 3);
  assert.equal(payload.missCount, 2);
  assert.equal(payload.totalNotes, 8);
  assert.equal(payload.hitCount, 6);
  assert.equal(payload.rating, 'B');

  assert.deepEqual(payload.debug.sessionTotals, { Perfect: 4, Good: 2, Miss: 3 });
});

test('buildFinalResultsPayload uses N/A rating when totalNotes is zero', () => {
  const payload = buildFinalResultsPayload(
    {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      goodCount: 0,
      missCount: 0
    },
    {
      totals: { Perfect: 0, Good: 0, Miss: 0 },
      noteCounts: { ground: 0, air: 0 }
    }
  );

  assert.equal(payload.totalNotes, 0);
  assert.equal(payload.hitCount, 0);
  assert.equal(payload.rating, 'N/A');
});

test('buildFinalResultsPayload clamps hitCount to totalNotes', () => {
  const payload = buildFinalResultsPayload(
    {
      score: 9999,
      combo: 99,
      maxCombo: 99,
      perfectCount: 10,
      goodCount: 10,
      missCount: 0
    },
    {
      totals: { Perfect: 2, Good: 2, Miss: 0 },
      noteCounts: { ground: 2, air: 2 }
    }
  );

  assert.equal(payload.totalNotes, 4);
  assert.equal(payload.hitCount, 4);
  assert.equal(payload.rating, 'S');
});
