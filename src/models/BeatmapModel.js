import { Conductor } from './Conductor.js';
import { LaneModel } from './LaneModel.js';

const LANE_RENDER_DEFAULTS = Object.freeze({
  [LaneModel.normalizeLane('ground')]: Object.freeze({
    archetype: 'alien',
    variant: 'blue',
    state: 'stand'
  }),
  [LaneModel.normalizeLane('air')]: Object.freeze({
    archetype: 'ship',
    variant: 'green',
    state: 'default'
  })
});

const DEFAULT_COUNTDOWN = Object.freeze({
  enabled: false,
  leadInBeats: 0,
  spokenSequence: [],
  availableVoices: [],
  initialDelayMs: 0,
  stepDurationMs: 1000
});

function assertObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function assertPositiveNumber(value, label) {
  assertFiniteNumber(value, label);

  if (value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }
}

function normalizeRenderValue(value, fallback, label) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string when provided.`);
  }

  return value.trim().toLowerCase();
}

export class BeatmapModel {
  constructor(rawBeatmap) {
    assertObject(rawBeatmap, 'Beatmap');

    const { song, bpm, scrollSpeed, offset = 0, enemies, countdown } = rawBeatmap;

    if (typeof song !== 'string' || song.trim().length === 0) {
      throw new Error('Beatmap song must be a non-empty string.');
    }

    assertPositiveNumber(bpm, 'Beatmap bpm');
    assertPositiveNumber(scrollSpeed, 'Beatmap scrollSpeed');
    assertFiniteNumber(offset, 'Beatmap offset');

    if (!Array.isArray(enemies)) {
      throw new Error('Beatmap enemies must be an array.');
    }

    this.song = song;
    this.bpm = bpm;
    this.scrollSpeed = scrollSpeed;
    this.offsetSec = offset;
    this.countdown = BeatmapModel.normalizeCountdown(countdown);
    this.notes = enemies
      .map((enemy, index) => BeatmapModel.createNote(enemy, index, bpm, offset))
      .sort((left, right) => left.hitTimeMs - right.hitTimeMs);

    this.durationMs = this.notes.length > 0
      ? this.notes[this.notes.length - 1].hitTimeMs
      : 0;
  }

  static normalizeCountdown(countdown) {
    if (countdown === undefined) {
      return { ...DEFAULT_COUNTDOWN };
    }

    assertObject(countdown, 'Beatmap countdown');

    const {
      enabled = true,
      leadInBeats = 0,
      spokenSequence = [],
      availableVoices = [],
      initialDelayMs = 0,
      stepDurationMs = 1000
    } = countdown;

    if (typeof enabled !== 'boolean') {
      throw new Error('Beatmap countdown.enabled must be a boolean.');
    }

    if (!Number.isInteger(leadInBeats) || leadInBeats < 0) {
      throw new Error('Beatmap countdown.leadInBeats must be a non-negative integer.');
    }

    if (!Array.isArray(spokenSequence) || !spokenSequence.every((token) => typeof token === 'string' && token.length > 0)) {
      throw new Error('Beatmap countdown.spokenSequence must be an array of non-empty strings.');
    }

    // Future tuning hook: callers can adapt spokenSequence cadence externally
    // (e.g., dynamic coaching cues) while this model remains timing-authoritative.

    if (!Array.isArray(availableVoices) || !availableVoices.every((token) => typeof token === 'string' && token.length > 0)) {
      throw new Error('Beatmap countdown.availableVoices must be an array of non-empty strings.');
    }

    if (!Number.isInteger(initialDelayMs) || initialDelayMs < 0) {
      throw new Error('Beatmap countdown.initialDelayMs must be a non-negative integer.');
    }

    if (!Number.isInteger(stepDurationMs) || stepDurationMs <= 0) {
      throw new Error('Beatmap countdown.stepDurationMs must be a positive integer.');
    }

    return {
      enabled,
      leadInBeats,
      spokenSequence: spokenSequence.slice(),
      availableVoices: availableVoices.slice(),
      initialDelayMs,
      stepDurationMs
    };
  }

  static createNote(enemy, index, bpm, offsetSec) {
    assertObject(enemy, `enemies[${index}]`);
    const beat = enemy.beat;
    assertFiniteNumber(beat, `enemies[${index}].beat`);

    const laneValue = enemy.lane ?? enemy.type;
    const lane = LaneModel.normalizeLane(laneValue);
    const hitTimeMs = Conductor.beatToTimeMs(beat, bpm, offsetSec);
    const laneDefaults = LANE_RENDER_DEFAULTS[lane];

    const render = {
      archetype: normalizeRenderValue(enemy.archetype, laneDefaults.archetype, `enemies[${index}].archetype`),
      variant: normalizeRenderValue(enemy.variant, laneDefaults.variant, `enemies[${index}].variant`),
      state: normalizeRenderValue(enemy.state, laneDefaults.state, `enemies[${index}].state`)
    };

    return {
      id: `note-${index}`,
      beat,
      lane,
      hitTimeMs,
      ...render,
      render
    };
  }

  getAllNotes() {
    return this.notes.slice();
  }

  getCountdown() {
    return {
      enabled: this.countdown.enabled,
      leadInBeats: this.countdown.leadInBeats,
      spokenSequence: this.countdown.spokenSequence.slice(),
      availableVoices: this.countdown.availableVoices.slice(),
      initialDelayMs: this.countdown.initialDelayMs,
      stepDurationMs: this.countdown.stepDurationMs
    };
  }

  getDurationMs() {
    return this.durationMs;
  }

  getNotesForLane(lane) {
    const normalizedLane = LaneModel.normalizeLane(lane);
    return this.notes.filter((note) => note.lane === normalizedLane);
  }

  getNextNoteForLane(lane, laneCursor = 0) {
    const notes = this.getNotesForLane(lane);

    if (!Number.isInteger(laneCursor) || laneCursor < 0) {
      throw new Error('laneCursor must be a non-negative integer.');
    }

    return notes[laneCursor] ?? null;
  }
}
