import {
  UpgradeId,
  UpgradeChoice,
  WeaponId,
  PassiveId,
  MAX_WEAPON_LEVEL,
  MAX_PASSIVE_LEVEL,
  UPGRADE_CHOICES_COUNT,
} from '@solanasurvivors/shared';
import { WEAPON_TABLE } from '../balance/weapons';
import { PASSIVE_TABLE } from '../balance/passives';

const WEAPON_NAMES: Record<WeaponId, string> = {
  magic_bolt: 'Magic Bolt',
  knife_fan: 'Knife Fan',
  orbit_aura: 'Orbit Aura',
  chain_lightning: 'Chain Lightning',
  bomb_toss: 'Bomb Toss',
  drone_summon: 'Drone Summon',
};

const PASSIVE_NAMES: Record<PassiveId, string> = {
  max_hp: 'Max HP',
  armor: 'Armor',
  move_speed: 'Move Speed',
  pickup_radius: 'Pickup Radius',
  cooldown_reduction: 'Cooldown Reduction',
  damage_boost: 'Damage Boost',
  xp_boost: 'XP Boost',
};

const ALL_WEAPON_IDS: WeaponId[] = ['magic_bolt', 'knife_fan', 'orbit_aura', 'chain_lightning', 'bomb_toss', 'drone_summon'];
const ALL_PASSIVE_IDS: PassiveId[] = ['max_hp', 'armor', 'move_speed', 'pickup_radius', 'cooldown_reduction', 'damage_boost', 'xp_boost'];

export class UpgradePool {
  private ownedLevels: Map<UpgradeId, number> = new Map();

  getLevel(id: UpgradeId): number {
    return this.ownedLevels.get(id) ?? 0;
  }

  applyUpgrade(id: UpgradeId): void {
    const current = this.getLevel(id);
    this.ownedLevels.set(id, current + 1);
  }

  getChoices(count: number = UPGRADE_CHOICES_COUNT): UpgradeChoice[] {
    const available: UpgradeChoice[] = [];

    for (const id of ALL_WEAPON_IDS) {
      const level = this.getLevel(id);
      if (level >= MAX_WEAPON_LEVEL) continue;
      const stats = WEAPON_TABLE[id][level]; // next level stats
      available.push({
        id,
        type: 'weapon',
        name: WEAPON_NAMES[id],
        description: level === 0
          ? `New weapon: ${WEAPON_NAMES[id]}`
          : `Lv${level + 1}: DMG ${stats.damage}, CD ${stats.cooldown}ms`,
        currentLevel: level,
        nextLevel: level + 1,
      });
    }

    for (const id of ALL_PASSIVE_IDS) {
      const level = this.getLevel(id);
      if (level >= MAX_PASSIVE_LEVEL) continue;
      const stats = PASSIVE_TABLE[id][level]; // next level stats
      available.push({
        id,
        type: 'passive',
        name: PASSIVE_NAMES[id],
        description: stats.description,
        currentLevel: level,
        nextLevel: level + 1,
      });
    }

    // Shuffle and pick
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  reset(): void {
    this.ownedLevels.clear();
  }
}
