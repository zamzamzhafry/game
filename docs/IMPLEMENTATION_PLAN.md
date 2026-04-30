# Two-Lane Rhythm Runner Implementation Plan

## Goal

Build a **2D two-lane rhythm runner** in **Phaser 3 + Vite (vanilla JavaScript)**.

- Player stays fixed on the left.
- Two lanes only: `ground` and `air`.
- Notes/enemies approach a fixed strike line.
- Gameplay is driven by chart data and song time.
- `docs/pianotiles.md` is **not** the v1 direction.

## Canonical Decisions

These decisions reconcile `docs/ARCHITECTURE.md`, `docs/musadash.md`, external Phaser references, and rhythm-game timing best practice.

1. **Game type**: 2D Muse Dash-style runner, not 3D highway.
2. **Engine**: Phaser 3 with Vite.
3. **Scene flow**: `Boot -> Preloader -> MainMenu -> Game -> GameOver`.
4. **Timing truth**: use **song time**, not Arcade Physics velocity, for note judgment.
5. **Spatial Trick**: keep it as a **render projection** only.
6. **Lanes**: `ground` on `F`, `air` on `J`.
7. **Scope**: no hold notes, no boss logic, no extra lanes in v1.

## Why the Spatial Trick Changes Internally

The docs describe a spatial conveyor belt where enemies are placed using beat math and then moved left at constant speed. That is a good **visual model**, but it is not the safest **gameplay authority** for a rhythm game.

V1 should use this rule instead:

- Audio time is the single source of truth.
- Each note has a `hitTimeMs`.
- Each frame, note X is projected from current song time.
- Hit judgment compares input time against `hitTimeMs`.

Projection formula:

```text
screenX = hitLineX + (note.hitTimeMs - songTimeMs) * pixelsPerMs
```

This preserves the conveyor-belt look without sync drift from physics or frame accumulation.

## MVC Architecture

### Model

Pure gameplay state and timing logic. No Phaser objects.

- `src/models/BeatmapModel.js`
- `src/models/Conductor.js`
- `src/models/LaneModel.js`
- `src/models/JudgmentModel.js`
- `src/models/ScoreModel.js`
- `src/models/RunStateModel.js`

Responsibilities:

- validate and normalize chart data
- convert beats into hit times
- define lane constants and lane Y positions
- judge `perfect / good / miss`
- manage score, combo, and end-of-run state

### View

Phaser scenes and display objects only.

- `src/scenes/BootScene.js`
- `src/scenes/PreloaderScene.js`
- `src/scenes/MainMenuScene.js`
- `src/scenes/GameScene.js`
- `src/scenes/GameOverScene.js`
- `src/views/PlayerView.js`
- `src/views/EnemyView.js`
- `src/views/StrikeZoneView.js`
- `src/views/HudView.js`

Responsibilities:

- preload assets
- render player, notes/enemies, lanes, HUD, and effects
- play animations and SFX
- reflect model state visually

### Controller

Bridges Phaser input + scene lifecycle to the pure model layer.

- `src/controllers/GameSessionController.js`
- `src/controllers/InputController.js`

Responsibilities:

- start and advance gameplay
- read the song clock
- map `F` and `J` to lane hit attempts
- resolve hit/miss results through the model
- update views and trigger feedback

## Recommended Folder Structure

```text
game/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── musadash.md
│   ├── pianotiles.md
│   └── IMPLEMENTATION_PLAN.md
├── public/
│   ├── assets/
│   │   ├── audio/
│   │   │   ├── music/
│   │   │   └── sfx/
│   │   ├── sprites/
│   │   │   ├── player/
│   │   │   ├── enemies/
│   │   │   ├── backgrounds/
│   │   │   └── fx/
│   │   └── ui/
│   └── levels/
│       └── track1.json
├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── scenes/
│   ├── services/
│   ├── utils/
│   ├── views/
│   └── main.js
├── tests/
│   ├── integration/
│   └── unit/
├── index.html
├── package.json
└── vite.config.js
```

## Asset Drop Zones

Put your assets here:

- `public/assets/audio/music/`
  - `track1.mp3`
- `public/assets/audio/sfx/`
  - `hit.mp3`
  - `miss.mp3`
  - `ui-click.mp3`
- `public/assets/sprites/player/`
  - player sprite sheet(s)
  - idle / attack-low / attack-high / hurt animations
