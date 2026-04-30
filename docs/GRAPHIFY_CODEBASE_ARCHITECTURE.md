# Graphify Codebase Architecture

This file is a learning map for the current prototype. It explains how a beatmap turns into timed notes on screen, how countdown and judgment work, and exactly where to replace the placeholder `__WHITE` sprites with manifest-backed art.

## Architecture at a Glance

The runtime path is:

1. `PreloaderScene` loads the chart JSON plus the player and enemy manifests (`src/scenes/PreloaderScene.js:20-23`).
2. `GameScene` reads the selected chart from cache, then creates the timing/controller stack: `GameSessionController`, `Conductor`, and `ScoreModel` (`src/scenes/GameScene.js:74-80`).
3. `BeatmapModel` converts raw beatmap entries into normalized notes with `hitTimeMs`, lane, and render metadata (`src/models/BeatmapModel.js:62-88`, `src/models/BeatmapModel.js:143-167`).
4. `Conductor` advances authoritative song time in milliseconds (`src/models/Conductor.js:48-57`).
5. `GameSessionController` decides which note is next, whether an input hits, and when old notes auto-miss (`src/controllers/GameSessionController.js:49-55`, `src/controllers/GameSessionController.js:57-136`).
6. `GameScene` projects upcoming notes into screen space and renders them using the current placeholder visuals (`src/scenes/GameScene.js:443-456`, `src/scenes/GameScene.js:479-525`).

The important design choice is that gameplay truth is song time, not physics. Movement on screen is just a projection of `note.hitTimeMs - songTimeMs`.

## How Beat Mapping Flows Through the Codebase

### 1. Beatmap authoring starts in `public/levels/track1.json`

The current chart defines:

- song id, bpm, scroll speed, and offset (`public/levels/track1.json:2-5`)
- countdown behavior (`public/levels/track1.json:6-13`)
- the note list in `enemies` (`public/levels/track1.json:14-45`)

Each note currently uses `beat` plus `type`, for example `{ "beat": 1, "type": "ground" }` (`public/levels/track1.json:15-16`).

### 2. `PreloaderScene` loads chart and manifest data

`PreloaderScene.preload()` pulls in the level index, the chart, and both manifests (`src/scenes/PreloaderScene.js:20-23`). In `create()`, it:

- builds the fallback `__WHITE` texture if needed (`src/scenes/PreloaderScene.js:49-56`)
- normalizes the player and enemy manifests (`src/scenes/PreloaderScene.js:58-59`)
- extracts all referenced state images and animations (`src/scenes/PreloaderScene.js:60-67`)
- stores normalized manifests in the Phaser registry (`src/scenes/PreloaderScene.js:69-70`)
- queues missing textures and creates Phaser animations before entering `MainMenuScene` (`src/scenes/PreloaderScene.js:72-98`)

This means the asset pipeline is already present. The game is still using placeholders because `GameScene` does not yet consume the manifest-backed texture/animation keys.

### 3. `GameScene` boots the gameplay stack from cached chart data

When gameplay starts, `GameScene.create()` builds `chartKey` as `${this.trackKey}-chart`, reads the raw beatmap from cache, copies `scrollSpeed`, and constructs the session/timing models (`src/scenes/GameScene.js:74-80`).

That stack splits responsibility cleanly:

- `BeatmapModel` owns chart normalization.
- `Conductor` owns elapsed song time.
- `GameSessionController` owns note consumption and miss logic.
- `GameScene` owns presentation and player input wiring.

### 4. `BeatmapModel` turns beats into deterministic note objects

`BeatmapModel` validates `song`, `bpm`, `scrollSpeed`, `offset`, `enemies`, and `countdown`, then maps every enemy entry through `createNote()` and sorts by `hitTimeMs` (`src/models/BeatmapModel.js:62-88`).

The timing conversion happens in `createNote()`:

- lane comes from `enemy.lane ?? enemy.type` (`src/models/BeatmapModel.js:148-149`)
- beat time comes from `Conductor.beatToTimeMs(beat, bpm, offsetSec)` (`src/models/BeatmapModel.js:150`)
- render defaults are lane-based: ground defaults to `alien/blue/stand`, air defaults to `ship/green/default` (`src/models/BeatmapModel.js:4-15`, `src/models/BeatmapModel.js:151-157`)

Every note comes out with both flattened render fields and a nested `render` object:

- `archetype`
- `variant`
- `state`
- `render: { archetype, variant, state }`

That happens in `src/models/BeatmapModel.js:153-166`. This is the key extension point for sprite replacement, because the scene can render from note metadata without changing note timing logic.

### 5. `Conductor` is the authoritative beat-to-time bridge

`Conductor.secondsPerBeat()` returns `60 / bpm` (`src/models/Conductor.js:78-80`). `Conductor.beatToTimeMs()` then computes:

`hitTimeSec = beat * secondsPerBeat(bpm) + offsetSec`

and returns milliseconds (`src/models/Conductor.js:83-89`).

At runtime, `Conductor.start()` anchors song time to the scene clock, and `update()` advances `songTimeMs` from that anchor (`src/models/Conductor.js:22-27`, `src/models/Conductor.js:48-57`).

