import Phaser from 'phaser';
import { VoiceKeys, MusicKeys, SfxKeys } from '../config/assets';
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

    // Load SFX
    this.load.audio(SfxKeys.Hit, 'assets/audio/sfx/fx/twoTone1.ogg'); 
    this.load.audio(SfxKeys.Miss, 'assets/audio/sfx/fx/tone1.ogg'); 
    this.load.audio(SfxKeys.GroundAttack, 'assets/audio/sfx/fx/lowDown.ogg');
    this.load.audio(SfxKeys.AirAttack, 'assets/audio/sfx/fx/highUp.ogg');
    this.load.audio(MusicKeys.Track1, 'assets/audio/music/track1.mp3');
  }

  create() {
    // Generate a white pixel texture for __WHITE if Phaser doesn't provide it reliably in this version
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
