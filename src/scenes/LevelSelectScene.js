import Phaser from 'phaser';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0b0b1a');
    
    const bgGradient = this.add.sprite(width / 2, height / 2, '__WHITE');
    bgGradient.setDisplaySize(width, height);
    bgGradient.setTint(0x1a0b2e, 0x1a0b2e, 0x0b0b1a, 0x0b0b1a);
    bgGradient.setAlpha(0.8);
    bgGradient.setDepth(0);

    const titleText = this.add.text(width / 2, 80, 'SELECT TRACK', {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      shadow: { blur: 10, color: '#00ffff', fill: true }
    }).setOrigin(0.5);
    titleText.setDepth(2);

    const backBtn = this.createButton(150, 80, 'BACK', 0x555555, 0x222222, () => {
      this.scene.start('MainMenuScene');
    }, 200, 60);

    const levelData = this.cache.json.get('level-index');
    const levels = levelData ? levelData.levels : [];

    const startX = width / 2;
    let currentY = 250;

    levels.forEach((level) => {
      this.createLevelCard(startX, currentY, level);
      currentY += 150;
    });

    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }

  createLevelCard(x, y, level) {
    const w = 600;
    const h = 120;
    
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

    const btnBg = this.add.sprite(0, 0, '__WHITE');
    btnBg.setDisplaySize(w, h);
    btnBg.setTint(0x2a1b3d, 0x2a1b3d, 0x1a0b2e, 0x1a0b2e);
    
    const border = this.add.sprite(0, 0, '__WHITE');
    border.setDisplaySize(w + 4, h + 4);
    border.setTint(diffColor, diffColor, diffDark, diffDark);

    const titleText = this.add.text(-w/2 + 30, -25, level.title, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      shadow: { blur: 2, color: '#000000', fill: true }
    }).setOrigin(0, 0.5);

    const artistText = this.add.text(-w/2 + 30, 15, level.artist, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    const statsText = this.add.text(-w/2 + 30, 45, `BPM: ${level.bpm} | Notes: ${level.noteCount}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#888888'
    }).setOrigin(0, 0.5);

    const diffBadgeBg = this.add.sprite(w/2 - 70, 0, '__WHITE');
    diffBadgeBg.setDisplaySize(100, 40);
    diffBadgeBg.setTint(diffColor, diffColor, diffDark, diffDark);

    const diffText = this.add.text(w/2 - 70, 0, level.difficulty.toUpperCase(), {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        shadow: { blur: 2, color: '#000000', fill: true }
    }).setOrigin(0.5);

    container.add([border, btnBg, titleText, artistText, statsText, diffBadgeBg, diffText]);
    
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        btnBg.setTint(0x3a2b4d, 0x3a2b4d, 0x2a1b3d, 0x2a1b3d);
        border.setTint(0xffffff, 0xffffff, diffColor, diffColor);
        this.tweens.add({
          targets: container,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100
        });
      })
      .on('pointerout', () => {
        btnBg.setTint(0x2a1b3d, 0x2a1b3d, 0x1a0b2e, 0x1a0b2e);
        border.setTint(diffColor, diffColor, diffDark, diffDark);
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
      })
      .on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 50,
          yoyo: true,
          onComplete: () => {
              this.scene.start('GameScene', { trackKey: level.id });
          }
        });
      });
  }

  createButton(x, y, text, baseColor, darkColor, callback, w = 300, h = 70) {
    const container = this.add.container(x, y);
    container.setDepth(2);
    
    const btnBg = this.add.sprite(0, 0, '__WHITE');
    btnBg.setDisplaySize(w, h);
    btnBg.setTint(baseColor, baseColor, darkColor, darkColor);
    
    const btnText = this.add.text(0, 0, text, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      shadow: { blur: 5, color: '#000000', fill: true }
    }).setOrigin(0.5);
    
    container.add([btnBg, btnText]);
    
    container.setSize(w, h);
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        btnBg.setTint(0xffffff, 0xffffff, baseColor, baseColor);
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100
        });
      })
      .on('pointerout', () => {
        btnBg.setTint(baseColor, baseColor, darkColor, darkColor);
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
      })
      .on('pointerdown', () => {
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
