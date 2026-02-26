# Solana Survivors

A 2D top-down "Vampire Survivors-like" survival game built with Phaser 3, Vite, and TypeScript. Survive 10 minutes against waves of enemies with auto-attacking weapons and upgrade choices.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrow Keys | Move |
| Gamepad Left Stick | Move |
| ESC | Pause / Resume |
| Mouse Click | Select upgrades & menu buttons |

Weapons fire automatically at the nearest enemy. No aiming required.

## How to Play

1. Click **START** on the title screen
2. Move your character to dodge enemies
3. Enemies are killed automatically by your weapons
4. Collect blue XP gems dropped by enemies
5. On level up, choose 1 of 3 upgrades (new weapons or passive stat boosts)
6. Survive 10 minutes to win
7. A boss appears at 9:30 - defeat it or survive until 10:00

## Weapons

| Weapon | Description |
|--------|-------------|
| Magic Bolt | Fires homing bolts at the nearest enemy (starting weapon) |
| Knife Fan | Fires a spread of knives in the movement direction |
| Orbit Aura | Rotating damage orbs around the player |
| Chain Lightning | Hits nearest enemy then chains to nearby targets |
| Bomb Toss | Lobs a bomb that explodes in an AOE |
| Drone Summon | Orbiting drones that fire at nearby enemies |

All weapons can be upgraded to level 5.

## Passive Upgrades

Max HP, Armor, Move Speed, Pickup Radius, Cooldown Reduction, Damage Boost, XP Boost - each upgradeable to level 5.

## Enemy Types

| Type | Behavior | Appears |
|------|----------|---------|
| Swarm (green) | Chase player | 0:00 |
| Fast (yellow) | Fast chase | 1:00 |
| Tank (red) | Slow, high HP | 3:00 |
| Ranged (purple) | Keeps distance, fires projectiles | 4:00 |
| Exploder (orange) | Rushes and detonates on proximity | 5:00 |
| Elite (white) | Strong, periodic dash | 7:00 |
| Boss (crimson) | Phase-based (chase + burst fire) | 9:30 |

## Architecture

```
solanasurvivors/
├── packages/
│   ├── shared/          # Types, constants, math utils
│   └── core/            # Framework-agnostic game logic
│       ├── balance/     # Weapon, passive, enemy, XP, spawn tables
│       ├── spawn/       # Pure SpawnDirector logic
│       ├── stats/       # PlayerStats computation
│       ├── rng/         # Seeded RNG
│       ├── upgrade/     # UpgradePool selection logic
│       └── integration/ # Solana adapter interfaces
└── apps/
    └── web/             # Phaser 3 game client
        └── src/
            ├── scenes/      # Boot, Home, Run, Pause, LevelUp, GameOver
            ├── entities/    # Player, Enemy, Projectile, XPGem
            ├── weapons/     # BaseWeapon + 6 weapon implementations
            ├── systems/     # SpawnDirector, Combat, Upgrade, Input
            ├── ui/          # HUD, DamageNumber
            └── integration/ # DummyAdapters (Solana stubs)
```

`packages/core` is framework-agnostic (no Phaser dependency). All balance data lives there so it can be shared with a future server or different frontend.

## Tweaking Balance

All game balance is in `packages/core/src/balance/`:

- **weapons.ts** - Damage, cooldown, projectile count, speed, pierce per level
- **passives.ts** - Stat bonus values per level
- **enemies.ts** - HP, speed, damage, XP value, color per enemy type
- **xpCurve.ts** - XP required per player level
- **spawnTable.ts** - Which enemies appear at which minute, base spawn rate

## Solana Integration (Stubbed)

The following interfaces are defined in `packages/core/src/integration/` but not yet active:

- `IWalletAdapter` - Wallet connect/disconnect
- `IAssetRegistry` - NFT skin ownership
- `ISacrificeGate` - Token-gated run access + result submission

Dummy implementations exist in `apps/web/src/integration/DummyAdapters.ts`.

## Building

```bash
npm run build
```

Output goes to `apps/web/dist/`.
