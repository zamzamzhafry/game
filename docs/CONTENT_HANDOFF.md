# Content Handoff Guide

> For artists, level designers, and non-programmers working on **Two-Lane Rhythm Runner**.
>
> This document tells you **what to change**, **where to find it**, and **what NOT to touch**.
> Every section includes the exact file path and the exact shape of the data you will edit.

---

## Table of Contents

1. [Quick Start — How the Game Works](#1-quick-start--how-the-game-works)
2. [Folder Map — Where Everything Lives](#2-folder-map--where-everything-lives)
3. [Level Charts — Writing Beat Sequences](#3-level-charts--writing-beat-sequences)
4. [Rest Beats — Creating Silence / Gaps](#4-rest-beats--creating-silence--gaps)
5. [Enemy Sprites — Adding or Replacing Enemies](#5-enemy-sprites--adding-or-replacing-enemies)
6. [Player Sprites — Adding or Replacing the Player](#6-player-sprites--adding-or-replacing-the-player)
7. [Audio — Music, SFX, and Voice](#7-audio--music-sfx-and-voice)
8. [Background & Parallax — Placeholder Ready](#8-background--parallax--placeholder-ready)
9. [Dynamic Scripting — How Data Drives the Game](#9-dynamic-scripting--how-data-drives-the-game)
10. [Do NOT Touch List](#10-do-not-touch-list)
11. [Checklist Before You Ship Changes](#11-checklist-before-you-ship-changes)

---

## 1. Quick Start — How the Game Works

- **Engine**: Phaser 3 (browser game, runs with `npm run dev`)
- **Canvas**: 1280 × 720 pixels, landscape
- **Two lanes**: Ground (bottom) and Air (upper)
- **Player**: anchored on the left side (~150px from left edge)
- **Enemies/notes**: scroll from right to left toward a strike zone
- **Controls**: `F` = ground action, `J` = air action, `P`/`Esc` = pause
- **Timing**: Perfect (±50ms), Good (±100ms), Miss (beyond that)

The game reads **JSON files** to know what enemies to spawn and when. You change the JSON, the game changes. No code editing needed for most content work.

---

## 2. Folder Map — Where Everything Lives

```
game/
├── public/                          ← ALL your content goes here
│   ├── assets/
│   │   ├── audio/
│   │   │   ├── music/               ← background music files (.mp3)
│   │   │   ├── sfx/fx/              ← hit/miss/attack sound effects (.ogg)
│   │   │   └── voice/Female/        ← countdown voice clips (.ogg)
│   │   ├── sprites/
│   │   │   ├── player/dino/         ← player sprite frames (.png)
│   │   │   ├── enemies/
│   │   │   │   ├── ground-enemies/  ← ground enemy sprites (.png)
│   │   │   │   ├── flying-enemies/  ← air enemy sprites (.png)
│   │   │   │   └── small-enemies/   ← (unused, reserved)
│   │   │   ├── backgrounds/         ← ⭐ PARALLAX LAYERS GO HERE
│   │   │   └── fx/                  ← (reserved for hit effects)
│   │   └── ui/                      ← (reserved for HUD art)
│   ├── data/
│   │   └── manifests/
│   │       ├── player-manifest.json ← tells the game about player sprites
│   │       └── enemy-manifest.json  ← tells the game about enemy sprites
│   └── levels/
│       ├── index.json               ← list of all available levels
│       └── track1.json              ← the beat chart for level 1
│
├── src/                             ← CODE LIVES HERE (don't edit unless you know JS)
│   ├── config/
│   │   ├── assets.js                ← asset key registry
│   │   └── gameConfig.js            ← Phaser boot config
│   ├── controllers/
│   │   └── GameSessionController.js ← note consumption + auto-miss logic
│   ├── models/
│   │   ├── BeatmapModel.js          ← parses level JSON into timed notes
│   │   ├── Conductor.js             ← song clock (beat↔time conversion)
│   │   ├── JudgmentModel.js         ← hit window rules
│   │   ├── LaneModel.js             ← lane type definitions
│   │   └── ScoreModel.js            ← score/combo tracking
│   ├── scenes/
│   │   ├── BootScene.js             ← first scene (minimal)
│   │   ├── PreloaderScene.js        ← loads all assets + manifests
│   │   ├── MainMenuScene.js         ← title screen
│   │   ├── LevelSelectScene.js      ← level picker
│   │   ├── GameScene.js             ← ⭐ main gameplay (rendering, input, parallax hook)
│   │   └── GameOverScene.js         ← results screen
│   ├── services/
│   │   └── buildFinalResultsPayload.js
│   ├── utils/
│   │   └── manifestUtils.js         ← shared manifest parser
│   ├── views/                       ← (empty, reserved for future view classes)
│   └── main.js                      ← game entry point
└── docs/                            ← documentation (you are here)
```

---

## 3. Level Charts — Writing Beat Sequences

### Where

```
public/levels/track1.json
```

### Shape

```jsonc
{
  "song": "track1",           // must match a music key in assets.js
  "bpm": 120,                 // beats per minute
  "scrollSpeed": 400,         // pixels per second enemies travel
  "offset": 0,                // seconds offset before beat 1
  "countdown": {
    "enabled": true,
    "leadInBeats": 4,
    "spokenSequence": ["3", "2", "1", "go"],
    "availableVoices": ["3", "2", "1", "go"],
    "initialDelayMs": 1000,
    "stepDurationMs": 1000
  },
  "enemies": [
    // EACH OBJECT = ONE NOTE/ENEMY
    { "beat": 1,  "type": "ground" },
    { "beat": 2,  "type": "air" },
    { "beat": 3,  "type": "ground" },
    // ...
  ]
}
```

### How to add a new note

Add a new object to the `enemies` array:

```json
{ "beat": 14, "type": "ground" }
```

- `beat` — which beat number (can be decimal: `4.5` = halfway between beat 4 and 5)
- `type` — which lane: `"ground"` or `"air"`

### Optional: custom enemy appearance per note

You can override the default enemy look on any individual note:

```json
{
  "beat": 14,
  "type": "ground",
  "archetype": "alien",
  "variant": "green",
  "state": "walk1"
}
```

If you leave out `archetype`/`variant`/`state`, the game uses these defaults:

| Lane   | Default archetype | Default variant | Default state |
|--------|-------------------|-----------------|---------------|
| ground | `alien`           | `blue`          | `stand`       |
| air    | `ship`            | `green`         | `default`     |

### How to add a new level

1. Create a new file: `public/levels/track2.json` (same shape as track1)
2. Add it to `public/levels/index.json`:

```json
{
  "levels": [
    {
      "id": "track1",
      "title": "First Steps",
      "artist": "Demo Track",
      "bpm": 120,
      "difficulty": "Easy",
      "noteCount": 30
    },
    {
      "id": "track2",
      "title": "Your New Level",
      "artist": "Your Name",
      "bpm": 140,
      "difficulty": "Medium",
      "noteCount": 50
    }
  ]
}
```

3. Add the matching music file to `public/assets/audio/music/track2.mp3`
4. Register the music key in `src/config/assets.js` (needs a programmer, or copy the pattern):

```js
export const MusicKeys = {
  Track1: 'music_track1',
  Track2: 'music_track2'   // ← add this line
};
```

5. Load it in `src/scenes/PreloaderScene.js` (needs a programmer, or copy the pattern):

```js
this.load.json('track2-chart', 'levels/track2.json');
this.load.audio(MusicKeys.Track2, 'assets/audio/music/track2.mp3');
```

---

## 4. Rest Beats — Creating Silence / Gaps

### Can you skip beats?

**Yes.** The game does NOT require every beat to have a note. The timing system runs on continuous milliseconds, not a beat counter. If beat 5 has no entry in the `enemies` array, nothing spawns on beat 5. The player just waits.

### How to create a rest

Simply **leave a gap** in the beat numbers:

```json
"enemies": [
  { "beat": 1, "type": "ground" },
  { "beat": 2, "type": "air" },
  // beat 3 = REST (nothing here)
  // beat 4 = REST (nothing here)
  { "beat": 5, "type": "ground" },
  { "beat": 8, "type": "air" }
]
```

Beats 3, 4, 6, and 7 are all rests. No enemies spawn. The player is not penalized.

### Important

- You do NOT need a special `{ "type": "rest" }` entry
- You do NOT need consecutive beat numbers
- You CAN use decimal beats: `3.5` is valid (half-beat timing)
- The order in the JSON does not matter — the game sorts by time automatically

---

## 5. Enemy Sprites — Adding or Replacing Enemies

### Where the manifest lives

```
public/data/manifests/enemy-manifest.json
```

### Current enemies in the manifest

| Archetype | Variant | Lane   | States                                    |
|-----------|---------|--------|-------------------------------------------|
| `alien`   | `blue`  | ground | `stand`, `walk1`, `walk2`, `jump`, `hurt` |
| `alien`   | `green` | ground | `stand`, `walk1`, `walk2`, `jump`, `hurt` |
| `ship`    | `green` | air    | `default`, `manned`, `damage1`, `damage2` |

### How to add a new enemy variant

**Step 1** — Put your sprite images in the right folder:

```
public/assets/sprites/enemies/ground-enemies/alienRed_stand.png
public/assets/sprites/enemies/ground-enemies/alienRed_walk1.png
public/assets/sprites/enemies/ground-enemies/alienRed_walk2.png
```

**Step 2** — Add an entry to `enemy-manifest.json`:

```json
{
  "archetype": "alien",
  "variant": "red",
  "lane": "ground",
  "states": {
    "stand": "assets/sprites/enemies/ground-enemies/alienRed_stand.png",
    "walk1": "assets/sprites/enemies/ground-enemies/alienRed_walk1.png",
    "walk2": "assets/sprites/enemies/ground-enemies/alienRed_walk2.png"
  },
  "animations": {
    "walk": {
      "frames": ["walk1", "walk2"],
      "frameRate": 8,
      "repeat": -1
    }
  }
}
```

**Step 3** — Use it in your level chart:

```json
{ "beat": 10, "type": "ground", "archetype": "alien", "variant": "red", "state": "walk1" }
```

### Manifest shape reference

```jsonc
{
  "entities": [
    {
      "archetype": "alien",        // category name (e.g. alien, robot, slime)
      "variant": "blue",           // color/style variant
      "lane": "ground",            // which lane this enemy belongs to
      "states": {
        // KEY = state name (you pick it)
        // VALUE = path to the PNG file (relative to public/)
        "stand": "assets/sprites/enemies/ground-enemies/alienBlue_stand.png",
        "walk1": "assets/sprites/enemies/ground-enemies/alienBlue_walk1.png",
        "walk2": "assets/sprites/enemies/ground-enemies/alienBlue_walk2.png",
        "jump":  "assets/sprites/enemies/ground-enemies/alienBlue_jump.png",
        "hurt":  "assets/sprites/enemies/ground-enemies/alienBlue_hurt.png"
      },
      "animations": {
        // KEY = animation name
        // "frames" = array of state names (must exist in "states" above)
        // "frameRate" = frames per second
        // "repeat" = -1 means loop forever, 0 means play once
        "walk": {
          "frames": ["walk1", "walk2"],
          "frameRate": 8,
          "repeat": -1
        }
      }
    }
  ]
}
```

### Rules

- Every frame name in `animations.frames` **must** exist as a key in `states`
- File paths are relative to the `public/` folder
- The `archetype` + `variant` combo must be unique per entity
- State names are case-insensitive (the game lowercases them)

---

## 6. Player Sprites — Adding or Replacing the Player

### Where the manifest lives

```
public/data/manifests/player-manifest.json
```

### Current player states

The player (`dino` / `default`) has these animation sets:

| Animation | Frames | Frame Rate | Loops? |
|-----------|--------|------------|--------|
| `idle`    | 10     | 10 fps     | yes    |
| `run`     | 8      | 14 fps     | yes    |
| `jump`    | 12     | 16 fps     | no     |
| `dead`    | 8      | 8 fps      | no     |
| `walk`    | 10     | 12 fps     | yes    |

### Where to put new player sprites

```
public/assets/sprites/player/dino/
```

Each frame is a separate PNG file. The naming pattern is:

```
Idle (1).png, Idle (2).png, ... Idle (10).png
Run (1).png, Run (2).png, ... Run (8).png
Jump (1).png, ... Jump (12).png
Dead (1).png, ... Dead (8).png
Walk (1).png, ... Walk (10).png
```

### How to replace the player character

1. Put your new sprite frames in a new folder:
   ```
   public/assets/sprites/player/robot/
   ```

2. Edit `player-manifest.json` — add a new entity or replace the existing one:

```json
{
  "entities": [
    {
      "archetype": "robot",
      "variant": "default",
      "states": {
        "idle1": "assets/sprites/player/robot/idle_01.png",
        "idle2": "assets/sprites/player/robot/idle_02.png",
        "run1": "assets/sprites/player/robot/run_01.png",
        "run2": "assets/sprites/player/robot/run_02.png"
      },
      "animations": {
        "idle": {
          "frames": ["idle1", "idle2"],
          "frameRate": 10,
          "repeat": -1
        },
        "run": {
          "frames": ["run1", "run2"],
          "frameRate": 14,
          "repeat": -1
        }
      }
    }
  ]
}
```

### Important: Player is currently a placeholder box

Right now, `GameScene.js` renders the player as a **colored box**, not a sprite from the manifest. The manifest data is loaded and registered (animations are created in Phaser), but the gameplay scene uses `__WHITE` texture with color tints instead.

**What this means for you**: You can prepare all your player sprites and manifest entries now. When a programmer connects the manifest to the gameplay sprite (replacing the `__WHITE` box), your art will appear automatically.

### Current placeholder colors (for reference)

| Player State   | Color                    | Hex        |
|----------------|--------------------------|------------|
| Idle / Run     | Cyan gradient            | `0x00ffff` |
| Ground attack  | Orange gradient          | `0xffa500` |
| Air attack     | Magenta gradient         | `0xff00ff` |
| Miss feedback  | Red flash                | `0xff0000` |

---

## 7. Audio — Music, SFX, and Voice

### Music

| Key     | File                                  |
|---------|---------------------------------------|
| Track 1 | `public/assets/audio/music/track1.mp3` |

To add a new track: see [Section 3 — How to add a new level](#how-to-add-a-new-level).

### Sound Effects

| Purpose        | File                                        |
|----------------|---------------------------------------------|
| Hit            | `public/assets/audio/sfx/fx/twoTone1.ogg`  |
| Miss           | `public/assets/audio/sfx/fx/tone1.ogg`     |
| Ground attack  | `public/assets/audio/sfx/fx/lowDown.ogg`   |
| Air attack     | `public/assets/audio/sfx/fx/highUp.ogg`    |

**To replace**: just swap the file at the same path. Keep the same filename. No code changes needed.

### Voice (Countdown)

| Clip   | File                                           |
|--------|------------------------------------------------|
| "3"    | `public/assets/audio/voice/Female/3.ogg`      |
| "2"    | `public/assets/audio/voice/Female/2.ogg`      |
| "1"    | `public/assets/audio/voice/Female/1.ogg`      |
| "Go"   | `public/assets/audio/voice/Female/go.ogg`     |
| "Ready"| `public/assets/audio/voice/Female/ready.ogg`  |
| "Set"  | `public/assets/audio/voice/Female/set.ogg`    |

**To add a new voice pack**: create a new folder (e.g., `voice/Male/`) with the same filenames, then ask a programmer to update the `voicePack` variable in `PreloaderScene.js` (line 33).

---

## 8. Background & Parallax — Placeholder Ready

### Current state

The backgrounds folder exists but is empty:

```
public/assets/sprites/backgrounds/    ← only has .gitkeep
```

The game currently uses a flat dark background (`#1a1a1a`).

### Where parallax code will live

The parallax system will be added to `src/scenes/GameScene.js`:

- **Setup** in `create()` — create the layered background images
- **Movement** in `update()` — scroll each layer at different speeds every frame
- **Reset** in `startGameplay()` — reset layer positions when a run starts

### How to prepare parallax layers now

Create your background layers as **wide images** (at least 2560px wide, or 2× the game width of 1280px, so they can tile/scroll seamlessly).

Suggested layer structure:

```
public/assets/sprites/backgrounds/sky.png          ← farthest back, slowest scroll
public/assets/sprites/backgrounds/mountains.png    ← mid-distance
public/assets/sprites/backgrounds/trees.png        ← closer, faster scroll
public/assets/sprites/backgrounds/ground.png       ← closest, fastest scroll (or static)
```

### Recommended naming convention

```
bg_layer_0_sky.png        (depth 0, farthest)
bg_layer_1_mountains.png  (depth 1)
bg_layer_2_trees.png      (depth 2)
bg_layer_3_ground.png     (depth 3, nearest)
```

### Image specs

| Property       | Recommendation                          |
|----------------|-----------------------------------------|
| Width          | 2560px minimum (2× game width for tiling) |
| Height         | 720px (match game height)               |
| Format         | PNG (transparency) or JPG (opaque layers) |
| Seamless edges | Left edge should match right edge for looping |

### What a programmer needs to do (later)

Once you provide the layer images, a programmer will:

1. Load them in `PreloaderScene.js`
2. Create tiling sprites in `GameScene.create()`
3. Scroll them at different speeds in `GameScene.update()`

Example of what the code will look like (for programmer reference):

```js
// In GameScene.create():
this.bgSky = this.add.tileSprite(640, 360, 1280, 720, 'bg_sky').setScrollFactor(0);
this.bgMountains = this.add.tileSprite(640, 360, 1280, 720, 'bg_mountains').setScrollFactor(0);
this.bgTrees = this.add.tileSprite(640, 360, 1280, 720, 'bg_trees').setScrollFactor(0);

// In GameScene.update():
this.bgSky.tilePositionX += 0.2;        // slowest
this.bgMountains.tilePositionX += 0.5;  // medium
this.bgTrees.tilePositionX += 1.0;      // fastest
```

### Per-level background sequences (future)

When the game supports multiple levels, each level JSON could specify its own background set:

```jsonc
{
  "song": "track2",
  "bpm": 140,
  "backgrounds": [
    { "layer": 0, "image": "assets/sprites/backgrounds/desert_sky.png", "speed": 0.2 },
    { "layer": 1, "image": "assets/sprites/backgrounds/desert_dunes.png", "speed": 0.5 },
    { "layer": 2, "image": "assets/sprites/backgrounds/desert_cacti.png", "speed": 1.0 }
  ],
  "enemies": [ ... ]
}
```

This is not implemented yet, but you can prepare assets for it now.

---

## 9. Dynamic Scripting — How Data Drives the Game

This section explains the "magic" — how JSON files control the game without code changes.

### The data pipeline

```
JSON files (you edit)
    ↓
PreloaderScene loads them
    ↓
Models parse them into game objects
    ↓
GameScene renders and runs them
```

### What is "dynamic" (data-driven, no code needed)

| What                        | Where you change it                          |
|-----------------------------|----------------------------------------------|
| Beat chart / note sequence  | `public/levels/trackN.json`                  |
| Enemy appearance per note   | `archetype`/`variant`/`state` in level JSON  |
| Enemy sprite images         | `public/data/manifests/enemy-manifest.json`  |
| Player sprite images        | `public/data/manifests/player-manifest.json` |
| Animation frame order       | `animations` block in manifest JSON          |
| Animation speed             | `frameRate` in manifest JSON                 |
| Animation looping           | `repeat` in manifest JSON (-1=loop, 0=once)  |
| Level list                  | `public/levels/index.json`                   |
| Countdown sequence          | `countdown.spokenSequence` in level JSON     |
| BPM / scroll speed          | `bpm` and `scrollSpeed` in level JSON        |
| SFX / music files           | swap files at same path in `public/assets/`  |

### What requires a programmer

| What                              | Where it lives                        |
|-----------------------------------|---------------------------------------|
| Adding a new music key            | `src/config/assets.js`                |
| Loading a new level file          | `src/scenes/PreloaderScene.js`        |
| Connecting manifest to gameplay   | `src/scenes/GameScene.js`             |
| Adding parallax rendering         | `src/scenes/GameScene.js`             |
| Adding new lane types             | `src/models/LaneModel.js`            |
| Changing hit windows              | `src/models/JudgmentModel.js`        |
| Changing score values             | `src/models/ScoreModel.js`           |
| Adding new voice pack selection   | `src/scenes/PreloaderScene.js`        |

### The manifest system explained

The manifest system (`manifestUtils.js`) is the bridge between your art files and the game engine. Here is how it works:

1. **You** create PNG files and put them in the right folder
2. **You** register them in the manifest JSON with a state name and file path
3. **You** define animations as sequences of state names
4. **The game** reads the manifest, loads every image, creates every animation
5. **The game** looks up the right sprite using `archetype:variant:state` keys

The key format is automatic:

```
archetype + variant → entity key     → "alien:blue"
+ state             → state key      → "alien:blue:stand"
+ animation         → animation key  → "alien:blue:anim:walk"
```

You never type these keys yourself. The game builds them from your manifest data.

---

## 10. Do NOT Touch List

These files control core game logic. Changing them without understanding the code will break things:

| File                                        | Why                                    |
|---------------------------------------------|----------------------------------------|
| `src/models/Conductor.js`                   | Song clock / beat↔time math            |
| `src/models/JudgmentModel.js`               | Hit window rules (±50ms / ±100ms)      |
| `src/models/BeatmapModel.js`                | Note parsing and sorting               |
| `src/controllers/GameSessionController.js`  | Note consumption and auto-miss logic   |
| `src/models/LaneModel.js`                   | Lane type definitions                  |
| `src/config/gameConfig.js`                   | Phaser boot configuration              |
| `src/main.js`                                | Game entry point                       |

**Safe to edit** (with care):

| File                                        | What you can change                    |
|---------------------------------------------|----------------------------------------|
| `public/levels/*.json`                       | Beat charts, BPM, countdown            |
| `public/data/manifests/*.json`               | Sprite registrations, animations       |
| `public/assets/**/*`                         | Image and audio files                  |
| `public/levels/index.json`                   | Level list metadata                    |

---

## 11. Checklist Before You Ship Changes

### Adding a new enemy variant

- [ ] PNG files placed in `public/assets/sprites/enemies/`
- [ ] Entry added to `public/data/manifests/enemy-manifest.json`
- [ ] Every `animations.frames` entry matches a key in `states`
- [ ] File paths in `states` are correct (relative to `public/`)
- [ ] Tested: run `npm run dev` and check browser console for errors

### Adding a new level

- [ ] Level JSON created in `public/levels/`
- [ ] Music file placed in `public/assets/audio/music/`
- [ ] Level added to `public/levels/index.json`
- [ ] Music key added to `src/config/assets.js` (ask programmer)
- [ ] Level + music loaded in `src/scenes/PreloaderScene.js` (ask programmer)
- [ ] Tested: select level from menu, plays without errors

### Replacing player sprites

- [ ] PNG frames placed in `public/assets/sprites/player/`
- [ ] `public/data/manifests/player-manifest.json` updated
- [ ] All animation frame references match state keys
- [ ] Tested: `npm run dev`, no console errors on load

### Preparing parallax backgrounds

- [ ] Layer images placed in `public/assets/sprites/backgrounds/`
- [ ] Images are at least 2560px wide × 720px tall
- [ ] Left and right edges tile seamlessly
- [ ] Layers named clearly (e.g., `bg_layer_0_sky.png`)
- [ ] Handed off to programmer for integration into `GameScene.js`

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  CONTENT CREATOR QUICK REFERENCE                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Add enemies    → enemy-manifest.json + PNG files       │
│  Add levels     → levels/trackN.json + index.json       │
│  Add rests      → just skip beat numbers in the JSON    │
│  Add music      → audio/music/ + ask programmer         │
│  Add backgrounds→ sprites/backgrounds/ + ask programmer │
│  Replace SFX    → swap file at same path, same name     │
│  Replace player → player-manifest.json + PNG files      │
│                                                         │
│  Test changes   → npm run dev → open browser            │
│  See errors     → press F12 → Console tab               │
│                                                         │
│  DON'T TOUCH    → src/models/*, src/controllers/*       │
│  SAFE TO EDIT   → public/**/*.json, public/assets/**    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
