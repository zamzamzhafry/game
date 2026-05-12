import { JudgmentModel } from '../../models/JudgmentModel.js';
import { FontKeys, UiKeys } from '../../config/assets.js';

export function createInputHints(scene, width, height, useBitmapFont) {
  const hintDepth = 50;
  const hintAlpha = 0.5;
  const iconSize = 44;
  const rightX = width - 60;
  const bottomY = height - 40;
  const stackGap = 56;

  const hintContainer = scene.add.container(0, 0).setDepth(hintDepth).setAlpha(hintAlpha);

  const aIcon = scene.add.image(rightX, bottomY - stackGap, UiKeys.KeyA).setDisplaySize(iconSize, iconSize);
  const zIcon = scene.add.image(rightX, bottomY, UiKeys.KeyZ).setDisplaySize(iconSize, iconSize);

  if (useBitmapFont) {
    const aLabel = scene.add.bitmapText(rightX, bottomY - stackGap - 26, FontKeys.Peaberry, 'AIR', 14)
      .setOrigin(0.5).setTint(0x55aaff);
    const zLabel = scene.add.bitmapText(rightX, bottomY - 26, FontKeys.Peaberry, 'GROUND', 14)
      .setOrigin(0.5).setTint(0x00ff88);
    hintContainer.add([aIcon, aLabel, zIcon, zLabel]);
  } else {
    const aLabel = scene.add.text(rightX, bottomY - stackGap - 26, 'AIR', {
      fontFamily: 'Arial', fontSize: '14px', color: '#55aaff', fontStyle: 'bold'
    }).setOrigin(0.5);
    const zLabel = scene.add.text(rightX, bottomY - 26, 'GROUND', {
      fontFamily: 'Arial', fontSize: '14px', color: '#00ff88', fontStyle: 'bold'
    }).setOrigin(0.5);
    hintContainer.add([aIcon, aLabel, zIcon, zLabel]);
  }

  const tapIcon = scene.add.image(rightX, bottomY - stackGap * 2, UiKeys.TouchTap)
    .setDisplaySize(iconSize, iconSize);
  hintContainer.add([tapIcon]);

  const touchLeft = scene.add.rectangle(width * 0.25, height * 0.5, width * 0.5, height, 0x000000, 0)
    .setOrigin(0.5).setInteractive().setDepth(hintDepth - 1);
  touchLeft.on('pointerdown', () => scene.handleGroundInput());

  const touchRight = scene.add.rectangle(width * 0.75, height * 0.5, width * 0.5, height, 0x000000, 0)
    .setOrigin(0.5).setInteractive().setDepth(hintDepth - 1);
  touchRight.on('pointerdown', () => scene.handleAirInput());
}

export function createTopRightControls(scene, width, useBitmapFont) {
  const controlDepth = 55;
  const iconSize = 36;
  const topY = 24;
  const rightEdge = width - 20;
  const gap = 50;

  const controlContainer = scene.add.container(0, 0).setDepth(controlDepth).setAlpha(0.6);

  const qIcon = scene.add.image(rightEdge - gap, topY, UiKeys.KeyQ).setDisplaySize(iconSize, iconSize);
  const dIcon = scene.add.image(rightEdge, topY, UiKeys.KeyD).setDisplaySize(iconSize, iconSize);

  if (useBitmapFont) {
    const qLabel = scene.add.bitmapText(rightEdge - gap, topY + 22, FontKeys.Peaberry, 'PAUSE', 10)
      .setOrigin(0.5).setTint(0xaaaaaa);
    const dLabel = scene.add.bitmapText(rightEdge, topY + 22, FontKeys.Peaberry, 'DEBUG', 10)
      .setOrigin(0.5).setTint(0xaaaaaa);
    controlContainer.add([qIcon, qLabel, dIcon, dLabel]);
  } else {
    const qLabel = scene.add.text(rightEdge - gap, topY + 22, 'PAUSE', {
      fontFamily: 'Arial', fontSize: '10px', color: '#aaaaaa'
    }).setOrigin(0.5);
    const dLabel = scene.add.text(rightEdge, topY + 22, 'DEBUG', {
      fontFamily: 'Arial', fontSize: '10px', color: '#aaaaaa'
    }).setOrigin(0.5);
    controlContainer.add([qIcon, qLabel, dIcon, dLabel]);
  }

  scene.input.keyboard.on('keydown-D', () => {
    scene.debugContainer.setVisible(!scene.debugContainer.visible);
  });
}

