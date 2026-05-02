# Asset Sources & Placeholder Guide

Where to find free/CC0 art, fonts, and audio for the Two-Lane Rhythm Runner.

---

## 1. Parallax Backgrounds

Your `ParallaxManager` expects tileable PNGs across 3 speed tiers (slow/medium/fast).  
Drop files into `public/assets/backgrounds/shared/` or `public/assets/backgrounds/levels/<setId>/`.

| Source | URL | Details | License |
|--------|-----|---------|---------|
| **Kenney — Background Elements Remastered** | https://kenney.nl/assets/background-elements-remastered | 90 modular pieces (hills, clouds, trees, mountains). Build your own layers. | CC0 — no attribution |
| **ansimuz — Parallax Forest** | https://ansimuz.itch.io/parallax-forest | Layered seamless 16-bit pixel art forest. PSD included. | CC-BY 4.0 |
| **Digital Moons — Forest BG** | https://digitalmoons.itch.io/parallax-forest-background | Hand-painted 1920×1080 seamless forest, separate PNG layers. | Free commercial (credit required) |
| **vnitti — Glacial Mountains** | https://vnitti.itch.io/glacial-mountains-parallax-background | 6+ pixel art layers, seamless. PSD included. | Free (name your price) |
| **RavenTale — Nature Parallax** | https://raventale.itch.io/parallax-background | 22 transparent PNGs + PSD, 2048×1546. Matches their Nature Tile Set. | Free (name your price) |
| **Free Game Assets — Parallax 2D** | https://free-game-assets.itch.io/free-parallax-2d-backgrounds | 1920×1080 PNGs with separate layers (desert, forest, cave, winter). | Free commercial |
| **Hollow Pixel — Space Parallax v1** | https://hollow-pixel.itch.io/space-parallax-bgs-v1 | 60 layers, 4 palettes, 1920×1080, 3-tier naming (far/mid/near). Includes test program. | Free commercial, no attribution |
| **Myaumya — Night Sky** | https://myaumya.itch.io/night-sky-paralax | 4 parallax-ready layers, 1280×360 pixel art. | Free commercial (no redistribution) |
| **saukgp — The Dawn** | https://saurabhkgp.itch.io/the-dawn-parallax-background | 1920×1080 layered dawn scene. | Free (credit appreciated) |
| **Alina_ino — FREE Background Parallax** | https://kelench.itch.io/free-background-paralax | Transparent PNG layers, pixel art. | Free commercial |

### Browse more

- **itch.io parallax tag (214+ free results):** https://itch.io/game-assets/free/tag-parallax
- **ansimuz full catalog:** https://ansimuz.itch.io (Backgrounds section — dozens of free parallax packs)
- **OpenGameArt backgrounds:** https://opengameart.org/art-search-advanced?keys=parallax&type=art2d

---

## 2. Fonts & Text

The game uses Phaser `this.add.text()` for score/combo/UI. For pixel-perfect rendering, switch to BitmapText.

### Ready-to-use Bitmap Fonts (PNG + XML for Phaser)

| Source | URL | Details | License |
|--------|-----|---------|---------|
| **Peaberry Pixel Font** | https://emhuo.itch.io/peaberry-pixel-font | Clean bold pixel font. Includes `.png` + `.xml` bitmap font files. Mono, regular, double variants. | Free, no attribution needed |
| **Kenney Fonts (already in project)** | `public/assets/ui/keybm/Fonts/` and `public/assets/ui/touch/Fonts/` | Bitmap font spritesheets bundled with Input Prompts pack. Check these first! | CC0 |
| **frostyfreeze — Pixel Bitmap Fonts** | https://frostyfreeze.itch.io/pixel-bitmap-fonts | PNG + XML bitmap fonts for Phaser. | Free |

### TTF/OTF Pixel Fonts (convert to bitmap with tools below)

| Source | URL | Details | License |
|--------|-----|---------|---------|
| **Pixellari** | https://github.com/zedseven/Pixellari | Simple pixel font, TTF. Used in A Short Hike, PAYDAY 2 text adventure. | Free (credit requested) |
| **NF-Pixels** | https://github.com/sgigou/NF-Pixels | Minimalist pixel TTF/OTF. Covers western european. | Free |
| **Eight Beats** | https://ifonts.xyz/eight-beats-pixel-font.html | Pixel font for games/retro projects. | Free |

### Bitmap Font Tools

| Tool | URL | Notes |
|------|-----|-------|
| **SnowB BMF** | https://snowb.org/ | Web-based. Upload TTF → export PNG + XML for Phaser. |
| **BMFont** | https://www.angelcode.com/products/bmfont/ | Windows, free. Industry standard. Exports `.fnt` (rename to `.xml`). |
| **Littera** | http://kvazars.com/littera/ | Web-based (Flash). Quick bitmap font generation. |
| **phaser3-bitmapfont-factory** | https://github.com/jjcapellan/phaser3-bitmapfont-factory | Runtime generation from any browser font. No build step needed. |

### How to use BitmapText in Phaser 3

