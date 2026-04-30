import Phaser from 'phaser';

const RATING_CONFIG = Object.freeze({
  S: { color: '#ffcc00', glow: 0xffcc00, message: 'PERFECT RUN!', particles: true, flash: true },
  A: { color: '#33cc33', glow: 0x33cc33, message: 'Great Job!', particles: true, flash: true },
  B: { color: '#3399ff', glow: 0x3399ff, message: 'Nice!', particles: false, flash: false },
  C: { color: '#ff9900', glow: 0xff9900, message: 'Not Bad', particles: false, flash: false },
  D: { color: '#cc6600', glow: 0xcc6600, message: 'Keep Practicing', particles: false, flash: false },
  F: { color: '#cc0000', glow: 0xcc0000, message: 'Try Again!', particles: false, flash: false },
  'N/A': { color: '#888888', glow: 0x888888, message: '', particles: false, flash: false }
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
    const stats = this.resultsPayload || {};
    const rating = stats.rating || 'F';
    const config = getRatingConfig(rating);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1a, 0x0f0f1a, 1);
    bg.fillRect(0, 0, width, height);

    if (config.flash) {
      this.cameras.main.flash(400, 255, 255, 255);
    }

    this.add
      .text(width * 0.5, height * 0.08, 'Run Finished!', {
        fontFamily: 'Arial',
        fontSize: '44px',
        color: '#ff6b6b',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    const rankText = this.add
      .text(width * 0.5, height * 0.19, rating, {
        fontFamily: 'Arial',
        fontSize: '96px',
        color: config.color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setScale(0);

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
      const msgText = this.add
        .text(width * 0.5, height * 0.29, config.message, {
          fontFamily: 'Arial',
          fontSize: '28px',
          color: config.color,
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setAlpha(0);

      this.tweens.add({
        targets: msgText,
        alpha: { from: 0, to: 1 },
        y: { from: height * 0.31, to: height * 0.29 },
        ease: 'Power2',
        duration: 500,
        delay: 700
      });
    }

    if (config.particles) {
      this.spawnConfetti(width, height);
    }

    this.createStatsPanel(width, height, stats);

    this.createButtons(width, height);

    this.input.keyboard.once('keydown-R', () => {
      this.scene.start('GameScene', { trackKey: this.trackKey });
    });

    this.input.keyboard.once('keydown-M', () => {
      this.scene.start('MainMenuScene');
    });
  }

  spawnConfetti(width, height) {
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

  createStatsPanel(width, height, stats) {
    const score = stats.score || 0;
    const maxCombo = stats.maxCombo || 0;
    const perfectCount = stats.perfectCount || 0;
    const goodCount = stats.goodCount || 0;
    const missCount = stats.missCount || 0;
    const totalNotes = stats.totalNotes || 0;
    const hitCount = stats.hitCount || 0;

    const panelWidth = Math.min(620, width * 0.82);
    const panelHeight = 280;
    const panelX = (width - panelWidth) / 2;
    const panelY = height * 0.36;

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.55);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);
    panel.lineStyle(2, 0x444466, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);

    const leftColX = panelX + panelWidth * 0.25;
    const rightColX = panelX + panelWidth * 0.72;
    const startY = panelY + 40;
    const ySpacing = 42;

    const labelStyle = {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#999999'
    };

    const valStyle = {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    };

    const addStat = (label, value, x, y, valColor) => {
      this.add.text(x - 10, y, label, labelStyle).setOrigin(1, 0.5);
      const style = valColor ? { ...valStyle, color: valColor } : valStyle;
      this.add.text(x + 10, y, String(value), style).setOrigin(0, 0.5);
    };

    addStat('Score:', score.toLocaleString(), leftColX, startY);
    addStat('Max Combo:', maxCombo, leftColX, startY + ySpacing);
    addStat('Total Notes:', totalNotes, leftColX, startY + ySpacing * 2);

    addStat('Perfect:', perfectCount, rightColX, startY, '#ff66ff');
    addStat('Good:', goodCount, rightColX, startY + ySpacing, '#66ffff');
    addStat('Miss:', missCount, rightColX, startY + ySpacing * 2, '#ff3333');

    const accuracy = totalNotes > 0 ? hitCount / totalNotes : 0;
    const accuracyPct = (accuracy * 100).toFixed(1);

    const barY = startY + ySpacing * 3.3;
    const barWidth = panelWidth * 0.7;
    const barX = panelX + (panelWidth - barWidth) / 2;
    const barHeight = 20;

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

    this.add
      .text(barX + barWidth + 14, barY + barHeight / 2, `${accuracyPct}%`, {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);
  }

  createButtons(width, height) {
    const btnY = height * 0.87;
    const btnWidth = 180;
    const btnHeight = 50;

    this.createButton(width * 0.35, btnY, btnWidth, btnHeight, 'R | RETRY', 0x33cc33, () => {
      this.scene.start('GameScene', { trackKey: this.trackKey });
    });

    this.createButton(width * 0.65, btnY, btnWidth, btnHeight, 'M | MENU', 0x3399ff, () => {
      this.scene.start('MainMenuScene');
    });
  }

  createButton(x, y, w, h, labelText, baseColor, callback) {
    const container = this.add.container(x, y);

    const btnBg = this.add.sprite(0, 0, '__WHITE');
    btnBg.setDisplaySize(w, h);

    const r = (baseColor >> 16) & 0xff;
    const g = (baseColor >> 8) & 0xff;
    const b = baseColor & 0xff;
    const darkR = Math.floor(r * 0.5);
    const darkG = Math.floor(g * 0.5);
    const darkB = Math.floor(b * 0.5);
    const darkColor = (darkR << 16) | (darkG << 8) | darkB;

    btnBg.setTint(baseColor, baseColor, darkColor, darkColor);

    const text = this.add
      .text(0, 0, labelText, {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    container.add([btnBg, text]);
    btnBg.setInteractive({ useHandCursor: true });

    btnBg.on('pointerover', () => {
      btnBg.setTint(0xffffff, 0xffffff, baseColor, baseColor);
    });

    btnBg.on('pointerout', () => {
      btnBg.setTint(baseColor, baseColor, darkColor, darkColor);
    });

    btnBg.on('pointerdown', callback);

    return container;
  }
}
