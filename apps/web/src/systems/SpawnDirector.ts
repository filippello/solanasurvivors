import Phaser from 'phaser';
import { SPAWN_MARGIN, GAME_WIDTH, GAME_HEIGHT, EnemyType } from '@solanasurvivors/shared';
import { SpawnDirector as CoreSpawnDirector } from '@solanasurvivors/core';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

export class PhaserSpawnDirector {
  private core: CoreSpawnDirector;
  private scene: Phaser.Scene;
  private enemyGroup: Phaser.GameObjects.Group;
  private player: Player;

  constructor(scene: Phaser.Scene, player: Player, enemyGroup: Phaser.GameObjects.Group, core: CoreSpawnDirector) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.core = core;
  }

  update(elapsedMs: number): void {
    const batch = this.core.getSpawnBatch(elapsedMs);

    for (const req of batch) {
      for (let i = 0; i < req.count; i++) {
        this.spawnEnemy(req.enemyType);
      }
    }
  }

  private spawnEnemy(type: EnemyType): void {
    let enemy = this.enemyGroup.getFirstDead(false) as Enemy | null;
    if (!enemy) {
      enemy = new Enemy(this.scene, -9999, -9999);
      this.enemyGroup.add(enemy);
      enemy.deactivate();
    }

    const pos = this.getSpawnPosition();
    const hpMultiplier = 1; // Could scale with time
    enemy.spawn(pos.x, pos.y, type, hpMultiplier);
  }

  private getSpawnPosition(): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    const halfW = cam.width / 2 + SPAWN_MARGIN;
    const halfH = cam.height / 2 + SPAWN_MARGIN;

    // Pick random edge: 0=top, 1=right, 2=bottom, 3=left
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (edge) {
      case 0: // top
        x = this.player.x + (Math.random() * 2 - 1) * halfW;
        y = this.player.y - halfH;
        break;
      case 1: // right
        x = this.player.x + halfW;
        y = this.player.y + (Math.random() * 2 - 1) * halfH;
        break;
      case 2: // bottom
        x = this.player.x + (Math.random() * 2 - 1) * halfW;
        y = this.player.y + halfH;
        break;
      default: // left
        x = this.player.x - halfW;
        y = this.player.y + (Math.random() * 2 - 1) * halfH;
        break;
    }

    return { x, y };
  }

  reset(): void {
    this.core.reset();
  }
}
