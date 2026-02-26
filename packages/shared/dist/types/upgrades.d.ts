import { WeaponId } from './weapons';
export type PassiveId = 'max_hp' | 'armor' | 'move_speed' | 'pickup_radius' | 'cooldown_reduction' | 'damage_boost' | 'xp_boost';
export type UpgradeId = WeaponId | PassiveId;
export interface UpgradeChoice {
    id: UpgradeId;
    type: 'weapon' | 'passive';
    name: string;
    description: string;
    currentLevel: number;
    nextLevel: number;
}
export interface PassiveLevelStats {
    level: number;
    value: number;
    description: string;
}
//# sourceMappingURL=upgrades.d.ts.map