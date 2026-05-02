export const LANE_TYPES = Object.freeze({
  GROUND: 'ground',
  AIR: 'air'
});

export const LANE_KEYS = Object.freeze({
  [LANE_TYPES.GROUND]: 'Z',
  [LANE_TYPES.AIR]: 'A'
});

const KEY_TO_LANE = Object.freeze({
  Z: LANE_TYPES.GROUND,
  A: LANE_TYPES.AIR
});

export class LaneModel {
  static getLaneTypes() {
    return [LANE_TYPES.GROUND, LANE_TYPES.AIR];
  }

  static isLaneType(value) {
    return LaneModel.getLaneTypes().includes(value);
  }

  static normalizeLane(value) {
    if (!LaneModel.isLaneType(value)) {
      throw new Error(`Invalid lane type: ${value}`);
    }

    return value;
  }

  static keyToLane(key) {
    if (typeof key !== 'string' || key.length === 0) {
      return null;
    }

    const upperKey = key.toUpperCase();
    return KEY_TO_LANE[upperKey] ?? null;
  }
}
