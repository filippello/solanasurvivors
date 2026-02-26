import Phaser from 'phaser';
import { EnemyType, EnemyState, angleBetween } from '@solanasurvivors/shared';
import { ENEMY_TABLE } from '@solanasurvivors/core';

export class Enemy extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  eState!: EnemyState;
  private damageCooldown = 0;

  // Type-specific timers
  private shootTimer = 0;
  private explodeProximity = 60;
  private dashTimer = 0;
  private dashCooldown = 0;
  private bossPhase: 'chase' | 'burst' = 'chase';
  private bossPhaseTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-swarm');
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  spawn(x: number, y: number, type: EnemyType, hpMultiplier = 1): void {
    const def = ENEMY_TABLE[type];
    this.setPosition(x, y);
    this.setTexture(`enemy-${type}`);
    this.setDisplaySize(def.radius * 2, def.radius * 2);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setCircle(def.radius);
    this.damageCooldown = 0;
    this.shootTimer = 2000;
    this.dashTimer = 0;
    this.dashCooldown = 5000;
    this.bossPhase = 'chase';
    this.bossPhaseTimer = 4000;

    this.eState = {
      type,
      hp: Math.ceil(def.hp * hpMultiplier),
      maxHp: Math.ceil(def.hp * hpMultiplier),
      x,
      y,
      speed: def.speed,
      damage: def.damage,
      xpValue: def.xpValue,
    };
  }

  updateBehavior(tx: number, ty: number, delta: number, fireCallback?: (x: number, y: number, vx: number, vy: number, damage: number) => void): void {
    if (!this.eState) return;

    switch (this.eState.type) {
      case 'ranged':
        this.behaviorRanged(tx, ty, delta, fireCallback);
        break;
      case 'exploder':
        this.behaviorExploder(tx, ty, delta);
        break;
      case 'elite':
        this.behaviorElite(tx, ty, delta);
        break;
      case 'boss':
        this.behaviorBoss(tx, ty, delta, fireCallback);
        break;
      default:
        this.chaseTarget(tx, ty);
        break;
    }

    this.eState.x = this.x;
    this.eState.y = this.y;
  }

  chaseTarget(tx: number, ty: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      this.body.setVelocity(
        (dx / len) * this.eState.speed,
        (dy / len) * this.eState.speed,
      );
    }
    this.eState.x = this.x;
    this.eState.y = this.y;
  }

  private behaviorRanged(tx: number, ty: number, delta: number, fireCallback?: (x: number, y: number, vx: number, vy: number, damage: number) => void): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const preferredDist = 100;

    // Keep distance
    if (dist < preferredDist - 30) {
      // Move away
      if (dist > 0) {
        this.body.setVelocity(
          (-dx / dist) * this.eState.speed,
          (-dy / dist) * this.eState.speed,
        );
      }
    } else if (dist > preferredDist + 50) {
      // Move toward
      if (dist > 0) {
        this.body.setVelocity(
          (dx / dist) * this.eState.speed,
          (dy / dist) * this.eState.speed,
        );
      }
    } else {
      this.body.setVelocity(0, 0);
    }

    // Shoot
    this.shootTimer -= delta;
    if (this.shootTimer <= 0 && fireCallback) {
      this.shootTimer = 2000;
      const angle = angleBetween(this, { x: tx, y: ty });
      fireCallback(
        this.x, this.y,
        Math.cos(angle) * 100,
        Math.sin(angle) * 100,
        this.eState.damage,
      );
    }
  }

  private behaviorExploder(tx: number, ty: number, _delta: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Rush toward player
    if (dist > 0) {
      this.body.setVelocity(
        (dx / dist) * this.eState.speed,
        (dy / dist) * this.eState.speed,
      );
    }

    // Explode when close
    if (dist < this.explodeProximity) {
      this.explode();
    }
  }

  explode(): void {
    if (!this.active) return;
    const blastRadius = 80;

    // Visual explosion
    const explosion = this.scene.add.sprite(this.x, this.y, 'explosion');
    explosion.setDisplaySize(blastRadius * 2, blastRadius * 2);
    explosion.setAlpha(0.5);
    explosion.setDepth(6);
    explosion.play('explode-anim');
    explosion.once('animationcomplete', () => explosion.destroy());

    // Mark HP to 0 so combat system handles it
    this.eState.hp = 0;
  }

  isExploder(): boolean {
    return this.eState?.type === 'exploder';
  }

  getExplodeDamage(): number {
    return this.eState?.damage ?? 0;
  }

  private behaviorElite(tx: number, ty: number, delta: number): void {
    // Normal chase
    this.chaseTarget(tx, ty);

    // Periodic dash
    this.dashCooldown -= delta;
    if (this.dashCooldown <= 0) {
      this.dashCooldown = 5000;
      this.dashTimer = 300;
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= delta;
      // Double speed during dash
      this.body.velocity.x *= 2.5;
      this.body.velocity.y *= 2.5;
      this.setAlpha(0.6);
    } else {
      this.setAlpha(1);
    }
  }

  private behaviorBoss(tx: number, ty: number, delta: number, fireCallback?: (x: number, y: number, vx: number, vy: number, damage: number) => void): void {
    this.bossPhaseTimer -= delta;

    if (this.bossPhaseTimer <= 0) {
      this.bossPhase = this.bossPhase === 'chase' ? 'burst' : 'chase';
      this.bossPhaseTimer = this.bossPhase === 'chase' ? 4000 : 2000;
    }

    if (this.bossPhase === 'chase') {
      this.chaseTarget(tx, ty);
    } else {
      // Burst: stop and fire in all directions
      this.body.setVelocity(0, 0);

      this.shootTimer -= delta;
      if (this.shootTimer <= 0 && fireCallback) {
        this.shootTimer = 300;
        const numBullets = 8;
        for (let i = 0; i < numBullets; i++) {
          const angle = (i / numBullets) * Math.PI * 2;
          fireCallback(
            this.x, this.y,
            Math.cos(angle) * 75,
            Math.sin(angle) * 75,
            this.eState.damage,
          );
        }
      }
    }
  }

  takeDamage(amount: number): boolean {
    this.eState.hp -= amount;
    // Flash white using tint
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) {
        this.clearTint();
      }
    });
    return this.eState.hp <= 0;
  }

  canDealDamage(): boolean {
    return this.damageCooldown <= 0;
  }

  resetDamageCooldown(): void {
    this.damageCooldown = 500;
  }

  updateCooldown(delta: number): void {
    if (this.damageCooldown > 0) this.damageCooldown -= delta;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.body.setVelocity(0, 0);
    this.setPosition(-9999, -9999);
  }
}
