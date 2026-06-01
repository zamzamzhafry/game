import { getAnimationManifestKey } from '../../utils/manifestUtils.js';
import { LANE_TYPES } from '../../models/LaneModel.js';
import { FeverKeys, LaserKeys, ParticleKeys, SfxKeys } from '../../config/assets.js';

const FX_VOLUME = Object.freeze({
  hit: 0.5,
  miss: 0.5,
  laser: 0.25,
});

export function fireLaser(scene, lane) {
  const isGround = lane === LANE_TYPES.GROUND;
  const laserKey = isGround ? LaserKeys.Green1 : LaserKeys.Blue1;
  const burstKey = isGround ? LaserKeys.GreenBurst : LaserKeys.BlueBurst;
  const y = isGround ? scene.GROUND_Y - 20 : scene.AIR_Y;

  if (!scene.textures.exists(laserKey)) return;

  const laser = scene.add.image(scene.PLAYER_X + 30, y, laserKey);
  laser.setOrigin(0, 0.5);
  laser.setDepth(15);
  laser.setScale(scene.isFeverActive ? 1.9 : 1.5, 1);
  laser.setAngle(0);

  scene.sound.play(SfxKeys.LaserShoot, { volume: FX_VOLUME.laser });

  scene.tweens.add({
    targets: laser,
    x: scene.HIT_X + 40,
    alpha: { from: 1, to: 0.25 },
    scaleX: scene.isFeverActive ? 2.8 : 2,
    duration: 120,
    ease: 'Power2',
    onComplete: () => {
      if (scene.textures.exists(burstKey)) {
        const burst = scene.add.image(scene.HIT_X, y, burstKey);
        burst.setDepth(16);
        burst.setScale(0.5);
        burst.setTint(scene.isFeverActive ? 0xff77ff : 0xffffff);
        scene.tweens.add({
          targets: burst,
          scale: scene.isFeverActive ? 2.2 : 1.5,
          alpha: 0,
          duration: 200,
          onComplete: () => burst.destroy()
        });
      }
      laser.destroy();
    }
  });
}

export function spawnHitParticles(scene, judgment, laneY) {
  const particleKey = scene.textures.exists(ParticleKeys.Star01)
    ? ParticleKeys.Star01
    : '__WHITE';
  const tint = judgment === 'Perfect' ? 0x00ff00 : 0xffff00;

  scene.add.particles(scene.HIT_X, laneY - 20, particleKey, {
    speed: { min: 60, max: scene.isFeverActive ? 260 : 180 },
    angle: { min: 220, max: 320 },
    scale: { start: scene.isFeverActive ? 0.95 : 0.6, end: 0 },
    lifespan: 400,
    quantity: judgment === 'Perfect' ? (scene.isFeverActive ? 18 : 12) : (scene.isFeverActive ? 10 : 6),
    tint: scene.isFeverActive ? [tint, 0xff66ff, 0x66ffff] : tint,
    gravityY: 100,
    emitting: false
  }).explode();
}

export function spawnMissParticles(scene, laneY) {
  const particleKey = scene.textures.exists(ParticleKeys.Smoke01)
    ? ParticleKeys.Smoke01
    : '__WHITE';

  scene.add.particles(scene.HIT_X, laneY - 10, particleKey, {
    speed: { min: 30, max: 80 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.4, end: 0 },
    lifespan: 500,
    quantity: 8,
    tint: 0xff0000,
    alpha: { start: 0.6, end: 0 },
    emitting: false
  }).explode();
}

export function showComboBurst(scene) {
  const keys = [FeverKeys.ComboBurst0, FeverKeys.ComboBurst1, FeverKeys.ComboBurst2].filter((key) => scene.textures.exists(key));
  if (keys.length === 0) return;

  scene.lastComboBurstIndex = (scene.lastComboBurstIndex + 1) % keys.length;
  const key = keys[scene.lastComboBurstIndex];
  const x = scene.scale.width + 180;
  const y = scene.scale.height * 0.54;
  const image = scene.add.image(x, y, key).setOrigin(1, 0.5).setDepth(96).setAlpha(0);
  image.setScale(0.78);

  scene.tweens.add({
    targets: image,
    x: scene.scale.width - 8,
    alpha: 1,
    duration: 220,
    ease: 'Back.Out'
  });
  scene.tweens.add({
    targets: image,
    alpha: 0,
    delay: 1100,
    duration: 450,
    ease: 'Linear',
    onComplete: () => image.destroy()
  });
}

export function recordJudgment(scene, judgment) {
  const snapshot = scene.scoreModel.applyJudgment(judgment, {
    multiplier: scene.isFeverActive ? scene.feverScoreMultiplier : 1,
    flatBonus: scene.isFeverActive && judgment !== 'Miss' ? scene.feverScoreFlatBonus : 0
  });
  scene.lastJudgment = `${judgment} | Combo ${snapshot.combo}`;

  const laneY = scene.lastHitLane === LANE_TYPES.AIR ? scene.AIR_Y : scene.GROUND_Y;

  if (judgment === 'Miss') {
    scene.sound.play(SfxKeys.Miss, { volume: FX_VOLUME.miss });
    spawnMissParticles(scene, laneY);

    const entity = scene._getPlayerEntity();
    if (entity) {
      const hurtKey = getAnimationManifestKey(entity.archetype, entity.variant, 'hurt');
      const runKey = getAnimationManifestKey(entity.archetype, entity.variant, 'run');
      if (scene.anims.exists(hurtKey)) {
        scene.playerSprite.play(hurtKey);
        scene.time.delayedCall(300, () => {
          if (scene.anims.exists(runKey)) scene.playerSprite.play(runKey);
        });
      }
    }
  } else if (judgment !== 'None') {
    scene.sound.play(SfxKeys.Hit, { volume: FX_VOLUME.hit });
    spawnHitParticles(scene, judgment, laneY);
  }

  if (scene.scoreText) {
    scene.scoreText.setText(`SCORE: ${snapshot.score}`);
    scene.comboText.setText(scene.isFeverActive ? `COMBO xFEVER: ${snapshot.combo}` : `COMBO: ${snapshot.combo}`);

    scene.judgmentText.setPosition(scene.HIT_X, laneY - 60);
    scene.judgmentText.setText(judgment);

    const tintMap = {
      Perfect: 0x00ff00,
      Good: 0xffff00,
      Bad: 0xff8800,
      Miss: 0xff0000
    };
    const tint = scene.isFeverActive ? 0xff66ff : (tintMap[judgment] || 0xffffff);

    if (scene.judgmentText.type === 'BitmapText') {
      scene.judgmentText.setTint(tint);
    } else {
      scene.judgmentText.setColor(`#${tint.toString(16).padStart(6, '0')}`);
    }

    scene.tweens.killTweensOf(scene.judgmentText);
    scene.judgmentText.setAlpha(1);
    scene.judgmentText.setScale(scene.isFeverActive ? 1.9 : 1.5);
    scene.judgmentText.y = laneY - 60;
    scene.tweens.add({
      targets: scene.judgmentText,
      scale: 1,
      alpha: 0,
      y: laneY - 85,
      duration: 500,
      ease: 'Power2'
    });
  }

  return snapshot;
}
