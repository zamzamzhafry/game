import Phaser from 'phaser';
import { SfxKeys, FontKeys, BgImageKeys } from '../config/assets.js';
import { getStateManifestKey } from '../utils/manifestUtils.js';

const PLAYER_COLORS = ['green', 'blue', 'beige', 'pink', 'yellow'];
const COLOR_TINTS = {
  green: 0x44cc44,
  blue: 0x4488ff,
  beige: 0xddcc88,
  pink: 0xff66aa,
  yellow: 0xffcc00
};

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
    this.colorIndex = 0;
    this.previewSprite = null;
    this.colorLabel = null;
    this.colorDots = [];
  }

  create() {
    const { width, height } = this.scale;
    const useBitmapFont = this.cache.bitmapFont.has(FontKeys.Peaberry);

    const savedColor = this.registry.get('selectedPlayerColor') || 'green';
    this.colorIndex = Math.max(0, PLAYER_COLORS.indexOf(savedColor));

    this.cameras.main.setBackgroundColor('#0b0b1a');

    if (this.textures.exists(BgImageKeys.Forest)) {
      const bg = this.add.image(width / 2, height / 2, BgImageKeys.Forest);
      bg.setDisplaySize(width, height);
      bg.setDepth(0);
      bg.setAlpha(0.6);
    }

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b1a, 0.5);
    overlay.setDepth(0);

    const particles = this.add.particles(0, 0, '__WHITE', {
      x: { min: 0, max: width },
      y: height + 50,
      angle: { min: 250, max: 290 },
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 8000,
      blendMode: 'ADD',
      tint: [0xff00ff, 0x00ffff, 0xff0088],
      frequency: 200,
    });
    particles.setDepth(1);

    let titleText;
    if (useBitmapFont) {
      titleText = this.add.bitmapText(width / 2, height * 0.12, FontKeys.Peaberry, 'NEON BEAT', 72)
        .setOrigin(0.5).setTint(0xff00ff).setDepth(2);
    } else {
      titleText = this.add.text(width / 2, height * 0.12, 'NEON BEAT', {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '96px',
        fontStyle: 'italic',
        color: '#ffffff',
        stroke: '#ff00ff',
        strokeThickness: 8,
        shadow: { blur: 15, color: '#00ffff', fill: true }
      }).setOrigin(0.5).setDepth(2);
    }

    this.tweens.add({
      targets: titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this._createColorSelector(width, height, useBitmapFont);

    this._createButton(width / 2, height * 0.45, 'PLAY', 0xff00ff, 0x880088, () => {
      this.scene.start('LevelSelectScene');
    }, useBitmapFont);

    this._createButton(width / 2, height * 0.58, 'SETTINGS', 0x555555, 0x222222, () => {
      console.log('Settings clicked');
    }, useBitmapFont, true);

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('LevelSelectScene');
    });

    this.input.keyboard.on('keydown-LEFT', () => this._cycleColor(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this._cycleColor(1));
  }

  _createColorSelector(width, height, useBitmapFont) {
    const centerX = width * 0.18;
    const centerY = height * 0.82;

    if (useBitmapFont) {
      this.add.bitmapText(centerX, centerY - 80, FontKeys.Peaberry, 'YOUR ALIEN', 16)
        .setOrigin(0.5).setTint(0xaaaaaa).setDepth(2);
    } else {
      this.add.text(centerX, centerY - 80, 'YOUR ALIEN', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#aaaaaa'
      }).setOrigin(0.5).setDepth(2);
    }

    const arrowLeft = this.add.text(centerX - 60, centerY, '\u25C0', {
      fontFamily: 'Arial', fontSize: '30px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
    arrowLeft.on('pointerdown', () => this._cycleColor(-1));
    arrowLeft.on('pointerover', () => arrowLeft.setColor('#00ffff'));
    arrowLeft.on('pointerout', () => arrowLeft.setColor('#ffffff'));

    const arrowRight = this.add.text(centerX + 60, centerY, '\u25B6', {
      fontFamily: 'Arial', fontSize: '30px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
    arrowRight.on('pointerdown', () => this._cycleColor(1));
    arrowRight.on('pointerover', () => arrowRight.setColor('#00ffff'));
    arrowRight.on('pointerout', () => arrowRight.setColor('#ffffff'));

    this.previewSprite = this.add.sprite(centerX, centerY, '__WHITE');
    this.previewSprite.setOrigin(0.5, 0.5);
    this.previewSprite.setScale(2.2);
    this.previewSprite.setDepth(3);

    if (useBitmapFont) {
      this.colorLabel = this.add.bitmapText(centerX, centerY + 45, FontKeys.Peaberry, '', 16)
        .setOrigin(0.5).setDepth(3);
    } else {
      this.colorLabel = this.add.text(centerX, centerY + 45, '', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(3);
    }

    const dotY = centerY + 65;
    this.colorDots = [];
    const dotSpacing = 16;
    const dotsStartX = centerX - ((PLAYER_COLORS.length - 1) * dotSpacing) / 2;

    for (let i = 0; i < PLAYER_COLORS.length; i++) {
      const dot = this.add.circle(dotsStartX + i * dotSpacing, dotY, 4, COLOR_TINTS[PLAYER_COLORS[i]], 0.4);
      dot.setDepth(3);
      this.colorDots.push(dot);
    }

    this._updateColorPreview();
  }

  _cycleColor(dir) {
    this.colorIndex = (this.colorIndex + dir + PLAYER_COLORS.length) % PLAYER_COLORS.length;
    this.sound.play(SfxKeys.UiClick, { volume: 0.3 });
    this._updateColorPreview();
  }

  _updateColorPreview() {
    const color = PLAYER_COLORS[this.colorIndex];
    this.registry.set('selectedPlayerColor', color);

    const playerManifest = this.registry.get('player-manifest');
    const entity = playerManifest?.entities?.find(e => e.variant === color);

    if (entity) {
      const standKey = getStateManifestKey(entity.archetype, entity.variant, 'stand');
      if (this.textures.exists(standKey)) {
        this.previewSprite.setTexture(standKey);
        this.previewSprite.clearTint();
        this.previewSprite.setScale(2.2);
      } else {
        this.previewSprite.setTexture('__WHITE');
        this.previewSprite.setDisplaySize(50, 50);
        this.previewSprite.setTint(COLOR_TINTS[color]);
      }
    }

    if (this.colorLabel.type === 'BitmapText') {
      this.colorLabel.setText(color.toUpperCase());
      this.colorLabel.setTint(COLOR_TINTS[color]);
    } else {
      this.colorLabel.setText(color.toUpperCase());
      this.colorLabel.setColor(`#${COLOR_TINTS[color].toString(16).padStart(6, '0')}`);
    }

    for (let i = 0; i < this.colorDots.length; i++) {
      this.colorDots[i].setAlpha(i === this.colorIndex ? 1 : 0.3);
      this.colorDots[i].setRadius(i === this.colorIndex ? 6 : 4);
    }

    this.tweens.killTweensOf(this.previewSprite);
    this.previewSprite.setScale(1.9);
    this.tweens.add({
      targets: this.previewSprite,
      scale: 2.2,
      duration: 150,
      ease: 'Back.easeOut'
    });
  }

  _createButton(x, y, text, baseColor, darkColor, callback, useBitmapFont, disabled = false) {
    const w = 280;
    const h = 60;

    const container = this.add.container(x, y);
    container.setDepth(2);

    const btnBg = this.add.sprite(0, 0, '__WHITE');
    btnBg.setDisplaySize(w, h);
    btnBg.setTint(baseColor, baseColor, darkColor, darkColor);

    if (disabled) {
      btnBg.setAlpha(0.5);
    }

    let btnText;
    if (useBitmapFont) {
      btnText = this.add.bitmapText(0, 0, FontKeys.Peaberry, text, 28)
        .setOrigin(0.5).setTint(disabled ? 0xaaaaaa : 0xffffff);
    } else {
      btnText = this.add.text(0, 0, text, {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '28px',
        color: disabled ? '#aaaaaa' : '#ffffff',
        shadow: { blur: disabled ? 0 : 5, color: '#000000', fill: true }
      }).setOrigin(0.5);
    }

    container.add([btnBg, btnText]);

    if (!disabled) {
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
    }

    return container;
  }
}
