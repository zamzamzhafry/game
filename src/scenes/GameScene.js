import Phaser from 'phaser';
import { Conductor } from '../models/Conductor.js';
import { LaneModel, LANE_TYPES } from '../models/LaneModel.js';
import { JudgmentModel } from '../models/JudgmentModel.js';
import { ScoreModel } from '../models/ScoreModel.js';
import { GameSessionController } from '../controllers/GameSessionController.js';
import { buildFinalResultsPayload } from '../services/buildFinalResultsPayload.js';
import { VoiceKeys, MusicKeys, SfxKeys } from '../config/assets.js';
import { ParallaxManager } from '../views/ParallaxManager.js';

// Volume constants — centralized for easy tuning
const VOLUME = {
  MUSIC: 0.6,
  SFX_HIT: 0.5,
  SFX_MISS: 0.5,
  SFX_GROUND_ATTACK: 0.35,
  SFX_AIR_ATTACK: 0.35,
  VOICE: 0.7,
  MUSIC_FADE_IN_MS: 500,
  MUSIC_FADE_OUT_MS: 800,
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    this.trackKey = 'track1';
    this.sessionController = null;
    this.conductor = null;
    this.scoreModel = null;
    this.lastJudgment = 'None';
    this.debugText = null;
    this.countdownText = null;

    this.gameState = 'INIT';
    this.stateBeforePause = null;

    this.playerSprite = null; // Reusing var name but it's a box now
    this.enemySprites = [];
    this.musicTrack = null;
    this.parallax = null;
    
    this.PLAYER_X = 150;
    this.GROUND_Y = 0;
    this.AIR_Y = 0;
    this.HIT_X = this.PLAYER_X + 50;
    this.scrollSpeed = 400;

    // TUNING CONSTANTS
    this.BOX_SIZE = 40; // 40x40 box
    this.GROUND_ATTACK_DUR_MS = 150; 
    this.AIR_ATTACK_DUR_MS = 300; 

    // STATE COLORS
    this.COLOR_IDLE = 0x00ffff; // Cyan
    this.COLOR_GROUND_ATK = 0xffa500; // Orange
    this.COLOR_AIR_ATK = 0xff00ff; // Magenta
    this.COLOR_MISS = 0xff0000; // Red
    
    this.COLOR_ENEMY_GROUND = 0xff4444; // Reddish
    this.COLOR_ENEMY_AIR = 0x4444ff; // Blueish
  }

  init(data) {
    if (data?.trackKey) {
      this.trackKey = data.trackKey;
    }
  }

  create() {
    const { width, height } = this.scale;

    this.GROUND_Y = height * 0.7;
    this.AIR_Y = height * 0.45;

    const chartKey = `${this.trackKey}-chart`;
    const rawBeatmap = this.cache.json.get(chartKey);
    this.scrollSpeed = rawBeatmap.scrollSpeed || 400;

    this.parallax = new ParallaxManager(this);
    const bgSetId = rawBeatmap.backgroundSetId || 'forest-day';
    this.parallax.loadSet(bgSetId).then(() => {
      this.parallax.createLayers();
    });

    this.sessionController = new GameSessionController(rawBeatmap);
    this.conductor = new Conductor();
    this.scoreModel = new ScoreModel();
    this.lastJudgment = 'None';
    this.gameState = 'INIT';

    this.enemySprites = [];

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

    // Debug Overlay
    this.debugGraphics = this.add.graphics();

    // Player Box Placeholder
    this.playerSprite = this.add.sprite(this.PLAYER_X, this.GROUND_Y, '__WHITE');
    this.playerSprite.setDisplaySize(this.BOX_SIZE, this.BOX_SIZE);
    this.playerSprite.setOrigin(0.5, 1);
    this.setPlayerColor(this.COLOR_IDLE);

    // Main HUD
    this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    
    this.comboText = this.add.text(20, 60, 'COMBO: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffd166',
      fontStyle: 'bold'
    });

    this.judgmentText = this.add.text(this.HIT_X, this.AIR_Y - 50, '', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(30).setStroke('#000000', 6);
    this.judgmentText.y = this.GROUND_Y - 90;

    // Placeholder UI Buttons
    this.createPlaceholderUI(width, height);

    // Pause Overlay
    this.createPauseOverlay(width, height);

    // Debug UI container
    this.debugContainer = this.add.container(0, 0);

    this.debugTitleText = this.add.text(width * 0.5, height * 0.12, 'Phase 3 Deterministic Rhythm Debug', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.debugInstructionsText = this.add.text(width * 0.5, height * 0.2, 'F = ground lane, J = air lane, G = Game Over', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#7bdff2'
    }).setOrigin(0.5);

    this.debugText = this.add.text(width * 0.5, height * 0.56, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '28px',
      color: '#ffd166',
      align: 'center'
    }).setOrigin(0.5);

    this.debugDisclaimerText = this.add.text(width * 0.5, height * 0.9, 'No physics used as gameplay truth in this phase.', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#b8f2e6',
        align: 'center'
    }).setOrigin(0.5);

    this.debugContainer.add([
      this.debugGraphics, 
      this.debugTitleText, 
      this.debugInstructionsText, 
      this.debugText, 
      this.debugDisclaimerText
    ]);

    // Optional: toggle debug UI with 'D'
    this.input.keyboard.on('keydown-D', () => {
      this.debugContainer.setVisible(!this.debugContainer.visible);
    });

    this.countdownText = this.add.text(width * 0.5, height * 0.35, '', {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-F', () => this.handleGroundInput());
    this.input.keyboard.on('keydown-J', () => this.handleAirInput());

    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    this.input.keyboard.once('keydown-G', () => {
      this.startGameOverScene();
    });

    this.startCountdown();
  }

  createPlaceholderUI(width, height) {
    const createButton = (x, y, w, h, labelText, baseColor, callback) => {
      const btnContainer = this.add.container(x, y);
      
      const btnBg = this.add.sprite(0, 0, '__WHITE');
      btnBg.setDisplaySize(w, h);
      
      const r = (baseColor >> 16) & 0xff;
      const g = (baseColor >> 8) & 0xff;
      const b = baseColor & 0xff;
      const darkR = Math.floor(r * 0.6);
      const darkG = Math.floor(g * 0.6);
      const darkB = Math.floor(b * 0.6);
      const darkColor = (darkR << 16) | (darkG << 8) | darkB;
      
      btnBg.setTint(baseColor, baseColor, darkColor, darkColor);

      const text = this.add.text(0, 0, labelText, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btnContainer.add([btnBg, text]);
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerdown', callback);

      return btnContainer;
    };

    // Ground Button (Bottom Left)
    createButton(width * 0.2, height * 0.85, 160, 60, 'F | GROUND', this.COLOR_GROUND_ATK, () => this.handleGroundInput());

    // Air Button (Bottom Right)
    createButton(width * 0.8, height * 0.85, 160, 60, 'J | AIR', this.COLOR_AIR_ATK, () => this.handleAirInput());

    // Pause Button (Top Right)
    createButton(width * 0.9, height * 0.08, 120, 40, 'II PAUSE', 0x888888, () => this.togglePause());
  }

  createPauseOverlay(width, height) {
    this.pauseContainer = this.add.container(0, 0);
    
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    
    const pauseText = this.add.text(width / 2, height / 2, 'PAUSED', {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const subText = this.add.text(width / 2, height / 2 + 60, 'Press P, ESC, or Pause Button to Resume', {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#aaaaaa'
    }).setOrigin(0.5);

    this.pauseContainer.add([overlay, pauseText, subText]);
    this.pauseContainer.setDepth(100);
    this.pauseContainer.setVisible(false);
  }

  drawGameplayGuides(width, height) {
    const goodWindowPx = (JudgmentModel.getGoodWindowMs() / 1000) * this.scrollSpeed;

    this.guideGraphics.clear();

    // Always-visible lane guides
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

    // Two outer good guides
    this.guideGraphics.lineStyle(3, 0xffd166, 0.8);
    this.guideGraphics.beginPath();
    this.guideGraphics.moveTo(this.HIT_X - goodWindowPx, this.AIR_Y - 60);
    this.guideGraphics.lineTo(this.HIT_X - goodWindowPx, this.GROUND_Y + 30);
    this.guideGraphics.strokePath();

    this.guideGraphics.beginPath();
    this.guideGraphics.moveTo(this.HIT_X + goodWindowPx, this.AIR_Y - 60);
    this.guideGraphics.lineTo(this.HIT_X + goodWindowPx, this.GROUND_Y + 30);
    this.guideGraphics.strokePath();

    // Center perfect guide
    this.guideGraphics.lineStyle(4, 0x00ff00, 0.95);
    this.guideGraphics.beginPath();
    this.guideGraphics.moveTo(this.HIT_X, this.AIR_Y - 80);
    this.guideGraphics.lineTo(this.HIT_X, height);
    this.guideGraphics.strokePath();
  }

  handleGroundInput() {
    if (this.gameState === 'PLAYING') {
      this.setPlayerColor(this.COLOR_GROUND_ATK);
      this.sound.play(SfxKeys.GroundAttack, { volume: VOLUME.SFX_GROUND_ATTACK });
      this.time.delayedCall(this.GROUND_ATTACK_DUR_MS, () => this.setPlayerColor(this.COLOR_IDLE));
      
      const result = this.sessionController.handleLaneInput('F', this.conductor.getSongTimeMs());
      this.recordJudgment(result.judgment ?? 'Miss');
    }
  }

  handleAirInput() {
    if (this.gameState === 'PLAYING') {
      this.setPlayerColor(this.COLOR_AIR_ATK);
      this.playerSprite.y = this.AIR_Y; // Jump up
      this.sound.play(SfxKeys.AirAttack, { volume: VOLUME.SFX_AIR_ATTACK });
      this.time.delayedCall(this.AIR_ATTACK_DUR_MS, () => {
          this.setPlayerColor(this.COLOR_IDLE);
          this.playerSprite.y = this.GROUND_Y; // Back to ground
      });
      
      const result = this.sessionController.handleLaneInput('J', this.conductor.getSongTimeMs());
      this.recordJudgment(result.judgment ?? 'Miss');
    }
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

  setPlayerColor(baseColor) {
      // Create a gradient tint: lighter top, darker bottom
      // baseColor should be a hex like 0xRRGGBB
      const r = (baseColor >> 16) & 0xff;
      const g = (baseColor >> 8) & 0xff;
      const b = baseColor & 0xff;
      
      const darkR = Math.floor(r * 0.6);
      const darkG = Math.floor(g * 0.6);
      const darkB = Math.floor(b * 0.6);
      const darkColor = (darkR << 16) | (darkG << 8) | darkB;
      
      this.playerSprite.setTint(baseColor, baseColor, darkColor, darkColor);
  }

  startCountdown() {
    this.gameState = 'COUNTDOWN';
    this.setPlayerColor(this.COLOR_IDLE);
    
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
        if (this.gameState !== 'COUNTDOWN') return; // In case we exit early
        
        this.countdownText.setText(clipName.toUpperCase());
        
        let voiceKey;
        switch(clipName.toLowerCase()) {
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
    this.setPlayerColor(this.COLOR_IDLE);
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
      this.enemySprites.forEach((sprite) => sprite.destroy());
      this.enemySprites = [];
      return;
    }

    const songTimeMs = this.conductor.getSongTimeMs();
    const visibleWindowMs = 2000;
    
    this.enemySprites.forEach(s => s.destroy());
    this.enemySprites = [];

    const lanes = [LANE_TYPES.GROUND, LANE_TYPES.AIR];
    lanes.forEach(lane => {
      let cursor = sessionState.laneCursors[lane];
      let note = this.sessionController.notesByLane[lane][cursor];
      
      while (note && note.hitTimeMs <= songTimeMs + visibleWindowMs) {
        if (note.hitTimeMs >= songTimeMs - JudgmentModel.getGoodWindowMs()) {
          const timeToHitSec = (note.hitTimeMs - songTimeMs) / 1000;
          const targetX = this.HIT_X + (timeToHitSec * this.scrollSpeed);
          
          let y = lane === LANE_TYPES.GROUND ? this.GROUND_Y : this.AIR_Y;
          
          let sprite = this.add.sprite(targetX, y, '__WHITE');
          sprite.setDisplaySize(this.BOX_SIZE, this.BOX_SIZE);
          sprite.setOrigin(0.5, lane === LANE_TYPES.GROUND ? 1 : 0.5);
          
          let baseColor = lane === LANE_TYPES.GROUND ? this.COLOR_ENEMY_GROUND : this.COLOR_ENEMY_AIR;
          
          const r = (baseColor >> 16) & 0xff;
          const g = (baseColor >> 8) & 0xff;
          const b = baseColor & 0xff;
          const darkR = Math.floor(r * 0.6);
          const darkG = Math.floor(g * 0.6);
          const darkB = Math.floor(b * 0.6);
          const darkColor = (darkR << 16) | (darkG << 8) | darkB;
          
          sprite.setTint(baseColor, baseColor, darkColor, darkColor);

          this.enemySprites.push(sprite);
        }
        cursor++;
        note = this.sessionController.notesByLane[lane][cursor];
      }
    });
  }

  recordJudgment(judgment) {
    const snapshot = this.scoreModel.applyJudgment(judgment);
    this.lastJudgment = `${judgment} | Combo ${snapshot.combo}`;
    
    if (judgment === 'Miss') {
      this.sound.play(SfxKeys.Miss, { volume: VOLUME.SFX_MISS });
      this.setPlayerColor(this.COLOR_MISS);
      this.time.delayedCall(this.GROUND_ATTACK_DUR_MS, () => this.setPlayerColor(this.COLOR_IDLE));
    } else if (judgment !== 'None') {
      this.sound.play(SfxKeys.Hit, { volume: VOLUME.SFX_HIT });
    }

    if (this.scoreText) {
      this.scoreText.setText(`SCORE: ${snapshot.score}`);
      this.comboText.setText(`COMBO: ${snapshot.combo}`);
      
      this.judgmentText.setPosition(this.HIT_X, this.GROUND_Y - 90);
      this.judgmentText.setText(judgment);
      
      let color = '#ffffff';
      if (judgment === 'Perfect') color = '#00ff00';
      else if (judgment === 'Good') color = '#ffff00';
      else if (judgment === 'Bad') color = '#ff8800';
      else if (judgment === 'Miss') color = '#ff0000';
      
      this.judgmentText.setColor(color);
      
      this.tweens.killTweensOf(this.judgmentText);
      this.judgmentText.setAlpha(1);
      this.judgmentText.setScale(1.5);
      this.judgmentText.y = this.GROUND_Y - 90;
      this.tweens.add({
        targets: this.judgmentText,
        scale: 1,
        alpha: 0,
        y: this.GROUND_Y - 115,
        duration: 500,
        ease: 'Power2'
      });
    }
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

    this.debugText.setText([
      `Song Time: ${songTimeMs.toFixed(0)}ms`,
      `Next Notes -> ${this.formatNextNote(LANE_TYPES.GROUND, sessionState)} | ${this.formatNextNote(LANE_TYPES.AIR, sessionState)}`,
      `Last Judgment: ${this.lastJudgment}`,
      `Score: ${score.score} | Combo: ${score.combo} | Max Combo: ${score.maxCombo}`
    ]);
  }
}
