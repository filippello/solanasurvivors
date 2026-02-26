import Phaser from 'phaser';
import {
  PLAYER_RADIUS,
  PLAYER_BASE_HP,
  PLAYER_BASE_SPEED,
  PLAYER_BASE_PICKUP_RADIUS,
  PLAYER_IFRAME_MS,
  PlayerState,
} from '@solanasurvivors/shared';
import { PlayerStats } from '@solanasurvivors/core';

export class Player extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  pState: PlayerState;
  stats: PlayerStats;
  private iframeTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    this.setDisplaySize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCircle(PLAYER_RADIUS);

    this.stats = new PlayerStats();

    this.pState = {
      hp: PLAYER_BASE_HP,
      maxHp: PLAYER_BASE_HP,
      x,
      y,
      level: 1,
      xp: 0,
      xpToNext: 10,
      speed: PLAYER_BASE_SPEED,
      pickupRadius: PLAYER_BASE_PICKUP_RADIUS,
      armor: 0,
      gold: 0,
      kills: 0,
      invulnerable: false,
    };
  }

  move(vx: number, vy: number): void {
    const speed = this.stats.moveSpeed;
    this.body.setVelocity(vx * speed, vy * speed);

    // Flip sprite based on movement direction
    if (Math.abs(vx) > 0.1) {
      this.setFlipX(vx < 0);
    }

    if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
      this.play('player-walk', true);
    } else {
      this.play('player-idle', true);
    }

    this.pState.x = this.x;
    this.pState.y = this.y;
  }

  takeDamage(amount: number): boolean {
    if (this.pState.invulnerable) return false;

    const effectiveDamage = Math.max(1, amount - this.stats.armor);
    this.pState.hp -= effectiveDamage;
    this.pState.invulnerable = true;
    this.iframeTimer = PLAYER_IFRAME_MS;

    // Flash effect
    this.setAlpha(0.5);

    return this.pState.hp <= 0;
  }

  updateIframes(delta: number): void {
    if (!this.pState.invulnerable) return;
    this.iframeTimer -= delta;
    if (this.iframeTimer <= 0) {
      this.pState.invulnerable = false;
      this.setAlpha(1);
    }
  }

  refreshStats(): void {
    this.pState.maxHp = this.stats.maxHp;
    this.pState.speed = this.stats.moveSpeed;
    this.pState.pickupRadius = this.stats.pickupRadius;
    this.pState.armor = this.stats.armor;
  }

  heal(amount: number): void {
    this.pState.hp = Math.min(this.pState.hp + amount, this.pState.maxHp);
  }
}
