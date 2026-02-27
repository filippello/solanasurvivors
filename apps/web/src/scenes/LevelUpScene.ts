import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, UpgradeChoice } from '@solanasurvivors/shared';
import { HEADER, SMALL, TINY, textStyle } from '../ui/textStyles';

export class LevelUpScene extends Phaser.Scene {
  private choices: UpgradeChoice[] = [];
  private onChoose!: (choice: UpgradeChoice) => void;

  constructor() {
    super({ key: 'LevelUpScene' });
  }

  init(data: { choices: UpgradeChoice[]; onChoose: (choice: UpgradeChoice) => void }): void {
    this.choices = data.choices;
    this.onChoose = data.onChoose;
  }

  create(): void {
    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add.text(GAME_WIDTH / 2, 40, 'LEVEL UP!', HEADER).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 58, 'Choose an upgrade:', SMALL).setOrigin(0.5);

    const cardWidth = 140;
    const cardHeight = 100;
    const gap = 15;
    const totalWidth = this.choices.length * cardWidth + (this.choices.length - 1) * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    this.choices.forEach((choice, i) => {
      const cx = startX + i * (cardWidth + gap);
      const cy = GAME_HEIGHT / 2 + 5;

      // Card background
      const bg = this.add.rectangle(cx, cy, cardWidth, cardHeight, 0x2a2a4e)
        .setStrokeStyle(1, 0x4444cc)
        .setInteractive({ useHandCursor: true });

      // Type badge
      const badgeColor = choice.type === 'weapon' ? 0xcc4444 : 0x44cc44;
      this.add.rectangle(cx, cy - cardHeight / 2 + 10, 50, 14, badgeColor, 0.8)
        .setStrokeStyle(1, 0xffffff, 0.3);
      this.add.text(cx, cy - cardHeight / 2 + 10, choice.type.toUpperCase(), textStyle(8, '#ffffff')).setOrigin(0.5);

      // Name
      this.add.text(cx, cy - 10, choice.name, textStyle(8, '#ffffff')).setOrigin(0.5);

      // Level
      const levelText = choice.currentLevel === 0
        ? 'NEW'
        : `Lv ${choice.currentLevel} > ${choice.nextLevel}`;
      this.add.text(cx, cy + 6, levelText, textStyle(8, '#aaaaff')).setOrigin(0.5);

      // Description
      this.add.text(cx, cy + 22, choice.description, {
        ...TINY,
        wordWrap: { width: cardWidth - 10 },
        align: 'center',
      }).setOrigin(0.5);

      bg.on('pointerover', () => bg.setStrokeStyle(2, 0x6666ff));
      bg.on('pointerout', () => bg.setStrokeStyle(1, 0x4444cc));
      bg.on('pointerdown', () => {
        this.onChoose(choice);
        this.scene.stop('LevelUpScene');
      });
    });
  }
}
