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

    this.add.text(cx, cy - 80, 'SOLANA SURVIVORS', TITLE).setOrigin(0.5);

    this.add.text(cx, cy - 55, 'Survive 10 minutes!', SMALL).setOrigin(0.5);

    // --- Wallet Connect (top-right) ---
    this.walletBtnBg = this.add.rectangle(GAME_WIDTH - 65, 16, 110, 18, 0x333355)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x4444cc);
    this.walletBtnText = this.add.text(GAME_WIDTH - 65, 16, 'Connect Wallet', textStyle(7, '#aaaaff'))
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

    // --- START button ---
    const startBg = this.add.rectangle(cx, cy - 15, 100, 25, 0x4444cc)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy - 15, 'START', BUTTON).setOrigin(0.5);

    startBg.on('pointerover', () => startBg.setFillStyle(0x6666ee));
    startBg.on('pointerout', () => startBg.setFillStyle(0x4444cc));
    startBg.on('pointerdown', () => this.scene.start('RunScene'));

    // --- ARENA button ---
    const arenaBg = this.add.rectangle(cx, cy + 18, 100, 25, 0x995500)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 18, 'ARENA', BUTTON).setOrigin(0.5);

    arenaBg.on('pointerover', () => arenaBg.setFillStyle(0xbb7700));
    arenaBg.on('pointerout', () => arenaBg.setFillStyle(0x995500));
    arenaBg.on('pointerdown', () => this.scene.launch('ArenaScene'));

    // --- LEADERBOARD button ---
    const lbBg = this.add.rectangle(cx, cy + 51, 100, 25, 0x444444)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 51, 'LEADERBOARD', textStyle(7, '#ffffff')).setOrigin(0.5);

    lbBg.on('pointerover', () => lbBg.setFillStyle(0x666666));
    lbBg.on('pointerout', () => lbBg.setFillStyle(0x444444));
    lbBg.on('pointerdown', () => this.scene.launch('LeaderboardScene'));

    // --- Instructions ---
    this.add.text(cx, cy + 82, 'WASD / Arrows to move', TINY).setOrigin(0.5);
    this.add.text(cx, cy + 97, 'Gamepad supported', TINY).setOrigin(0.5);
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
