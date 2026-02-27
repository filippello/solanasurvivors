import Phaser from 'phaser';
import { GAME_WIDTH, RUN_DURATION_MS, PlayerState } from '@solanasurvivors/shared';
import { HUD_LABEL, textStyle } from './textStyles';

export class HUD {
  private scene: Phaser.Scene;

  // HP bar
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;

  // XP bar
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;

  // Timer
  private timerText!: Phaser.GameObjects.Text;

  // Level
  private levelText!: Phaser.GameObjects.Text;

  // Kill count
  private killText!: Phaser.GameObjects.Text;

  // Gold
  private goldText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const s = this.scene;

    // HP Bar
    const hpX = 10;
    const hpY = 8;
    const hpWidth = 100;
    const hpHeight = 8;

    this.hpBarBg = s.add.rectangle(hpX, hpY, hpWidth, hpHeight, 0x333333).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.hpBarFill = s.add.rectangle(hpX, hpY, hpWidth, hpHeight, 0xcc3333).setOrigin(0, 0).setScrollFactor(0).setDepth(101);
    this.hpText = s.add.text(hpX + hpWidth / 2, hpY + hpHeight / 2, '100/100', textStyle(8, '#ffffff'))
      .setOrigin(0.5).setScrollFactor(0).setDepth(102);

    // XP Bar
    const xpY = hpY + hpHeight + 2;
    this.xpBarBg = s.add.rectangle(hpX, xpY, hpWidth, 4, 0x333333).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
    this.xpBarFill = s.add.rectangle(hpX, xpY, 0, 4, 0x44aaff).setOrigin(0, 0).setScrollFactor(0).setDepth(101);

    // Timer (top center)
    this.timerText = s.add.text(GAME_WIDTH / 2, 8, '0:00', textStyle(10, '#ffffff'))
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);

    // Level (below HP)
    this.levelText = s.add.text(hpX, xpY + 7, 'Lv 1', textStyle(8, '#ffdd44'))
      .setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    // Kill count (top right)
    this.killText = s.add.text(GAME_WIDTH - 10, 8, 'Kills: 0', HUD_LABEL)
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100);

    // Gold (below kills)
    this.goldText = s.add.text(GAME_WIDTH - 10, 20, 'Gold: 0', textStyle(8, '#ffcc44'))
      .setOrigin(1, 0).setScrollFactor(0).setDepth(100);
  }

  update(playerState: PlayerState, elapsedMs: number): void {
    // HP
    const hpPct = Math.max(0, playerState.hp / playerState.maxHp);
    this.hpBarFill.setDisplaySize(100 * hpPct, 8);
    this.hpText.setText(`${Math.ceil(playerState.hp)}/${playerState.maxHp}`);

    // Color based on HP
    if (hpPct > 0.5) {
      this.hpBarFill.setFillStyle(0x44cc44);
    } else if (hpPct > 0.25) {
      this.hpBarFill.setFillStyle(0xcccc44);
    } else {
      this.hpBarFill.setFillStyle(0xcc3333);
    }

    // XP
    const xpPct = playerState.xpToNext > 0 ? playerState.xp / playerState.xpToNext : 0;
    this.xpBarFill.setDisplaySize(100 * Math.min(1, xpPct), 4);

    // Timer
    const totalSecs = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

    // Danger color near end
    const remaining = RUN_DURATION_MS - elapsedMs;
    if (remaining < 30000) {
      this.timerText.setColor('#ff4444');
    } else if (remaining < 60000) {
      this.timerText.setColor('#ffcc44');
    } else {
      this.timerText.setColor('#ffffff');
    }

    // Level
    this.levelText.setText(`Lv ${playerState.level}`);

    // Kills
    this.killText.setText(`Kills: ${playerState.kills}`);

    // Gold
    this.goldText.setText(`Gold: ${playerState.gold}`);
  }
}
