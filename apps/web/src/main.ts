import Phaser from 'phaser';
import { gameConfig } from './config';
import { initServices } from './integration/GameServices';

// Initialize blockchain services before creating the game
initServices();

new Phaser.Game(gameConfig);
