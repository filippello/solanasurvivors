import { PassiveId, WeaponId, UpgradeChoice } from '@solanasurvivors/shared';
import { UpgradePool, xpRequiredForLevel } from '@solanasurvivors/core';
import { Player } from '../entities/Player';
import { WeaponManager } from '../weapons/WeaponManager';

export class UpgradeSystem {
  private upgradePool: UpgradePool;
  private player: Player;
  private weaponManager: WeaponManager;

  constructor(player: Player, weaponManager: WeaponManager, upgradePool: UpgradePool) {
    this.player = player;
    this.weaponManager = weaponManager;
    this.upgradePool = upgradePool;
  }

  addXP(amount: number): boolean {
    const boosted = Math.round(amount * this.player.stats.xpMultiplier);
    this.player.pState.xp += boosted;

    if (this.player.pState.xp >= this.player.pState.xpToNext) {
      this.player.pState.xp -= this.player.pState.xpToNext;
      this.player.pState.level++;
      this.player.pState.xpToNext = xpRequiredForLevel(this.player.pState.level);
      return true; // leveled up
    }
    return false;
  }

  getChoices(): UpgradeChoice[] {
    return this.upgradePool.getChoices();
  }

  applyUpgrade(choice: UpgradeChoice): void {
    this.upgradePool.applyUpgrade(choice.id);

    if (choice.type === 'passive') {
      this.player.stats.setPassiveLevel(choice.id as PassiveId, choice.nextLevel);
      this.player.refreshStats();
      // Heal when maxHP increases
      if (choice.id === 'max_hp') {
        this.player.pState.hp = this.player.pState.maxHp;
      }
    } else {
      this.weaponManager.addWeapon(choice.id as WeaponId);
    }
  }
}
