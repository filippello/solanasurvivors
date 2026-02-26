import Phaser from 'phaser';
import { WeaponId, WeaponLevelStats, MAX_WEAPON_LEVEL } from '@solanasurvivors/shared';
import { WEAPON_TABLE } from '@solanasurvivors/core';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export abstract class BaseWeapon {
  readonly weaponId: WeaponId;
  level = 1;
  protected cooldownTimer = 0;

  constructor(weaponId: WeaponId) {
    this.weaponId = weaponId;
  }

  getStats(): WeaponLevelStats {
    return WEAPON_TABLE[this.weaponId][this.level - 1];
  }

  upgrade(): boolean {
    if (this.level >= MAX_WEAPON_LEVEL) return false;
    this.level++;
    return true;
  }

  tickCooldown(delta: number, cooldownReduction: number): boolean {
    this.cooldownTimer -= delta;
    if (this.cooldownTimer <= 0) {
      const stats = this.getStats();
      this.cooldownTimer = stats.cooldown * (1 - cooldownReduction);
      return true;
    }
    return false;
  }

  abstract fire(scene: Phaser.Scene, player: Player, enemies: Enemy[]): void;
}
