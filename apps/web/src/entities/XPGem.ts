import Phaser from 'phaser';
import { XP_GEM_RADIUS } from '@solanasurvivors/shared';

export class XPGem extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  xpValue = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'xp-gem');
    this.setDisplaySize(XP_GEM_RADIUS * 2, XP_GEM_RADIUS * 2);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCircle(XP_GEM_RADIUS);
    this.setDepth(3);
  }

  spawn(x: number, y: number, xpValue: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.xpValue = xpValue;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.setPosition(-9999, -9999);
  }
}
