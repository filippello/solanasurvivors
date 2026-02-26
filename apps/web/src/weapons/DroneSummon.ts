import Phaser from 'phaser';
import { angleBetween } from '@solanasurvivors/shared';
import { BaseWeapon } from './BaseWeapon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { RunScene } from '../scenes/RunScene';

export class DroneSummon extends BaseWeapon {
  private drones: Phaser.GameObjects.Sprite[] = [];
  private droneAngle = 0;
  private shootTimers: number[] = [];

  constructor() {
    super('drone_summon');
  }

  fire(_scene: Phaser.Scene, _player: Player, _enemies: Enemy[]): void {
    // Drones fire in updateDrones
  }

  updateDrones(scene: Phaser.Scene, player: Player, enemies: Enemy[], delta: number): void {
    const stats = this.getStats();
    const droneCount = stats.extra?.droneCount ?? 1;
    const orbitRadius = stats.extra?.droneOrbitRadius ?? 100;
    const damageMultiplier = player.stats.damageMultiplier;
    const damage = Math.round(stats.damage * damageMultiplier);

    // Manage drone count
    while (this.drones.length < droneCount) {
      const drone = scene.add.sprite(0, 0, 'drone');
      drone.setDisplaySize(16, 16);
      drone.setDepth(9);
      this.drones.push(drone);
      this.shootTimers.push(0);
    }
    while (this.drones.length > droneCount) {
      const drone = this.drones.pop()!;
      drone.destroy();
      this.shootTimers.pop();
    }

    this.droneAngle += (delta / 1000) * 2;

    for (let i = 0; i < this.drones.length; i++) {
      const a = this.droneAngle + (i * Math.PI * 2) / this.drones.length;
      const dx = player.x + Math.cos(a) * orbitRadius;
      const dy = player.y + Math.sin(a) * orbitRadius;
      this.drones[i].setPosition(dx, dy);

      // Shoot from drone position
      this.shootTimers[i] -= delta;
      if (this.shootTimers[i] <= 0) {
        this.shootTimers[i] = stats.cooldown * (1 - player.stats.cooldownReduction);

        // Find nearest enemy to drone
        let nearest: Enemy | null = null;
        let nearestDist = Infinity;
        for (const e of enemies) {
          if (!e.active) continue;
          const ex = e.x - dx;
          const ey = e.y - dy;
          const dist = ex * ex + ey * ey;
          if (dist < nearestDist && dist < 200 * 200) {
            nearestDist = dist;
            nearest = e;
          }
        }

        if (nearest) {
          const runScene = scene as RunScene;
          const proj = runScene.getProjectile();
          if (proj) {
            const angle = angleBetween({ x: dx, y: dy }, nearest);
            proj.fire(
              dx,
              dy,
              Math.cos(angle) * stats.speed,
              Math.sin(angle) * stats.speed,
              damage,
              stats.pierce,
              'proj-drone-bullet',
            );
          }
        }
      }
    }
  }

  destroyDrones(): void {
    for (const drone of this.drones) drone.destroy();
    this.drones = [];
    this.shootTimers = [];
  }
}
