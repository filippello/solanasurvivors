import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';
import { getServices } from '../integration/GameServices';
import type { EnemyNftEntry } from '../integration/EnemyPoolService';
import { HEADER, TINY, textStyle } from '../ui/textStyles';

/**
 * Overlay scene for the Community Graveyard.
 * Shows deposited enemy stats, top killer NFTs, and the user's own sacrifices.
 */
export class ArenaScene extends Phaser.Scene {
  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];
  private sacrificeObjects: Phaser.GameObjects.GameObject[] = [];
  private mySacrifices: EnemyNftEntry[] = [];
  private sacrificePage = 0;

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

  /* ================================================================
   *  MY SACRIFICES — paginated cards with in-game enemy sprite
   * ================================================================ */

  private renderMySacrifices(): void {
    const { wallet, enemyPool } = getServices();
    const sectionY = 185;

    // Divider
    this.dynamicObjects.push(
      this.add.rectangle(GAME_WIDTH / 2, sectionY, GAME_WIDTH - 60, 1, 0x333355),
    );

    this.dynamicObjects.push(
      this.add.text(GAME_WIDTH / 2, sectionY + 12, 'MY SACRIFICES', textStyle(8, '#ff6644')).setOrigin(0.5),
    );

    if (!wallet.isConnected()) {
      this.dynamicObjects.push(
        this.add.text(GAME_WIDTH / 2, sectionY + 30, 'Connect wallet to see yours', TINY).setOrigin(0.5),
      );
      return;
    }

    const address = wallet.getAddress()!;
    const pool = enemyPool.getPool();
    this.mySacrifices = pool.filter((e) => e.depositor === address);

    if (this.mySacrifices.length === 0) {
      this.dynamicObjects.push(
        this.add.text(GAME_WIDTH / 2, sectionY + 30, 'No sacrifices yet', TINY).setOrigin(0.5),
      );
      return;
    }

    this.sacrificePage = 0;
    this.renderSacrificePage();
  }

  private renderSacrificePage(): void {
    // Clear only sacrifice card objects
    for (const obj of this.sacrificeObjects) {
      if (obj && obj.active) obj.destroy();
    }
    this.sacrificeObjects = [];

    const perPage = 3;
    const totalPages = Math.ceil(this.mySacrifices.length / perPage);
    const start = this.sacrificePage * perPage;
    const visible = this.mySacrifices.slice(start, start + perPage);

    const cardW = 170;
    const cardH = 120;
    const gap = 16;
    const totalW = visible.length * cardW + (visible.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2 + cardW / 2;
    const cardCy = 185 + 30 + cardH / 2;

    visible.forEach((entry, i) => {
      const cx = startX + i * (cardW + gap);
      this.renderSacrificeCard(entry, cx, cardCy, cardW, cardH);
    });

    // Pagination arrows (only if more than 1 page)
    if (totalPages > 1) {
      const arrowY = cardCy;

      // Left arrow
      if (this.sacrificePage > 0) {
        const leftBtn = this.add.text(14, arrowY, '<', textStyle(16, '#ffffff'))
          .setOrigin(0.5).setInteractive({ useHandCursor: true });
        leftBtn.on('pointerover', () => leftBtn.setColor('#ffdd44'));
        leftBtn.on('pointerout', () => leftBtn.setColor('#ffffff'));
        leftBtn.on('pointerdown', () => {
          this.sacrificePage--;
          this.renderSacrificePage();
        });
        this.sacrificeObjects.push(leftBtn);
      }

      // Right arrow
      if (this.sacrificePage < totalPages - 1) {
        const rightBtn = this.add.text(GAME_WIDTH - 14, arrowY, '>', textStyle(16, '#ffffff'))
          .setOrigin(0.5).setInteractive({ useHandCursor: true });
        rightBtn.on('pointerover', () => rightBtn.setColor('#ffdd44'));
        rightBtn.on('pointerout', () => rightBtn.setColor('#ffffff'));
        rightBtn.on('pointerdown', () => {
          this.sacrificePage++;
          this.renderSacrificePage();
        });
        this.sacrificeObjects.push(rightBtn);
      }

      // Page indicator
      const pageText = this.add.text(
        GAME_WIDTH / 2, cardCy + cardH / 2 + 10,
        `${this.sacrificePage + 1} / ${totalPages}`,
        textStyle(8, '#666666'),
      ).setOrigin(0.5);
      this.sacrificeObjects.push(pageText);
    }
  }

  private renderSacrificeCard(
    entry: EnemyNftEntry,
    cx: number,
    cy: number,
    w: number,
    h: number,
  ): void {
    // Card background
    this.sacrificeObjects.push(
      this.add.rectangle(cx, cy, w, h, 0x1a1a30).setStrokeStyle(1, 0x444466),
    );

    const imgSize = 52;
    const imgY = cy - 12;

    // In-game enemy sprite
    const enemyTex = `enemy-${entry.enemyType}`;
    if (this.textures.exists(enemyTex)) {
      const enemyImg = this.add.image(cx, imgY, enemyTex)
        .setDisplaySize(imgSize, imgSize)
        .setOrigin(0.5);
      this.sacrificeObjects.push(enemyImg);
    }

    // Name
    this.sacrificeObjects.push(
      this.add.text(cx, cy + 24, entry.name, textStyle(8, '#ffffff')).setOrigin(0.5),
    );

    // Kills + type
    const info = `${entry.killCounter} kills - ${entry.enemyType}`;
    this.sacrificeObjects.push(
      this.add.text(cx, cy + 38, info, textStyle(8, '#888888')).setOrigin(0.5),
    );
  }
}
