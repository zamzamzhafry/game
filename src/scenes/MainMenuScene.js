import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0b0b1a');
    
    const bgGradient = this.add.sprite(width / 2, height / 2, '__WHITE');
    bgGradient.setDisplaySize(width, height);
    bgGradient.setTint(0x1a0b2e, 0x1a0b2e, 0x0b0b1a, 0x0b0b1a);
    bgGradient.setAlpha(0.8);
    bgGradient.setDepth(0);

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

    const titleText = this.add.text(width / 2, height * 0.3, 'NEON BEAT', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '96px',
      fontStyle: 'italic',
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 8,
      shadow: { blur: 15, color: '#00ffff', fill: true }
    }).setOrigin(0.5);
    titleText.setDepth(2);

    this.tweens.add({
      targets: titleText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.createButton(width / 2, height * 0.6, 'PLAY', 0xff00ff, 0x880088, () => {
      this.scene.start('LevelSelectScene');
    });

    this.createButton(width / 2, height * 0.75, 'SETTINGS', 0x555555, 0x222222, () => {
      console.log('Settings clicked');
    }, true);

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  createButton(x, y, text, baseColor, darkColor, callback, disabled = false) {
    const w = 300;
    const h = 70;
    
    const container = this.add.container(x, y);
    container.setDepth(2);
    
    const btnBg = this.add.sprite(0, 0, '__WHITE');
    btnBg.setDisplaySize(w, h);
    btnBg.setTint(baseColor, baseColor, darkColor, darkColor);
    
    if (disabled) {
        btnBg.setAlpha(0.5);
    }
    
    const btnText = this.add.text(0, 0, text, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: '32px',
      color: disabled ? '#aaaaaa' : '#ffffff',
      shadow: { blur: disabled ? 0 : 5, color: '#000000', fill: true }
    }).setOrigin(0.5);
    
    container.add([btnBg, btnText]);
    
    if (!disabled) {
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
    }
    
    return container;
  }
}
