import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { RunScene } from '../scenes/RunScene';

export class KnifeFan extends BaseWeapon {
  private lastMoveAngle = 0;

  constructor() {
    super('knife_fan');
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Enemy[]): void {
    const stats = this.getStats();
    const runScene = scene as RunScene;

    // Use player movement direction; fall back to last known direction
    const vx = player.body.velocity.x;
    const vy = player.body.velocity.y;
    if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
      this.lastMoveAngle = Math.atan2(vy, vx);
    }

    const spread = stats.extra?.spread ?? 0.4;
    const damageMultiplier = player.stats.damageMultiplier;
    const damage = Math.round(stats.damage * damageMultiplier);

    for (let i = 0; i < stats.projectiles; i++) {
      const offset = (i - (stats.projectiles - 1) / 2) * (spread / stats.projectiles);
      const angle = this.lastMoveAngle + offset;

      const proj = runScene.getProjectile();
      if (!proj) continue;

      proj.fire(
        player.x,
        player.y,
        Math.cos(angle) * stats.speed,
        Math.sin(angle) * stats.speed,
        damage,
        stats.pierce,
        'proj-knife',
      );
    }
  }
}
