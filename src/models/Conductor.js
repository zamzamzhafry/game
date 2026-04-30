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

export class Conductor {
  constructor() {
    this.running = false;
    this.startTimeMs = 0;
    this.songTimeMs = 0;
  }

  start(nowMs = 0) {
    assertFiniteNumber(nowMs, 'nowMs');
    this.startTimeMs = nowMs - this.songTimeMs; // Allows resuming from current songTimeMs
    this.running = true;
    return this.songTimeMs;
  }

  stop() {
    this.running = false;
    return this.songTimeMs;
  }
  
  pause() {
      this.running = false;
      return this.songTimeMs;
  }
  
  resume(nowMs = 0) {
      assertFiniteNumber(nowMs, 'nowMs');
      if (this.running) return this.songTimeMs;
      
      this.startTimeMs = nowMs - this.songTimeMs;
      this.running = true;
      return this.songTimeMs;
  }

  update(nowMs) {
    assertFiniteNumber(nowMs, 'nowMs');

    if (!this.running) {
      return this.songTimeMs;
    }

    this.songTimeMs = Math.max(0, nowMs - this.startTimeMs);
    return this.songTimeMs;
  }

  setSongTimeMs(songTimeMs) {
    assertFiniteNumber(songTimeMs, 'songTimeMs');
    this.songTimeMs = Math.max(0, songTimeMs);
    return this.songTimeMs;
  }

  getSongTimeMs(nowMs) {
    if (typeof nowMs === 'number') {
      assertFiniteNumber(nowMs, 'nowMs');
      return this.running ? Math.max(0, nowMs - this.startTimeMs) : this.songTimeMs;
    }

    return this.songTimeMs;
  }

  getSongTimeSec(nowMs) {
    return this.getSongTimeMs(nowMs) / 1000;
  }

  static secondsPerBeat(bpm) {
    assertPositiveNumber(bpm, 'bpm');
    return 60 / bpm;
  }

  static beatToTimeMs(beat, bpm, offsetSec = 0) {
    assertFiniteNumber(beat, 'beat');
    assertPositiveNumber(bpm, 'bpm');
    assertFiniteNumber(offsetSec, 'offsetSec');

    const hitTimeSec = beat * Conductor.secondsPerBeat(bpm) + offsetSec;
    return hitTimeSec * 1000;
  }
}
