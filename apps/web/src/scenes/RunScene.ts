import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, RUN_DURATION_MS } from '@solanasurvivors/shared';
import { SpawnDirector as CoreSpawnDirector, UpgradePool } from '@solanasurvivors/core';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { XPGem } from '../entities/XPGem';
import { InputManager } from '../systems/InputManager';
import { PhaserSpawnDirector } from '../systems/SpawnDirector';
import { CombatSystem } from '../systems/CombatSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { WeaponManager } from '../weapons/WeaponManager';
import { HUD } from '../ui/HUD';
import { DamageNumberManager } from '../ui/DamageNumber';

export class RunScene extends Phaser.Scene {
  player!: Player;
  inputManager!: InputManager;
  elapsedMs = 0;
  coreSpawnDirector!: CoreSpawnDirector;
  upgradePool!: UpgradePool;
  enemyGroup!: Phaser.GameObjects.Group;
  projectileGroup!: Phaser.GameObjects.Group;
  xpGemGroup!: Phaser.GameObjects.Group;
  spawnDirector!: PhaserSpawnDirector;
  combatSystem!: CombatSystem;
  weaponManager!: WeaponManager;
  upgradeSystem!: UpgradeSystem;
  hud!: HUD;
  damageNumbers!: DamageNumberManager;

  private groundLayer!: Phaser.GameObjects.TileSprite;
  private gameRunning = true;
  private paused = false;

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    this.elapsedMs = 0;
    this.gameRunning = true;
    this.paused = false;
    this.coreSpawnDirector = new CoreSpawnDirector();
    this.upgradePool = new UpgradePool();

    // Infinite tiling ground
    this.groundLayer = this.add.tileSprite(0, 0, GAME_WIDTH * 3, GAME_HEIGHT * 3, 'ground-tile')
      .setOrigin(0.5);

    // Player
    this.player = new Player(this, 0, 0);
    this.player.setDepth(10);

    // Groups
    this.enemyGroup = this.add.group({ classType: Enemy, runChildUpdate: false });
    this.projectileGroup = this.add.group({ classType: Projectile, runChildUpdate: false });
    this.xpGemGroup = this.add.group({ classType: XPGem, runChildUpdate: false });

    // Systems
    this.spawnDirector = new PhaserSpawnDirector(this, this.player, this.enemyGroup, this.coreSpawnDirector);
    this.weaponManager = new WeaponManager();
    this.upgradeSystem = new UpgradeSystem(this.player, this.weaponManager, this.upgradePool);
    this.combatSystem = new CombatSystem(this);

    this.combatSystem.setupCollisions(
      this.player,
      this.enemyGroup,
      this.projectileGroup,
      (enemy) => this.onEnemyDeath(enemy),
      () => this.onPlayerDeath(),
    );

    // XP gem pickup overlap
    this.physics.add.overlap(
      this.player,
      this.xpGemGroup,
      (_playerObj, gemObj) => {
        const gem = gemObj as unknown as XPGem;
        if (!gem.active) return;

        gem.deactivate();
        const leveledUp = this.upgradeSystem.addXP(gem.xpValue);
        if (leveledUp) {
          this.showLevelUp();
        }
      },
    );

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(25, 25);

    // Input
    this.inputManager = new InputManager(this);

    // HUD & Effects
    this.hud = new HUD(this);
    this.damageNumbers = new DamageNumberManager(this);

