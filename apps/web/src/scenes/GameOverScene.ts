import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RunResult } from '@solanasurvivors/shared';

export class GameOverScene extends Phaser.Scene {
  private result!: RunResult;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: RunResult): void {
    this.result = data;
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const r = this.result;

    // Title
    const title = r.victory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = r.victory ? '#44ff44' : '#ff4444';
    this.add.text(cx, cy - 75, title, {
      fontSize: '24px',
      color: titleColor,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    const subtitle = r.victory ? 'You survived 10 minutes!' : 'You have been overwhelmed...';
    this.add.text(cx, cy - 50, subtitle, {
      fontSize: '10px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Stats
    const totalSecs = Math.floor(r.timeSurvivedMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const stats = [
      `Time Survived: ${timeStr}`,
      `Level Reached: ${r.level}`,
      `Enemies Killed: ${r.kills}`,
      `Gold Earned: ${r.gold}`,
    ];

    stats.forEach((text, i) => {
      this.add.text(cx, cy - 20 + i * 15, text, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // Play Again button
    const btnBg = this.add.rectangle(cx, cy + 50, 120, 25, 0x4444cc)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 50, 'PLAY AGAIN', {
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

    // Main Menu button
    const menuBg = this.add.rectangle(cx, cy + 85, 120, 25, 0x444444)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 85, 'MAIN MENU', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    menuBg.on('pointerover', () => menuBg.setFillStyle(0x666666));
    menuBg.on('pointerout', () => menuBg.setFillStyle(0x444444));
    menuBg.on('pointerdown', () => {
      this.scene.start('HomeScene');
    });
  }
}