export function createDebugPanel(scene, width, height, useBitmapFont) {
  scene.debugContainer = scene.add.container(0, 0).setVisible(false).setDepth(70);

  const debugBg = scene.add.rectangle(width * 0.5, height * 0.5, width * 0.7, height * 0.6, 0x000000, 0.8);
  scene.debugContainer.add(debugBg);

  if (useBitmapFont) {
    const title = scene.add.bitmapText(width * 0.5, height * 0.25, FontKeys.Peaberry, 'RHYTHM DEBUG', 28)
      .setOrigin(0.5).setTint(0xffffff);
    const instructions = scene.add.bitmapText(width * 0.5, height * 0.32, FontKeys.Peaberry,
      'Z = ground, A = air, D = debug, Q = pause', 18).setOrigin(0.5).setTint(0x7bdff2);
    scene.debugText = scene.add.bitmapText(width * 0.5, height * 0.5, FontKeys.Peaberry, '', 22)
      .setOrigin(0.5).setTint(0xffd166).setCenterAlign();
    const disclaimer = scene.add.bitmapText(width * 0.5, height * 0.7, FontKeys.Peaberry,
      'No physics used as gameplay truth.', 16).setOrigin(0.5).setTint(0xb8f2e6);
    scene.debugContainer.add([title, instructions, scene.debugText, disclaimer]);
  } else {
    const title = scene.add.text(width * 0.5, height * 0.25, 'RHYTHM DEBUG', {
      fontFamily: 'Arial', fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5);
    const instructions = scene.add.text(width * 0.5, height * 0.32,
      'Z = ground, A = air, D = debug, Q = pause', {
        fontFamily: 'Arial', fontSize: '18px', color: '#7bdff2'
      }).setOrigin(0.5);
    scene.debugText = scene.add.text(width * 0.5, height * 0.5, '', {
      fontFamily: 'Consolas, monospace', fontSize: '22px', color: '#ffd166', align: 'center'
    }).setOrigin(0.5);
    const disclaimer = scene.add.text(width * 0.5, height * 0.7,
      'No physics used as gameplay truth.', {
        fontFamily: 'Arial', fontSize: '16px', color: '#b8f2e6'
      }).setOrigin(0.5);
    scene.debugContainer.add([title, instructions, scene.debugText, disclaimer]);
  }
}

export function createPauseOverlay(scene, width, height, useBitmapFont) {
  scene.pauseContainer = scene.add.container(0, 0).setVisible(false).setDepth(100);

  const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55);

  let pauseLabel;
  let subLabel;

  if (useBitmapFont) {
    pauseLabel = scene.add.bitmapText(width / 2, height / 2, FontKeys.Peaberry, 'PAUSED', 64)
      .setOrigin(0.5).setTint(0xffffff);
    subLabel = scene.add.bitmapText(width / 2, height / 2 + 50, FontKeys.Peaberry, 'Press Q or ESC to Resume', 20)
      .setOrigin(0.5).setTint(0xffd166);
  } else {
    pauseLabel = scene.add.text(width / 2, height / 2, 'PAUSED', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '64px', color: '#ffffff'
    }).setOrigin(0.5);
    subLabel = scene.add.text(width / 2, height / 2 + 60, 'Press Q or ESC to Resume', {
      fontFamily: 'Arial', fontSize: '24px', color: '#ffd166'
    }).setOrigin(0.5);
  }

  scene.pauseContainer.add([bg, pauseLabel, subLabel]);
}

export function drawGameplayGuides(scene, width, height) {
  const goodWindowPx = (JudgmentModel.getGoodWindowMs() / 1000) * scene.scrollSpeed;
  const guide = scene.guideGraphics;

  guide.clear();

  guide.lineStyle(2, 0x00ff88, 0.45);
  guide.beginPath();
  guide.moveTo(0, scene.GROUND_Y);
  guide.lineTo(width, scene.GROUND_Y);
  guide.strokePath();

  guide.lineStyle(2, 0x55aaff, 0.45);
  guide.beginPath();
  guide.moveTo(0, scene.AIR_Y);
  guide.lineTo(width, scene.AIR_Y);
  guide.strokePath();

  guide.lineStyle(3, 0xffd166, 0.8);
  guide.beginPath();
  guide.moveTo(scene.HIT_X - goodWindowPx, scene.AIR_Y - 60);
  guide.lineTo(scene.HIT_X - goodWindowPx, scene.GROUND_Y + 30);
  guide.strokePath();

  guide.beginPath();
  guide.moveTo(scene.HIT_X + goodWindowPx, scene.AIR_Y - 60);
  guide.lineTo(scene.HIT_X + goodWindowPx, scene.GROUND_Y + 30);
  guide.strokePath();

  guide.lineStyle(4, 0x00ff00, 0.95);
  guide.beginPath();
  guide.moveTo(scene.HIT_X, scene.AIR_Y - 80);
  guide.lineTo(scene.HIT_X, height);
  guide.strokePath();
}
