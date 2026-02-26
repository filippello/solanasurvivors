import Phaser from 'phaser';
import { angleBetween } from '@solanasurvivors/shared';
import { BaseWeapon } from './BaseWeapon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { RunScene } from '../scenes/RunScene';

export class MagicBolt extends BaseWeapon {
  constructor() {
    super('magic_bolt');
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Enemy[]): void {
    const stats = this.getStats();
    const runScene = scene as RunScene;

    // Find nearest enemy
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;
    for (const e of enemies) {
      if (!e.active) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = dx * dx + dy * dy;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = e;
      }
    }

    if (!nearest) return;

    const baseAngle = angleBetween(player, nearest);
    const damageMultiplier = player.stats.damageMultiplier;
    const damage = Math.round(stats.damage * damageMultiplier);

    for (let i = 0; i < stats.projectiles; i++) {
      const spread = stats.projectiles > 1
        ? (i - (stats.projectiles - 1) / 2) * 0.15
        : 0;
      const angle = baseAngle + spread;

      const proj = runScene.getProjectile();
      if (!proj) continue;

      proj.fire(
        player.x,
        player.y,
        Math.cos(angle) * stats.speed,
        Math.sin(angle) * stats.speed,
        damage,
        stats.pierce,
        'proj-magic-bolt',
      );
    }
  }
}
