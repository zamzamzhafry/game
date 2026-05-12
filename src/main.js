import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';

const game = new Phaser.Game(gameConfig);

if (typeof window !== 'undefined') {
  window.__PHASER_GAME__ = game;
}

export default game;
