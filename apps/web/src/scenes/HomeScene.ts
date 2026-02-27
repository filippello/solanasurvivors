import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';
import { getServices } from '../integration/GameServices';
import { TITLE, BUTTON, SMALL, TINY, textStyle } from '../ui/textStyles';

export class HomeScene extends Phaser.Scene {
  private walletBtnBg!: Phaser.GameObjects.Rectangle;
  private walletBtnText!: Phaser.GameObjects.Text;
  private walletCheckTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'HomeScene' });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 90, 'SOLANA SURVIVORS', TITLE).setOrigin(0.5);

    this.add.text(cx, cy - 64, 'Survive 10 minutes!', SMALL).setOrigin(0.5);

    // --- Wallet Connect (top-right) ---
    this.walletBtnBg = this.add.rectangle(GAME_WIDTH - 70, 16, 120, 20, 0x333355)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x4444cc);
    this.walletBtnText = this.add.text(GAME_WIDTH - 70, 16, 'Connect Wallet', textStyle(8, '#aaaaff'))
      .setOrigin(0.5);

    this.walletBtnBg.on('pointerover', () => this.walletBtnBg.setFillStyle(0x444466));
    this.walletBtnBg.on('pointerout', () => this.walletBtnBg.setFillStyle(0x333355));
    this.walletBtnBg.on('pointerdown', () => this.handleWalletClick());

    this.updateWalletButton();

    // Poll wallet state for a few seconds to catch async auto-reconnect
    this.walletCheckTimer = this.time.addEvent({
      delay: 500,
      repeat: 5,
      callback: () => this.updateWalletButton(),
    });

    const btnW = 140;
    const btnH = 30;
    const btnGap = 38;

    // --- START button ---
    const startY = cy - 15;
    const startBg = this.add.rectangle(cx, startY, btnW, btnH, 0x4444cc)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, startY, 'START', BUTTON).setOrigin(0.5);

    startBg.on('pointerover', () => startBg.setFillStyle(0x6666ee));
    startBg.on('pointerout', () => startBg.setFillStyle(0x4444cc));
    startBg.on('pointerdown', () => this.scene.start('RunScene'));

    // --- ARENA button ---
    const arenaY = startY + btnGap;
    const arenaBg = this.add.rectangle(cx, arenaY, btnW, btnH, 0xcc8822)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, arenaY, 'GRAVEYARD', BUTTON).setOrigin(0.5);

    arenaBg.on('pointerover', () => arenaBg.setFillStyle(0xee9933));
    arenaBg.on('pointerout', () => arenaBg.setFillStyle(0xcc8822));
    arenaBg.on('pointerdown', () => this.scene.launch('ArenaScene'));

    // --- SACRIFICE button ---
    const sacrificeY = arenaY + btnGap;
    const sacrificeBg = this.add.rectangle(cx, sacrificeY, btnW, btnH, 0xcc3333)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, sacrificeY, 'SACRIFICE', BUTTON).setOrigin(0.5);

    sacrificeBg.on('pointerover', () => sacrificeBg.setFillStyle(0xee4444));
    sacrificeBg.on('pointerout', () => sacrificeBg.setFillStyle(0xcc3333));
    sacrificeBg.on('pointerdown', () => this.scene.launch('SacrificeScene'));

    // --- LEADERBOARD button ---
    const lbY = sacrificeY + btnGap;
    const lbBg = this.add.rectangle(cx, lbY, btnW, btnH, 0x444444)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, lbY, 'LEADERBOARD', BUTTON).setOrigin(0.5);

    lbBg.on('pointerover', () => lbBg.setFillStyle(0x666666));
    lbBg.on('pointerout', () => lbBg.setFillStyle(0x444444));
    lbBg.on('pointerdown', () => this.scene.launch('LeaderboardScene'));

    // --- Instructions ---
    this.add.text(cx, lbY + 40, 'WASD / Arrows to move', TINY).setOrigin(0.5);
    this.add.text(cx, lbY + 54, 'Gamepad supported', TINY).setOrigin(0.5);
  }

  private async handleWalletClick(): Promise<void> {
    const { wallet } = getServices();

    if (wallet.isConnected()) {
      await wallet.disconnect();
    } else {
      await wallet.connect();
    }
    this.updateWalletButton();
  }

  private updateWalletButton(): void {
    const { wallet } = getServices();

    if (wallet.isConnected()) {
      const addr = wallet.getAddress()!;
      const short = addr.slice(0, 4) + '...' + addr.slice(-4);
      this.walletBtnText.setText(short);
      this.walletBtnBg.setStrokeStyle(1, 0x44ff44);
    } else {
      this.walletBtnText.setText('Connect Wallet');
      this.walletBtnBg.setStrokeStyle(1, 0x4444cc);
    }
  }
}
