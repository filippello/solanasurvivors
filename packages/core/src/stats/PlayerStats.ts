import {
  PassiveId,
  PLAYER_BASE_HP,
  PLAYER_BASE_SPEED,
  PLAYER_BASE_PICKUP_RADIUS,
  PLAYER_BASE_ARMOR,
} from '@solanasurvivors/shared';
import { PASSIVE_TABLE } from '../balance/passives';

export class PlayerStats {
  private passiveLevels: Map<PassiveId, number> = new Map();

  setPassiveLevel(id: PassiveId, level: number): void {
    this.passiveLevels.set(id, level);
  }

  getPassiveLevel(id: PassiveId): number {
    return this.passiveLevels.get(id) ?? 0;
  }

  private getPassiveValue(id: PassiveId): number {
    const level = this.getPassiveLevel(id);
    if (level === 0) return 0;
    const table = PASSIVE_TABLE[id];
    return table[level - 1]?.value ?? 0;
  }

  get maxHp(): number {
    return PLAYER_BASE_HP + this.getPassiveValue('max_hp');
  }

  get armor(): number {
    return PLAYER_BASE_ARMOR + this.getPassiveValue('armor');
  }

  get moveSpeed(): number {
    return PLAYER_BASE_SPEED * (1 + this.getPassiveValue('move_speed'));
  }

  get pickupRadius(): number {
    return PLAYER_BASE_PICKUP_RADIUS * (1 + this.getPassiveValue('pickup_radius'));
  }

  get cooldownReduction(): number {
    return this.getPassiveValue('cooldown_reduction');
  }

  get damageMultiplier(): number {
    return 1 + this.getPassiveValue('damage_boost');
  }

  get xpMultiplier(): number {
    return 1 + this.getPassiveValue('xp_boost');
  }

  reset(): void {
    this.passiveLevels.clear();
  }
}