- `public/assets/sprites/enemies/`
  - `enemy-ground.png`
  - `enemy-air.png`
- `public/assets/sprites/backgrounds/`
  - parallax backgrounds
  - ground strip / lane art
- `public/assets/sprites/fx/`
  - hit spark
  - miss flash
- `public/assets/ui/`
  - logo
  - buttons
  - combo / score art

## Beatmap Contract for v1

Keep the doc shape, but treat `offset` as **timing offset**.

```json
{
  "song": "track1",
  "bpm": 120,
  "scrollSpeed": 400,
  "offset": 0,
  "enemies": [
    { "beat": 4, "type": "ground" },
    { "beat": 5, "type": "air" },
    { "beat": 6, "type": "ground" }
  ]
}
```

### Semantics

- `song`: audio key / song id
- `bpm`: tempo
- `scrollSpeed`: presentation speed in pixels per second
- `offset`: audio timing correction in seconds for v1 plan compatibility
- `enemies[].beat`: beat number when the note should be hit
- `enemies[].type`: `ground` or `air`

## Timing Rules

1. `secondsPerBeat = 60 / bpm`
2. `hitTimeSec = beat * secondsPerBeat + offset`
3. `timeUntilHitSec = hitTimeSec - currentSongTimeSec`
4. `screenX = hitLineX + timeUntilHitSec * scrollSpeed`

Judgment should be **time-window based**, not collision-authoritative.

Suggested v1 windows:

- `Perfect`: within `±50ms`
- `Good`: within `±100ms`
- otherwise `Miss`

These can be tuned later.

## Phase Plan

### Phase 0 — Project Setup

Create the folder skeleton, placeholder chart, and repo conventions.

Deliverables:

- `public/` asset folders
- `src/` skeleton folders
- `tests/` skeleton folders
- `docs/IMPLEMENTATION_PLAN.md`

### Phase 1 — Bootstrap

Set up Vite + Phaser and render a blank playable shell.

Deliverables:

- `package.json`
- `index.html`
- `src/main.js`
- `src/config/gameConfig.js`
- scene registration

Acceptance:

- app boots cleanly at `1280x720`
- no console/runtime errors

### Phase 2 — Scene Flow

Implement shell scenes with placeholder text.

Deliverables:

- `BootScene.js`
- `PreloaderScene.js`
- `MainMenuScene.js`
- `GameScene.js`
- `GameOverScene.js`

Acceptance:

- can move Menu -> Game -> GameOver -> Menu

### Phase 3 — Deterministic Rhythm Core

Build and test the pure model layer before real visuals.

Deliverables:

- `BeatmapModel.js`
- `Conductor.js`
- `LaneModel.js`
- `JudgmentModel.js`
- `ScoreModel.js`
- unit tests for timing and judgment

Acceptance:

- beat-to-time conversion is correct
- lane typing is correct
- hit windows behave correctly

### Phase 4 — First Playable Vertical Slice

Wire gameplay controller, song clock, placeholder notes, strike line, and inputs.

Deliverables:

- `GameSessionController.js`
- `InputController.js`
- `PlayerView.js`
- `EnemyView.js`
- `StrikeZoneView.js`
- `HudView.js`

Acceptance:

- `F` hits ground lane
- `J` hits air lane
- judgments and combo update on screen
- note motion stays synced to song time

### Phase 5 — Asset Integration

Replace placeholders with actual art/audio.

Deliverables:

- player animations
- enemy sprites
- hit / miss SFX
- HUD polish

Acceptance:

- one complete playable song with real assets

### Phase 6 — Polish and Stability

Deliverables:

- restart flow polish
- local score persistence
- note pooling if needed
- tuning for scroll speed and timing windows

## First Milestone

The safest first implementation milestone is:

> **One playable vertical slice with one chart, two lanes, deterministic time-based note positioning, F/J input, and visible Perfect/Good/Miss feedback.**

That gives you proof the rhythm core works before you invest in polish.

## Risks to Avoid

1. **Do not use physics velocity as gameplay truth.**
2. **Do not let `GameScene` absorb model logic.**
3. **Do not mix 2D T-Rex runner scope with `pianotiles.md` 3D highway scope.**
4. **Do not overload `offset` with both pixel and timing meaning.**
5. **Do not expand beyond two lanes in v1.**

## Next Step

When implementation starts, begin with:

1. Vite + Phaser bootstrap
2. scene flow shell
3. pure timing/judgment model
4. first playable placeholder slice