```js
// PreloaderScene.js
this.load.bitmapFont('pixelfont', 'assets/fonts/pixelfont.png', 'assets/fonts/pixelfont.xml');

// GameScene.js
this.scoreText = this.add.bitmapText(640, 30, 'pixelfont', 'SCORE: 0', 24);
this.scoreText.setOrigin(0.5, 0);
```

---

## 3. Keyboard / Input Prompt Icons

**Already in project** at `public/assets/ui/`:

```
keybm/Default/   → 243 PNG (64×64) keyboard keys
keybm/Vector/    → 243 SVG equivalents
keybm/Double/    → 128×128 variants
keybm/Fonts/     → Bitmap font sheets
touch/Default/   → 28 PNG touch gesture icons
touch/Vector/    → 28 SVG equivalents
touch/Fonts/     → Bitmap font sheets
```

Source: **Kenney Input Prompts** — https://kenney.nl/assets/input-prompts (CC0)

Pixel variant available: https://kenney.nl/assets/input-prompts-pixel-16 (16×16, CC0)

---

## 4. Enemy & Player Sprites

Your manifests expect spritesheets in `public/assets/sprites/enemies/` and `public/assets/sprites/player/`.

| Source | URL | What you get | License |
|--------|-----|--------------|---------|
| **ansimuz — Sunny Land** | https://ansimuz.itch.io/sunny-land-pixel-game-art | Full 2D platformer pack: characters, enemies, tiles, FX | Free |
| **ansimuz — Warped Chibi Robot** | https://ansimuz.itch.io/warped | Sci-fi characters + enemies + environment | Free |
| **ansimuz — Legacy Collection** | https://ansimuz.itch.io/gothicvania-patreon-collection | Massive free 16-bit pixel art bundle | Free |
| **Kenney — All-in-1 Bundle** | https://kenney.itch.io/kenney-game-assets | 60,000+ assets ($20). Characters, enemies, tiles, UI, audio. | CC0 |
| **0x72 — DungeonTileset II** | https://0x72.itch.io/dungeontileset-ii | Animated characters + enemies, 16×16 | CC0 |
| **Pixel Frog — Pixel Adventure** | https://pixelfrog-assets.itch.io/pixel-adventure-1 | Platformer characters + enemies with animations | Free |

---

## 5. VFX / Hit Effects

For judgment feedback (Perfect/Good/Miss flashes, particles):

| Source | URL | What | License |
|--------|-----|------|---------|
| **ansimuz — Explosion Packs** | https://ansimuz.itch.io (search "explosion") | 16+ packs of animated pixel explosions/magic effects | Free |
| **Kenney — Particle Pack** | https://kenney.nl/assets/particle-pack | 52 particle sprites (circles, stars, sparks) | CC0 |

---

## 6. Audio (SFX + Music)

| Source | URL | What | License |
|--------|-----|------|---------|
| **Kenney — Interface Sounds** | https://kenney.nl/assets (search "interface") | UI clicks, confirms, errors | CC0 |
| **Kenney — Impact Sounds** | https://kenney.nl/assets (search "impact") | Hit/miss feedback | CC0 |
| **Freesound.org** | https://freesound.org | Massive CC0/CC-BY SFX library | Varies per file |
| **OpenGameArt — Music** | https://opengameart.org/art-search-advanced?type=music | Loops, themes, rhythm tracks | Varies (filter by CC0) |
| **Kevin MacLeod** | https://incompetech.com/music/ | Royalty-free music loops | CC-BY 3.0 |

---

## 7. UI Elements (buttons, panels, HUD frames)

| Source | URL | What | License |
|--------|-----|------|---------|
| **Kenney — UI Pack** | https://kenney.nl/assets/ui-pack | Buttons, panels, sliders, checkboxes | CC0 |
| **Kenney — UI Pack Pixel Adventure** | https://kenney.nl/assets/ui-pack-pixel-adventure | Pixel art UI elements | CC0 |
| **Kenney — UI Pack Sci-Fi** | https://kenney.nl/assets/ui-pack-sci-fi | Futuristic UI elements | CC0 |

---

## Quick-Start Checklist

1. **Check existing Kenney fonts** in `public/assets/ui/keybm/Fonts/` — may already have usable bitmap font sheets
2. **Download ansimuz Parallax Forest** → slice into 7 layers → rename to match `forest-day.json` manifest keys
3. **For enemy/player sprites:** grab Pixel Frog or ansimuz Sunny Land packs → export spritesheets matching your manifest frame counts
4. **For text:** use SnowB BMF (https://snowb.org/) to convert any TTF to Phaser-ready PNG+XML

---

## License Summary

| License | What it means |
|---------|---------------|
| **CC0** | Do anything. No attribution. No restrictions. |
| **CC-BY 4.0** | Free commercial use. Must credit the author. |
| **CC-BY 3.0** | Same as above, older version. |
| **"Free, credit appreciated"** | Technically no legal requirement, but be nice. |

---

*Last updated: auto-generated during development session*
