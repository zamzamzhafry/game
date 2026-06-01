import { buildFinalResultsPayload } from '../../services/buildFinalResultsPayload.js';
import { VoiceKeys } from '../../config/assets.js';

export const FEVER_DEFAULTS = Object.freeze({
  meterMax: 8,
  missPenalty: 0.5,
  durationMs: 9000,
  musicVolume: 0.6,
  feverLayerVolume: 0.45,
  musicFadeInMs: 500,
  musicFadeOutMs: 800,
  voiceVolume: 0.7,
  scoreMultiplier: 1.5,
  scoreFlatBonus: 100,
  burstMilestoneStep: 4
});

function getVoiceKey(clipName) {
  switch (clipName.toLowerCase()) {
    case 'ready': return VoiceKeys.Ready;
    case 'set': return VoiceKeys.Set;
    case 'go': return VoiceKeys.Go;
    case '1': return VoiceKeys.One;
    case '2': return VoiceKeys.Two;
    case '3': return VoiceKeys.Three;
    default: return null;
  }
}

export function initFeverState(scene) {
  scene.feverMeter = 0;
  scene.feverMeterMax = FEVER_DEFAULTS.meterMax;
  scene.feverMissPenalty = FEVER_DEFAULTS.missPenalty;
  scene.feverDurationMs = FEVER_DEFAULTS.durationMs;
  scene.feverScoreMultiplier = FEVER_DEFAULTS.scoreMultiplier;
  scene.feverScoreFlatBonus = FEVER_DEFAULTS.scoreFlatBonus;
  scene.isFeverActive = false;
  scene.feverEndsAtMs = 0;
  scene.lastComboBurstIndex = -1;
}

export function togglePause(scene) {
  if (scene.gameState === 'COUNTDOWN' || scene.gameState === 'PLAYING') {
    scene.stateBeforePause = scene.gameState;
    scene.gameState = 'PAUSED';
    if (scene.stateBeforePause === 'PLAYING') {
      scene.conductor.pause();
      if (scene.musicTrack?.isPlaying) scene.musicTrack.pause();
      if (scene.feverTrack?.isPlaying) scene.feverTrack.pause();
    }
    if (scene.parallax) scene.parallax.pause();
    scene.pauseContainer.setVisible(true);
    scene.tweens.pauseAll();
    scene.time.paused = true;
  } else if (scene.gameState === 'PAUSED') {
    const resumeState = scene.stateBeforePause || 'PLAYING';
    scene.gameState = resumeState;
    if (resumeState === 'PLAYING') {
      scene.conductor.resume(scene.time.now);
      if (scene.musicTrack?.isPaused) scene.musicTrack.resume();
      if (scene.feverTrack?.isPaused) scene.feverTrack.resume();
    }
    if (scene.parallax) scene.parallax.resume();
    scene.pauseContainer.setVisible(false);
    scene.tweens.resumeAll();
    scene.time.paused = false;
    scene.stateBeforePause = null;
  }
}

export function startCountdown(scene) {
  scene.gameState = 'COUNTDOWN';
  const snapshot = scene.sessionController.getSnapshot();
  const countdownConfig = snapshot.countdown;

  if (!countdownConfig || !countdownConfig.enabled) {
    startGameplay(scene);
    return;
  }

  const sequence = countdownConfig.spokenSequence || ['3', '2', '1', 'go'];
  const initialDelayMs = countdownConfig.initialDelayMs ?? 1000;
  const stepDurationMs = countdownConfig.stepDurationMs ?? 1000;

  let delayMs = initialDelayMs;
  sequence.forEach((clipName, index) => {
    scene.time.delayedCall(delayMs, () => {
      if (scene.gameState !== 'COUNTDOWN') return;
      scene.countdownText.setText(clipName.toUpperCase());
      const voiceKey = getVoiceKey(clipName);
      if (voiceKey) scene.sound.play(voiceKey, { volume: FEVER_DEFAULTS.voiceVolume });
      if (index === sequence.length - 1) {
        scene.time.delayedCall(stepDurationMs, () => {
          if (scene.gameState === 'COUNTDOWN') {
            scene.countdownText.setText('');
            startGameplay(scene);
          }
        });
      }
    });
    delayMs += stepDurationMs;
  });
}

