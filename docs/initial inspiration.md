This is the perfect approach. Having your assets prepped and using AI coding agents (like Cursor, Windsurf, or GitHub Copilot) is the modern way to build games fast. _Muse Dash_ is an excellent structural choice: it scopes the game down to two input lanes (Air and Ground) and keeps the player stationary while the world moves towards them.

To get the best results out of an AI coding agent, you need a rock-solid foundation. AI agents are incredibly smart, but they get confused if the project structure is messy or if you ask them to build the whole game in one prompt.

Here is the technical blueprint, the folder structure, and the exact strategy you should use to guide your AI agents.

---

### 1. The Recommended Tech Stack

Since you are using coding agents, you want a stack that is incredibly well-documented online so the AI has massive amounts of training data to pull from.

- **The Engine: Phaser 3 (JavaScript/HTML5)**
  - _Why:_ It is the absolute industry standard for 2D web games. It handles sprite-sheet animations, audio management, and collision detection out of the box. AI agents write flawless Phaser code.
- **The Bundler: Vite**
  - _Why:_ Vite is a local development server. It instantly refreshes your browser the second your AI agent writes new code, making testing lightning-fast.

---

### 2. The Folder Structure

Before you write a single line of code, organize your assets exactly like this. When you open this folder in your code editor, the AI will immediately understand the architecture.

```text
my-rhythm-game/
├── public/                 # The AI knows everything here is a raw asset
│   ├── assets/
│   │   ├── audio/          # .mp3 or .ogg files (Music tracks, hit sounds)
│   │   ├── sprites/        # .png files (T-Rex, enemies, obstacles)
│   │   └── ui/             # .png files (Buttons, health bars, combo text)
│   └── levels/
│       └── track1.json     # Your "Spatial Map" (where enemies spawn)
├── src/                    # Where the AI will write the code
│   ├── scenes/
│   │   ├── Boot.js         # Loads the loading bar
│   │   ├── Preloader.js    # Loads all assets from public/ into memory
│   │   ├── MainMenu.js     # Start button, level select
│   │   └── GamePlay.js     # The actual rhythm engine lives here
│   ├── objects/            # Custom classes the AI will build
│   │   ├── Player.js       # The T-Rex logic (jump, attack)
│   │   └── Enemy.js        # The incoming notes/monsters
│   └── main.js             # Initializes the Phaser engine
├── index.html              # The webpage that holds the game canvas
└── package.json            # Lists Vite and Phaser as dependencies
```

---

### 3. The AI Prompting Strategy (Crucial)

If you tell an AI, _"Build a Muse Dash clone,"_ it will hallucinate a massive, broken file. You must act as the **Director**, giving the AI one specific "Scene" to build at a time.

Here is your exact roadmap for prompting the AI, step-by-step:

#### Phase 1: The Setup

- **Prompt to AI:** _"I want to build a 2D web game using Vite and Phaser 3. Please set up the `package.json`, the `index.html`, and a basic `main.js` configuration with a canvas size of 1280x720. Just render a black screen to start."_

#### Phase 2: Asset Loading

- **Prompt to AI:** _"Create a `Preloader.js` scene. I have assets in `/public/assets/`. Please write the Phaser code to load `player_spritesheet.png`, `enemy.png`, and `track1.mp3`. Once loaded, transition to a `GamePlay.js` scene."_

#### Phase 3: The Conveyor Belt (The World)

- **Prompt to AI:** _"In `GamePlay.js`, do not add the player yet. I want to create the 'conveyor belt' effect. Create a scrolling background. Then, create a system that spawns an `Enemy` sprite off-screen to the right and moves it to the left at a constant speed of 400 pixels per second. When the enemy goes off-screen to the left, destroy it."_

#### Phase 4: The Player & The Spatial Trick

- **Prompt to AI:** _"Add the Player sprite to the left side of the screen. Now, implement the 'Spatial Trick'. Read an array like `[1, 0, 0, 1, 1]` where 1 is an enemy and 0 is an empty space. Based on our scrolling speed of 400px/s, spawn enemies spaced out so they reach the player exactly to a 120 BPM rhythm."_

#### Phase 5: Hit Detection & Audio

- **Prompt to AI:** _"Let's add input. When I tap the right side of the screen or press 'F', check if an Enemy is currently overlapping a specific 'Strike Zone' in front of the Player. If yes, destroy the enemy, play `hit.mp3`, and show 'Perfect'. If no enemy is there, play a miss sound."_

