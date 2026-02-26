import { SpawnRequest } from '@solanasurvivors/shared';
import { SpawnBracket } from '../balance/spawnTable';
export declare class SpawnDirector {
    private lastSpawnTime;
    private bossSpawned;
    getBracket(elapsedMs: number): SpawnBracket;
    getSpawnBatch(elapsedMs: number): SpawnRequest[];
    reset(): void;
}
//# sourceMappingURL=SpawnDirector.d.ts.map