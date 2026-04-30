import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getEntityManifestKey,
  getStateManifestKey,
  getAnimationManifestKey,
  normalizeAssetManifest,
  collectManifestImageFiles,
  collectManifestAnimations
} from '../../src/utils/manifestUtils.js';

test('manifest key helpers generate deterministic keys', () => {
  assert.equal(getEntityManifestKey('Alien', 'Blue'), 'alien:blue');
  assert.equal(getStateManifestKey('Alien', 'Blue', 'Stand'), 'alien:blue:stand');
  assert.equal(getAnimationManifestKey('Alien', 'Blue', 'Walk'), 'alien:blue:anim:walk');
});

test('normalizeAssetManifest normalizes states and animations', () => {
  const normalized = normalizeAssetManifest({
    entities: [
      {
        archetype: 'Alien',
        variant: 'Blue',
        lane: 'Ground',
        states: {
          Stand: 'assets/a.png',
          Walk1: 'assets/b.png',
          Walk2: 'assets/c.png'
        },
        animations: {
          Walk: {
            frames: ['Walk1', 'Walk2'],
            frameRate: 10,
            repeat: -1
          }
        }
      }
    ]
  }, 'test-manifest');

  assert.equal(normalized.entities.length, 1);
  assert.equal(normalized.entities[0].key, 'alien:blue');
  assert.equal(normalized.entities[0].lane, 'ground');
  assert.deepEqual(
    normalized.entities[0].states.map((state) => state.key),
    ['alien:blue:stand', 'alien:blue:walk1', 'alien:blue:walk2']
  );
  assert.equal(normalized.entities[0].animations[0].key, 'alien:blue:anim:walk');
  assert.deepEqual(normalized.entities[0].animations[0].frames, ['alien:blue:walk1', 'alien:blue:walk2']);
});

test('normalizeAssetManifest rejects unknown animation frame states', () => {
  assert.throws(
    () => normalizeAssetManifest({
      entities: [
        {
          archetype: 'ship',
          variant: 'green',
          states: { default: 'assets/ship.png' },
          animations: {
            blink: {
              frames: ['missing-state']
            }
          }
        }
      ]
    }, 'enemy-manifest'),
    /unknown state 'missing-state'/
  );
});

test('manifest collection helpers expose preloadable image and animation entries', () => {
  const normalized = normalizeAssetManifest({
    entities: [
      {
        archetype: 'Dino',
        variant: 'Default',
        states: {
          Idle1: 'assets/idle-1.png',
          Idle2: 'assets/idle-2.png'
        },
        animations: {
          Idle: {
            frames: ['Idle1', 'Idle2'],
            frameRate: 12,
            repeat: -1
          }
        }
      }
    ]
  }, 'player-manifest');

  assert.deepEqual(collectManifestImageFiles(normalized), [
    { key: 'dino:default:idle1', path: 'assets/idle-1.png' },
    { key: 'dino:default:idle2', path: 'assets/idle-2.png' }
  ]);

  assert.deepEqual(collectManifestAnimations(normalized), [
    {
      key: 'dino:default:anim:idle',
      frames: [
        { key: 'dino:default:idle1' },
        { key: 'dino:default:idle2' }
      ],
      frameRate: 12,
      repeat: -1
    }
  ]);
});
