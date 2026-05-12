import { JudgmentModel } from '../../models/JudgmentModel.js';
import { LANE_TYPES } from '../../models/LaneModel.js';
import { getAnimationManifestKey, getStateManifestKey } from '../../utils/manifestUtils.js';

const ENEMY_SCALE = 1.2;

export function getEnemyTextureKey(note) {
  const arch = note.render?.archetype || 'snail';
  const variant = note.render?.variant || 'default';
  const state = note.render?.state || 'idle';
  return getStateManifestKey(arch, variant, state);
}

export function getEnemyAnimKey(note) {
  const arch = note.render?.archetype || 'snail';
  const variant = note.render?.variant || 'default';
  const animName = note.lane === LANE_TYPES.AIR ? 'fly' : 'walk';
  return getAnimationManifestKey(arch, variant, animName);
}

export function acquireEnemySprite(scene, x, y, textureKey, animKey, lane) {
  let sprite = scene.enemyPool.pop();
  const hasTexture = scene.textures.exists(textureKey);

  if (sprite) {
    sprite.setActive(true).setVisible(true);
    sprite.setPosition(x, y);
    if (hasTexture) {
      sprite.setTexture(textureKey);
      sprite.setScale(ENEMY_SCALE);
      sprite.clearTint();
    } else {
      sprite.setTexture('__WHITE');
      sprite.setDisplaySize(36, 36);
      sprite.setTint(lane === LANE_TYPES.GROUND ? 0xff4444 : 0x4444ff);
    }
  } else if (hasTexture) {
    sprite = scene.add.sprite(x, y, textureKey);
    sprite.setScale(ENEMY_SCALE);
  } else {
    sprite = scene.add.sprite(x, y, '__WHITE');
    sprite.setDisplaySize(36, 36);
    sprite.setTint(lane === LANE_TYPES.GROUND ? 0xff4444 : 0x4444ff);
  }

  sprite.setOrigin(0.5, lane === LANE_TYPES.GROUND ? 1 : 0.5);
  sprite.setDepth(5);

  if (hasTexture && scene.anims.exists(animKey)) {
    if (sprite.anims.currentAnim?.key !== animKey) {
      sprite.play(animKey);
    }
  } else {
    sprite.anims?.stop();
  }

  return sprite;
}

export function releaseEnemySprite(scene, sprite) {
  sprite.setActive(false).setVisible(false);
  sprite.anims?.stop();
  scene.enemyPool.push(sprite);
}

export function updateEnemies(scene, sessionState) {
  if (scene.gameState !== 'PLAYING') {
    for (const entry of scene.activeEnemies) {
      releaseEnemySprite(scene, entry.sprite);
    }
    scene.activeEnemies = [];
    return;
  }

  const songTimeMs = scene.conductor.getSongTimeMs();
  const visibleWindowMs = 2000;
  const visibleNoteIds = new Set();

  [LANE_TYPES.GROUND, LANE_TYPES.AIR].forEach((lane) => {
    let cursor = sessionState.laneCursors[lane];
    let note = scene.sessionController.notesByLane[lane][cursor];

    while (note && note.hitTimeMs <= songTimeMs + visibleWindowMs) {
      if (note.hitTimeMs >= songTimeMs - JudgmentModel.getGoodWindowMs()) {
        const noteId = `${lane}_${cursor}`;
        visibleNoteIds.add(noteId);

        const timeToHitSec = (note.hitTimeMs - songTimeMs) / 1000;
        const targetX = scene.HIT_X + (timeToHitSec * scene.scrollSpeed);
        const y = lane === LANE_TYPES.GROUND ? scene.GROUND_Y : scene.AIR_Y;

        const existing = scene.activeEnemies.find((entry) => entry.noteId === noteId);
        if (existing) {
          existing.sprite.x = targetX;
        } else {
          const textureKey = getEnemyTextureKey(note);
          const animKey = getEnemyAnimKey(note);
          const sprite = acquireEnemySprite(scene, targetX, y, textureKey, animKey, lane);
          scene.activeEnemies.push({ noteId, sprite });
        }
      }

      cursor += 1;
      note = scene.sessionController.notesByLane[lane][cursor];
    }
  });

  scene.activeEnemies = scene.activeEnemies.filter((entry) => {
    if (!visibleNoteIds.has(entry.noteId)) {
      releaseEnemySprite(scene, entry.sprite);
      return false;
    }
    return true;
  });
}
