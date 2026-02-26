export type WeaponId = 'magic_bolt' | 'knife_fan' | 'orbit_aura' | 'chain_lightning' | 'bomb_toss' | 'drone_summon';
export interface WeaponLevelStats {
    level: number;
    damage: number;
    cooldown: number;
    projectiles: number;
    speed: number;
    pierce: number;
    /** Weapon-specific extra data */
    extra?: Record<string, number>;
}
export interface WeaponState {
    id: WeaponId;
    level: number;
}
//# sourceMappingURL=weapons.d.ts.map