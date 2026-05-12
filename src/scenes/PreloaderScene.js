import Phaser from 'phaser';
import {
  VoiceKeys, MusicKeys, SfxKeys, UiKeys,
  JingleKeys, ParticleKeys, LaserKeys,
  FontKeys, BgImageKeys, FeverKeys
} from '../config/assets';
import {
  normalizeAssetManifest,
  collectManifestImageFiles,
  collectManifestAnimations
} from '../utils/manifestUtils.js';

const PLAYER_MANIFEST_KEY = 'player-manifest';
const ENEMY_MANIFEST_KEY = 'enemy-manifest';

export class PreloaderScene extends Phaser.Scene {
  constructor() {
    super('PreloaderScene');
  }

  preload() {
    const { width, height } = this.scale;

    this.load.json('level-index', 'levels/index.json');
    this.load.json('track1-chart', 'levels/track1.json');
    this.load.json(PLAYER_MANIFEST_KEY, 'data/manifests/player-manifest.json');
    this.load.json(ENEMY_MANIFEST_KEY, 'data/manifests/enemy-manifest.json');

    this.add
      .text(width * 0.5, height * 0.5, 'Loading...', {
        fontFamily: 'Arial',
        fontSize: '42px',
        color: '#ffffff'
      })
      .setOrigin(0.5);

    const voicePack = 'Female';
    this.load.audio(VoiceKeys.Ready, `assets/audio/voice/${voicePack}/ready.ogg`);
    this.load.audio(VoiceKeys.Set, `assets/audio/voice/${voicePack}/set.ogg`);
    this.load.audio(VoiceKeys.Go, `assets/audio/voice/${voicePack}/go.ogg`);
    this.load.audio(VoiceKeys.One, `assets/audio/voice/${voicePack}/1.ogg`);
    this.load.audio(VoiceKeys.Two, `assets/audio/voice/${voicePack}/2.ogg`);
    this.load.audio(VoiceKeys.Three, `assets/audio/voice/${voicePack}/3.ogg`);
    this.load.audio(VoiceKeys.GameOver, `assets/audio/voice/${voicePack}/game_over.ogg`);
    this.load.audio(VoiceKeys.YouWin, `assets/audio/voice/${voicePack}/you_win.ogg`);
    this.load.audio(VoiceKeys.NewHighscore, `assets/audio/voice/${voicePack}/new_highscore.ogg`);

    this.load.audio(SfxKeys.Hit, 'assets/audio/sfx/fx/twoTone1.ogg');
    this.load.audio(SfxKeys.Miss, 'assets/audio/sfx/fx/tone1.ogg');
    this.load.audio(SfxKeys.GroundAttack, 'assets/audio/sfx/fx/lowDown.ogg');
    this.load.audio(SfxKeys.AirAttack, 'assets/audio/sfx/fx/highUp.ogg');
    this.load.audio(SfxKeys.LaserShoot, 'assets/audio/sfx/fx/laserSmall_001.ogg');
    this.load.audio(SfxKeys.UiClick, 'assets/audio/sfx/fx2/click_002.ogg');
    this.load.audio(SfxKeys.UiConfirm, 'assets/audio/sfx/fx2/confirmation_002.ogg');
    this.load.audio(SfxKeys.UiBack, 'assets/audio/sfx/fx2/back_001.ogg');

    this.load.audio(MusicKeys.Track1, 'assets/audio/music/track1.mp3');
    this.load.audio(MusicKeys.FeverLayer, 'assets/audio/music/fever-layer.wav');
    this.load.audio(JingleKeys.Win, 'assets/audio/sfx/music/8-Bit jingles/jingles_NES00.ogg');
    this.load.audio(JingleKeys.Lose, 'assets/audio/sfx/music/8-Bit jingles/jingles_NES04.ogg');

    this.load.bitmapFont(
      FontKeys.Peaberry,
      'assets/ui/fonts/Peaberry-Font-v2.0/Peaberry Bitmap Fonts/1. WhitePeaberry/WhitePeaberry.png',
      'assets/ui/fonts/Peaberry-Font-v2.0/Peaberry Bitmap Fonts/1. WhitePeaberry/WhitePeaberry.xml'
    );

    this.load.image(BgImageKeys.Forest, 'assets/backgrounds/Backgrounds/backgroundForest.png');
    this.load.image(BgImageKeys.Castles, 'assets/backgrounds/Backgrounds/backgroundCastles.png');
    this.load.image(BgImageKeys.Desert, 'assets/backgrounds/Backgrounds/backgroundDesert.png');

    this.load.image(UiKeys.KeyZ, 'assets/ui/keybm/Default/keyboard_z.png');
    this.load.image(UiKeys.KeyA, 'assets/ui/keybm/Default/keyboard_a.png');
    this.load.image(UiKeys.KeyD, 'assets/ui/keybm/Default/keyboard_d.png');
    this.load.image(UiKeys.KeyQ, 'assets/ui/keybm/Default/keyboard_q.png');
    this.load.image(UiKeys.TouchTap, 'assets/ui/touch/Default/touch_tap.png');
    this.load.image(FeverKeys.ComboBurst0, 'assets/ui/comboburst/comboburst-0.png');
    this.load.image(FeverKeys.ComboBurst1, 'assets/ui/comboburst/comboburst-1.png');
    this.load.image(FeverKeys.ComboBurst2, 'assets/ui/comboburst/comboburst-2.png');

    this.load.image(ParticleKeys.Circle01, 'assets/particles/PNG (Transparent)/circle_01.png');
    this.load.image(ParticleKeys.Circle02, 'assets/particles/PNG (Transparent)/circle_02.png');
    this.load.image(ParticleKeys.Star01, 'assets/particles/PNG (Transparent)/star_01.png');
    this.load.image(ParticleKeys.Flare01, 'assets/particles/PNG (Transparent)/flare_01.png');
    this.load.image(ParticleKeys.Spark01, 'assets/particles/PNG (Transparent)/spark_01.png');
    this.load.image(ParticleKeys.Smoke01, 'assets/particles/PNG (Transparent)/smoke_01.png');

    this.load.image(LaserKeys.Blue1, 'assets/particles/attack/PNG/laserBlue01.png');
    this.load.image(LaserKeys.Blue2, 'assets/particles/attack/PNG/laserBlue02.png');
    this.load.image(LaserKeys.BlueBurst, 'assets/particles/attack/PNG/laserBlue_burst.png');
    this.load.image(LaserKeys.Green1, 'assets/particles/attack/PNG/laserGreen01.png');
    this.load.image(LaserKeys.Green2, 'assets/particles/attack/PNG/laserGreen02.png');
    this.load.image(LaserKeys.GreenBurst, 'assets/particles/attack/PNG/laserGreen_burst.png');
    this.load.image(LaserKeys.Pink1, 'assets/particles/attack/PNG/laserPink01.png');
    this.load.image(LaserKeys.PinkBurst, 'assets/particles/attack/PNG/laserPink_burst.png');
  }

