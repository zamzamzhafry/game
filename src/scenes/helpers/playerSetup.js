import { getAnimationManifestKey, getStateManifestKey } from '../../utils/manifestUtils.js';

const PLAYER_SCALE = 1.4;

export function getPlayerEntity(scene) {
  const playerManifest = scene.registry.get('player-manifest');
  const selectedColor = scene.registry.get('selectedPlayerColor') || 'green';
  return playerManifest?.entities?.find((entry) => entry.variant === selectedColor)
    || playerManifest?.entities?.[0];
}

export function createPlayerSprite(scene) {
  const entity = getPlayerEntity(scene);

  if (entity) {
    const runKey = getAnimationManifestKey(entity.archetype, entity.variant, 'run');
    const idleKey = getStateManifestKey(entity.archetype, entity.variant, 'stand');

    scene.playerSprite = scene.add.sprite(scene.PLAYER_X, scene.GROUND_Y, idleKey);
    scene.playerSprite.setOrigin(0.5, 1);
    scene.playerSprite.setScale(PLAYER_SCALE);
    scene.playerSprite.setDepth(10);

    if (scene.anims.exists(runKey)) {
      scene.playerSprite.play(runKey);
    }
  } else {
    scene.playerSprite = scene.add.sprite(scene.PLAYER_X, scene.GROUND_Y, '__WHITE');
    scene.playerSprite.setDisplaySize(40, 40);
    scene.playerSprite.setOrigin(0.5, 1);
    scene.playerSprite.setTint(0x00ffff);
  }
}
