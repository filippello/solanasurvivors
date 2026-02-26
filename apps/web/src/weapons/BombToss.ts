import Phaser from 'phaser';
import { angleBetween } from '@solanasurvivors/shared';
import { BaseWeapon } from './BaseWeapon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { RunScene } from '../scenes/RunScene';

export class BombToss extends BaseWeapon {
  constructor() {
    super('bomb_toss');
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Enemy[]): void {
    const stats = this.getStats();
    const blastRadius = stats.extra?.blastRadius ?? 80;
    const damageMultiplier = player.stats.damageMultiplier;
    const damage = Math.round(stats.damage * damageMultiplier);
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

    for (let i = 0; i < stats.projectiles; i++) {
      const angle = angleBetween(player, nearest) + (i - (stats.projectiles - 1) / 2) * 0.3;
      const targetDist = Math.min(Math.sqrt(nearestDist), 150);
      const targetX = player.x + Math.cos(angle) * targetDist;
      const targetY = player.y + Math.sin(angle) * targetDist;

      const bomb = scene.add.sprite(player.x, player.y, 'proj-bomb');
      bomb.setDisplaySize(12, 12);
      bomb.setDepth(7);

      scene.tweens.add({
        targets: bomb,
        x: targetX,
        y: targetY,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => {
          bomb.destroy();
          const liveEnemies = runScene.enemyGroup.getChildren() as Enemy[];
          this.explode(runScene, targetX, targetY, blastRadius, damage, liveEnemies);
        },
      });
    }
  }

  private explode(runScene: RunScene, x: number, y: number, radius: number, damage: number, enemies: Enemy[]): void {
    // Visual explosion
    const explosion = runScene.add.sprite(x, y, 'explosion');
    explosion.setDisplaySize(radius * 2, radius * 2);
    explosion.setAlpha(0.4);
    explosion.setDepth(6);
    explosion.play('explode-anim');
    explosion.once('animationcomplete', () => explosion.destroy());

    // AOE damage
    const rSq = radius * radius;
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      if (dx * dx + dy * dy < rSq) {
        const dead = enemy.takeDamage(damage);
        runScene.damageNumbers.spawn(enemy.x, enemy.y, damage, '#ff6600');
        if (dead) {
          runScene.onEnemyDeath(enemy);
        }
      }
    }
  }
}
