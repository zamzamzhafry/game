import { BeatmapModel } from '../models/BeatmapModel.js';
import { JudgmentModel, JUDGMENTS } from '../models/JudgmentModel.js';
import { LaneModel } from '../models/LaneModel.js';

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}

export class GameSessionController {
  constructor(rawBeatmap) {
    this.beatmap = new BeatmapModel(rawBeatmap);
    this.notesByLane = Object.freeze({
      ground: this.beatmap.getNotesForLane('ground'),
      air: this.beatmap.getNotesForLane('air')
    });

    this.state = this.createInitialState();
  }

  createInitialState() {
    return {
      songTimeMs: 0,
      ended: false,
      laneCursors: {
        ground: 0,
        air: 0
      },
      totals: {
        [JUDGMENTS.PERFECT]: 0,
        [JUDGMENTS.GOOD]: 0,
        [JUDGMENTS.MISS]: 0
      }
    };
  }

  restart() {
    this.state = this.createInitialState();
    return this.getSnapshot();
  }

  setSongTimeMs(songTimeMs) {
    assertFiniteNumber(songTimeMs, 'songTimeMs');
    this.state.songTimeMs = Math.max(0, songTimeMs);
    this.flushAutoMisses();
    this.state.ended = this.isComplete();
    return this.getSnapshot();
  }

  handleLaneInput(inputKey, inputTimeMs = this.state.songTimeMs) {
    const lane = LaneModel.keyToLane(inputKey);
    assertFiniteNumber(inputTimeMs, 'inputTimeMs');

    if (lane === null) {
      return {
        consumed: false,
        reason: 'invalid_key',
        lane: null,
        judgment: null,
        note: null,
        deltaMs: null
      };
    }

    this.state.songTimeMs = Math.max(this.state.songTimeMs, inputTimeMs);
    this.flushAutoMisses();

    const cursor = this.state.laneCursors[lane];
    assertNonNegativeInteger(cursor, `laneCursors.${lane}`);

    const laneNotes = this.notesByLane[lane];
    const note = laneNotes[cursor] ?? null;

    if (note === null) {
      return {
        consumed: false,
        reason: 'no_note_available',
        lane,
        judgment: null,
        note: null,
        deltaMs: null
      };
    }

    const result = JudgmentModel.judgeNoteHit({ note, inputLane: lane, hitTimeMs: inputTimeMs });

    if (result.judgment === JUDGMENTS.MISS) {
      return {
        consumed: false,
        reason: 'outside_window',
        lane,
        judgment: JUDGMENTS.MISS,
        note,
        deltaMs: result.deltaMs
      };
    }

    this.state.laneCursors[lane] += 1;
    this.state.totals[result.judgment] += 1;
    this.state.ended = this.isComplete();

    return {
      consumed: true,
      reason: 'hit',
      lane,
      judgment: result.judgment,
      note,
      deltaMs: result.deltaMs
    };
  }

  flushAutoMisses() {
    const missThresholdMs = this.state.songTimeMs - JudgmentModel.getGoodWindowMs();

    for (const lane of LaneModel.getLaneTypes()) {
      const laneNotes = this.notesByLane[lane];

      while (this.state.laneCursors[lane] < laneNotes.length) {
        const note = laneNotes[this.state.laneCursors[lane]];

        if (note.hitTimeMs > missThresholdMs) {
          break;
        }

        this.state.laneCursors[lane] += 1;
        this.state.totals[JUDGMENTS.MISS] += 1;
      }
    }
  }

  isComplete() {
    return LaneModel.getLaneTypes().every((lane) => {
      return this.state.laneCursors[lane] >= this.notesByLane[lane].length;
    });
  }

  getSnapshot() {
    return {
      songTimeMs: this.state.songTimeMs,
      ended: this.state.ended,
      totals: {
        [JUDGMENTS.PERFECT]: this.state.totals[JUDGMENTS.PERFECT],
        [JUDGMENTS.GOOD]: this.state.totals[JUDGMENTS.GOOD],
        [JUDGMENTS.MISS]: this.state.totals[JUDGMENTS.MISS]
      },
      laneCursors: {
        ground: this.state.laneCursors.ground,
        air: this.state.laneCursors.air
      },
      noteCounts: {
        ground: this.notesByLane.ground.length,
        air: this.notesByLane.air.length
      },
      durationMs: this.beatmap.getDurationMs(),
      countdown: this.beatmap.getCountdown()
    };
  }
}
