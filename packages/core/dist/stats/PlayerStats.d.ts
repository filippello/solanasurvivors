import { PassiveId } from '@solanasurvivors/shared';
export declare class PlayerStats {
    private passiveLevels;
    setPassiveLevel(id: PassiveId, level: number): void;
    getPassiveLevel(id: PassiveId): number;
    private getPassiveValue;
    get maxHp(): number;
    get armor(): number;
    get moveSpeed(): number;
    get pickupRadius(): number;
    get cooldownReduction(): number;
    get damageMultiplier(): number;
    get xpMultiplier(): number;
    reset(): void;
}
//# sourceMappingURL=PlayerStats.d.ts.map