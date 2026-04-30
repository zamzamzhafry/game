import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloaderScene } from '../scenes/PreloaderScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { LevelSelectScene } from '../scenes/LevelSelectScene';
import { GameScene } from '../scenes/GameScene';
import { GameOverScene } from '../scenes/GameOverScene';

export const gameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scene: [BootScene, PreloaderScene, MainMenuScene, LevelSelectScene, GameScene, GameOverScene]
};

