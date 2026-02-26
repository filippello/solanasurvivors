import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';

export class PauseScene extends Phaser.Scene {
  private onResume!: () => void;

  constructor() {
    super({ key: 'PauseScene' });
  }

  init(data: { onResume: () => void }): void {
    this.onResume = data.onResume;
  }

  create(): void {
    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'PAUSED', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Resume button
    const btnBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 100, 25, 0x4444cc)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'RESUME', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x6666ee));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x4444cc));
    btnBg.on('pointerdown', () => {
      this.onResume();
      this.scene.stop('PauseScene');
    });

    // Quit button
    const quitBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, 100, 25, 0xcc4444)
      .setInteractive({ useHandCursor: true });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 45, 'QUIT', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    quitBg.on('pointerover', () => quitBg.setFillStyle(0xee6666));
    quitBg.on('pointerout', () => quitBg.setFillStyle(0xcc4444));
    quitBg.on('pointerdown', () => {
      this.scene.stop('PauseScene');
      this.scene.stop('RunScene');
      this.scene.start('HomeScene');
    });

    // ESC to resume
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        this.onResume();
        this.scene.stop('PauseScene');
      });
    }
  }
}
