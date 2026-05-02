import Phaser from 'phaser';
import { Conductor } from '../models/Conductor.js';
import { LaneModel, LANE_TYPES } from '../models/LaneModel.js';
import { JudgmentModel } from '../models/JudgmentModel.js';
import { ScoreModel } from '../models/ScoreModel.js';
import { GameSessionController } from '../controllers/GameSessionController.js';
import { buildFinalResultsPayload } from '../services/buildFinalResultsPayload.js';
import {
  VoiceKeys, MusicKeys, SfxKeys, UiKeys,
  ParticleKeys, LaserKeys, FontKeys
} from '../config/assets.js';
import { ParallaxManager } from '../views/ParallaxManager.js';
import { getStateManifestKey, getAnimationManifestKey } from '../utils/manifestUtils.js';

const VOLUME = {
  MUSIC: 0.6,
  SFX_HIT: 0.5,
  SFX_MISS: 0.5,
  SFX_GROUND_ATTACK: 0.35,
  SFX_AIR_ATTACK: 0.35,
  SFX_LASER: 0.25,
  VOICE: 0.7,
  MUSIC_FADE_IN_MS: 500,
  MUSIC_FADE_OUT_MS: 800,
};

const PLAYER_SCALE = 1.4;
const ENEMY_SCALE = 1.2;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    this.trackKey = 'track1';
    this.sessionController = null;
    this.conductor = null;
    this.scoreModel = null;
    this.lastJudgment = 'None';
    this.lastHitLane = LANE_TYPES.GROUND;
    this.debugText = null;
    this.countdownText = null;

    this.gameState = 'INIT';
    this.stateBeforePause = null;

    this.playerSprite = null;
    this.enemyPool = [];
    this.activeEnemies = [];
    this.musicTrack = null;
    this.parallax = null;

    this.PLAYER_X = 150;
    this.GROUND_Y = 0;
    this.AIR_Y = 0;
    this.HIT_X = 200;
    this.scrollSpeed = 400;

    this.GROUND_ATTACK_DUR_MS = 150;
    this.AIR_ATTACK_DUR_MS = 300;
  }

  init(data) {
    if (data?.trackKey) {
      this.trackKey = data.trackKey;
    }
  }

  create() {
    const { width, height } = this.scale;
    const useBitmapFont = this.cache.bitmapFont.has(FontKeys.Peaberry);

    this.GROUND_Y = height * 0.7;
    this.AIR_Y = height * 0.45;

    const chartKey = `${this.trackKey}-chart`;
    const rawBeatmap = this.cache.json.get(chartKey);
    this.scrollSpeed = rawBeatmap.scrollSpeed || 400;

    this.parallax = new ParallaxManager(this);
    const bgSetId = this.registry.get('selectedBgSet') || rawBeatmap.backgroundSetId || 'forest-day';
    this.parallax.loadSet(bgSetId).then(() => {
      this.parallax.createLayers();
    });

    this.sessionController = new GameSessionController(rawBeatmap);
    this.conductor = new Conductor();
    this.scoreModel = new ScoreModel();
    this.lastJudgment = 'None';
    this.lastHitLane = LANE_TYPES.GROUND;
    this.gameState = 'INIT';

    this.enemyPool = [];
    this.activeEnemies = [];

    this.musicTrack = this.sound.get(MusicKeys.Track1) ?? this.sound.add(MusicKeys.Track1, {
      loop: false,
      volume: 0
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.musicTrack) {
        this.musicTrack.stop();
      }
      if (this.parallax) {
        this.parallax.destroy();
        this.parallax = null;
      }
    });

    this.guideGraphics = this.add.graphics();
    this.drawGameplayGuides(width, height);

    this._createPlayerSprite();

    if (useBitmapFont) {
      this.scoreText = this.add.bitmapText(20, 20, FontKeys.Peaberry, 'SCORE: 0', 28)
        .setTint(0xffffff).setDepth(40);
      this.comboText = this.add.bitmapText(20, 54, FontKeys.Peaberry, 'COMBO: 0', 24)
        .setTint(0xffd166).setDepth(40);
      this.judgmentText = this.add.bitmapText(this.HIT_X, this.GROUND_Y - 90, FontKeys.Peaberry, '', 32)
        .setOrigin(0.5).setDepth(30).setTint(0x00ff00);
    } else {
      this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
        fontFamily: 'Arial', fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
      }).setDepth(40);
      this.comboText = this.add.text(20, 54, 'COMBO: 0', {
        fontFamily: 'Arial', fontSize: '24px', color: '#ffd166', fontStyle: 'bold'
      }).setDepth(40);
      this.judgmentText = this.add.text(this.HIT_X, this.GROUND_Y - 90, '', {
        fontFamily: 'Arial', fontSize: '32px', color: '#00ff00', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(30).setStroke('#000000', 6);
    }

    this._createInputHints(width, height, useBitmapFont);
    this._createTopRightControls(width, useBitmapFont);
    this.createPauseOverlay(width, height, useBitmapFont);

    this._createDebugPanel(width, height, useBitmapFont);

    if (useBitmapFont) {
      this.countdownText = this.add.bitmapText(width * 0.5, height * 0.35, FontKeys.Peaberry, '', 64)
        .setOrigin(0.5).setDepth(60).setTint(0xff0000);
    } else {
      this.countdownText = this.add.text(width * 0.5, height * 0.35, '', {
        fontFamily: 'Arial', fontSize: '64px', color: '#ff0000', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(60);
    }

    this.input.keyboard.on('keydown-Z', () => this.handleGroundInput());
    this.input.keyboard.on('keydown-A', () => this.handleAirInput());
    this.input.keyboard.on('keydown-Q', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    this.input.keyboard.once('keydown-G', () => {
      this.startGameOverScene();
    });

    this.startCountdown();
  }

  _createInputHints(width, height, useBitmapFont) {
    const hintDepth = 50;
    const hintAlpha = 0.5;
    const iconSize = 44;
    const rightX = width - 60;
    const bottomY = height - 40;
    const stackGap = 56;

    const hintContainer = this.add.container(0, 0).setDepth(hintDepth).setAlpha(hintAlpha);

    const aIcon = this.add.image(rightX, bottomY - stackGap, UiKeys.KeyA).setDisplaySize(iconSize, iconSize);
    const zIcon = this.add.image(rightX, bottomY, UiKeys.KeyZ).setDisplaySize(iconSize, iconSize);

    if (useBitmapFont) {
      const aLabel = this.add.bitmapText(rightX, bottomY - stackGap - 26, FontKeys.Peaberry, 'AIR', 14)
        .setOrigin(0.5).setTint(0x55aaff);
      const zLabel = this.add.bitmapText(rightX, bottomY - 26, FontKeys.Peaberry, 'GROUND', 14)
        .setOrigin(0.5).setTint(0x00ff88);
      hintContainer.add([aIcon, aLabel, zIcon, zLabel]);
    } else {
      const aLabel = this.add.text(rightX, bottomY - stackGap - 26, 'AIR', {
        fontFamily: 'Arial', fontSize: '14px', color: '#55aaff', fontStyle: 'bold'
      }).setOrigin(0.5);
      const zLabel = this.add.text(rightX, bottomY - 26, 'GROUND', {
        fontFamily: 'Arial', fontSize: '14px', color: '#00ff88', fontStyle: 'bold'
      }).setOrigin(0.5);
      hintContainer.add([aIcon, aLabel, zIcon, zLabel]);
    }

    const tapIcon = this.add.image(rightX, bottomY - stackGap * 2, UiKeys.TouchTap)
      .setDisplaySize(iconSize, iconSize);
    hintContainer.add([tapIcon]);

    const touchLeft = this.add.rectangle(width * 0.25, height * 0.5, width * 0.5, height, 0x000000, 0)
      .setOrigin(0.5).setInteractive().setDepth(hintDepth - 1);
    touchLeft.on('pointerdown', () => this.handleGroundInput());

    const touchRight = this.add.rectangle(width * 0.75, height * 0.5, width * 0.5, height, 0x000000, 0)
      .setOrigin(0.5).setInteractive().setDepth(hintDepth - 1);
    touchRight.on('pointerdown', () => this.handleAirInput());
  }

  _createTopRightControls(width, useBitmapFont) {
    const controlDepth = 55;
    const iconSize = 36;
    const topY = 24;
    const rightEdge = width - 20;
    const gap = 50;

    const controlContainer = this.add.container(0, 0).setDepth(controlDepth).setAlpha(0.6);

    const qIcon = this.add.image(rightEdge - gap, topY, UiKeys.KeyQ).setDisplaySize(iconSize, iconSize);
    const dIcon = this.add.image(rightEdge, topY, UiKeys.KeyD).setDisplaySize(iconSize, iconSize);

    if (useBitmapFont) {
      const qLabel = this.add.bitmapText(rightEdge - gap, topY + 22, FontKeys.Peaberry, 'PAUSE', 10)
        .setOrigin(0.5).setTint(0xaaaaaa);
      const dLabel = this.add.bitmapText(rightEdge, topY + 22, FontKeys.Peaberry, 'DEBUG', 10)
        .setOrigin(0.5).setTint(0xaaaaaa);
      controlContainer.add([qIcon, qLabel, dIcon, dLabel]);
    } else {
      const qLabel = this.add.text(rightEdge - gap, topY + 22, 'PAUSE', {
        fontFamily: 'Arial', fontSize: '10px', color: '#aaaaaa'
      }).setOrigin(0.5);
      const dLabel = this.add.text(rightEdge, topY + 22, 'DEBUG', {
        fontFamily: 'Arial', fontSize: '10px', color: '#aaaaaa'
      }).setOrigin(0.5);
      controlContainer.add([qIcon, qLabel, dIcon, dLabel]);
    }

    this.input.keyboard.on('keydown-D', () => {
      this.debugContainer.setVisible(!this.debugContainer.visible);
    });
  }

  _createDebugPanel(width, height, useBitmapFont) {
    this.debugContainer = this.add.container(0, 0).setVisible(false).setDepth(70);

    const debugBg = this.add.rectangle(width * 0.5, height * 0.5, width * 0.7, height * 0.6, 0x000000, 0.8);
    this.debugContainer.add(debugBg);

    if (useBitmapFont) {
      const title = this.add.bitmapText(width * 0.5, height * 0.25, FontKeys.Peaberry, 'RHYTHM DEBUG', 28)
        .setOrigin(0.5).setTint(0xffffff);
      const instructions = this.add.bitmapText(width * 0.5, height * 0.32, FontKeys.Peaberry,
        'Z = ground, A = air, D = debug, Q = pause', 18).setOrigin(0.5).setTint(0x7bdff2);
      this.debugText = this.add.bitmapText(width * 0.5, height * 0.5, FontKeys.Peaberry, '', 22)
        .setOrigin(0.5).setTint(0xffd166).setCenterAlign();
      const disclaimer = this.add.bitmapText(width * 0.5, height * 0.7, FontKeys.Peaberry,
        'No physics used as gameplay truth.', 16).setOrigin(0.5).setTint(0xb8f2e6);
      this.debugContainer.add([title, instructions, this.debugText, disclaimer]);
    } else {
      const title = this.add.text(width * 0.5, height * 0.25, 'RHYTHM DEBUG', {
        fontFamily: 'Arial', fontSize: '28px', color: '#ffffff'
      }).setOrigin(0.5);
      const instructions = this.add.text(width * 0.5, height * 0.32,
        'Z = ground, A = air, D = debug, Q = pause', {
          fontFamily: 'Arial', fontSize: '18px', color: '#7bdff2'
        }).setOrigin(0.5);
      this.debugText = this.add.text(width * 0.5, height * 0.5, '', {
        fontFamily: 'Consolas, monospace', fontSize: '22px', color: '#ffd166', align: 'center'
      }).setOrigin(0.5);
      const disclaimer = this.add.text(width * 0.5, height * 0.7,
        'No physics used as gameplay truth.', {
          fontFamily: 'Arial', fontSize: '16px', color: '#b8f2e6'
        }).setOrigin(0.5);
      this.debugContainer.add([title, instructions, this.debugText, disclaimer]);
    }
  }

  _getPlayerEntity() {
    const playerManifest = this.registry.get('player-manifest');
    const selectedColor = this.registry.get('selectedPlayerColor') || 'green';
    const entity = playerManifest?.entities?.find(e => e.variant === selectedColor)
      || playerManifest?.entities?.[0];
    return entity;
  }

  _createPlayerSprite() {
    const entity = this._getPlayerEntity();

    if (entity) {
      const runKey = getAnimationManifestKey(entity.archetype, entity.variant, 'run');
      const idleKey = getStateManifestKey(entity.archetype, entity.variant, 'stand');

      this.playerSprite = this.add.sprite(this.PLAYER_X, this.GROUND_Y, idleKey);
      this.playerSprite.setOrigin(0.5, 1);
      this.playerSprite.setScale(PLAYER_SCALE);
      this.playerSprite.setDepth(10);

      if (this.anims.exists(runKey)) {
        this.playerSprite.play(runKey);
      }
    } else {
      this.playerSprite = this.add.sprite(this.PLAYER_X, this.GROUND_Y, '__WHITE');
      this.playerSprite.setDisplaySize(40, 40);
      this.playerSprite.setOrigin(0.5, 1);
      this.playerSprite.setTint(0x00ffff);
    }
  }

  _getEnemyTextureKey(note) {
    const arch = note.render?.archetype || 'snail';
    const variant = note.render?.variant || 'default';
    const state = note.render?.state || 'idle';
    return getStateManifestKey(arch, variant, state);
  }

  _getEnemyAnimKey(note) {
    const arch = note.render?.archetype || 'snail';
    const variant = note.render?.variant || 'default';
    const lane = note.lane;
    const animName = lane === LANE_TYPES.AIR ? 'fly' : 'walk';
    return getAnimationManifestKey(arch, variant, animName);
  }

  _acquireEnemySprite(x, y, textureKey, animKey, lane) {
    let sprite = this.enemyPool.pop();

    const hasTexture = this.textures.exists(textureKey);

    if (sprite) {
      sprite.setActive(true).setVisible(true);
      sprite.setPosition(x, y);
      if (hasTexture) {
        sprite.setTexture(textureKey);
        sprite.setScale(ENEMY_SCALE);
        sprite.clearTint();
      } else {
        sprite.setTexture('__WHITE');
        sprite.setDisplaySize(36, 36);
        sprite.setTint(lane === LANE_TYPES.GROUND ? 0xff4444 : 0x4444ff);
      }
    } else {
      if (hasTexture) {
        sprite = this.add.sprite(x, y, textureKey);
        sprite.setScale(ENEMY_SCALE);
      } else {
        sprite = this.add.sprite(x, y, '__WHITE');
        sprite.setDisplaySize(36, 36);
        sprite.setTint(lane === LANE_TYPES.GROUND ? 0xff4444 : 0x4444ff);
      }
    }

    sprite.setOrigin(0.5, lane === LANE_TYPES.GROUND ? 1 : 0.5);
    sprite.setDepth(5);

    if (hasTexture && this.anims.exists(animKey)) {
      if (sprite.anims.currentAnim?.key !== animKey) {
        sprite.play(animKey);
      }
    } else {
      sprite.anims?.stop();
    }

    return sprite;
  }

  _releaseEnemySprite(sprite) {
    sprite.setActive(false).setVisible(false);
    sprite.anims?.stop();
    this.enemyPool.push(sprite);
  }

  createPauseOverlay(width, height, useBitmapFont) {
    this.pauseContainer = this.add.container(0, 0);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    let pauseLabel, subLabel;
    if (useBitmapFont) {
      pauseLabel = this.add.bitmapText(width / 2, height / 2, FontKeys.Peaberry, 'PAUSED', 64)
        .setOrigin(0.5).setTint(0xffffff);
      subLabel = this.add.bitmapText(width / 2, height / 2 + 50, FontKeys.Peaberry, 'Press Q or ESC to Resume', 20)
        .setOrigin(0.5).setTint(0xaaaaaa);
    } else {
      pauseLabel = this.add.text(width / 2, height / 2, 'PAUSED', {
        fontFamily: 'Arial', fontSize: '64px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);
      subLabel = this.add.text(width / 2, height / 2 + 60, 'Press Q or ESC to Resume', {
        fontFamily: 'Arial', fontSize: '24px', color: '#aaaaaa'
      }).setOrigin(0.5);
    }

    this.pauseContainer.add([overlay, pauseLabel, subLabel]);
    this.pauseContainer.setDepth(100);
    this.pauseContainer.setVisible(false);
  }

  drawGameplayGuides(width, height) {
    const goodWindowPx = (JudgmentModel.getGoodWindowMs() / 1000) * this.scrollSpeed;

    this.guideGraphics.clear();

    this.guideGraphics.lineStyle(2, 0x00ff88, 0.45);
    this.guideGraphics.beginPath();
    this.guideGraphics.moveTo(0, this.GROUND_Y);
    this.guideGraphics.lineTo(width, this.GROUND_Y);
    this.guideGraphics.strokePath();

    this.guideGraphics.lineStyle(2, 0x55aaff, 0.45);
    this.guideGraphics.beginPath();
    this.guideGraphics.moveTo(0, this.AIR_Y);
    this.guideGraphics.lineTo(width, this.AIR_Y);
    this.guideGraphics.strokePath();

    this.guideGraphics.lineStyle(3, 0xffd166, 0.8);
    this.guideGraphics.beginPath();
    this.guideGraphics.moveTo(this.HIT_X - goodWindowPx, this.AIR_Y - 60);
    this.guideGraphics.lineTo(this.HIT_X - goodWindowPx, this.GROUND_Y + 30);
    this.guideGraphics.strokePath();

    this.guideGraphics.beginPath();
    this.guideGraphics.moveTo(this.HIT_X + goodWindowPx, this.AIR_Y - 60);
    this.guideGraphics.lineTo(this.HIT_X + goodWindowPx, this.GROUND_Y + 30);
    this.guideGraphics.strokePath();

    this.guideGraphics.lineStyle(4, 0x00ff00, 0.95);
    this.guideGraphics.beginPath();
    this.guideGraphics.moveTo(this.HIT_X, this.AIR_Y - 80);
    this.guideGraphics.lineTo(this.HIT_X, this.scale.height);
    this.guideGraphics.strokePath();
  }

  handleGroundInput() {
    if (this.gameState !== 'PLAYING') return;

    this.lastHitLane = LANE_TYPES.GROUND;
    this._fireLaser(LANE_TYPES.GROUND);
    this.sound.play(SfxKeys.GroundAttack, { volume: VOLUME.SFX_GROUND_ATTACK });

    const entity = this._getPlayerEntity();
    if (entity) {
      const duckKey = getAnimationManifestKey(entity.archetype, entity.variant, 'duck');
      const runKey = getAnimationManifestKey(entity.archetype, entity.variant, 'run');
      if (this.anims.exists(duckKey)) {
        this.playerSprite.play(duckKey);
        this.time.delayedCall(this.GROUND_ATTACK_DUR_MS, () => {
          if (this.anims.exists(runKey)) this.playerSprite.play(runKey);
        });
      }
    }

    const result = this.sessionController.handleLaneInput('Z', this.conductor.getSongTimeMs());
    this.recordJudgment(result.judgment ?? 'Miss');
  }

  handleAirInput() {
    if (this.gameState !== 'PLAYING') return;

    this.lastHitLane = LANE_TYPES.AIR;
    this._fireLaser(LANE_TYPES.AIR);
    this.sound.play(SfxKeys.AirAttack, { volume: VOLUME.SFX_AIR_ATTACK });

    const entity = this._getPlayerEntity();
    if (entity) {
      const jumpKey = getAnimationManifestKey(entity.archetype, entity.variant, 'jump');
      const runKey = getAnimationManifestKey(entity.archetype, entity.variant, 'run');
      if (this.anims.exists(jumpKey)) {
        this.playerSprite.play(jumpKey);
      }
      this.playerSprite.y = this.AIR_Y;
      this.time.delayedCall(this.AIR_ATTACK_DUR_MS, () => {
        this.playerSprite.y = this.GROUND_Y;
        if (this.anims.exists(runKey)) this.playerSprite.play(runKey);
      });
    } else {
      this.playerSprite.y = this.AIR_Y;
      this.time.delayedCall(this.AIR_ATTACK_DUR_MS, () => {
        this.playerSprite.y = this.GROUND_Y;
      });
    }

    const result = this.sessionController.handleLaneInput('A', this.conductor.getSongTimeMs());
    this.recordJudgment(result.judgment ?? 'Miss');
  }

  _fireLaser(lane) {
    const isGround = lane === LANE_TYPES.GROUND;
    const laserKey = isGround ? LaserKeys.Green1 : LaserKeys.Blue1;
    const burstKey = isGround ? LaserKeys.GreenBurst : LaserKeys.BlueBurst;
    const y = isGround ? this.GROUND_Y - 20 : this.AIR_Y;

    if (!this.textures.exists(laserKey)) return;

    const laser = this.add.image(this.PLAYER_X + 30, y, laserKey);
    laser.setOrigin(0, 0.5);
    laser.setDepth(15);
    laser.setScale(1.5, 1);
    laser.setAngle(0);

    this.sound.play(SfxKeys.LaserShoot, { volume: VOLUME.SFX_LASER });

    this.tweens.add({
      targets: laser,
      x: this.HIT_X + 40,
      alpha: { from: 1, to: 0.3 },
      scaleX: 2,
      duration: 120,
      ease: 'Power2',
      onComplete: () => {
        if (this.textures.exists(burstKey)) {
          const burst = this.add.image(this.HIT_X, y, burstKey);
          burst.setDepth(16);
          burst.setScale(0.5);
          this.tweens.add({
            targets: burst,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => burst.destroy()
          });
        }
        laser.destroy();
      }
    });
  }

  togglePause() {
    if (this.gameState === 'COUNTDOWN' || this.gameState === 'PLAYING') {
      this.stateBeforePause = this.gameState;
      this.gameState = 'PAUSED';

      if (this.stateBeforePause === 'PLAYING') {
        this.conductor.pause();
        if (this.musicTrack?.isPlaying) {
          this.musicTrack.pause();
        }
      }

      if (this.parallax) this.parallax.pause();
      this.pauseContainer.setVisible(true);
      this.tweens.pauseAll();
      this.time.paused = true;
    } else if (this.gameState === 'PAUSED') {
      const resumeState = this.stateBeforePause || 'PLAYING';
      this.gameState = resumeState;

      if (resumeState === 'PLAYING') {
        this.conductor.resume(this.time.now);
        if (this.musicTrack?.isPaused) {
          this.musicTrack.resume();
        }
      }

      if (this.parallax) this.parallax.resume();
      this.pauseContainer.setVisible(false);
      this.tweens.resumeAll();
      this.time.paused = false;
      this.stateBeforePause = null;
    }
  }

  startCountdown() {
    this.gameState = 'COUNTDOWN';

    const snapshot = this.sessionController.getSnapshot();
    const countdownConfig = snapshot.countdown;

    if (!countdownConfig || !countdownConfig.enabled) {
      this.startGameplay();
      return;
    }

    const sequence = countdownConfig.spokenSequence || ['3', '2', '1', 'go'];
    const initialDelayMs = countdownConfig.initialDelayMs ?? 1000;
    const stepDurationMs = countdownConfig.stepDurationMs ?? 1000;

    let delayMs = initialDelayMs;
    sequence.forEach((clipName, index) => {
      this.time.delayedCall(delayMs, () => {
        if (this.gameState !== 'COUNTDOWN') return;

        this.countdownText.setText(clipName.toUpperCase());

        let voiceKey;
        switch (clipName.toLowerCase()) {
          case 'ready': voiceKey = VoiceKeys.Ready; break;
          case 'set': voiceKey = VoiceKeys.Set; break;
          case 'go': voiceKey = VoiceKeys.Go; break;
          case '1': voiceKey = VoiceKeys.One; break;
          case '2': voiceKey = VoiceKeys.Two; break;
          case '3': voiceKey = VoiceKeys.Three; break;
        }
        if (voiceKey) this.sound.play(voiceKey, { volume: VOLUME.VOICE });

        if (index === sequence.length - 1) {
          this.time.delayedCall(stepDurationMs, () => {
            if (this.gameState === 'COUNTDOWN') {
              this.countdownText.setText('');
              this.startGameplay();
            }
          });
        }
      });
      delayMs += stepDurationMs;
    });
  }

  startGameplay() {
    this.gameState = 'PLAYING';
    if (this.parallax) this.parallax.reset();
    if (this.musicTrack) {
      this.musicTrack.stop();
      this.musicTrack.play({ volume: 0 });
      this.tweens.add({
        targets: this.musicTrack,
        volume: VOLUME.MUSIC,
        duration: VOLUME.MUSIC_FADE_IN_MS,
        ease: 'Linear'
      });
    }
    this.conductor.start(this.time.now);
    const sessionState = this.sessionController.setSongTimeMs(0);
    this.refreshDebugText(sessionState);
  }

  update(_time, delta) {
    if (this.parallax) {
      this.parallax.update(delta);
    }

    if (this.gameState === 'PLAYING') {
      const songTimeMs = this.conductor.update(this.time.now);
      const sessionState = this.sessionController.setSongTimeMs(songTimeMs);

      this.updateEnemies(sessionState);
      this.refreshDebugText(sessionState);

      if (sessionState.ended || songTimeMs > sessionState.durationMs + 2000) {
        this.gameState = 'FINISHED';
        this.startGameOverScene();
      }
    }
  }

  startGameOverScene() {
    const resultsPayload = buildFinalResultsPayload(
      this.scoreModel?.getSnapshot(),
      this.sessionController?.getSnapshot()
    );

    if (this.musicTrack?.isPlaying) {
      this.tweens.add({
        targets: this.musicTrack,
        volume: 0,
        duration: VOLUME.MUSIC_FADE_OUT_MS,
        ease: 'Linear',
        onComplete: () => {
          this.musicTrack.stop();
        }
      });
    }

    this.scene.start('GameOverScene', { resultsPayload, trackKey: this.trackKey });
  }

  updateEnemies(sessionState) {
    if (this.gameState !== 'PLAYING') {
      for (const entry of this.activeEnemies) {
        this._releaseEnemySprite(entry.sprite);
      }
      this.activeEnemies = [];
      return;
    }

    const songTimeMs = this.conductor.getSongTimeMs();
    const visibleWindowMs = 2000;

    const visibleNoteIds = new Set();
    const lanes = [LANE_TYPES.GROUND, LANE_TYPES.AIR];

    lanes.forEach(lane => {
      let cursor = sessionState.laneCursors[lane];
      let note = this.sessionController.notesByLane[lane][cursor];

      while (note && note.hitTimeMs <= songTimeMs + visibleWindowMs) {
        if (note.hitTimeMs >= songTimeMs - JudgmentModel.getGoodWindowMs()) {
          const noteId = `${lane}_${cursor}`;
          visibleNoteIds.add(noteId);

          const timeToHitSec = (note.hitTimeMs - songTimeMs) / 1000;
          const targetX = this.HIT_X + (timeToHitSec * this.scrollSpeed);
          const y = lane === LANE_TYPES.GROUND ? this.GROUND_Y : this.AIR_Y;

          let existing = this.activeEnemies.find(e => e.noteId === noteId);

          if (existing) {
            existing.sprite.x = targetX;
          } else {
            const textureKey = this._getEnemyTextureKey(note);
            const animKey = this._getEnemyAnimKey(note);
            const sprite = this._acquireEnemySprite(targetX, y, textureKey, animKey, lane);
            this.activeEnemies.push({ noteId, sprite });
          }
        }
        cursor++;
        note = this.sessionController.notesByLane[lane][cursor];
      }
    });

    this.activeEnemies = this.activeEnemies.filter(entry => {
      if (!visibleNoteIds.has(entry.noteId)) {
        this._releaseEnemySprite(entry.sprite);
        return false;
      }
      return true;
    });
  }

  recordJudgment(judgment) {
    const snapshot = this.scoreModel.applyJudgment(judgment);
    this.lastJudgment = `${judgment} | Combo ${snapshot.combo}`;

    const laneY = this.lastHitLane === LANE_TYPES.AIR ? this.AIR_Y : this.GROUND_Y;

    if (judgment === 'Miss') {
      this.sound.play(SfxKeys.Miss, { volume: VOLUME.SFX_MISS });
      this._spawnMissParticles(laneY);

      const entity = this._getPlayerEntity();
      if (entity) {
        const hurtKey = getAnimationManifestKey(entity.archetype, entity.variant, 'hurt');
        const runKey = getAnimationManifestKey(entity.archetype, entity.variant, 'run');
        if (this.anims.exists(hurtKey)) {
          this.playerSprite.play(hurtKey);
          this.time.delayedCall(300, () => {
            if (this.anims.exists(runKey)) this.playerSprite.play(runKey);
          });
        }
      }
    } else if (judgment !== 'None') {
      this.sound.play(SfxKeys.Hit, { volume: VOLUME.SFX_HIT });
      this._spawnHitParticles(judgment, laneY);
    }

    if (this.scoreText) {
      this.scoreText.setText(`SCORE: ${snapshot.score}`);
      this.comboText.setText(`COMBO: ${snapshot.combo}`);

      this.judgmentText.setPosition(this.HIT_X, laneY - 60);
      this.judgmentText.setText(judgment);

      const tintMap = {
        Perfect: 0x00ff00,
        Good: 0xffff00,
        Bad: 0xff8800,
        Miss: 0xff0000
      };
      const tint = tintMap[judgment] || 0xffffff;

      if (this.judgmentText.type === 'BitmapText') {
        this.judgmentText.setTint(tint);
      } else {
        const hex = `#${tint.toString(16).padStart(6, '0')}`;
        this.judgmentText.setColor(hex);
      }

      this.tweens.killTweensOf(this.judgmentText);
      this.judgmentText.setAlpha(1);
      this.judgmentText.setScale(1.5);
      this.judgmentText.y = laneY - 60;
      this.tweens.add({
        targets: this.judgmentText,
        scale: 1,
        alpha: 0,
        y: laneY - 85,
        duration: 500,
        ease: 'Power2'
      });
    }
  }

  _spawnHitParticles(judgment, laneY) {
    const particleKey = this.textures.exists(ParticleKeys.Star01)
      ? ParticleKeys.Star01
      : '__WHITE';

    const tint = judgment === 'Perfect' ? 0x00ff00 : 0xffff00;

    this.add.particles(this.HIT_X, laneY - 20, particleKey, {
      speed: { min: 60, max: 180 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.6, end: 0 },
      lifespan: 400,
      quantity: judgment === 'Perfect' ? 12 : 6,
      tint: tint,
      gravityY: 100,
      emitting: false
    }).explode();
  }

  _spawnMissParticles(laneY) {
    const particleKey = this.textures.exists(ParticleKeys.Smoke01)
      ? ParticleKeys.Smoke01
      : '__WHITE';

    this.add.particles(this.HIT_X, laneY - 10, particleKey, {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      lifespan: 500,
      quantity: 8,
      tint: 0xff0000,
      alpha: { start: 0.6, end: 0 },
      emitting: false
    }).explode();
  }

  formatNextNote(lane, sessionState) {
    const cursor = sessionState ? sessionState.laneCursors[lane] : 0;
    const note = this.sessionController.notesByLane[lane][cursor];

    if (!note) {
      return `${lane}: none`;
    }

    return `${lane}: beat ${note.beat}, hit ${note.hitTimeMs.toFixed(0)}ms`;
  }

  refreshDebugText(sessionState) {
    if (!this.debugText || this.gameState !== 'PLAYING') return;

    const songTimeMs = this.conductor.getSongTimeMs();
    const score = this.scoreModel.getSnapshot();

    const lines = [
      `Song Time: ${songTimeMs.toFixed(0)}ms`,
      `Next -> ${this.formatNextNote(LANE_TYPES.GROUND, sessionState)} | ${this.formatNextNote(LANE_TYPES.AIR, sessionState)}`,
      `Last: ${this.lastJudgment}`,
      `Score: ${score.score} | Combo: ${score.combo} | Max: ${score.maxCombo}`
    ];

    if (this.debugText.type === 'BitmapText') {
      this.debugText.setText(lines.join('\n'));
    } else {
      this.debugText.setText(lines);
    }
  }
}