  create() {
    if (!this.textures.exists('__WHITE')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 1, 1);
      g.generateTexture('__WHITE', 1, 1);
    }

    const playerManifest = normalizeAssetManifest(this.cache.json.get(PLAYER_MANIFEST_KEY), PLAYER_MANIFEST_KEY);
    const enemyManifest = normalizeAssetManifest(this.cache.json.get(ENEMY_MANIFEST_KEY), ENEMY_MANIFEST_KEY);
    const manifestImages = [
      ...collectManifestImageFiles(playerManifest),
      ...collectManifestImageFiles(enemyManifest)
    ];
    const manifestAnimations = [
      ...collectManifestAnimations(playerManifest),
      ...collectManifestAnimations(enemyManifest)
    ];

    this.registry.set(PLAYER_MANIFEST_KEY, playerManifest);
    this.registry.set(ENEMY_MANIFEST_KEY, enemyManifest);

    let queuedAssets = 0;
    for (const image of manifestImages) {
      if (!this.textures.exists(image.key)) {
        this.load.image(image.key, image.path);
        queuedAssets += 1;
      }
    }

    const finalize = () => {
      for (const animation of manifestAnimations) {
        if (this.anims.exists(animation.key)) {
          continue;
        }
        this.anims.create(animation);
      }
      this.scene.start('MainMenuScene');
    };

    if (queuedAssets > 0) {
      this.load.once(Phaser.Loader.Events.COMPLETE, finalize);
      this.load.start();
      return;
    }

    finalize();
  }
}
