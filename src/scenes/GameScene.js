import Phaser from 'phaser';
import { Conductor } from '../models/Conductor.js';
import { LaneModel, LANE_TYPES } from '../models/LaneModel.js';
import { JudgmentModel } from '../models/JudgmentModel.js';
import { ScoreModel } from '../models/ScoreModel.js';
import { GameSessionController } from '../controllers/GameSessionController.js';
import {
  MusicKeys, SfxKeys, FontKeys
} from '../config/assets.js';
import { ParallaxManager } from '../views/ParallaxManager.js';
import { getAnimationManifestKey } from '../utils/manifestUtils.js';
import {
  createInputHints as buildInputHints,
  createTopRightControls as buildTopRightControls,
  createDebugPanel as buildDebugPanel,
  createPauseOverlay as buildPauseOverlay,
  drawGameplayGuides as buildGameplayGuides
} from './helpers/gameSceneUi.js';
import {
  getPlayerEntity as resolvePlayerEntity,
  createPlayerSprite as buildPlayerSprite
} from './helpers/playerSetup.js';
import {
  getEnemyTextureKey as resolveEnemyTextureKey,
  getEnemyAnimKey as resolveEnemyAnimKey,
  acquireEnemySprite as takeEnemySprite,
  releaseEnemySprite as freeEnemySprite,
  updateEnemies as syncEnemyProjection
} from './helpers/enemyProjection.js';
import {
  FEVER_DEFAULTS,
  initFeverState,
  togglePause as handlePauseToggle,
  startCountdown as beginCountdown,
  startGameplay as beginGameplay,
  startGameOverScene as beginGameOver,
  updateFeverState,
  tickFever
} from './helpers/gameSceneFlow.js';
import {
  fireLaser as playLaserFx,
  spawnHitParticles as emitHitParticles,
  spawnMissParticles as emitMissParticles,
  showComboBurst,
  recordJudgment as applyJudgmentFeedback
} from './helpers/gameSceneFeedback.js';
import {
  createFeverHud,
  updateFeverHud,
  applyFeverHudState
} from './helpers/feverHud.js';

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
    this.feverTrack = null;
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
    initFeverState(this);

    this.enemyPool = [];
    this.activeEnemies = [];

    this.musicTrack = this.sound.get(MusicKeys.Track1) ?? this.sound.add(MusicKeys.Track1, {
      loop: false,
      volume: 0
    });
    this.feverTrack = this.sound.get(MusicKeys.FeverLayer) ?? this.sound.add(MusicKeys.FeverLayer, {
      loop: true,
      volume: 0
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.musicTrack) {
        this.musicTrack.stop();
      }
      if (this.feverTrack) {
        this.feverTrack.stop();
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
    createFeverHud(this, width, height, useBitmapFont);

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
    buildInputHints(this, width, height, useBitmapFont);
  }

  _createTopRightControls(width, useBitmapFont) {
    buildTopRightControls(this, width, useBitmapFont);
  }

  _createDebugPanel(width, height, useBitmapFont) {
    buildDebugPanel(this, width, height, useBitmapFont);
  }

  _getPlayerEntity() {
    return resolvePlayerEntity(this);
  }

  _createPlayerSprite() {
    buildPlayerSprite(this);
  }

  _getEnemyTextureKey(note) {
    return resolveEnemyTextureKey(note);
  }

  _getEnemyAnimKey(note) {
    return resolveEnemyAnimKey(note);
  }

  _acquireEnemySprite(x, y, textureKey, animKey, lane) {
    return takeEnemySprite(this, x, y, textureKey, animKey, lane);
  }

  _releaseEnemySprite(sprite) {
    freeEnemySprite(this, sprite);
  }

  createPauseOverlay(width, height, useBitmapFont) {
    buildPauseOverlay(this, width, height, useBitmapFont);
  }

  drawGameplayGuides(width, height) {
    buildGameplayGuides(this, width, height);
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
    playLaserFx(this, lane);
  }

  togglePause() {
    handlePauseToggle(this);
  }

  startCountdown() {
    beginCountdown(this);
  }

  startGameplay() {
    beginGameplay(this);
  }

  update(_time, delta) {
    if (this.parallax) {
      this.parallax.update(delta);
    }

    if (this.gameState === 'PLAYING') {
      const songTimeMs = this.conductor.update(this.time.now);
      const sessionState = this.sessionController.setSongTimeMs(songTimeMs);

      this.updateEnemies(sessionState);
      tickFever(this);
      this.refreshDebugText(sessionState);

      if (sessionState.ended || songTimeMs > sessionState.durationMs + 2000) {
        this.gameState = 'FINISHED';
        this.startGameOverScene();
      }
    }
  }

  startGameOverScene() {
    beginGameOver(this);
  }

  updateEnemies(sessionState) {
    syncEnemyProjection(this, sessionState);
  }

  recordJudgment(judgment) {
    const snapshot = applyJudgmentFeedback(this, judgment);
    updateFeverState(this, judgment, snapshot.combo);
  }

  _spawnHitParticles(judgment, laneY) {
    emitHitParticles(this, judgment, laneY);
  }

  _spawnMissParticles(laneY) {
    emitMissParticles(this, laneY);
  }

  showComboBurst() {
    showComboBurst(this);
  }

  updateFeverHud() {
    updateFeverHud(this);
  }

  applyFeverHudState(active) {
    applyFeverHudState(this, active);
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
