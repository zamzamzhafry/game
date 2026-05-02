import Phaser from 'phaser';
import { JingleKeys, VoiceKeys, SfxKeys, ParticleKeys, FontKeys, BgImageKeys } from '../config/assets.js';
import { getStateManifestKey, getAnimationManifestKey } from '../utils/manifestUtils.js';

const RATING_CONFIG = Object.freeze({
  S: { color: 0xffcc00, message: 'PERFECT RUN!', particles: true, flash: true },
  A: { color: 0x33cc33, message: 'Great Job!', particles: true, flash: true },
  B: { color: 0x3399ff, message: 'Nice!', particles: true, flash: false },
  C: { color: 0xff9900, message: 'Not Bad', particles: false, flash: false },
  D: { color: 0xcc6600, message: 'Keep Practicing', particles: false, flash: false },
  F: { color: 0xcc0000, message: 'Try Again!', particles: false, flash: false },
  'N/A': { color: 0x888888, message: '', particles: false, flash: false }
});

function getRatingConfig(rating) {
  return RATING_CONFIG[rating] ?? RATING_CONFIG['F'];
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
    this.resultsPayload = null;
    this.trackKey = 'track1';
  }

  init(data) {
    this.resultsPayload = data?.resultsPayload ?? null;
    this.trackKey = data?.trackKey ?? 'track1';
  }

  create() {
    const { width, height } = this.scale;
    const useBitmapFont = this.cache.bitmapFont.has(FontKeys.Peaberry);
    const stats = this.resultsPayload || {};
    const rating = stats.rating || 'F';
    const config = getRatingConfig(rating);
    const isWin = rating === 'S' || rating === 'A' || rating === 'B';

    this.cameras.main.setBackgroundColor('#0f0f1a');

    if (this.textures.exists(BgImageKeys.Desert)) {
      const bg = this.add.image(width / 2, height / 2, BgImageKeys.Desert);
      bg.setDisplaySize(width, height);
      bg.setDepth(0);
      bg.setAlpha(0.4);
    }

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0f0f1a, 0.55);
    overlay.setDepth(0);

    if (config.flash) {
      this.cameras.main.flash(400, 255, 255, 255);
    }

    if (useBitmapFont) {
      this.add.bitmapText(width * 0.5, height * 0.06, FontKeys.Peaberry,
        isWin ? 'VICTORY!' : 'Run Finished!', 36)
        .setOrigin(0.5).setTint(isWin ? 0xffcc00 : 0xff6b6b).setDepth(2);
    } else {
      this.add.text(width * 0.5, height * 0.06, isWin ? 'VICTORY!' : 'Run Finished!', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '36px',
        color: isWin ? '#ffcc00' : '#ff6b6b',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: { blur: 10, color: isWin ? '#ffcc00' : '#ff6b6b', fill: true }
      }).setOrigin(0.5).setDepth(2);
    }

    this._createPlayerDisplay(width, height, isWin);

    let rankText;
    if (useBitmapFont) {
      rankText = this.add.bitmapText(width * 0.78, height * 0.2, FontKeys.Peaberry, rating, 90)
        .setOrigin(0.5).setTint(config.color).setScale(0).setDepth(3);
    } else {
      rankText = this.add.text(width * 0.78, height * 0.2, rating, {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '100px',
        color: `#${config.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 10,
        shadow: { blur: 20, color: `#${config.color.toString(16).padStart(6, '0')}`, fill: true }
      }).setOrigin(0.5).setScale(0).setDepth(3);
    }

    this.tweens.add({
      targets: rankText,
      scale: { from: 0, to: 1 },
      ease: 'Back.easeOut',
      duration: 600,
      delay: 200
    });

    if (config.particles) {
      this.tweens.add({
        targets: rankText,
        scale: { from: 1, to: 1.08 },
        ease: 'Sine.easeInOut',
        duration: 800,
        yoyo: true,
        repeat: -1,
        delay: 900
      });
    }

    if (config.message) {
      let msgText;
      if (useBitmapFont) {
        msgText = this.add.bitmapText(width * 0.78, height * 0.32, FontKeys.Peaberry, config.message, 18)
          .setOrigin(0.5).setTint(config.color).setAlpha(0).setDepth(2);
      } else {
        msgText = this.add.text(width * 0.78, height * 0.32, config.message, {
          fontFamily: 'Arial', fontSize: '20px',
          color: `#${config.color.toString(16).padStart(6, '0')}`, fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0).setDepth(2);
      }

      this.tweens.add({
        targets: msgText,
        alpha: { from: 0, to: 1 },
        y: { from: height * 0.34, to: height * 0.32 },
        ease: 'Power2',
        duration: 500,
        delay: 700
      });
    }

    if (config.particles) {
      this._spawnConfetti(width, height);
    }

    this._createStatsPanel(width, height, stats, useBitmapFont);
    this._createButtons(width, height, useBitmapFont);

    const jingleKey = isWin ? JingleKeys.Win : JingleKeys.Lose;
    const voiceKey = isWin ? VoiceKeys.YouWin : VoiceKeys.GameOver;

    if (this.sound.get(jingleKey) || this.cache.audio.has(jingleKey)) {
      this.sound.play(jingleKey, { volume: 0.6 });
    }
    this.time.delayedCall(800, () => {
      if (this.sound.get(voiceKey) || this.cache.audio.has(voiceKey)) {
        this.sound.play(voiceKey, { volume: 0.7 });
      }
    });

    this.input.keyboard.once('keydown-R', () => {
      this.sound.play(SfxKeys.UiConfirm, { volume: 0.5 });
      this.scene.start('GameScene', { trackKey: this.trackKey });
    });

    this.input.keyboard.once('keydown-M', () => {
      this.sound.play(SfxKeys.UiBack, { volume: 0.5 });
      this.scene.start('MainMenuScene');
    });
  }

  _createPlayerDisplay(width, height, isWin) {
    const playerManifest = this.registry.get('player-manifest');
    const selectedColor = this.registry.get('selectedPlayerColor') || 'green';
    const entity = playerManifest?.entities?.find(e => e.variant === selectedColor)
      || playerManifest?.entities?.[0];

    if (!entity) return;

    const standKey = getStateManifestKey(entity.archetype, entity.variant, 'stand');
    const jumpKey = getAnimationManifestKey(entity.archetype, entity.variant, 'jump');
    const hurtKey = getAnimationManifestKey(entity.archetype, entity.variant, 'hurt');

    const px = width * 0.18;
    const py = height * 0.32;

    if (!this.textures.exists(standKey)) return;

    const playerSprite = this.add.sprite(px, py, standKey);
    playerSprite.setScale(3);
    playerSprite.setOrigin(0.5, 1);
    playerSprite.setDepth(3);

    if (isWin) {
      if (this.anims.exists(jumpKey)) {
        playerSprite.play(jumpKey);
      }
      this.tweens.add({
        targets: playerSprite,
        y: py - 15,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const particleKey = this.textures.exists(ParticleKeys.Star01)
        ? ParticleKeys.Star01 : '__WHITE';
      this.add.particles(px, py - 60, particleKey, {
        speed: { min: 20, max: 60 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        lifespan: 1200,
        quantity: 1,
        frequency: 300,
        tint: [0xffcc00, 0xff66ff, 0x00ffff],
        emitting: true
      }).setDepth(2);
    } else {
      if (this.anims.exists(hurtKey)) {
        playerSprite.play(hurtKey);
      }
    }
  }

  _spawnConfetti(width, height) {
    const confettiColors = [0xff6b6b, 0xffcc00, 0x33cc33, 0x3399ff, 0xff66ff, 0x66ffff, 0xff9900];

    this.add.particles(width * 0.15, -20, '__WHITE', {
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.4, end: 0.1 },
      lifespan: { min: 2000, max: 4000 },
      gravityY: 60,
      quantity: 2,
      frequency: 100,
      tint: confettiColors,
      rotate: { min: 0, max: 360 },
      emitting: true
    });

    this.add.particles(width * 0.85, -20, '__WHITE', {
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.4, end: 0.1 },
      lifespan: { min: 2000, max: 4000 },
      gravityY: 60,
      quantity: 2,
      frequency: 100,
      tint: confettiColors,
      rotate: { min: 0, max: 360 },
      emitting: true
    });

    this.add.particles(width * 0.5, height * 0.2, '__WHITE', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      lifespan: 1500,
      gravityY: 80,
      quantity: 30,
      tint: confettiColors,
      rotate: { min: 0, max: 360 },
      emitting: false
    }).explode();
  }

  _createStatsPanel(width, height, stats, useBitmapFont) {
    const score = stats.score || 0;
    const maxCombo = stats.maxCombo || 0;
    const perfectCount = stats.perfectCount || 0;
    const goodCount = stats.goodCount || 0;
    const missCount = stats.missCount || 0;
    const totalNotes = stats.totalNotes || 0;
    const hitCount = stats.hitCount || 0;

    const panelWidth = Math.min(600, width * 0.8);
    const panelHeight = 240;
    const panelX = (width - panelWidth) / 2;
    const panelY = height * 0.40;

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.55);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 14);
    panel.lineStyle(2, 0x444466, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 14);
    panel.setDepth(1);

    const leftColX = panelX + panelWidth * 0.25;
    const rightColX = panelX + panelWidth * 0.72;
    const startY = panelY + 34;
    const ySpacing = 38;

    const addStat = (label, value, x, y, tint) => {
      if (useBitmapFont) {
        this.add.bitmapText(x - 10, y, FontKeys.Peaberry, label, 16)
          .setOrigin(1, 0.5).setTint(0x999999).setDepth(2);
        this.add.bitmapText(x + 10, y, FontKeys.Peaberry, String(value), 16)
          .setOrigin(0, 0.5).setTint(tint || 0xffffff).setDepth(2);
      } else {
        this.add.text(x - 10, y, label, {
          fontFamily: 'monospace', fontSize: '16px', color: '#999999'
        }).setOrigin(1, 0.5).setDepth(2);
        const valColor = tint ? `#${tint.toString(16).padStart(6, '0')}` : '#ffffff';
        this.add.text(x + 10, y, String(value), {
          fontFamily: 'monospace', fontSize: '16px', color: valColor, fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(2);
      }
    };

    addStat('Score:', score.toLocaleString(), leftColX, startY);
    addStat('Max Combo:', maxCombo, leftColX, startY + ySpacing);
    addStat('Total Notes:', totalNotes, leftColX, startY + ySpacing * 2);

    addStat('Perfect:', perfectCount, rightColX, startY, 0xff66ff);
    addStat('Good:', goodCount, rightColX, startY + ySpacing, 0x66ffff);
    addStat('Miss:', missCount, rightColX, startY + ySpacing * 2, 0xff3333);

    const accuracy = totalNotes > 0 ? hitCount / totalNotes : 0;
    const accuracyPct = (accuracy * 100).toFixed(1);

    const barY = startY + ySpacing * 3.2;
    const barWidth = panelWidth * 0.7;
    const barX = panelX + (panelWidth - barWidth) / 2;
    const barHeight = 16;

    panel.fillStyle(0x333344, 1);
    panel.fillRoundedRect(barX, barY, barWidth, barHeight, 6);

    const fillWidth = Math.max(0, barWidth * accuracy);
    let barColor = 0x33cc33;
    if (accuracy < 0.5) barColor = 0xcc0000;
    else if (accuracy < 0.7) barColor = 0xff9900;
    else if (accuracy < 0.85) barColor = 0x3399ff;

    if (fillWidth > 0) {
      panel.fillStyle(barColor, 1);
      panel.fillRoundedRect(barX, barY, fillWidth, barHeight, 6);
    }

    if (useBitmapFont) {
      this.add.bitmapText(barX + barWidth + 12, barY + barHeight / 2, FontKeys.Peaberry,
        `${accuracyPct}%`, 14).setOrigin(0, 0.5).setTint(0xffffff).setDepth(2);
    } else {
      this.add.text(barX + barWidth + 12, barY + barHeight / 2, `${accuracyPct}%`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(2);
    }
  }

  _createButtons(width, height, useBitmapFont) {
    const btnY = height * 0.88;
    const btnWidth = 190;
    const btnHeight = 50;

    this._createBtn(width * 0.35, btnY, btnWidth, btnHeight, 'R | RETRY', 0x33cc33, () => {
      this.scene.start('GameScene', { trackKey: this.trackKey });
    }, useBitmapFont);

    this._createBtn(width * 0.65, btnY, btnWidth, btnHeight, 'M | MENU', 0x3399ff, () => {
      this.scene.start('MainMenuScene');
    }, useBitmapFont);
  }

  _createBtn(x, y, w, h, labelText, baseColor, callback, useBitmapFont) {
    const container = this.add.container(x, y);

    const r = (baseColor >> 16) & 0xff;
    const g = (baseColor >> 8) & 0xff;
    const b = baseColor & 0xff;
    const darkColor = (Math.floor(r * 0.5) << 16) | (Math.floor(g * 0.5) << 8) | Math.floor(b * 0.5);

    const btnBg = this.add.sprite(0, 0, '__WHITE');
    btnBg.setDisplaySize(w, h);
    btnBg.setTint(baseColor, baseColor, darkColor, darkColor);

    let text;
    if (useBitmapFont) {
      text = this.add.bitmapText(0, 0, FontKeys.Peaberry, labelText, 18)
        .setOrigin(0.5).setTint(0xffffff);
    } else {
      text = this.add.text(0, 0, labelText, {
        fontFamily: 'Arial Black, sans-serif', fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    container.add([btnBg, text]);
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true });
    container.setDepth(3);

    container.on('pointerover', () => {
      btnBg.setTint(0xffffff, 0xffffff, baseColor, baseColor);
      this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 80 });
    });

    container.on('pointerout', () => {
      btnBg.setTint(baseColor, baseColor, darkColor, darkColor);
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
    });

    container.on('pointerdown', () => {
      this.sound.play(SfxKeys.UiConfirm, { volume: 0.5 });
      this.tweens.add({
        targets: container,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 50,
        yoyo: true,
        onComplete: callback
      });
    });

    return container;
  }
}
