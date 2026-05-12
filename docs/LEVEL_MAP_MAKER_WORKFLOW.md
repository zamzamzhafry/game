# Level Map Maker Workflow

Purpose: add or edit playable level entries in `public/levels/` without touching game code.

## Files that matter

- `public/levels/index.json` = level catalog shown to game.
- `public/levels/<level-id>.json` = one beatmap file per level.
- Current example: `public/levels/track1.json`.

## What a level needs

Each level needs both of these:

1. Catalog entry in `public/levels/index.json`
2. Matching beatmap file in `public/levels/<id>.json`

Current catalog shape:

```json
{
  "id": "track1",
  "title": "First Steps",
  "artist": "Demo Track",
  "bpm": 120,
  "difficulty": "Easy",
  "noteCount": 30,
  "backgroundSetId": "forest-day"
}
```

## Recommended workflow

### 1. Pick level id

- Use short stable id like `track2`, `forest-run`, `boss-intro`.
- File name must match id: `public/levels/<id>.json`.

### 2. Copy existing pattern

- Duplicate `public/levels/track1.json`.
- Rename copy to new id.
- Update song data, bpm, enemies, countdown, and background.

### 3. Add catalog entry

- Open `public/levels/index.json`.
- Add new object inside `levels` array.
- Keep `id`, `bpm`, `noteCount`, and `backgroundSetId` aligned with beatmap file.

### 4. Count notes correctly

- `noteCount` should equal total items inside beatmap `enemies` array.
- Example: `track1.json` has 30 enemy entries, so `index.json` shows `noteCount: 30`.

### 5. Save and smoke check

- Confirm JSON stays valid.
- Confirm new file name and `id` match.
- Confirm catalog points to real beatmap file.

## Authoring rules

- Keep `id` unique across `index.json`.
- Keep `bpm` same in both files.
- Keep `backgroundSetId` same in both files.
- Keep `noteCount` equal to actual `enemies.length`.
- Do not leave trailing commas.

## Quick create checklist

- Create `public/levels/<id>.json`
- Set `song`
- Set `bpm`
- Set `scrollSpeed`
- Set `offset`
- Set `backgroundSetId`
- Fill `countdown`
- Fill `enemies`
- Add matching row in `public/levels/index.json`
- Recount `noteCount`

## Minimal example process

To create `track2`:

1. Copy `public/levels/track1.json` to `public/levels/track2.json`
2. Change beatmap content inside `track2.json`
3. Add this to `public/levels/index.json`

```json
{
  "id": "track2",
  "title": "New Level Name",
  "artist": "Artist Name",
  "bpm": 120,
  "difficulty": "Easy",
  "noteCount": 30,
  "backgroundSetId": "forest-day"
}
```

## Common mistakes

- New beatmap file exists but no `index.json` entry
- `index.json` id does not match beatmap filename
- `noteCount` not updated after editing enemies
- `backgroundSetId` mismatched between catalog and beatmap
- Invalid lane/type values inside enemies