### 6. `GameSessionController` turns time into playable note state

The controller constructs a `BeatmapModel`, then pre-splits notes by lane into `ground` and `air` arrays (`src/controllers/GameSessionController.js:18-25`).

From there:

- `setSongTimeMs()` updates the session clock, flushes automatic misses, and sets `ended` when all lane cursors are consumed (`src/controllers/GameSessionController.js:49-55`)
- `handleLaneInput()` maps a key to a lane, looks at the next note on that lane, asks `JudgmentModel` for the result, and advances the cursor only on hit (`src/controllers/GameSessionController.js:57-117`)
- `flushAutoMisses()` advances stale notes once they move beyond the good window (`src/controllers/GameSessionController.js:119-136`)

This is why the game can stay deterministic even if rendering is replaced. The controller never cares whether a note is drawn as a white box or a sprite sheet frame.

### 7. `GameScene` projects note timing into screen position

During `update()`, `GameScene` asks the `Conductor` for the latest song time, pushes that time into `GameSessionController`, then redraws visible enemies (`src/scenes/GameScene.js:443-456`).

The projection logic is inside `updateEnemies()`:

- visible notes are chosen from lane cursors forward (`src/scenes/GameScene.js:492-497`)
- `timeToHitSec = (note.hitTimeMs - songTimeMs) / 1000` (`src/scenes/GameScene.js:499`)
- `targetX = this.HIT_X + (timeToHitSec * this.scrollSpeed)` (`src/scenes/GameScene.js:500`)
- `y` comes from the lane (`src/scenes/GameScene.js:502`)

That is the live implementation of the “spatial conveyor belt” idea: x-position is derived from timing, not simulated motion.

## Countdown Flow

Countdown starts as data in the beatmap (`public/levels/track1.json:6-13`). `BeatmapModel.normalizeCountdown()` validates and normalizes that structure into:

- `enabled`
- `leadInBeats`
- `spokenSequence`
- `availableVoices`
- `initialDelayMs`
- `stepDurationMs`

See `src/models/BeatmapModel.js:90-141`.

`GameSessionController.getSnapshot()` exposes countdown data back to the scene (`src/controllers/GameSessionController.js:144-163`). `GameScene.startCountdown()` then:

- enters `COUNTDOWN` state (`src/scenes/GameScene.js:378-380`)
- reads `snapshot.countdown` (`src/scenes/GameScene.js:382-384`)
- skips directly to gameplay if countdown is disabled (`src/scenes/GameScene.js:385-388`)
- schedules each spoken token with `delayedCall` (`src/scenes/GameScene.js:394-422`)
- maps token text like `3`, `2`, `1`, `go` to voice assets (`src/scenes/GameScene.js:401-410`)
- starts gameplay after the last countdown step finishes (`src/scenes/GameScene.js:412-417`)

`startGameplay()` then starts music playback, fades volume in, starts the `Conductor`, and seeds the session at song time `0` (`src/scenes/GameScene.js:425-441`).

## Judgment Flow

### Timing windows

`JudgmentModel` defines:

- perfect window: `±50ms` (`src/models/JudgmentModel.js:1`, `src/models/JudgmentModel.js:17-19`)
- good window: `±100ms` (`src/models/JudgmentModel.js:2`, `src/models/JudgmentModel.js:21-23`)

`judgeDeltaMs()` returns `Perfect`, `Good`, or `Miss` from absolute timing error (`src/models/JudgmentModel.js:25-39`). `judgeNoteHit()` also verifies lane match before applying timing (`src/models/JudgmentModel.js:41-69`).

### Input path

`GameScene` binds keyboard inputs in `create()` (`src/scenes/GameScene.js:187-191`). The handlers:

- `handleGroundInput()` calls `sessionController.handleLaneInput('F', this.conductor.getSongTimeMs())` (`src/scenes/GameScene.js:302-310`)
- `handleAirInput()` calls `sessionController.handleLaneInput('J', this.conductor.getSongTimeMs())` (`src/scenes/GameScene.js:313-325`)

The controller translates the key to a lane, checks the next note on that lane, and returns whether the input consumed a note (`src/controllers/GameSessionController.js:57-117`).

### Miss path and feedback

If the player never presses in time, `flushAutoMisses()` advances notes after `songTimeMs - goodWindow` passes their `hitTimeMs` (`src/controllers/GameSessionController.js:119-136`).

After either input handler gets a result, `GameScene.recordJudgment()`:

- updates score and combo through `ScoreModel` (`src/scenes/GameScene.js:528-530`)
- plays hit or miss SFX (`src/scenes/GameScene.js:532-538`)
- updates the HUD and tweened floating judgment text (`src/scenes/GameScene.js:540-567`)

The judgment system is therefore already independent from visuals. Replacing white boxes with sprites should not touch any of the timing code above.

## Manifest-Backed Sprite System Already Exists

### What the manifests define

The player manifest currently exposes a `dino/default` entity with many state images plus `idle`, `run`, `jump`, `dead`, and `walk` animations (`public/data/manifests/player-manifest.json:4-82`).