export function startGameplay(scene) {
  scene.gameState = 'PLAYING';
  if (scene.parallax) scene.parallax.reset();
  if (scene.musicTrack) {
    scene.musicTrack.stop();
    scene.musicTrack.play({ volume: 0 });
    scene.tweens.add({
      targets: scene.musicTrack,
      volume: FEVER_DEFAULTS.musicVolume,
      duration: FEVER_DEFAULTS.musicFadeInMs,
      ease: 'Linear'
    });
  }
  if (scene.feverTrack) {
    scene.feverTrack.stop();
    scene.feverTrack.play({ volume: 0, loop: true });
    scene.feverTrack.pause();
  }
  scene.conductor.start(scene.time.now);
  const sessionState = scene.sessionController.setSongTimeMs(0);
  scene.refreshDebugText(sessionState);
}

export function startGameOverScene(scene) {
  const resultsPayload = buildFinalResultsPayload(
    scene.scoreModel?.getSnapshot(),
    scene.sessionController?.getSnapshot()
  );

  if (scene.musicTrack?.isPlaying) {
    scene.tweens.add({
      targets: scene.musicTrack,
      volume: 0,
      duration: FEVER_DEFAULTS.musicFadeOutMs,
      ease: 'Linear',
      onComplete: () => scene.musicTrack.stop()
    });
  }
  if (scene.feverTrack?.isPlaying || scene.feverTrack?.isPaused) {
    scene.tweens.add({
      targets: scene.feverTrack,
      volume: 0,
      duration: 250,
      ease: 'Linear',
      onComplete: () => scene.feverTrack.stop()
    });
  }

  scene.scene.start('GameOverScene', { resultsPayload, trackKey: scene.trackKey });
}

export function startFever(scene) {
  scene.isFeverActive = true;
  scene.feverEndsAtMs = scene.conductor.getSongTimeMs() + scene.feverDurationMs;
  scene.feverMeter = 0;
  if (scene.feverTrack) {
    if (!scene.feverTrack.isPlaying && !scene.feverTrack.isPaused) {
      scene.feverTrack.play({ volume: 0, loop: true });
    }
    if (scene.feverTrack.isPaused) {
      scene.feverTrack.resume();
    }
    scene.tweens.add({
      targets: scene.feverTrack,
      volume: FEVER_DEFAULTS.feverLayerVolume,
      duration: 220,
      ease: 'Linear'
    });
  }
  scene.showComboBurst?.();
  scene.applyFeverHudState?.(true);
}

export function endFever(scene) {
  scene.isFeverActive = false;
  scene.feverEndsAtMs = 0;
  if (scene.feverTrack?.isPlaying) {
    scene.tweens.add({
      targets: scene.feverTrack,
      volume: 0,
      duration: 250,
      ease: 'Linear',
      onComplete: () => scene.feverTrack.pause()
    });
  }
  scene.applyFeverHudState?.(false);
}

export function updateFeverState(scene, judgment, combo) {
  if (judgment === 'Miss') {
    scene.feverMeter = Math.max(0, scene.feverMeter - scene.feverMissPenalty);
  } else if (combo > 0) {
    scene.feverMeter = Math.min(scene.feverMeterMax, scene.feverMeter + 1);
  }

  if (!scene.isFeverActive && scene.feverMeter >= scene.feverMeterMax) {
    startFever(scene);
  }

  if (judgment !== 'Miss' && combo > 0 && combo % FEVER_DEFAULTS.burstMilestoneStep === 0) {
    scene.showComboBurst?.();
  }

  scene.updateFeverHud?.();
}

export function tickFever(scene) {
  if (!scene.isFeverActive) return;
  if (scene.conductor.getSongTimeMs() >= scene.feverEndsAtMs) {
    endFever(scene);
  }
  scene.updateFeverHud?.();
}