By forcing the AI to build the scrolling world _first_, then adding the player, and finally adding the hit detection, you ensure the engine remains stable and entirely within your control.

Are your sprites separate images, or are they packed into "sprite sheets" (one image with multiple animation frames)? We'll need to tell the AI how to handle them.

Handling a rhythm platformer map requires translating musical timing (beats) into physical space (pixels). Instead of telling the engine _when_ an enemy should appear, you tell it _where_ the enemy should be placed in the world before the level even starts.

Here is the exact architecture and math you and your AI agent should use to handle the map in Phaser 3.

---

### 1. The Level Data Structure (JSON)

Don't use a massive string of `[0, 1, 0, 0]` arrays. That gets messy quickly. Instead, use a JSON file where you define enemies by their **Beat Number**.

Create a file like `track1.json` in your `/public/levels/` folder:

```json
{
  "song": "cyber_track",
  "bpm": 120,
  "scrollSpeed": 400,
  "offset": 2.5,
  "enemies": [
    { "beat": 4, "type": "ground" },
    { "beat": 5, "type": "air" },
    { "beat": 5.5, "type": "ground" },
    { "beat": 6, "type": "ground" },
    { "beat": 8, "type": "boss" }
  ]
}
```

- **`scrollSpeed`**: How fast the world moves left (pixels per second).
- **`offset`**: The physical distance (in pixels) from the spawn point to the player's Hit Zone.
- **`beat: 5.5`**: You can easily do half-beats for faster rhythms!

### 2. The Golden Math Formula (Time to Distance)

To place these enemies in the Phaser world, your game needs to know exactly how much physical space exists between each beat.

**The Formula:**

1.  **Seconds per Beat** = `60 / BPM` _(If BPM is 120, one beat is 0.5 seconds)._
2.  **Pixels per Beat** = `scrollSpeed * Seconds per Beat` _(400px _ 0.5s = 200 pixels).\*

This means every single beat in your song is exactly **200 pixels** apart on your game map!

### 3. Spawning the Map (The Code Logic)

When your `GamePlay.js` scene starts, tell your AI agent to run a "Map Builder" function. It will read the JSON, loop through the enemies, and place them on the X-axis using that Golden Math Formula.

Here is the conceptual logic you should ask the AI to implement:

```javascript
// Inside your Phaser Scene's create() method:

const level = this.cache.json.get("track1"); // Load the JSON
const secondsPerBeat = 60 / level.bpm;
const pixelsPerBeat = level.scrollSpeed * secondsPerBeat;

// The X coordinate where the player's "Hit Zone" is located
const playerX = 200;

// Loop through the JSON and spawn the enemies
level.enemies.forEach((enemyData) => {
  // Calculate exact starting position
  // (Beat Number * Distance Per Beat) + Player Position + Audio Offset
  let spawnX = enemyData.beat * pixelsPerBeat + playerX + level.offset;

  let spawnY = enemyData.type === "air" ? 300 : 500; // High or Low

  // Tell Phaser to create the enemy sprite at that exact location
  let enemy = this.physics.add.sprite(spawnX, spawnY, "enemy_sprite");

  // Tell Phaser to move the enemy left at the constant scroll speed
  enemy.setVelocityX(-level.scrollSpeed);
});
```

### 4. The Hit Detection (The Strike Zone)

Because everything was placed using exact math, you don't need complex timestamp hit-detection anymore!

Your player stays at `X: 200`. You just place an invisible "Strike Zone" box slightly in front of them.
When the player taps the screen:

1.  Check if any Enemy sprite's bounding box is currently overlapping the Strike Zone's bounding box.
2.  If they overlap perfectly in the center -> **Perfect!**
3.  If they overlap on the edges -> **Good!**
4.  If the player taps and nothing is overlapping -> **Miss.**

### How to prompt your AI Agent for this:

_"I have a `track1.json` file with `bpm`, `scrollSpeed`, and an array of enemies with a `beat` property. Write a function in my `GamePlay` scene that calculates the `pixelsPerBeat`. Then, iterate through the JSON array and instantiate a Phaser physics sprite for each enemy, setting its starting X coordinate based on its beat number multiplied by `pixelsPerBeat`. Set their velocity to move left at the `scrollSpeed`."_

This approach makes level design incredibly easy. You just listen to your song, count the beats (1, 2, 3, 4), and type them into your JSON file!
