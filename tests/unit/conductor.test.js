import test from 'node:test';
import assert from 'node:assert/strict';

import { Conductor } from '../../src/models/Conductor.js';

test('Conductor beat-to-time math matches required 120 BPM examples', () => {
  assert.equal(Conductor.beatToTimeMs(4, 120, 0), 2000);
  assert.equal(Conductor.beatToTimeMs(5, 120, 0), 2500);
  assert.equal(Conductor.beatToTimeMs(6, 120, 0), 3000);
});

test('Conductor includes offset seconds in beat conversion', () => {
  assert.equal(Conductor.beatToTimeMs(4, 120, 0.25), 2250);
});

test('Conductor tracks deterministic song time from start timestamp', () => {
  const conductor = new Conductor();
  conductor.start(1000);

  assert.equal(conductor.update(1450), 450);
  assert.equal(conductor.getSongTimeSec(), 0.45);
});
