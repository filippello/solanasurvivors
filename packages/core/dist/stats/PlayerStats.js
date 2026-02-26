import { PLAYER_BASE_HP, PLAYER_BASE_SPEED, PLAYER_BASE_PICKUP_RADIUS, PLAYER_BASE_ARMOR, } from '@solanasurvivors/shared';
import { PASSIVE_TABLE } from '../balance/passives';
export class PlayerStats {
    constructor() {
        this.passiveLevels = new Map();
    }
    setPassiveLevel(id, level) {
        this.passiveLevels.set(id, level);
    }
    getPassiveLevel(id) {
        return this.passiveLevels.get(id) ?? 0;
    }
    getPassiveValue(id) {
        const level = this.getPassiveLevel(id);
        if (level === 0)
            return 0;
        const table = PASSIVE_TABLE[id];
        return table[level - 1]?.value ?? 0;
    }
    get maxHp() {
        return PLAYER_BASE_HP + this.getPassiveValue('max_hp');
    }
    get armor() {
        return PLAYER_BASE_ARMOR + this.getPassiveValue('armor');
    }
    get moveSpeed() {
        return PLAYER_BASE_SPEED * (1 + this.getPassiveValue('move_speed'));
    }
    get pickupRadius() {
        return PLAYER_BASE_PICKUP_RADIUS * (1 + this.getPassiveValue('pickup_radius'));
    }
    get cooldownReduction() {
        return this.getPassiveValue('cooldown_reduction');
    }
    get damageMultiplier() {
        return 1 + this.getPassiveValue('damage_boost');
    }
    get xpMultiplier() {
        return 1 + this.getPassiveValue('xp_boost');
    }
    reset() {
        this.passiveLevels.clear();
    }
}
//# sourceMappingURL=PlayerStats.js.map