To ensure your AI agent (like Cursor or Windsurf) builds the game exactly as we've designed it, you need to provide it with a high-level "Source of Truth."

Below is a structured AI Agent Handover Document in Markdown. You can copy and paste this into a file named AI_HANDOVER.md or directly into your AI chat to set the stage.

Project Dino Dash: Technical & Art Handover

1. Project Vision
   A 2D landscape rhythm-runner inspired by Muse Dash. The game features a T-Rex protagonist running through a neon-prehistoric world.

Platform: Web (Phaser 3 + Vite)
Controls: F (Ground Attack/Jump), J (Air Attack)
Art Direction: "Neon-Prehistoric." High-contrast, vibrant colors (pinks, cyans, oranges) against dark prehistoric backgrounds. Character and enemies should have thick outlines and an arcade-style polish. 2. Component Skeleton Structure
The AI should follow this architecture to keep logic (Model) and visuals (View) separate.

Core Models (Logic)
Conductor.js: Tracks the song time and manages the BPM clock.
BeatmapModel.js: Parses the JSON track data into millisecond hit-times.
JudgmentModel.js: Evaluates hits (Perfect: ±50ms, Good: ±100ms, Miss: >100ms).
StateModel.js: Manages HP, Score, Combo, and "Ultimate State" charge.
Views (Phaser Objects)
PlayerView.js: Handles T-Rex animations (Idle, Ground Attack, Air Attack, Hurt).
EnemyView.js: Represents the scrolling notes/enemies.
ParallaxBackground.js: Manages the multi-layered scrolling prehistoric landscape.
HUDView.js: Renders the Combo Bar, Score, Health, and the "Ultimate State" Gauge. 3. Design Guidance (Pre-Asset Phase)
Before we drop final art, the AI must implement the following UI/UX features based on the design mockups:

Landscape Layout: 1280x720 fixed aspect ratio.
Player Anchor: T-Rex fixed on the left side (approx 20% from the left edge).
Strike Zone: A visible "Hit Zone" indicator in front of the T-Rex.
Ultimate State (Streak Mode):
When the gauge is full, the screen should trigger a visual "Fever Mode."
UI Change: Add a neon glowing border around the camera.
Gameplay: Multiply score by 2x.
Pause & Result Screens:
Pause: Semi-transparent overlay with Resume, Restart, Quit.
Results: Full-screen grade (S/A/B) with a stats table (Perfect/Good/Miss). 4. Human Guidance & Art Direction
Direct the AI to use these specific visual cues for placeholders until final assets are ready:

Colors: Use #FF00FF (Neon Pink) for Air lanes and #00FFFF (Cyan) for Ground lanes.
Placeholders: Use simple 2D shapes:
Player: Large Green Rectangle.
Ground Enemy: Red Square.
Air Enemy: Purple Circle.
Feedback: When a 'Perfect' hit occurs, the AI should spawn a text popup that floats upward and fades out.
Ultimate State: The background tint should shift from dark blues to deep purples/reds to signal the "Fever" intensity. 5. Next Steps for AI Agent
Initialize the Phaser 3 + Vite project.
Build the Conductor.js timing engine using AudioContext or Phaser.Sound.BaseSound.
Implement the Spatial Projection formula: x = hitLineX + (noteTime - currentTime) \* scrollSpeed.
Create the input controller for F and J keys.
How to use this with your AI:
Initialize: "Hey, I'm building a rhythm game. Read this AI_HANDOVER.md for the architecture and design rules."
Build the Core: "Start with Phase 1 and 2 from the implementation plan. Set up the Vite project and the basic Phaser scenes."
Reference the Designs: "For the HUD and Ultimate State, refer to the descriptions in our design phase: T-Rex on the left, Combo bar at the top, and a neon overlay for Streak mode."
