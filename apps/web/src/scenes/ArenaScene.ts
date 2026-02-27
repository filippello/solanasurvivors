import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';
import { getServices } from '../integration/GameServices';
import { HEADER, TINY, textStyle } from '../ui/textStyles';

/**
 * Overlay scene for the Community Graveyard.
 * Shows deposited enemy stats, top killer NFTs, and the user's own sacrifices.
 */
export class ArenaScene extends Phaser.Scene {
  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'ArenaScene' });
  }

  create(): void {
    const { enemyPool } = getServices();

    // Full background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e, 1);

    // Header
    this.add.text(GAME_WIDTH / 2, 16, 'GRAVEYARD', HEADER).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH - 16, 12, '[X]', textStyle(8, '#ff4444'))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop('ArenaScene'));

    // Stats line
    const pool = enemyPool.getPool();
    const statsText = this.add.text(GAME_WIDTH / 2, 34, `Deposited enemies: ${pool.length}`, TINY).setOrigin(0.5);

    // Render with current data
    this.renderAll();

    // Refresh on-chain data
    enemyPool.refresh().then(() => {
      if (!this.scene.isActive('ArenaScene')) return;
      const freshPool = enemyPool.getPool();
      statsText.setText(`Deposited enemies: ${freshPool.length}`);
      this.renderAll();
    });
  }

  private renderAll(): void {
    // Clear previous dynamic content
    for (const obj of this.dynamicObjects) {
      if (obj && obj.active) obj.destroy();
    }
    this.dynamicObjects = [];

    this.renderTopKillers();
    this.renderMySacrifices();
  }

  private renderTopKillers(): void {
    const startY = 55;

    this.dynamicObjects.push(
      this.add.text(GAME_WIDTH / 2, startY, 'TOP KILLERS', textStyle(8, '#ffdd44')).setOrigin(0.5),
    );

    const { enemyPool } = getServices();
    const pool = enemyPool.getPool();

    if (pool.length === 0) {
      this.dynamicObjects.push(
        this.add.text(GAME_WIDTH / 2, startY + 18, 'No enemies deposited yet', TINY).setOrigin(0.5),
      );
      return;
    }

    const topKillers = enemyPool.getTopKillers(5);

    if (topKillers.length === 0) {
      this.dynamicObjects.push(
        this.add.text(GAME_WIDTH / 2, startY + 18, 'No kills recorded yet', TINY).setOrigin(0.5),
      );
      return;
    }

    topKillers.forEach((entry, i) => {
      const y = startY + 18 + i * 14;
      const text = `#${i + 1} ${entry.name} - ${entry.killCounter} kills`;
      this.dynamicObjects.push(
        this.add.text(GAME_WIDTH / 2, y, text, textStyle(8, i === 0 ? '#ffdd44' : '#cccccc')).setOrigin(0.5),
      );
    });
  }

  private renderMySacrifices(): void {
    const { wallet, enemyPool } = getServices();
    const startY = 195;

    // Divider line
    const divider = this.add.rectangle(GAME_WIDTH / 2, startY - 10, GAME_WIDTH - 60, 1, 0x333355);
    this.dynamicObjects.push(divider);

    this.dynamicObjects.push(
      this.add.text(GAME_WIDTH / 2, startY, 'MY SACRIFICES', textStyle(8, '#ff6644')).setOrigin(0.5),
    );

    if (!wallet.isConnected()) {
      this.dynamicObjects.push(
        this.add.text(GAME_WIDTH / 2, startY + 18, 'Connect wallet to see yours', TINY).setOrigin(0.5),
      );
      return;
    }

    const address = wallet.getAddress()!;
    const pool = enemyPool.getPool();
    const mine = pool.filter((e) => e.depositor === address);

    if (mine.length === 0) {
      this.dynamicObjects.push(
        this.add.text(GAME_WIDTH / 2, startY + 18, 'No sacrifices yet', TINY).setOrigin(0.5),
      );
      return;
    }

    mine.forEach((entry, i) => {
      const y = startY + 18 + i * 14;
      const kills = entry.killCounter > 0 ? `${entry.killCounter} kills` : '0 kills';
      const text = `${entry.name} - ${kills} (${entry.enemyType})`;
      this.dynamicObjects.push(
        this.add.text(GAME_WIDTH / 2, y, text, textStyle(8, '#cccccc')).setOrigin(0.5),
      );
    });
  }
}
