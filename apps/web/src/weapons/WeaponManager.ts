import Phaser from 'phaser';
import { WeaponId } from '@solanasurvivors/shared';
import { BaseWeapon } from './BaseWeapon';
import { MagicBolt } from './MagicBolt';
import { KnifeFan } from './KnifeFan';
import { OrbitAura } from './OrbitAura';
import { ChainLightning } from './ChainLightning';
import { BombToss } from './BombToss';
import { DroneSummon } from './DroneSummon';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

const WEAPON_CONSTRUCTORS: Record<WeaponId, () => BaseWeapon> = {
  magic_bolt: () => new MagicBolt(),
  knife_fan: () => new KnifeFan(),
  orbit_aura: () => new OrbitAura(),
  chain_lightning: () => new ChainLightning(),
  bomb_toss: () => new BombToss(),
  drone_summon: () => new DroneSummon(),
};

export class WeaponManager {
  activeWeapons: BaseWeapon[] = [];

  constructor() {
    this.addWeapon('magic_bolt');
  }

  addWeapon(id: WeaponId): BaseWeapon | null {
    const existing = this.activeWeapons.find(w => w.weaponId === id);
    if (existing) {
      existing.upgrade();
      return existing;
    }

    const ctor = WEAPON_CONSTRUCTORS[id];
    if (!ctor) return null;

    const weapon = ctor();
    this.activeWeapons.push(weapon);
    return weapon;
  }

  upgradeWeapon(id: WeaponId): boolean {
    const weapon = this.activeWeapons.find(w => w.weaponId === id);
    if (!weapon) return false;
    return weapon.upgrade();
  }

  getWeapon(id: WeaponId): BaseWeapon | undefined {
    return this.activeWeapons.find(w => w.weaponId === id);
  }

  update(delta: number, scene: Phaser.Scene, player: Player, enemies: Enemy[]): void {
    const cdr = player.stats.cooldownReduction;
    for (const weapon of this.activeWeapons) {
      // Special updates for persistent weapons
      if (weapon instanceof OrbitAura) {
        weapon.updateOrbit(scene, player, enemies, delta);
      }
      if (weapon instanceof DroneSummon) {
        weapon.updateDrones(scene, player, enemies, delta);
      }

      if (weapon.tickCooldown(delta, cdr)) {
        weapon.fire(scene, player, enemies);
      }
    }
  }
}
