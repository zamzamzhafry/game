import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';

const game = new Phaser.Game(gameConfig);

if (typeof window !== 'undefined') {
  window.__PHASER_GAME__ = game;

  const PORTRAIT_BREAKPOINT = 900;
  const isMobileLike = matchMedia('(hover: none) and (pointer: coarse)').matches
    || Math.min(window.innerWidth, window.innerHeight) <= PORTRAIT_BREAKPOINT;

  let pausedByOrientation = false;

  const isPhonePortrait = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return vh > vw && Math.min(vw, vh) <= PORTRAIT_BREAKPOINT;
  };

  const refreshScale = () => {
    if (game.scale && typeof game.scale.refresh === 'function') {
      game.scale.refresh();
    }
  };

  const updateOrientation = () => {
    const portrait = isPhonePortrait();
    document.body.classList.toggle('portrait-lock', portrait);

    if (portrait && !pausedByOrientation) {
      pausedByOrientation = true;
      if (game.sound && typeof game.sound.pauseAll === 'function') {
        game.sound.pauseAll();
      }
      if (game.loop && typeof game.loop.sleep === 'function') {
        game.loop.sleep();
      }
    } else if (!portrait && pausedByOrientation) {
      pausedByOrientation = false;
      if (game.loop && typeof game.loop.wake === 'function') {
        game.loop.wake();
      }
      if (game.sound && typeof game.sound.resumeAll === 'function') {
        game.sound.resumeAll();
      }
      refreshScale();
    }
  };

  const fsApi = {
    request: (el) =>
      el.requestFullscreen?.()
      ?? el.webkitRequestFullscreen?.()
      ?? el.msRequestFullscreen?.(),
    exit: () =>
      document.exitFullscreen?.()
      ?? document.webkitExitFullscreen?.()
      ?? document.msExitFullscreen?.(),
    element: () =>
      document.fullscreenElement
      ?? document.webkitFullscreenElement
      ?? document.msFullscreenElement,
    supported: () =>
      !!(document.documentElement.requestFullscreen
        || document.documentElement.webkitRequestFullscreen),
  };

  const enterFullscreen = async () => {
    try {
      await fsApi.request(document.documentElement);
    } catch (_) {}
    try {
      const orient = screen.orientation;
      if (orient && typeof orient.lock === 'function') {
        await orient.lock('landscape').catch(() => {});
      }
    } catch (_) {}
  };

  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn && fsApi.supported() && isMobileLike) {
    document.body.classList.add('show-fs-btn');
    fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (fsApi.element()) {
        fsApi.exit();
      } else {
        enterFullscreen();
      }
    });
  }

  const onFsChange = () => {
    const inFs = !!fsApi.element();
    document.body.classList.toggle('is-fullscreen', inFs);
    setTimeout(refreshScale, 100);
    setTimeout(refreshScale, 400);
  };
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
  onFsChange();

  let firstTapDone = false;
  const onFirstUserGesture = () => {
    if (firstTapDone) return;
    firstTapDone = true;
    if (isMobileLike && fsApi.supported() && !fsApi.element() && !isPhonePortrait()) {
      enterFullscreen();
    }
  };
  window.addEventListener('pointerdown', onFirstUserGesture, { once: true, capture: true });
  window.addEventListener('keydown', onFirstUserGesture, { once: true, capture: true });

  window.addEventListener('resize', () => {
    updateOrientation();
    refreshScale();
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => { updateOrientation(); refreshScale(); }, 50);
    setTimeout(() => { updateOrientation(); refreshScale(); }, 300);
  });
  setTimeout(updateOrientation, 0);
}

export default game;
