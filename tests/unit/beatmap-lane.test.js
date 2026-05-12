import test from 'node:test';
import assert from 'node:assert/strict';

import { BeatmapModel } from '../../src/models/BeatmapModel.js';
import { LaneModel, LANE_TYPES } from '../../src/models/LaneModel.js';

const sampleBeatmap = {
  song: 'track1',
  bpm: 120,
  scrollSpeed: 400,
  offset: 0,
  countdown: {
    enabled: true,
    leadInBeats: 4,
    spokenSequence: ['3', '2', '1', 'go'],
    availableVoices: ['3', '2', '1', 'go'],
    initialDelayMs: 1000,
    stepDurationMs: 1000
  },
  enemies: [
    { beat: 4, type: 'ground' },
    { beat: 5, type: 'air' },
    { beat: 6, type: 'ground' }
  ]
};

test('LaneModel maps key inputs to deterministic lanes', () => {
  assert.equal(LaneModel.keyToLane('Z'), LANE_TYPES.GROUND);
  assert.equal(LaneModel.keyToLane('z'), LANE_TYPES.GROUND);
  assert.equal(LaneModel.keyToLane('A'), LANE_TYPES.AIR);
  assert.equal(LaneModel.keyToLane('x'), null);
});

test('BeatmapModel converts beats into sorted hit times and lane notes', () => {
  const beatmap = new BeatmapModel(sampleBeatmap);
  const allNotes = beatmap.getAllNotes();
  const countdown = beatmap.getCountdown();

  assert.equal(allNotes.length, 3);
  assert.deepEqual(
    allNotes.map((note) => note.hitTimeMs),
    [2000, 2500, 3000]
  );

  assert.equal(countdown.leadInBeats, 4);
  assert.deepEqual(countdown.spokenSequence, ['3', '2', '1', 'go']);
  assert.equal(countdown.initialDelayMs, 1000);
  assert.equal(countdown.stepDurationMs, 1000);
  // Future tuning hook: keep spoken token count aligned with lead-in beat count.
  assert.equal(countdown.spokenSequence.length, countdown.leadInBeats);

  const groundNotes = beatmap.getNotesForLane(LANE_TYPES.GROUND);
  const airNotes = beatmap.getNotesForLane(LANE_TYPES.AIR);

  assert.deepEqual(groundNotes.map((note) => note.beat), [4, 6]);
  assert.deepEqual(airNotes.map((note) => note.beat), [5]);
  assert.equal(beatmap.getNextNoteForLane(LANE_TYPES.GROUND, 1).beat, 6);
  assert.equal(beatmap.getNextNoteForLane(LANE_TYPES.AIR, 1), null);
});

test('BeatmapModel preserves optional render metadata with lane defaults', () => {
  const beatmap = new BeatmapModel({
    ...sampleBeatmap,
    enemies: [
      { beat: 1, type: 'ground' },
      { beat: 2, type: 'air' },
      { beat: 3, type: 'ground', archetype: 'alien', variant: 'green', state: 'hurt' }
    ]
  });

  const notes = beatmap.getAllNotes();

  assert.deepEqual(
    notes.map((note) => ({ archetype: note.archetype, variant: note.variant, state: note.state })),
    [
      { archetype: 'snail', variant: 'default', state: 'idle' },
      { archetype: 'bat', variant: 'default', state: 'idle' },
      { archetype: 'alien', variant: 'green', state: 'hurt' }
    ]
  );

  assert.deepEqual(notes[0].render, { archetype: 'snail', variant: 'default', state: 'idle' });
  assert.deepEqual(notes[1].render, { archetype: 'bat', variant: 'default', state: 'idle' });
  assert.deepEqual(notes[2].render, { archetype: 'alien', variant: 'green', state: 'hurt' });
});
