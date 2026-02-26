import { EnemyType } from '@solanasurvivors/shared';
export interface SpawnBracket {
    /** Minute at which this bracket starts (0-indexed) */
    startMinute: number;
    /** Enemy types available in this bracket */
    types: EnemyType[];
    /** Base spawns per second for this bracket */
    baseRate: number;
}
export declare const SPAWN_TABLE: SpawnBracket[];
//# sourceMappingURL=spawnTable.d.ts.map