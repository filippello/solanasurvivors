import Phaser from 'phaser';
import { PROJECTILE_RADIUS } from '@solanasurvivors/shared';

export class Projectile extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  damage = 0;
  pierceLeft = 0;
  owner: 'player' | 'enemy' = 'player';
  private lifetime = 0;
  private maxLifetime = 3000;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'proj-magic-bolt');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(5);
  }

  fire(x: number, y: number, vx: number, vy: number, damage: number, pierce: number, textureKey = 'proj-magic-bolt', owner: 'player' | 'enemy' = 'player'): void {
    this.setPosition(x, y);
    this.setTexture(textureKey);
    this.setDisplaySize(10, 10);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setVelocity(vx, vy);
    this.body.setCircle(PROJECTILE_RADIUS);
    this.damage = damage;
    this.pierceLeft = pierce;
    this.owner = owner;
    this.lifetime = 0;
    this.maxLifetime = 3000;

    // Rotate sprite to face direction of travel
    this.rotation = Math.atan2(vy, vx);
  }

  updateLifetime(delta: number): boolean {
    this.lifetime += delta;
    return this.lifetime >= this.maxLifetime;
  }

  onHit(): boolean {
    if (this.pierceLeft > 0) {
      this.pierceLeft--;
      return false; // keep going
    }
    return true; // should deactivate
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.body.setVelocity(0, 0);
    this.setPosition(-9999, -9999);
  }
}
