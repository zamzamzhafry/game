import { FontKeys } from '../../config/assets.js';

export function createFeverHud(scene, width, height, useBitmapFont) {
  scene.feverHud = {};
  const y = height - 28;
  const barWidth = width * 0.58;
  const barHeight = 16;
  const x = (width - barWidth) / 2;

  const bg = scene.add.rectangle(x + barWidth / 2, y, barWidth + 6, barHeight + 6, 0x0b1020, 0.82).setDepth(80);
  const track = scene.add.rectangle(x + barWidth / 2, y, barWidth, barHeight, 0x1f2940, 1).setDepth(81);
  const fill = scene.add.rectangle(x, y, 1, barHeight - 4, 0x00ffaa, 1).setOrigin(0, 0.5).setDepth(82);
  const edge = scene.add.rectangle(x + barWidth / 2, y, barWidth, barHeight, 0xffffff, 0).setStrokeStyle(2, 0x66d9ff, 0.5).setDepth(83);

  let label;
  let timer;
  if (useBitmapFont) {
    label = scene.add.bitmapText(x, y - 28, FontKeys.Peaberry, 'FEVER 0 / 10', 16).setDepth(84).setTint(0xffffff);
    timer = scene.add.bitmapText(x + barWidth, y - 28, FontKeys.Peaberry, '', 16).setOrigin(1, 0).setDepth(84).setTint(0xff77ff);
  } else {
    label = scene.add.text(x, y - 28, 'FEVER 0 / 10', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ffffff'
    }).setDepth(84);
    timer = scene.add.text(x + barWidth, y - 28, '', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '16px', color: '#ff77ff'
    }).setOrigin(1, 0).setDepth(84);
  }

  scene.feverHud = { x, y, barWidth, bg, track, fill, edge, label, timer, pulseTween: null };
  scene.updateFeverHud?.();
}

export function updateFeverHud(scene) {
  const hud = scene.feverHud;
  if (!hud?.fill) return;

  const fillRatio = Math.max(0, Math.min(1, scene.feverMeter / scene.feverMeterMax));
  hud.fill.width = Math.max(1, hud.barWidth * fillRatio);
  hud.fill.fillColor = scene.isFeverActive ? 0xff66ff : (fillRatio >= 1 ? 0xffd166 : 0x00ffaa);

  const meterText = `FEVER ${scene.feverMeter.toFixed(1)} / ${scene.feverMeterMax}`;
  hud.label.setText(meterText);

  if (scene.isFeverActive) {
    const leftMs = Math.max(0, scene.feverEndsAtMs - scene.conductor.getSongTimeMs());
    hud.timer.setText(`LIVE ${(leftMs / 1000).toFixed(1)}s`);
  } else {
    hud.timer.setText('');
  }
}

export function applyFeverHudState(scene, active) {
  const hud = scene.feverHud;
  if (!hud?.bg) return;

  hud.bg.fillColor = active ? 0x34103f : 0x0b1020;
  hud.track.fillColor = active ? 0x5f1f77 : 0x1f2940;
  hud.edge.setStrokeStyle(2, active ? 0xff66ff : 0x66d9ff, active ? 0.95 : 0.5);

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
      targets: [hud.fill, scene.scoreText, scene.comboText],
      alpha: { from: 0.75, to: 1 },
      duration: 240,
      yoyo: true,
      repeat: -1
    });
  } else if (hud.pulseTween) {
    hud.pulseTween.remove();
    hud.pulseTween = null;
    hud.fill.setAlpha(1);
    scene.scoreText?.setAlpha?.(1);
    scene.comboText?.setAlpha?.(1);
  }
}
