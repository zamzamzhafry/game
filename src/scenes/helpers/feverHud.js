import { FontKeys } from '../../config/assets.js';

function setLabelTint(label, tint) {
  if (!label) return;
  if (label.type === 'BitmapText') {
    label.setTint(tint);
  } else {
    label.setColor(`#${tint.toString(16).padStart(6, '0')}`);
  }
}

export function createFeverHud(scene, width, height, useBitmapFont) {
  scene.feverHud = {};
  const y = height - 30;
  const barWidth = width * 0.64;
  const barHeight = 20;
  const x = (width - barWidth) / 2;

  const bg = scene.add.rectangle(x + barWidth / 2, y, barWidth + 12, barHeight + 12, 0x070b17, 0.9).setDepth(80);
  const glow = scene.add.rectangle(x + barWidth / 2, y, barWidth + 30, barHeight + 20, 0x00ffaa, 0.08).setDepth(80);
  const track = scene.add.rectangle(x + barWidth / 2, y, barWidth, barHeight, 0x152238, 1).setDepth(81);
  const fill = scene.add.rectangle(x, y, 1, barHeight - 4, 0x00ffaa, 1).setOrigin(0, 0.5).setDepth(82);
  const shine = scene.add.rectangle(x - 60, y, 64, barHeight - 2, 0xffffff, 0.22).setAngle(18).setDepth(83);
  const edge = scene.add.rectangle(x + barWidth / 2, y, barWidth, barHeight, 0xffffff, 0).setStrokeStyle(2, 0x66d9ff, 0.75).setDepth(84);

  const ticks = [];
  for (let i = 1; i < 8; i += 1) {
    const tickX = x + (barWidth * (i / 8));
    const tick = scene.add.rectangle(tickX, y, 3, barHeight - 2, 0xffffff, 0.22).setDepth(84);
    ticks.push(tick);
  }

  let label;
  let timer;
  let multiplier;
  if (useBitmapFont) {
    label = scene.add.bitmapText(x, y - 32, FontKeys.Peaberry, 'FEVER DRIVE 0.0 / 8', 16).setDepth(85).setTint(0xffffff);
    timer = scene.add.bitmapText(x + barWidth, y - 32, FontKeys.Peaberry, '', 16).setOrigin(1, 0).setDepth(85).setTint(0xff77ff);
    multiplier = scene.add.bitmapText(x + barWidth / 2, y - 10, FontKeys.Peaberry, '', 12).setOrigin(0.5).setDepth(85).setTint(0x66ffff);
  } else {
    label = scene.add.text(x, y - 32, 'FEVER DRIVE 0.0 / 8', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ffffff'
    }).setDepth(85);
    timer = scene.add.text(x + barWidth, y - 32, '', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ff77ff'
    }).setOrigin(1, 0).setDepth(85);
    multiplier = scene.add.text(x + barWidth / 2, y - 10, '', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '12px', color: '#66ffff'
    }).setOrigin(0.5).setDepth(85);
  }

  const shineTween = scene.tweens.add({
    targets: shine,
    x: x + barWidth + 60,
    duration: 950,
    repeat: -1,
    ease: 'Linear',
    paused: false,
    onRepeat: () => { shine.x = x - 60; }
  });

  scene.feverHud = { x, y, barWidth, bg, glow, track, fill, shine, edge, ticks, label, timer, multiplier, pulseTween: null, shineTween };
  scene.updateFeverHud?.();
}

export function updateFeverHud(scene) {
  const hud = scene.feverHud;
  if (!hud?.fill) return;

  const fillRatio = Math.max(0, Math.min(1, scene.feverMeter / scene.feverMeterMax));
  hud.fill.width = Math.max(1, hud.barWidth * fillRatio);
  hud.fill.fillColor = scene.isFeverActive ? 0xff66ff : (fillRatio >= 0.875 ? 0xffd166 : fillRatio >= 0.5 ? 0x66ffff : 0x00ffaa);
  hud.glow.fillColor = scene.isFeverActive ? 0xff66ff : hud.fill.fillColor;
  hud.glow.alpha = scene.isFeverActive ? 0.18 : (0.05 + fillRatio * 0.14);
  hud.shine.alpha = scene.isFeverActive ? 0.32 : (0.08 + fillRatio * 0.18);

  hud.ticks.forEach((tick, index) => {
    tick.alpha = fillRatio >= ((index + 1) / 8) ? 0.85 : 0.18;
    tick.fillColor = scene.isFeverActive ? 0xffd6ff : 0xffffff;
  });

  hud.label.setText(`FEVER DRIVE ${scene.feverMeter.toFixed(1)} / ${scene.feverMeterMax}`);
  hud.multiplier.setText(scene.isFeverActive ? `SCORE x${scene.feverScoreMultiplier.toFixed(1)}` : `READY AT ${scene.feverMeterMax.toFixed(0)}`);

  if (scene.isFeverActive) {
    const leftMs = Math.max(0, scene.feverEndsAtMs - scene.conductor.getSongTimeMs());
    hud.timer.setText(`LIVE ${(leftMs / 1000).toFixed(1)}s`);
  } else {
    hud.timer.setText(fillRatio >= 1 ? 'IGNITE' : '');
  }
}

export function applyFeverHudState(scene, active) {
  const hud = scene.feverHud;
  if (!hud?.bg) return;

  hud.bg.fillColor = active ? 0x34103f : 0x070b17;
  hud.track.fillColor = active ? 0x5f1f77 : 0x152238;
  hud.edge.setStrokeStyle(active ? 3 : 2, active ? 0xff66ff : 0x66d9ff, active ? 0.98 : 0.75);
  setLabelTint(hud.label, active ? 0xffd6ff : 0xffffff);
  setLabelTint(hud.timer, active ? 0xff77ff : 0xff77ff);
  setLabelTint(hud.multiplier, active ? 0xffffff : 0x66ffff);

  if (scene.scoreText) {
    if (scene.scoreText.type === 'BitmapText') {
      scene.scoreText.setTint(active ? 0xff77ff : 0xffffff);
      scene.comboText.setTint(active ? 0x66ffff : 0xffd166);
    } else {
      scene.scoreText.setColor(active ? '#ff77ff' : '#ffffff');
      scene.comboText.setColor(active ? '#66ffff' : '#ffd166');
    }
  }

  if (active) {
    if (hud.pulseTween) hud.pulseTween.remove();
    hud.pulseTween = scene.tweens.add({
      targets: [hud.fill, hud.glow, scene.scoreText, scene.comboText],
      alpha: { from: 0.65, to: 1 },
      duration: 180,
      yoyo: true,
      repeat: -1
    });
  } else if (hud.pulseTween) {
    hud.pulseTween.remove();
    hud.pulseTween = null;
    hud.fill.setAlpha(1);
    hud.glow.setAlpha(0.08);
    scene.scoreText?.setAlpha?.(1);
    scene.comboText?.setAlpha?.(1);
  }
}

