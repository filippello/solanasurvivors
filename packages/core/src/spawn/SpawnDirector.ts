import { SpawnRequest, EnemyType, RUN_DURATION_MS, BOSS_SPAWN_MS } from '@solanasurvivors/shared';
import { SPAWN_TABLE, SpawnBracket } from '../balance/spawnTable';

export class SpawnDirector {
  private lastSpawnTime = 0;
  private bossSpawned = false;

  getBracket(elapsedMs: number): SpawnBracket {
    const minute = Math.floor(elapsedMs / 60000);
    let bracket = SPAWN_TABLE[0];
    for (const b of SPAWN_TABLE) {
      if (minute >= b.startMinute) bracket = b;
    }
    return bracket;
  }

  getSpawnBatch(elapsedMs: number): SpawnRequest[] {
    const requests: SpawnRequest[] = [];

    // Boss at 9:30
    if (!this.bossSpawned && elapsedMs >= BOSS_SPAWN_MS) {
      this.bossSpawned = true;
      requests.push({ enemyType: 'boss', count: 1 });
    }

    const bracket = this.getBracket(elapsedMs);

    // Linear difficulty ramp: rate * (1 + elapsed/totalDuration)
    const ramp = 1 + elapsedMs / RUN_DURATION_MS;
    const effectiveRate = bracket.baseRate * ramp;

    // Calculate how many to spawn based on time delta
    const spawnInterval = 1000 / effectiveRate;
    const dt = elapsedMs - this.lastSpawnTime;

    if (dt >= spawnInterval) {
      this.lastSpawnTime = elapsedMs;

      const count = Math.max(1, Math.floor(dt / spawnInterval));

      // Distribute among available types
      for (let i = 0; i < count; i++) {
        const typeIndex = Math.floor(Math.random() * bracket.types.length);
        const enemyType = bracket.types[typeIndex];

        const existing = requests.find(r => r.enemyType === enemyType);
        if (existing) {
          existing.count++;
        } else {
          requests.push({ enemyType, count: 1 });
        }
      }
    }

    return requests;
  }

  reset(): void {
    this.lastSpawnTime = 0;
    this.bossSpawned = false;
  }
}
