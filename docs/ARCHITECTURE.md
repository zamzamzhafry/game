This is the perfect way to execute this. Offloading the boilerplate and structural setup to an AI agent while you act as the "Director" and handle the creative assets will save you days of work.

To get the best results from coding agents (like Cursor, Windsurf, or GitHub Copilot), you need to give them a strict **System Architecture Document** and prompt them in **phases**. If you ask the AI to "build the game" all at once, it will write messy, intertwined code.

Here is the exact **AI Project Handout**. I recommend saving this entire block below as a file named `ARCHITECTURE.md` and putting it in a `docs/` folder in your project. You can tell your AI agent: _"Please read docs/ARCHITECTURE.md and then let's begin Phase 1."_

---

# 🦖 T-Rex Rhythm Runner: AI Developer Handout

## 1. Project Overview

**Game Concept:** A 2D rhythm platformer inspired by _Muse Dash_. The player is a T-Rex stationed on the left side of the screen. The world (ground and obstacles) scrolls continuously to the left.
**Mechanic:** Obstacles (Enemies) spawn on two distinct heights (Air and Ground). The player must use two inputs (e.g., 'F' for Ground, 'J' for Air) to strike the obstacles exactly when they enter the "Strike Zone" overlapping the player.
**Tech Stack:** \* Engine: Phaser 3 (Vanilla JavaScript)

- Bundler: Vite
- Deployment: Vercel (Local Storage for High Scores)

## 2. Directory Structure Blueprint

Please strictly adhere to this folder structure when generating files:

```text
my-trex-game/
├── public/
│   ├── assets/
│   │   ├── audio/          # e.g., bgm_track1.mp3, hit.mp3, miss.mp3
│   │   ├── sprites/        # e.g., trex_sheet.png, enemy_air.png, enemy_ground.png
│   │   └── ui/             # e.g., logo.png, button.png
│   └── levels/
│       └── track1.json     # The spatial beat map
├── docs/
│   └── ARCHITECTURE.md     # This document
├── src/
│   ├── scenes/
│   │   ├── Preloader.js    # Loads assets
│   │   ├── MainMenu.js     # Start screen
│   │   ├── GamePlay.js     # Core engine
│   │   └── GameOver.js     # Score display and restart
│   ├── objects/
│   │   ├── Player.js       # T-Rex logic (animations, strike logic)
│   │   └── Conductor.js    # Parses JSON map, calculates spatial math, spawns enemies
│   └── main.js             # Phaser config (1280x720)
├── index.html
└── package.json
```

## 3. Core Engine Logic: The Spatial Trick

We do NOT use complex timestamp-to-collision math. We use a **Spatial Conveyor Belt**.

**The Level Data (JSON):**
Levels are defined in `public/levels/track1.json` like this:

```json
{
  "song": "bgm_track1",
  "bpm": 120,
  "scrollSpeed": 400,
  "offset": 2.5,
  "enemies": [
    { "beat": 4, "type": "ground" },
    { "beat": 5, "type": "air" }
  ]
}
```

**The Math (To be implemented in `Conductor.js`):**

1. `secondsPerBeat = 60 / level.bpm`
2. `pixelsPerBeat = level.scrollSpeed * secondsPerBeat`
3. Spawn X Coordinate = `(enemy.beat * pixelsPerBeat) + playerStrikeZoneX + level.offset`

When the game starts, all enemies are instantiated at their calculated X coordinates and given a constant velocity of `-level.scrollSpeed`.

---

## 4. Execution Phases (For the AI Agent)

_Agent Instructions: Do not execute all phases at once. Wait for the user to explicitly prompt you for the next phase._

### Phase 1: Vite & Phaser Boilerplate

- **Task:** Initialize the `package.json` with Vite and Phaser 3. Create the `index.html` and `src/main.js` with a 1280x720 Canvas.
- **Goal:** A black screen running a blank Phaser instance with zero console errors.

### Phase 2: Scene Management & Preloading

- **Task:** Create `Preloader.js`, `MainMenu.js`, `GamePlay.js`, and `GameOver.js`. Set up simple text placeholders in each scene (e.g., "Press Space to Start" in Main Menu) and wire the scene transitions together so the user can flow from Menu -> Game -> Game Over -> Menu.
- **Goal:** A working state-machine for the game flow.

### Phase 3: The Conductor & The Conveyor Belt

- **Task:** In `GamePlay.js`, read a dummy `track1.json` file. Implement `Conductor.js` to calculate the spatial math. Spawn simple colored rectangle graphics (representing enemies) far off to the right, and apply a negative X velocity so they scroll left. Destroy them when they pass off-screen.
- **Goal:** A visual representation of the rhythm map moving across the screen at a constant speed.

### Phase 4: The Player & Hit Detection

- **Task:** Create `Player.js`. Place it at `X: 200`. Create an invisible physics body representing the "Strike Zone" just in front of the player.
- **Input Logic:** Bind two keys (e.g., 'F' for ground, 'J' for air). When pressed, check for physics overlaps between the Strike Zone and the moving enemy rectangles. Implement Perfect, Good, and Miss logic based on how close the enemy center is to the Strike Zone center. Print the result to `console.log`.
- **Goal:** Fully functional rhythm mechanics using simple shapes.

### Phase 5: Asset Integration & Polish

- **Task:** Replace the colored rectangles with the actual user-provided sprite sheets. Implement the T-Rex animations (Idle, Attack High, Attack Low, Miss/Hurt). Add the UI overlay (Score, Combo multiplier) and trigger sound effects on hits/misses.

---

### How to use this with your AI:

1.  Create your project folder.
2.  Inside it, create a `docs` folder and save the above text as `ARCHITECTURE.md`.
3.  Open the folder in Cursor/Windsurf.
4.  Open the AI chat prompt and say: **"Please read `docs/ARCHITECTURE.md`. Once you understand the architecture and the Spatial Trick logic, please execute Phase 1."**

This will keep the AI focused, prevent it from over-engineering, and give you a perfectly clean codebase to drop your T-Rex assets into!
