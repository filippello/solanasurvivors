import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@solanasurvivors/shared';
import { getServices } from '../integration/GameServices';
import { HEADER, TINY, textStyle } from '../ui/textStyles';

type Tab = 'runs' | 'killers';

/**
 * Leaderboard overlay scene with two tabs:
 * - "Top Runs" — localStorage scores
 * - "Top Killers" — on-chain kill_counters
 */
export class LeaderboardScene extends Phaser.Scene {
  private activeTab: Tab = 'runs';
  private contentGroup!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    this.contentGroup = this.add.group();

    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);

    // Header
    this.add.text(GAME_WIDTH / 2, 16, 'LEADERBOARD', HEADER).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH - 16, 12, '[X]', textStyle(8, '#ff4444'))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop('LeaderboardScene'));

    // Tabs
    this.createTabs();
    this.renderContent();
  }

  private createTabs(): void {
    const tabY = 38;

    const runsTab = this.add.text(GAME_WIDTH / 2 - 60, tabY, 'TOP RUNS', textStyle(7, this.activeTab === 'runs' ? '#ffdd44' : '#666666'))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    const killersTab = this.add.text(GAME_WIDTH / 2 + 60, tabY, 'TOP KILLERS', textStyle(7, this.activeTab === 'killers' ? '#ffdd44' : '#666666'))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    runsTab.on('pointerdown', () => {
      if (this.activeTab === 'runs') return;
      this.activeTab = 'runs';
      runsTab.setColor('#ffdd44');
      killersTab.setColor('#666666');
      this.renderContent();
    });

    killersTab.on('pointerdown', () => {
      if (this.activeTab === 'killers') return;
      this.activeTab = 'killers';
      killersTab.setColor('#ffdd44');
      runsTab.setColor('#666666');
      this.renderContent();
    });
  }

  private renderContent(): void {
    this.contentGroup.clear(true);

    if (this.activeTab === 'runs') {
      this.renderTopRuns();
    } else {
      this.renderTopKillers();
    }
  }

  private renderTopRuns(): void {
    const { leaderboard } = getServices();
    const entries = leaderboard.getTopRuns(10);
    const startY = 60;

    if (entries.length === 0) {
      const text = this.add.text(GAME_WIDTH / 2, startY + 40, 'No runs recorded yet', TINY).setOrigin(0.5);
      this.contentGroup.add(text);
      return;
    }

    // Header row
    const header = this.add.text(20, startY, 'PLAYER     SCORE  LVL', textStyle(6, '#888888'));
    this.contentGroup.add(header);

    entries.forEach((entry, i) => {
      const y = startY + 16 + i * 14;
      const player = (entry.player || 'Anon').slice(0, 6).padEnd(6, ' ');
      const score = String(entry.score).padStart(5, ' ');
      const level = String(entry.level).padStart(3, ' ');
      const line = `${player}  ${score}  ${level}`;

      const color = i === 0 ? '#ffdd44' : i < 3 ? '#cccccc' : '#888888';
      const text = this.add.text(20, y, line, textStyle(6, color));
      this.contentGroup.add(text);
    });
  }

  private renderTopKillers(): void {
    const { enemyPool } = getServices();
    const topKillers = enemyPool.getTopKillers(10);
    const startY = 60;

    if (topKillers.length === 0) {
      const text = this.add.text(GAME_WIDTH / 2, startY + 40, 'No enemies deposited yet', TINY).setOrigin(0.5);
      this.contentGroup.add(text);
      return;
    }

    // Header row
    const header = this.add.text(20, startY, 'ENEMY        KILLS  TYPE', textStyle(6, '#888888'));
    this.contentGroup.add(header);

    topKillers.forEach((entry, i) => {
      const y = startY + 16 + i * 14;
      const name = entry.name.slice(0, 10).padEnd(10, ' ');
      const kills = String(entry.killCounter).padStart(5, ' ');
      const type = entry.enemyType;
      const line = `${name}  ${kills}  ${type}`;

      const color = i === 0 ? '#ffdd44' : i < 3 ? '#cccccc' : '#888888';
      const text = this.add.text(20, y, line, textStyle(6, color));
      this.contentGroup.add(text);
    });
  }
}
