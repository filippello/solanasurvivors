import { EnemyType } from '@solanasurvivors/shared';
export interface EnemyDefinition {
    type: EnemyType;
    hp: number;
    speed: number;
    damage: number;
    xpValue: number;
    color: number;
    radius: number;
}
export declare const ENEMY_TABLE: Record<EnemyType, EnemyDefinition>;
//# sourceMappingURL=enemies.d.ts.map