import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RunResult } from '@solanasurvivors/shared';
import { getServices } from '../integration/GameServices';
import { BODY, BUTTON, SMALL, textStyle } from '../ui/textStyles';

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
    const titleText = r.victory ? 'VICTORY!' : 'GAME OVER';
    const titleColor = r.victory ? '#44ff44' : '#ff4444';
    this.add.text(cx, cy - 85, titleText, textStyle(18, titleColor, true)).setOrigin(0.5);

    // Subtitle
    const subtitle = r.victory ? 'You survived 10 minutes!' : 'You have been overwhelmed...';
    this.add.text(cx, cy - 60, subtitle, SMALL).setOrigin(0.5);

    // Stats
    const totalSecs = Math.floor(r.timeSurvivedMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const stats = [
      `Time:  ${timeStr}`,
      `Level: ${r.level}`,
      `Kills: ${r.kills}`,
      `Gold:  ${r.gold}`,
    ];

    stats.forEach((text, i) => {
      this.add.text(cx, cy - 35 + i * 14, text, BODY).setOrigin(0.5);
    });

    // Killer NFT info (if died to an arena enemy)
    if (!r.victory && r.killerMint) {
      const killerY = cy + 28;
      const killerName = r.killerName || `NFT ${r.killerMint.slice(0, 8)}...`;

      this.add.text(cx, killerY, `Killed by: ${killerName}`, textStyle(8, '#ff8844', true)).setOrigin(0.5);

      if (r.killerCollection) {
        this.add.text(cx, killerY + 14, `Collection: ${r.killerCollection.slice(0, 12)}...`, textStyle(7, '#888888')).setOrigin(0.5);
      }

      // Record death on-chain via session key
      this.recordDeath(r.killerMint);
    }

    // Play Again button
    const btnBg = this.add.rectangle(cx, cy + 60, 120, 25, 0x4444cc)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 60, 'PLAY AGAIN', BUTTON).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x6666ee));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x4444cc));
    btnBg.on('pointerdown', () => {
      this.scene.start('RunScene');
    });

    // Main Menu button
    const menuBg = this.add.rectangle(cx, cy + 95, 120, 25, 0x444444)
      .setInteractive({ useHandCursor: true });
    this.add.text(cx, cy + 95, 'MAIN MENU', BUTTON).setOrigin(0.5);

    menuBg.on('pointerover', () => menuBg.setFillStyle(0x666666));
    menuBg.on('pointerout', () => menuBg.setFillStyle(0x444444));
    menuBg.on('pointerdown', () => {
      this.scene.start('HomeScene');
    });

    // Save to leaderboard
    this.saveToLeaderboard();
  }

  private async recordDeath(killerMint: string): Promise<void> {
    try {
      const { sessionKeys, enemyPool } = getServices();
      if (!sessionKeys.hasSession()) return;

      const runId = Date.now();
      const sig = await sessionKeys.recordPlayerDeath(killerMint, runId);
      if (sig) {
        console.log('[GameOver] Kill recorded on-chain:', sig);
        // Refresh pool so Arena/Leaderboard show updated kill counts
        await enemyPool.refresh();
      }
    } catch (err) {
      console.error('[GameOver] Failed to record death on-chain', err);
    }
  }

  private saveToLeaderboard(): void {
    try {
      const { leaderboard, wallet } = getServices();
      const r = this.result;

      leaderboard.addEntry({
        player: wallet.getAddress() || 'Anonymous',
        score: r.kills * 10 + Math.floor(r.timeSurvivedMs / 1000),
        level: r.level,
        kills: r.kills,
        duration: r.timeSurvivedMs,
        killerMint: r.killerMint ?? null,
        killerName: r.killerName ?? null,
        timestamp: Date.now(),
      });
    } catch {
      // Leaderboard save is best-effort
    }
  }
}
