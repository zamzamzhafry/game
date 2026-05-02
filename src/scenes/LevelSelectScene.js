import Phaser from 'phaser';
import { SfxKeys, FontKeys, BgImageKeys } from '../config/assets.js';

const BG_SETS = [
  { id: 'forest-day', label: 'Forest', color: 0x33aa55 },
  { id: 'kenney-grassland', label: 'Grassland', color: 0x66cc33 }
];

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
    this.bgIndex = 0;
    this.bgLabel = null;
    this.bgDots = [];
  }

  create() {
    const { width, height } = this.scale;
    const useBitmapFont = this.cache.bitmapFont.has(FontKeys.Peaberry);

    const savedBg = this.registry.get('selectedBgSet') || 'forest-day';
    this.bgIndex = Math.max(0, BG_SETS.findIndex(b => b.id === savedBg));

    this.cameras.main.setBackgroundColor('#0b0b1a');

    if (this.textures.exists(BgImageKeys.Castles)) {
      const bg = this.add.image(width / 2, height / 2, BgImageKeys.Castles);
      bg.setDisplaySize(width, height);
      bg.setDepth(0);
      bg.setAlpha(0.5);
    }

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b1a, 0.5);
    overlay.setDepth(0);

    let titleText;
    if (useBitmapFont) {
      titleText = this.add.bitmapText(width / 2, 50, FontKeys.Peaberry, 'SELECT TRACK', 40)
        .setOrigin(0.5).setTint(0x00ffff).setDepth(2);
    } else {
      titleText = this.add.text(width / 2, 50, 'SELECT TRACK', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '48px',
        color: '#ffffff',
        shadow: { blur: 10, color: '#00ffff', fill: true }
      }).setOrigin(0.5).setDepth(2);
    }

    this._createBtn(100, 50, 'BACK', 0x555555, 0x222222, () => {
      this.scene.start('MainMenuScene');
    }, useBitmapFont, 140, 44);

    this._createBgSelector(width, height, useBitmapFont);

    const levelData = this.cache.json.get('level-index');
    const levels = levelData ? levelData.levels : [];

    const startX = width / 2;
    let currentY = 200;

    levels.forEach((level) => {
      this._createLevelCard(startX, currentY, level, useBitmapFont);
      currentY += 150;
    });

    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }

  _createBgSelector(width, height, useBitmapFont) {
    const selectorY = height - 50;

    if (useBitmapFont) {
      this.add.bitmapText(width / 2 - 150, selectorY, FontKeys.Peaberry, 'BACKGROUND:', 14)
        .setOrigin(0, 0.5).setTint(0x888888).setDepth(2);
    } else {
      this.add.text(width / 2 - 150, selectorY, 'BACKGROUND:', {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#888888'
      }).setOrigin(0, 0.5).setDepth(2);
    }

    const arrowLeft = this.add.text(width / 2 + 10, selectorY, '\u25C0', {
      fontFamily: 'Arial', fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
    arrowLeft.on('pointerdown', () => this._cycleBg(-1));

    const arrowRight = this.add.text(width / 2 + 170, selectorY, '\u25B6', {
      fontFamily: 'Arial', fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
    arrowRight.on('pointerdown', () => this._cycleBg(1));

    if (useBitmapFont) {
      this.bgLabel = this.add.bitmapText(width / 2 + 90, selectorY, FontKeys.Peaberry, '', 16)
        .setOrigin(0.5).setDepth(3);
    } else {
      this.bgLabel = this.add.text(width / 2 + 90, selectorY, '', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ffffff'
      }).setOrigin(0.5).setDepth(3);
    }

    const dotY = selectorY + 20;
    const dotSpacing = 14;
    const dotsStartX = width / 2 + 90 - ((BG_SETS.length - 1) * dotSpacing) / 2;
    this.bgDots = [];
    for (let i = 0; i < BG_SETS.length; i++) {
      const dot = this.add.circle(dotsStartX + i * dotSpacing, dotY, 4, BG_SETS[i].color, 0.4);
      dot.setDepth(3);
      this.bgDots.push(dot);
    }

    this._updateBgPreview();
  }

  _cycleBg(dir) {
    this.bgIndex = (this.bgIndex + dir + BG_SETS.length) % BG_SETS.length;
    this.sound.play(SfxKeys.UiClick, { volume: 0.3 });
    this._updateBgPreview();
  }

  _updateBgPreview() {
    const bg = BG_SETS[this.bgIndex];
    this.registry.set('selectedBgSet', bg.id);

    if (this.bgLabel.type === 'BitmapText') {
      this.bgLabel.setText(bg.label.toUpperCase());
      this.bgLabel.setTint(bg.color);
    } else {
      this.bgLabel.setText(bg.label.toUpperCase());
      this.bgLabel.setColor(`#${bg.color.toString(16).padStart(6, '0')}`);
    }

    for (let i = 0; i < this.bgDots.length; i++) {
      this.bgDots[i].setAlpha(i === this.bgIndex ? 1 : 0.3);
    }
  }

  _createLevelCard(x, y, level, useBitmapFont) {
    const w = 580;
    const h = 110;

    const container = this.add.container(x, y);
    container.setDepth(2);

    let diffColor = 0x00ff00;
    let diffDark = 0x008800;
    if (level.difficulty.toLowerCase() === 'medium') {
      diffColor = 0xffff00;
      diffDark = 0x888800;
    } else if (level.difficulty.toLowerCase() === 'hard') {
      diffColor = 0xff0000;
      diffDark = 0x880000;
    }

    const border = this.add.sprite(0, 0, '__WHITE');
    border.setDisplaySize(w + 4, h + 4);
    border.setTint(diffColor, diffColor, diffDark, diffDark);

    const btnBg = this.add.sprite(0, 0, '__WHITE');
    btnBg.setDisplaySize(w, h);
    btnBg.setTint(0x2a1b3d, 0x2a1b3d, 0x1a0b2e, 0x1a0b2e);

    let titleText, artistText, statsText, diffText;

    if (useBitmapFont) {
      titleText = this.add.bitmapText(-w / 2 + 28, -22, FontKeys.Peaberry, level.title, 26)
        .setOrigin(0, 0.5).setTint(0xffffff);
      artistText = this.add.bitmapText(-w / 2 + 28, 10, FontKeys.Peaberry, level.artist, 16)
        .setOrigin(0, 0.5).setTint(0xaaaaaa);
      statsText = this.add.bitmapText(-w / 2 + 28, 36, FontKeys.Peaberry,
        `BPM: ${level.bpm} | Notes: ${level.noteCount}`, 12).setOrigin(0, 0.5).setTint(0x888888);
      diffText = this.add.bitmapText(w / 2 - 65, 0, FontKeys.Peaberry,
        level.difficulty.toUpperCase(), 16).setOrigin(0.5).setTint(0xffffff);
    } else {
      titleText = this.add.text(-w / 2 + 28, -22, level.title, {
        fontFamily: 'Arial Black, sans-serif', fontSize: '26px', color: '#ffffff'
      }).setOrigin(0, 0.5);
      artistText = this.add.text(-w / 2 + 28, 10, level.artist, {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#aaaaaa'
      }).setOrigin(0, 0.5);
      statsText = this.add.text(-w / 2 + 28, 36, `BPM: ${level.bpm} | Notes: ${level.noteCount}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#888888'
      }).setOrigin(0, 0.5);
      diffText = this.add.text(w / 2 - 65, 0, level.difficulty.toUpperCase(), {
        fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ffffff'
      }).setOrigin(0.5);
    }

    const diffBadgeBg = this.add.sprite(w / 2 - 65, 0, '__WHITE');
    diffBadgeBg.setDisplaySize(90, 36);
    diffBadgeBg.setTint(diffColor, diffColor, diffDark, diffDark);

    container.add([border, btnBg, titleText, artistText, statsText, diffBadgeBg, diffText]);

    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        btnBg.setTint(0x3a2b4d, 0x3a2b4d, 0x2a1b3d, 0x2a1b3d);
        border.setTint(0xffffff, 0xffffff, diffColor, diffColor);
        this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 100 });
      })
      .on('pointerout', () => {
        btnBg.setTint(0x2a1b3d, 0x2a1b3d, 0x1a0b2e, 0x1a0b2e);
        border.setTint(diffColor, diffColor, diffDark, diffDark);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      })
      .on('pointerdown', () => {
        this.sound.play(SfxKeys.UiConfirm, { volume: 0.5 });
        this.tweens.add({
          targets: container,
          scaleX: 0.96,
          scaleY: 0.96,
          duration: 50,
          yoyo: true,
          onComplete: () => {
            this.scene.start('GameScene', { trackKey: level.id });
          }
        });
      });
  }

  _createBtn(x, y, text, baseColor, darkColor, callback, useBitmapFont, w = 280, h = 60) {
    const container = this.add.container(x, y);
    container.setDepth(2);

    const btnBg = this.add.sprite(0, 0, '__WHITE');
    btnBg.setDisplaySize(w, h);
    btnBg.setTint(baseColor, baseColor, darkColor, darkColor);

    let btnText;
    if (useBitmapFont) {
      btnText = this.add.bitmapText(0, 0, FontKeys.Peaberry, text, 20)
        .setOrigin(0.5).setTint(0xffffff);
    } else {
      btnText = this.add.text(0, 0, text, {
        fontFamily: 'Arial Black, sans-serif', fontSize: '20px', color: '#ffffff'
      }).setOrigin(0.5);
    }

    container.add([btnBg, btnText]);

    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        btnBg.setTint(0xffffff, 0xffffff, baseColor, baseColor);
        this.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 100 });
      })
      .on('pointerout', () => {
        btnBg.setTint(baseColor, baseColor, darkColor, darkColor);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      })
      .on('pointerdown', () => {
        this.sound.play(SfxKeys.UiClick, { volume: 0.5 });
        this.tweens.add({
          targets: container,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 50,
          yoyo: true,
          onComplete: callback
        });
      });

    return container;
  }
}
