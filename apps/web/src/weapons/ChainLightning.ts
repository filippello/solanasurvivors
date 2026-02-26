import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { RunScene } from '../scenes/RunScene';

export class ChainLightning extends BaseWeapon {
  constructor() {
    super('chain_lightning');
  }

  fire(scene: Phaser.Scene, player: Player, enemies: Enemy[]): void {
    const stats = this.getStats();
    const chains = stats.extra?.chains ?? 2;
    const chainRange = stats.extra?.chainRange ?? 120;
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
      if (dist < nearestDist && dist < 250 * 250) {
        nearestDist = dist;
        nearest = e;
      }
    }

    if (!nearest) return;

    // Chain damage
    const hit: Set<Enemy> = new Set();
    let current = nearest;
    const gfx = scene.add.graphics();
    gfx.setDepth(15);
    gfx.lineStyle(2, 0x88ccff, 0.8);

    // Draw line from player to first target
    gfx.beginPath();
    gfx.moveTo(player.x, player.y);
    gfx.lineTo(current.x, current.y);
    gfx.strokePath();

    const dead = current.takeDamage(damage);
    runScene.damageNumbers.spawn(current.x, current.y, damage, '#88ccff');
    if (dead) runScene.onEnemyDeath(current);
    hit.add(current);

    for (let i = 0; i < chains; i++) {
      let nextTarget: Enemy | null = null;
      let nextDist = chainRange * chainRange;
      for (const e of enemies) {
        if (!e.active || hit.has(e)) continue;
        const dx = e.x - current.x;
        const dy = e.y - current.y;
        const dist = dx * dx + dy * dy;
        if (dist < nextDist) {
          nextDist = dist;
          nextTarget = e;
        }
      }

      if (!nextTarget) break;

      gfx.beginPath();
      gfx.moveTo(current.x, current.y);
      gfx.lineTo(nextTarget.x, nextTarget.y);
      gfx.strokePath();

      const chainDmg = Math.round(damage * 0.8);
      const chainDead = nextTarget.takeDamage(chainDmg);
      runScene.damageNumbers.spawn(nextTarget.x, nextTarget.y, chainDmg, '#88ccff');
      if (chainDead) runScene.onEnemyDeath(nextTarget);
      hit.add(nextTarget);
      current = nextTarget;
    }

    // Fade out lightning
    scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 200,
      onComplete: () => gfx.destroy(),
    });
  }
}
