import Phaser from 'phaser';
import { DAMAGE } from './textStyles';

export class DamageNumberManager {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  spawn(x: number, y: number, amount: number, color = '#ffffff'): void {
    let text = this.pool.find(t => !t.active);
    if (!text) {
      text = this.scene.add.text(0, 0, '', DAMAGE);
      text.setDepth(200);
      this.pool.push(text);
    }

    text.setText(String(Math.round(amount)));
    text.setColor(color);
    text.setPosition(x + (Math.random() - 0.5) * 10, y - 5);
    text.setActive(true);
    text.setVisible(true);
    text.setAlpha(1);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => {
        text.setActive(false);
        text.setVisible(false);
      },
    });
  }
}
