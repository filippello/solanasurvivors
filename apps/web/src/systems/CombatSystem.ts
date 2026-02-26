import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { RunScene } from '../scenes/RunScene';

export class CombatSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setupCollisions(
    player: Player,
    enemyGroup: Phaser.GameObjects.Group,
    projectileGroup: Phaser.GameObjects.Group,
    onEnemyDeath: (enemy: Enemy) => void,
    onPlayerDeath: () => void,
  ): void {
    const runScene = this.scene as RunScene;

    // Projectile vs Enemy
    this.scene.physics.add.overlap(
      projectileGroup,
      enemyGroup,
      (projObj, enemyObj) => {
        const proj = projObj as unknown as Projectile;
        const enemy = enemyObj as unknown as Enemy;
        if (!proj.active || !enemy.active) return;
        if (proj.owner !== 'player') return;

        const dead = enemy.takeDamage(proj.damage);

        // Damage number
        runScene.damageNumbers.spawn(enemy.x, enemy.y, proj.damage, '#ffffff');

        if (dead) {
          onEnemyDeath(enemy);
        }

        if (proj.onHit()) {
          proj.deactivate();
        }
      },
    );

    // Enemy vs Player (contact damage)
    this.scene.physics.add.overlap(
      player,
      enemyGroup,
      (_playerObj, enemyObj) => {
        const enemy = enemyObj as unknown as Enemy;
        if (!enemy.active || !enemy.canDealDamage()) return;

        enemy.resetDamageCooldown();
        const dead = player.takeDamage(enemy.eState.damage);

        // Damage number on player
        runScene.damageNumbers.spawn(player.x, player.y, enemy.eState.damage, '#ff4444');

        // Screen shake
        this.scene.cameras.main.shake(100, 0.005);

        if (dead) {
          onPlayerDeath();
        }
      },
    );

    // Enemy projectile vs Player
    this.scene.physics.add.overlap(
      player,
      projectileGroup,
      (_playerObj, projObj) => {
        const proj = projObj as unknown as Projectile;
        if (!proj.active || proj.owner !== 'enemy') return;

        const dead = player.takeDamage(proj.damage);
        runScene.damageNumbers.spawn(player.x, player.y, proj.damage, '#ff4444');
        this.scene.cameras.main.shake(100, 0.005);
        proj.deactivate();
        if (dead) {
          onPlayerDeath();
        }
      },
    );
  }
}
