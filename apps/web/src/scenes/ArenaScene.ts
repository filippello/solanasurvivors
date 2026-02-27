import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';
import type { NftAsset } from '@solanasurvivors/core';
import { getServices } from '../integration/GameServices';
import { HEADER, TINY, textStyle } from '../ui/textStyles';

/**
 * Overlay scene for the Community Arena Vault.
 * Shows user's eligible NFTs for deposit and top killer NFTs.
 */
export class ArenaScene extends Phaser.Scene {
  private nfts: NftAsset[] = [];
  private loadingText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'ArenaScene' });
  }

  create(): void {
    const { wallet, nftProvider, enemyPool } = getServices();

    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);

    // Header
    this.add.text(GAME_WIDTH / 2, 16, 'COMMUNITY ARENA', HEADER).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH - 16, 12, '[X]', textStyle(8, '#ff4444'))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop('ArenaScene'));

    // Stats line
    const pool = enemyPool.getPool();
    const statsText = this.add.text(GAME_WIDTH / 2, 34, `Deposited enemies: ${pool.length}`, TINY).setOrigin(0.5);

    // Loading indicator
    this.loadingText = this.add.text(GAME_WIDTH / 2, 80, '', TINY).setOrigin(0.5);

    // Refresh on-chain data every time arena is opened
    enemyPool.refresh().then(() => {
      if (!this.scene.isActive('ArenaScene')) return;
      const freshPool = enemyPool.getPool();
      statsText.setText(`Deposited enemies: ${freshPool.length}`);
      this.renderTopKillers(freshPool.length > 0);
    });

    // Check wallet connection
    if (!wallet.isConnected()) {
      this.loadingText.setText('Connect wallet to deposit NFTs');
      this.renderTopKillers(pool.length > 0);
      return;
    }

    // Fetch NFTs
    this.loadingText.setText('Loading your NFTs...');
    const address = wallet.getAddress()!;
    nftProvider.getOwnedNfts(address).then((nfts) => {
      this.nfts = nfts;
      this.loadingText.setText(
        nfts.length === 0
          ? 'No eligible NFTs found'
          : 'Your eligible NFTs:',
      );
      this.renderNftCards(nfts);
    });

    if (pool.length === 0) {
      this.renderTopKillers(false);
    }
  }

  private renderNftCards(nfts: NftAsset[]): void {
    const cardWidth = 90;
    const cardHeight = 70;
    const gap = 10;
    const maxVisible = Math.min(nfts.length, 5);
    const totalWidth = maxVisible * cardWidth + (maxVisible - 1) * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;
    const cy = 130;

    nfts.slice(0, maxVisible).forEach((nft, i) => {
      const cx = startX + i * (cardWidth + gap);

      // Card background
      const bg = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0x2a2a4e)
        .setStrokeStyle(1, 0x4444cc);

      // NFT name (truncated)
      const displayName = nft.name.length > 10 ? nft.name.slice(0, 9) + '..' : nft.name;
      this.add.text(cx, cy - 18, displayName, textStyle(6, '#ffffff')).setOrigin(0.5);

      // Mint address (truncated)
      this.add.text(cx, cy - 6, nft.id.slice(0, 6) + '...', textStyle(6, '#888888')).setOrigin(0.5);

      // Deposit button
      const btnBg = this.add.rectangle(cx, cy + 18, 60, 16, 0x44aa44)
        .setInteractive({ useHandCursor: true });
      const btnText = this.add.text(cx, cy + 18, 'DEPOSIT', textStyle(6, '#ffffff')).setOrigin(0.5);

      btnBg.on('pointerover', () => btnBg.setFillStyle(0x66cc66));
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x44aa44));
      btnBg.on('pointerdown', () => {
        this.handleDeposit(nft, bg, btnBg, btnText);
      });

      // Load NFT image asynchronously
      if (nft.image) {
        this.loadNftImage(nft.id, nft.image, cx, cy - 5, 30);
      }
    });
  }

  private async loadNftImage(id: string, url: string, x: number, y: number, size: number): Promise<void> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);

      const texKey = `nft-${id}`;
      if (!this.textures.exists(texKey)) {
        this.textures.addCanvas(texKey, canvas);
      }

      if (this.scene.isActive('ArenaScene')) {
        this.add.image(x, y, texKey)
          .setDisplaySize(size, size)
          .setOrigin(0.5);
      }
    } catch {
      // Image load failed — card still shows name/address
    }
  }

  private async handleDeposit(
    nft: NftAsset,
    cardBg: Phaser.GameObjects.Rectangle,
    btnBg: Phaser.GameObjects.Rectangle,
    btnText: Phaser.GameObjects.Text,
  ): Promise<void> {
    btnText.setText('...');
    btnBg.setFillStyle(0x666666);
    btnBg.disableInteractive();

    try {
      const { wallet } = getServices();
      console.log(`[ArenaScene] Deposit requested for NFT: ${nft.id} by ${wallet.getAddress()}`);

      // TODO: Build deposit_nft transaction with proper accounts
      btnText.setText('DONE');
      btnBg.setFillStyle(0x2a6a2a);
      cardBg.setStrokeStyle(2, 0x44ff44);
    } catch (err) {
      console.error('[ArenaScene] Deposit failed', err);
      btnText.setText('FAIL');
      btnBg.setFillStyle(0xaa4444);
    }
  }

  private renderTopKillers(hasEnemies: boolean): void {
    const startY = 190;

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
