import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';
import { getServices } from '../integration/GameServices';
import { HEADER, TINY, textStyle } from '../ui/textStyles';

/**
 * Overlay scene for the Community Arena Vault.
 * Shows deposited enemy stats and top killer NFTs (read-only).
 */
export class ArenaScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ArenaScene' });
  }

  create(): void {
    const { enemyPool } = getServices();

    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1);

    // Header
    this.add.text(GAME_WIDTH / 2, 16, 'COMMUNITY ARENA', HEADER).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH - 16, 12, '[X]', textStyle(8, '#ff4444'))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop('ArenaScene'));

    // Stats line
    const pool = enemyPool.getPool();
    const statsText = this.add.text(GAME_WIDTH / 2, 34, `Deposited enemies: ${pool.length}`, TINY).setOrigin(0.5);

    // Render top killers with current data
    this.renderTopKillers(pool.length > 0);

    // Refresh on-chain data
    enemyPool.refresh().then(() => {
      if (!this.scene.isActive('ArenaScene')) return;
      const freshPool = enemyPool.getPool();
      statsText.setText(`Deposited enemies: ${freshPool.length}`);
      this.renderTopKillers(freshPool.length > 0);
    });
  }

  private renderTopKillers(hasEnemies: boolean): void {
    const startY = 60;

    this.add.text(GAME_WIDTH / 2, startY, 'TOP KILLERS', textStyle(8, '#ffdd44')).setOrigin(0.5);

    if (!hasEnemies) {
      this.add.text(GAME_WIDTH / 2, startY + 18, 'No enemies deposited yet', TINY).setOrigin(0.5);
      return;
    }

    const { enemyPool } = getServices();
    const topKillers = enemyPool.getTopKillers(5);

    if (topKillers.length === 0) {
      this.add.text(GAME_WIDTH / 2, startY + 18, 'No kills recorded yet', TINY).setOrigin(0.5);
      return;
    }

    topKillers.forEach((entry, i) => {
      const y = startY + 16 + i * 14;
      const text = `#${i + 1} ${entry.name} - ${entry.killCounter} kills`;
      this.add.text(GAME_WIDTH / 2, y, text, textStyle(7, i === 0 ? '#ffdd44' : '#cccccc')).setOrigin(0.5);
    });
  }
}
