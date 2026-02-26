import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { ENEMY_TABLE } from '@solanasurvivors/core';
import { RunScene } from '../scenes/RunScene';

export class OrbitAura extends BaseWeapon {
  private orbs: Phaser.GameObjects.Sprite[] = [];
  private angle = 0;
  private hitCooldowns: Map<Enemy, number> = new Map();

  constructor() {
    super('orbit_aura');
  }

  fire(_scene: Phaser.Scene, _player: Player, _enemies: Enemy[]): void {
    // OrbitAura doesn't fire projectiles; damage is applied in updateOrbit
  }

  updateOrbit(scene: Phaser.Scene, player: Player, enemies: Enemy[], delta: number): void {
    const stats = this.getStats();
    const orbCount = stats.extra?.orbits ?? 2;
    const radius = stats.extra?.radius ?? 80;
    const damageMultiplier = player.stats.damageMultiplier;
    const damage = Math.round(stats.damage * damageMultiplier);
    const runScene = scene as RunScene;

    // Ensure correct number of orbs
    while (this.orbs.length < orbCount) {
      const orb = scene.add.sprite(0, 0, 'orbit-orb');
      orb.setDisplaySize(20, 20);
      orb.setAlpha(0.7);
      orb.setDepth(8);
      this.orbs.push(orb);
    }
    while (this.orbs.length > orbCount) {
      const orb = this.orbs.pop()!;
      orb.destroy();
    }

    // Rotate
    this.angle += (delta / 1000) * 3;

    // Position orbs and check damage
    for (let i = 0; i < this.orbs.length; i++) {
      const a = this.angle + (i * Math.PI * 2) / this.orbs.length;
      const ox = player.x + Math.cos(a) * radius;
      const oy = player.y + Math.sin(a) * radius;
      this.orbs[i].setPosition(ox, oy);

      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - ox;
        const dy = enemy.y - oy;
        const distSq = dx * dx + dy * dy;
        const enemyRadius = ENEMY_TABLE[enemy.eState.type]?.radius ?? 12;
        const hitDist = 10 + enemyRadius;
        if (distSq < hitDist * hitDist) {
          const lastHit = this.hitCooldowns.get(enemy) ?? 0;
          const now = scene.time.now;
          if (now - lastHit >= stats.cooldown) {
            this.hitCooldowns.set(enemy, now);
            const dead = enemy.takeDamage(damage);
            runScene.damageNumbers.spawn(enemy.x, enemy.y, damage, '#ff8844');
            if (dead) {
              runScene.onEnemyDeath(enemy);
            }
          }
        }
      }
    }

    // Clean up cooldown map for dead/deactivated enemies
    for (const [enemy] of this.hitCooldowns) {
      if (!enemy.active) this.hitCooldowns.delete(enemy);
    }
  }

  destroyOrbs(): void {
    for (const orb of this.orbs) orb.destroy();
    this.orbs = [];
  }
}
