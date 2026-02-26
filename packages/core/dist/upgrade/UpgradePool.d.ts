import { UpgradeId, UpgradeChoice } from '@solanasurvivors/shared';
export declare class UpgradePool {
    private ownedLevels;
    getLevel(id: UpgradeId): number;
    applyUpgrade(id: UpgradeId): void;
    getChoices(count?: number): UpgradeChoice[];
    reset(): void;
}
//# sourceMappingURL=UpgradePool.d.ts.map