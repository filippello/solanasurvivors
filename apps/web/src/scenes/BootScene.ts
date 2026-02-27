import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Player spritesheet (8 frames: 4 idle + 4 walk)
    this.load.spritesheet('player', 'assets/player/player.png', { frameWidth: 128, frameHeight: 128 });

    // Enemies
    this.load.image('enemy-swarm', 'assets/enemies/swarm.png');
    this.load.image('enemy-fast', 'assets/enemies/fast.png');
    this.load.image('enemy-tank', 'assets/enemies/tank.png');
    this.load.image('enemy-ranged', 'assets/enemies/ranged.png');
    this.load.image('enemy-exploder', 'assets/enemies/exploder.png');
    this.load.image('enemy-elite', 'assets/enemies/elite.png');
    this.load.image('enemy-boss', 'assets/enemies/boss.png');

    // Projectiles
    this.load.image('proj-magic-bolt', 'assets/projectiles/magic-bolt.png');
    this.load.image('proj-knife', 'assets/projectiles/knife.png');
    this.load.image('proj-bomb', 'assets/projectiles/bomb.png');
    this.load.image('proj-drone-bullet', 'assets/projectiles/drone-bullet.png');
    this.load.image('proj-enemy-bullet', 'assets/projectiles/enemy-bullet.png');

    // Effects
    this.load.image('orbit-orb', 'assets/effects/orbit-orb.png');
    this.load.image('drone', 'assets/effects/drone.png');
    this.load.image('xp-gem', 'assets/effects/xp-gem.png');
    this.load.spritesheet('explosion', 'assets/effects/explosion.png', { frameWidth: 64, frameHeight: 64 });

    // World
    this.load.image('ground-tile', 'assets/world/ground-tile.png');
  }

  create(): void {
    // Player animations (4 frames total)
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-walk',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    // Explosion animation
    this.anims.create({
      key: 'explode-anim',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 5 }),
      frameRate: 15,
      repeat: 0,
    });

    this.scene.start('HomeScene');
  }
}