    // Pause key
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        if (!this.paused && this.gameRunning) {
          this.pauseGame();
        }
      });
    }
  }

  getProjectile(): Projectile | null {
    let proj = this.projectileGroup.getFirstDead(false) as Projectile | null;
    if (!proj) {
      proj = new Projectile(this, -9999, -9999);
      this.projectileGroup.add(proj);
      proj.deactivate();
    }
    return proj;
  }

  private spawnXPGem(x: number, y: number, value: number): void {
    let gem = this.xpGemGroup.getFirstDead(false) as XPGem | null;
    if (!gem) {
      gem = new XPGem(this, -9999, -9999);
      this.xpGemGroup.add(gem);
    }
    gem.spawn(x, y, value);
  }

  /** Public so weapons with direct damage (OrbitAura, BombToss, ChainLightning) can call it */
  onEnemyDeath(enemy: Enemy): void {
    if (!enemy.active) return;
    this.player.pState.kills++;
    this.player.pState.gold += enemy.eState.xpValue;
    this.spawnXPGem(enemy.x, enemy.y, enemy.eState.xpValue);
    enemy.deactivate();
  }

  private onPlayerDeath(): void {
    if (!this.gameRunning) return;
    this.gameRunning = false;
    this.scene.start('GameOverScene', {
      victory: false,
      timeSurvivedMs: this.elapsedMs,
      level: this.player.pState.level,
      kills: this.player.pState.kills,
      gold: this.player.pState.gold,
    });
  }

  private showLevelUp(): void {
    this.paused = true;
    this.physics.pause();

    const choices = this.upgradeSystem.getChoices();
    if (choices.length === 0) {
      this.paused = false;
      this.physics.resume();
      return;
    }

    this.scene.launch('LevelUpScene', {
      choices,
      onChoose: (choice: any) => {
        this.upgradeSystem.applyUpgrade(choice);
        this.paused = false;
        this.physics.resume();
      },
    });
  }

  private pauseGame(): void {
    this.paused = true;
    this.physics.pause();
    this.scene.launch('PauseScene', {
      onResume: () => {
        this.paused = false;
        this.physics.resume();
      },
    });
  }

  update(_time: number, delta: number): void {
    if (!this.gameRunning || this.paused) return;

    this.elapsedMs += delta;

    // Victory check
    if (this.elapsedMs >= RUN_DURATION_MS) {
      this.gameRunning = false;
      this.scene.start('GameOverScene', {
        victory: true,
        timeSurvivedMs: this.elapsedMs,
        level: this.player.pState.level,
        kills: this.player.pState.kills,
        gold: this.player.pState.gold,
      });
      return;
    }

    // Input
    const move = this.inputManager.getMovement();
    this.player.move(move.x, move.y);
    this.player.updateIframes(delta);

    // Spawn enemies
    this.spawnDirector.update(this.elapsedMs);

    // Update enemies
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    const enemyFireCallback = (ex: number, ey: number, vx: number, vy: number, damage: number) => {
      const proj = this.getProjectile();
      if (proj) {
        proj.fire(ex, ey, vx, vy, damage, 0, 'proj-enemy-bullet', 'enemy');
      }
    };
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      enemy.updateBehavior(this.player.x, this.player.y, delta, enemyFireCallback);
      enemy.updateCooldown(delta);

      // Handle exploder self-destruct (hp set to 0)
      if (enemy.eState.hp <= 0 && enemy.isExploder()) {
        // Check if player is in blast radius
        const edx = this.player.x - enemy.x;
        const edy = this.player.y - enemy.y;
        if (edx * edx + edy * edy < 40 * 40) {
          this.player.takeDamage(enemy.getExplodeDamage());
          if (this.player.pState.hp <= 0) {
            this.onPlayerDeath();
          }
        }
        this.onEnemyDeath(enemy);
        continue;
      }

      // Despawn far enemies
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      if (dx * dx + dy * dy > 1000 * 1000) {
        enemy.deactivate();
      }
    }

    // Weapons auto-fire
    this.weaponManager.update(delta, this, this.player, enemies);

    // Update projectiles
    const projectiles = this.projectileGroup.getChildren() as Projectile[];
    for (const proj of projectiles) {
      if (!proj.active) continue;
      if (proj.updateLifetime(delta)) {
        proj.deactivate();
      }
    }

    // XP gem magnet (pull nearby gems toward player)
    const gems = this.xpGemGroup.getChildren() as XPGem[];
    const pickupR = this.player.pState.pickupRadius;
    const pickupRSq = pickupR * pickupR;
    for (const gem of gems) {
      if (!gem.active) continue;
      const dx = this.player.x - gem.x;
      const dy = this.player.y - gem.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < pickupRSq) {
        // Pull toward player
        const dist = Math.sqrt(distSq);
        if (dist > 0) {
          const speed = 150;
          gem.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        }
      } else {
        gem.body.setVelocity(0, 0);
      }
    }

    // HUD
    this.hud.update(this.player.pState, this.elapsedMs);

    // Ground
    this.groundLayer.setPosition(this.player.x, this.player.y);
    this.groundLayer.setTilePosition(this.player.x, this.player.y);
  }
}
