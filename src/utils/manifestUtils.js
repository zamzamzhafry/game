function toToken(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim().toLowerCase();
}

function assertObject(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

export function getEntityManifestKey(archetype, variant = 'default') {
  const normalizedArchetype = toToken(archetype, 'archetype');
  const normalizedVariant = toToken(variant, 'variant');
  return `${normalizedArchetype}:${normalizedVariant}`;
}

export function getStateManifestKey(archetype, variant, state) {
  const entityKey = getEntityManifestKey(archetype, variant);
  const normalizedState = toToken(state, 'state');
  return `${entityKey}:${normalizedState}`;
}

export function getAnimationManifestKey(archetype, variant, animation) {
  const entityKey = getEntityManifestKey(archetype, variant);
  const normalizedAnimation = toToken(animation, 'animation');
  return `${entityKey}:anim:${normalizedAnimation}`;
}

export function normalizeAssetManifest(rawManifest, label = 'manifest') {
  assertObject(rawManifest, label);

  if (!Array.isArray(rawManifest.entities)) {
    throw new Error(`${label}.entities must be an array.`);
  }

  return {
    entities: rawManifest.entities.map((entity, index) => {
      assertObject(entity, `${label}.entities[${index}]`);

      const archetype = toToken(entity.archetype, `${label}.entities[${index}].archetype`);
      const variant = toToken(entity.variant ?? 'default', `${label}.entities[${index}].variant`);
      const lane = entity.lane === undefined ? null : toToken(entity.lane, `${label}.entities[${index}].lane`);

      assertObject(entity.states, `${label}.entities[${index}].states`);
      const stateEntries = Object.entries(entity.states);

      const states = stateEntries.map(([stateName, path]) => {
        const state = toToken(stateName, `${label}.entities[${index}].states key`);
        if (typeof path !== 'string' || path.trim().length === 0) {
          throw new Error(`${label}.entities[${index}].states.${stateName} must be a non-empty string.`);
        }

        return {
          state,
          path: path.trim(),
          key: getStateManifestKey(archetype, variant, state)
        };
      });

      const stateSet = new Set(states.map((item) => item.state));
      const rawAnimations = entity.animations ?? {};
      assertObject(rawAnimations, `${label}.entities[${index}].animations`);

      const animations = Object.entries(rawAnimations).map(([animationName, definition]) => {
        const animation = toToken(animationName, `${label}.entities[${index}].animations key`);
        assertObject(definition, `${label}.entities[${index}].animations.${animationName}`);

        if (!Array.isArray(definition.frames) || definition.frames.length === 0) {
          throw new Error(`${label}.entities[${index}].animations.${animationName}.frames must be a non-empty array.`);
        }

        const frames = definition.frames.map((frameState, frameIndex) => {
          const normalizedFrameState = toToken(
            frameState,
            `${label}.entities[${index}].animations.${animationName}.frames[${frameIndex}]`
          );

          if (!stateSet.has(normalizedFrameState)) {
            throw new Error(
              `${label}.entities[${index}].animations.${animationName}.frames[${frameIndex}] references unknown state '${normalizedFrameState}'.`
            );
          }

          return getStateManifestKey(archetype, variant, normalizedFrameState);
        });

        const frameRate = definition.frameRate ?? 12;
        const repeat = definition.repeat ?? -1;

        if (!Number.isFinite(frameRate) || frameRate <= 0) {
          throw new Error(`${label}.entities[${index}].animations.${animationName}.frameRate must be > 0.`);
        }

        if (!Number.isInteger(repeat)) {
          throw new Error(`${label}.entities[${index}].animations.${animationName}.repeat must be an integer.`);
        }

        return {
          animation,
          key: getAnimationManifestKey(archetype, variant, animation),
          frames,
          frameRate,
          repeat
        };
      });

      return {
        archetype,
        variant,
        lane,
        key: getEntityManifestKey(archetype, variant),
        states,
        animations
      };
    })
  };
}

export function collectManifestImageFiles(normalizedManifest) {
  assertObject(normalizedManifest, 'normalizedManifest');

  if (!Array.isArray(normalizedManifest.entities)) {
    throw new Error('normalizedManifest.entities must be an array.');
  }

  return normalizedManifest.entities.flatMap((entity) => entity.states.map((state) => ({
    key: state.key,
    path: state.path
  })));
}

export function collectManifestAnimations(normalizedManifest) {
  assertObject(normalizedManifest, 'normalizedManifest');

  if (!Array.isArray(normalizedManifest.entities)) {
    throw new Error('normalizedManifest.entities must be an array.');
  }

  return normalizedManifest.entities.flatMap((entity) => entity.animations.map((animation) => ({
    key: animation.key,
    frames: animation.frames.map((frameKey) => ({ key: frameKey })),
    frameRate: animation.frameRate,
    repeat: animation.repeat
  })));
}
