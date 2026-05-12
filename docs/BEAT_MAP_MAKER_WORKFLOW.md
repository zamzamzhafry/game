# Beat Map Maker Workflow

Purpose: build or edit `public/levels/<id>.json` files so game can turn enemy beats into playable notes.

Source truth used here:

- `public/levels/track1.json`
- `src/models/BeatmapModel.js`

## Beatmap file shape

Current beatmaps use this top-level structure:

```json
{
  "song": "track1",
  "bpm": 120,
  "scrollSpeed": 400,
  "offset": 0,
  "backgroundSetId": "forest-day",
  "countdown": {
    "enabled": true,
    "leadInBeats": 4,
    "spokenSequence": ["3", "2", "1", "go"],
    "availableVoices": ["3", "2", "1", "go"],
    "initialDelayMs": 1000,
    "stepDurationMs": 1000
  },
  "enemies": [
    { "beat": 1, "type": "ground", "archetype": "snail" }
  ]
}
```

## Required fields

From `src/models/BeatmapModel.js`, these rules matter:

- `song` = required non-empty string
- `bpm` = required positive number
- `scrollSpeed` = required positive number
- `offset` = optional finite number, defaults to `0`
- `enemies` = required array
- `countdown` = optional object; if omitted, model uses defaults

## Enemy note rules

Each `enemies` item becomes one playable note.

Required per enemy:

- `beat` = required number
- `type` or `lane` = lane source

Optional render fields:

- `archetype`
- `variant`
- `state`

Important lane rule:

- Model reads `lane ?? type`
- Current data uses `type`
- Safe values in current content are `ground` and `air`

## Countdown rules

If `countdown` is present, keep these valid:

- `enabled` = boolean
- `leadInBeats` = non-negative integer
- `spokenSequence` = array of non-empty strings
- `availableVoices` = array of non-empty strings
- `initialDelayMs` = non-negative integer
- `stepDurationMs` = positive integer

If you do not need custom countdown, easiest path is copy `track1.json` countdown block.

## Recommended authoring workflow

### 1. Duplicate working file

- Copy `public/levels/track1.json`
- Rename to new level id

### 2. Set top-level timing

- Set `song`
- Set `bpm`
- Set `scrollSpeed`
- Set `offset`
- Set `backgroundSetId`

### 3. Build note pattern in `enemies`

- One object = one note
- `beat` can be integer or decimal if needed
- Use `type: "ground"` for low lane
- Use `type: "air"` for high lane

Example pattern:

```json
[
  { "beat": 1, "type": "ground", "archetype": "snail" },
  { "beat": 2, "type": "air", "archetype": "bat" },
  { "beat": 2.5, "type": "ground", "archetype": "mouse" }
]
```

### 4. Keep beats musical

- Start simple with quarter notes: `1`, `2`, `3`, `4`
- Add half-step syncopation with `.5`
- Keep early patterns readable before making dense sections
- Alternate `ground` and `air` for teaching patterns

### 5. Validate before handoff

- JSON valid
- All enemies have `beat` and lane
- No empty strings in countdown arrays
- `bpm` and `backgroundSetId` match `public/levels/index.json`
- `noteCount` in `index.json` matches enemy total

## Fast editing checklist

- Copy known-good beatmap
- Edit metadata
- Edit countdown only if needed
- Add or remove enemies
- Recount notes
- Sync `public/levels/index.json`

## Common mistakes

- Missing `enemies` array
- Using unsupported lane words instead of `ground` or `air`
- Leaving `song` empty
- Setting `scrollSpeed` or `bpm` to `0`
- Invalid countdown values like negative beats or empty voice tokens
