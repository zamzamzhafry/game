# Designer Handoff

## Project snapshot

- **Project**: browser rhythm-runner prototype
- **Engine**: Phaser 3 + Vite
- **Canvas**: 1280x720 landscape
- **Current gameplay model**: deterministic two-lane rhythm timing
- **Current controls**:
  - `F` = ground lane action
  - `J` = air lane action
  - `P` / `Esc` = pause toggle
  - `D` = debug overlay toggle

This document is for a visual designer, mockup artist, or Illustrator-capable asset agent. It describes what is already implemented, what is placeholder-only, and what visual deliverables are needed next.

## Current playable structure

The prototype already has these screens:

1. **Main Menu**
2. **Gameplay Scene**
3. **Pause Overlay**
4. **Game Over / Run Finished**

The gameplay loop is already functional. Notes/enemies spawn from beatmap timing, move toward a strike zone, and are judged by timing windows. Visual work must not change the underlying timing model.

## Non-negotiable gameplay constraints

These should be treated as fixed unless engineering explicitly says otherwise:

- The player is anchored on the left side of the screen, roughly **20% from the left edge**.
- The game has exactly **two lanes**:
  - **Ground lane**
  - **Air lane**
- The note/enemy projection is time-based, not physics-based.
- Hit timing is deterministic:
  - **Perfect**: ±50ms
  - **Good**: ±100ms
  - **Miss**: beyond that window
- Current countdown contract is **4 beats / 4 spoken tokens**:
  - `3`, `2`, `1`, `go`
- Gameplay currently uses a **15-second dummy level**.

## Current visual state

The current build is intentionally in a **placeholder phase**.

### Important direction for now

For the current prototype, **player and enemy presentation should stay as gradient placeholder boxes**, not final character art.

This is intentional. The current goal is to:

- validate layout
- validate visual readability
- validate HUD hierarchy
- validate lane clarity
- validate attack-state communication

before final art is dropped in.

## Current placeholder language

The prototype currently uses scaled white sprites with tint gradients as placeholder boxes.

### Player placeholder states

- **Idle / Run**: cyan-to-darker-cyan gradient
- **Ground action**: orange-to-darker-orange gradient
- **Air action**: magenta-to-darker-magenta gradient
- **Miss feedback**: red flash

### Enemy placeholder states

- **Ground enemy**: red gradient box
- **Air enemy**: blue gradient box

### Current placeholder UI

- Score text
- Combo text
- Judgment popup text
- Ground input button placeholder
- Air input button placeholder
- Pause button placeholder
- Pause overlay placeholder
- Optional debug overlay

## Visual goals for the next design pass

The next design pass should focus on **readability, hierarchy, and identity**, not on changing gameplay logic.

### Priority goals

1. Make the two lanes instantly readable.
2. Make the strike zone visually obvious.
3. Make ground vs air actions feel distinct.
4. Make the input prompts and pause control feel like part of one unified HUD system.
5. Preserve a strong "neon-prehistoric arcade" tone.

## Art direction

Use the previous design guidance as inspiration, but adapt it to the actual prototype state.

### Tone

- Neon-prehistoric
- Arcade clarity first
- Dark background, bright gameplay accents
- Strong contrast between gameplay-critical objects and decorative elements

### Suggested palette direction

- **Ground lane / grounded actions**: cyan, teal, electric green
- **Air lane / aerial actions**: magenta, pink, violet
- **Danger / miss / fail**: red, hot orange
- **Neutral HUD surfaces**: charcoal, slate, muted blue-gray
- **Accent highlights**: white, pale yellow

### Composition guidance

- Keep the player region visually stable and readable.
- Keep the strike zone slightly forward of the player.
- Avoid noisy center-screen UI during active timing moments.
- Keep pause and input prompts readable but secondary to notes approaching the hit line.

## What exists in assets right now

These assets exist in the repo, but they are **not the current visual source of truth** for gameplay presentation.

### Existing sprite folders

- `public/assets/sprites/player/dino/`
- `public/assets/sprites/enemies/ground-enemies/`
- `public/assets/sprites/enemies/flying-enemies/`
- `public/assets/sprites/enemies/small-enemies/`

### Existing player sprite states

- `Idle`
- `Run`
- `Walk`
- `Jump`
- `Dead`

### Important limitation

There is **no true final attack set** yet for:

- ground strike
- air strike
- hurt/react
- transition states

That is why the prototype is currently using state-colored placeholder boxes instead of pretending the current sprite set is final.

## Audio cues already available

These exist and can inform motion language / mockups:

- Countdown voice clips: `3`, `2`, `1`, `go`
- Hit cue
- Miss cue
- Ground-action cue
- Air-action cue

You do not need to redesign the sound system. Just account for the fact that different actions already have different audio identities.

## HUD and interface deliverables needed next

The most valuable design deliverables now are:

### 1. Gameplay HUD mockup

Include:

- score placement
- combo placement
- judgment popup behavior
- input prompt placement
- pause button placement
- strike zone visual treatment

### 2. Pause overlay mockup

Current pause is a basic dark overlay with text. A better placeholder/finalized pause composition is needed.

Recommended contents:

- Resume
- Restart
- Quit / Back to Menu

### 3. Placeholder style system

Define a consistent visual system for temporary prototype shapes:

- player box shape
- enemy box shape per lane
- button shapes
- hover/press states
- judgment feedback styles

This should feel intentional, not like random debug blocks.

### 4. Future final-art handoff targets

When the prototype is ready to leave the placeholder phase, the next asset requirements will likely be:

- player idle/run/ground-attack/air-attack/hurt/death set
- ground enemy set
- air enemy set
- lane/strike-zone visuals
- HUD skin
- pause modal art
- background layers / parallax concepts

## What is out of scope for the designer

Please do **not** change or assume changes to:

- BPM or timing rules
- lane count
- control mapping
- hit windows
- note projection math
- game architecture
- debug overlay content

Debug overlay is an engineering tool. It does not need final art treatment.

## Recommended mockup package

If you are producing design output, the ideal package is:

1. **Gameplay HUD mockup** at 1280x720
2. **Pause screen mockup** at 1280x720
3. **State sheet** for placeholder visuals:
   - idle/run
   - ground action
   - air action
   - miss
   - ground enemy
   - air enemy
   - button normal / hover / pressed
4. **Short notes** on spacing, scale, and color intent

## Engineering-friendly notes

If you hand back designs to engineering, annotate these clearly:

- pixel dimensions of gameplay objects
- safe margins for HUD
- exact strike-zone placement
- layer order
- animation intent
- which elements are temporary placeholders vs final production art

## One-sentence summary

Design around a **small left-anchored player, two clean lanes, bright gradient placeholder states, clear score/combo/judgment HUD, visible input prompts, and a readable pause experience**, while leaving the deterministic rhythm logic untouched.
