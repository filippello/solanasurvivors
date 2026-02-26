import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HomeScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 60, 'SOLANA SURVIVORS', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 30, 'Survive 10 minutes!', {
      fontSize: '10px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Start button
    const btnBg = this.add.rectangle(cx, cy + 10, 100, 25, 0x4444cc)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(cx, cy + 10, 'START', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x6666ee));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x4444cc));
    btnBg.on('pointerdown', () => {
      this.scene.start('RunScene');
    });

    this.add.text(cx, cy + 50, 'WASD / Arrows to move', {
      fontSize: '8px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 65, 'Gamepad supported', {
      fontSize: '8px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
