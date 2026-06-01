import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloaderScene } from '../scenes/PreloaderScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { LevelSelectScene } from '../scenes/LevelSelectScene';
import { GameScene } from '../scenes/GameScene';
import { GameOverScene } from '../scenes/GameOverScene';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    expandParent: false
  },
  input: {
    activePointers: 3
  },
  scene: [BootScene, PreloaderScene, MainMenuScene, LevelSelectScene, GameScene, GameOverScene]
};