The enemy manifest currently exposes:

- `alien/blue` on the ground lane (`public/data/manifests/enemy-manifest.json:4-20`)
- `alien/green` on the ground lane (`public/data/manifests/enemy-manifest.json:23-39`)
- `ship/green` on the air lane (`public/data/manifests/enemy-manifest.json:42-62`)

### How manifest keys are built

`manifestUtils.js` already provides canonical key builders:

- entity keys via `getEntityManifestKey(archetype, variant)` (`src/utils/manifestUtils.js:15-19`)
- state keys via `getStateManifestKey(archetype, variant, state)` (`src/utils/manifestUtils.js:21-25`)
- animation keys via `getAnimationManifestKey(archetype, variant, animation)` (`src/utils/manifestUtils.js:27-31`)

It also normalizes manifests into state and animation records (`src/utils/manifestUtils.js:33-121`) and converts them into Phaser preload/anims payloads (`src/utils/manifestUtils.js:123-149`).

The gap is not data loading. The gap is that `GameScene` still instantiates placeholder sprites instead of using those keys.

## Exact Replacement Points

- **Player placeholder creation** — `src/scenes/GameScene.js:103-107` creates the player with `this.add.sprite(..., '__WHITE')`, fixed display size, and tint. Replace this with a manifest-backed player texture or animation key. The clean path is to read the normalized player manifest from the registry and instantiate the dino using a key derived from `dino/default`.
- **Player attack/jump state changes** — `src/scenes/GameScene.js:302-325` currently uses tint swaps plus a temporary `y` change to signal ground and air actions. Keep the input timing call exactly where it is, but swap the visual response to animation or state changes, such as idle/run/jump frames from `player-manifest.json` (`public/data/manifests/player-manifest.json:56-82`).
- **Tint-only player helper** — `src/scenes/GameScene.js:363-376` is a placeholder-only color helper. Once the player uses real art, this function becomes either a debug fallback or something to remove in favor of `setTexture()` / `play()` calls.
- **Enemy placeholder creation** — `src/scenes/GameScene.js:504-518` creates every visible enemy from `__WHITE` and lane-based tint. This is the main enemy replacement point. Keep the projection math and lane `y`, but resolve the sprite key from `note.render.archetype`, `note.render.variant`, and `note.render.state`, which already exist on every note (`src/models/BeatmapModel.js:153-166`).
- **Enemy projection math** — `src/scenes/GameScene.js:497-500` should stay unchanged. That math is the deterministic gameplay projection and is not coupled to whether the rendered object is a box or a real sprite.
- **Manifest consumption hook** — `src/scenes/PreloaderScene.js:58-98` already normalizes, registers, loads, and animates manifest assets. The replacement work belongs mostly in `GameScene`, not in the preloader.

## How to Customize a Beatmap

### Change timing and flow

To change the song feel, edit these chart-level values:

- `bpm` for beat spacing (`public/levels/track1.json:3`)
- `scrollSpeed` for how quickly notes travel across the screen (`public/levels/track1.json:4`)
- `offset` for global timing shift (`public/levels/track1.json:5`)
- `countdown` for spoken intro cadence (`public/levels/track1.json:6-13`)

Because `BeatmapModel` runs every note through `Conductor.beatToTimeMs()` (`src/models/BeatmapModel.js:143-150`, `src/models/Conductor.js:83-89`), these fields affect gameplay without any scene-level rewrite.

### Change note lanes and visuals

Every note can already choose its lane through `lane` or `type` (`src/models/BeatmapModel.js:148-149`). More importantly, every note can already override visuals through `archetype`, `variant`, and `state` (`src/models/BeatmapModel.js:153-166`).

That means a beatmap entry can evolve from this:

```json
{ "beat": 14, "type": "ground" }
```

to this:

```json
{ "beat": 14, "type": "ground", "archetype": "alien", "variant": "green", "state": "walk1" }
```

If a note does not specify those fields, `BeatmapModel` falls back to lane defaults: ground becomes `alien/blue/stand`, air becomes `ship/green/default` (`src/models/BeatmapModel.js:4-15`).

### When a beatmap change is not enough

If you want a new sprite family or animation that does not already exist, update the relevant manifest:

- player art lives in `public/data/manifests/player-manifest.json`
- enemy art lives in `public/data/manifests/enemy-manifest.json`

Then the preloader will be able to normalize and load it on startup (`src/scenes/PreloaderScene.js:58-98`).

## Practical Implementation Order for Sprite Replacement

1. Replace the player placeholder spawn in `GameScene.create()` (`src/scenes/GameScene.js:103-107`).
2. Replace the enemy placeholder spawn in `GameScene.updateEnemies()` (`src/scenes/GameScene.js:504-518`).
3. Convert ground/air attack feedback from tint changes to animation/state changes (`src/scenes/GameScene.js:302-325`).
4. Leave `BeatmapModel`, `Conductor`, `GameSessionController`, and `JudgmentModel` alone unless you are intentionally changing gameplay timing.

That sequence preserves the existing deterministic rhythm core while upgrading presentation.
