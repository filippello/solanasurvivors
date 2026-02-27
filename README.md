# Solana Survivors

A **Vampire Survivors-like** game on Solana where community-deposited NFTs become in-game enemies, and every player death is recorded on-chain — gaslessly — via **MagicBlock Session Keys**.

Built for the **Solana Hackathon** | **MagicBlock Track**

---

## How It Works

1. **Community sacrifices NFTs** into the Arena vault through an animated ritual (Metaplex-verified, collection-whitelisted)
2. The **Sacrifice screen** features a full pentagram animation with particle effects — a 5.5-second ritual that makes every deposit memorable
3. Those NFTs spawn as **enemies in-game** — each with unique types and behaviors
4. When an NFT enemy kills a player, a **kill counter is incremented on-chain**
5. Thanks to MagicBlock Session Keys, the player signs **once** at the start of a run — all subsequent death records are **gasless and popup-free**
6. NFT depositors compete for the **Top Killers** leaderboard based on their NFTs' on-chain kill counts

---

## MagicBlock Integration

The core innovation: **zero-friction on-chain gameplay** via MagicBlock Session Keys.

### The Problem

Every `record_player_death` instruction requires a wallet signature. In a fast-paced game, popup confirmations destroy the experience — and players simply won't do it.

### The Solution

We use MagicBlock's **Session Keys** (`session-keys v3.0.10`) to create an ephemeral keypair that acts on behalf of the player's wallet:

```
┌──────────────────────────────────────────────────────────────┐
│  START RUN  →  1 wallet popup (createSession)                │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ init     │    │ top-up   │    │ create   │               │
│  │ player   │ +  │ 0.01 SOL │ +  │ session  │  = 1 tx      │
│  │ (if new) │    │ ephemeral│    │ token    │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│                                                              │
│  GAMEPLAY  →  0 popups                                       │
│                                                              │
│  Player dies  →  ephemeral key signs  →  record_player_death │
│  Player dies  →  ephemeral key signs  →  record_player_death │
│  Player dies  →  ephemeral key signs  →  record_player_death │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

### On-Chain Architecture

The `PlayerAccount` PDA stores the wallet's pubkey as `authority`. The `#[session_auth_or]` macro validates the ephemeral signer against the `SessionToken`, which points back to the real wallet via `player_account.authority`:

```
SessionToken (MagicBlock program)
  ├── session_signer: ephemeral_key
  ├── authority: wallet_pubkey
  └── target_program: arena_program_id

PlayerAccount (Arena program)
  ├── authority: wallet_pubkey  ← must match SessionToken.authority
  └── bump

record_player_death:
  signer = ephemeral_key
  → SessionToken validates ephemeral_key is authorized for wallet
  → PlayerAccount validates wallet owns this player PDA
  → Kill counter incremented. Zero popups.
```

### Verified On-Chain

The session creation transaction contains 3 instructions in a single atomic tx:

| # | Program | Instruction | Purpose |
|---|---------|-------------|---------|
| 0 | Arena | `init_player` | Create PlayerAccount PDA (one-time) |
| 1 | System | `transfer` | Top up ephemeral key with 0.01 SOL (~2000 txs) |
| 2 | MagicBlock Session Keys | `create_session` | Create SessionToken PDA (7-day validity) |

Death transactions are signed **exclusively by the ephemeral key** — the player's wallet never appears as signer or fee payer:

```
record_player_death tx:
  Fee payer:  ephemeral_key (NOT wallet)
  Signers:    [ephemeral_key] (NOT wallet)
  Accounts:   enemy_asset, player_account, session_token
  Cost:       ~0.000005 SOL per death (from ephemeral balance)
  Wallet:     not involved at all
```

Example confirmed tx: [`3sMukm...`](https://explorer.solana.com/tx/3sMukmosn7QnWz3CnLHAFoeEgjZ394E6fwZy35CemJtUwyaprNoKWt4qf8fF5djixQqMTX5QJsfno7vJEeeZnV6B?cluster=devnet)

---

## Game Features

### Gameplay
- **10-minute survival runs** against escalating enemy waves
- **6 auto-firing weapons** with 5 upgrade levels each (Magic Bolt, Knife Fan, Orbit Aura, Chain Lightning, Bomb Toss, Drone Summon)
- **7 passive upgrades** with 5 levels each (HP, Armor, Speed, Pickup Radius, Cooldown Reduction, Damage Boost, XP Boost)
- **7 enemy types** with distinct AI behaviors (Swarm, Fast, Tank, Ranged, Exploder, Elite, Boss)
- **Boss fight** at 9:30 with phase-based attack patterns
- **Level-up system** with 3 random upgrade choices per level

### Solana Integration
- **Wallet connect** (Phantom / Solflare) with silent auto-reconnect
- **NFT Sacrifice ritual** — full pentagram animation with particle effects when depositing NFTs to the vault
- **Metaplex verification** (collection whitelist, token standard, supply) on every deposit
- **MagicBlock Session Keys** for gasless death recording
- **On-chain kill counter** per deposited NFT
- **Graveyard** UI showing deposited enemies, top killers, and paginated "my sacrifices"
- **Leaderboard** with tabs for Top Runs (local scores) and Top Killers (on-chain data)

### Sacrifice & Arena System

**SACRIFICE** — the ritual screen where NFTs are deposited:
- Select an NFT from your wallet (whitelisted collections only)
- A **5.5-second animated ritual** plays: pentagram charge → energy impact → NFT reveal → "SACRIFICED" text
- The NFT is transferred to the Arena vault and an `EnemyAssetAccount` is created on-chain
- Each deposited NFT maps to an enemy type and spawns in-game

**GRAVEYARD** — the arena viewer:
- Shows all deposited enemies with their NFT images (fetched via Helius DAS API)
- **Top Killers** tab: NFT enemies ranked by on-chain kill count
- **My Sacrifices** tab: paginated view of NFTs you've deposited
- When an NFT enemy kills a player, its `kill_counter` increments on-chain

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | Phaser 3 |
| Frontend | TypeScript, Vite |
| Blockchain | Solana (devnet), Anchor 0.32.1 |
| Session Keys | MagicBlock `session-keys` v3.0.10 |
| NFT Standard | Metaplex Token Metadata |
| NFT Indexing | Helius DAS API |
| Wallet | Phantom / Solflare (browser extension) |

---

## Architecture

```
solanasurvivors/
├── packages/
│   ├── shared/          # Types, constants, math (zero dependencies)
│   └── core/            # Game logic: weapons, enemies, spawning, upgrades
│                          (framework-agnostic — no Phaser imports)
├── apps/
│   └── web/             # Phaser 3 client + Solana integrations
│       ├── scenes/      # Boot, Home, Run, Pause, LevelUp, GameOver, Sacrifice, Arena (Graveyard), Leaderboard
│       ├── entities/    # Player, Enemy, Projectile, XPGem
│       ├── weapons/     # 6 weapon implementations
│       ├── systems/     # Combat, Spawning, Upgrades, Input
│       ├── ui/          # HUD, DamageNumbers, TextStyles
│       └── integration/ # Wallet, SessionKeys, EnemyPool, NFTs, Leaderboard
└── programs/
    └── arena/           # Anchor program (6 instructions, 5 PDAs)
```

The monorepo separates concerns: `shared` has zero dependencies, `core` is framework-agnostic (could power a Unity or mobile client), and `web` is the Phaser-specific implementation.

---

## On-Chain Program

**Program ID:** [`8WUCDRofKewY1oGh93eGa1dpacVjYV1LGgbZZN5JKkS4`](https://explorer.solana.com/address/8WUCDRofKewY1oGh93eGa1dpacVjYV1LGgbZZN5JKkS4?cluster=devnet)
**Network:** Solana Devnet

### Instructions

| Instruction | Auth | Description |
|-------------|------|-------------|
| `init_arena` | Admin | Create ArenaConfig + ArenaVault PDAs |
| `set_whitelist` | Admin | Set whitelisted NFT collections (max 5) |
| `deposit_nft` | User | Deposit Metaplex-verified NFT into vault, create EnemyAssetAccount |
| `init_player` | User | Create PlayerAccount PDA (one-time, stores wallet authority for session auth) |
| `record_player_death` | Session Key / Wallet | Increment kill counter (gasless via MagicBlock) |
| `delegate_enemy_asset` | Admin | Delegate to MagicBlock Ephemeral Rollups |

### PDAs

| PDA | Seeds | Purpose |
|-----|-------|---------|
| ArenaConfig | `["arena_config"]` | Admin settings, whitelist |
| ArenaVault | `["arena_vault"]` | NFT custody |
| PlayerAccount | `["player", wallet]` | Session key authority anchor |
| EnemyAsset | `["enemy_asset", mint]` | Per-NFT kill counter, metadata |
| SessionToken | `["session_token", program, ephemeral, wallet]` | MagicBlock session (external program) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Phantom or Solflare browser extension
- (Optional) Anchor CLI 0.32.1 for program development

### Build & Run

```bash
# Install dependencies
npm install

# Build all packages (shared → core → web)
npm run build

# Start dev server (localhost:3000)
npm run dev
```

### Environment Variables

Create `apps/web/.env`:

```env
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_ARENA_PROGRAM_ID=8WUCDRofKewY1oGh93eGa1dpacVjYV1LGgbZZN5JKkS4
VITE_HELIUS_API_KEY=your_helius_key
```

### Deploy Program (optional)

```bash
anchor build
anchor deploy --provider.cluster devnet

# Setup arena (init, whitelist, deposit NFTs)
cd scripts && npm install && npx tsx setup-devnet.ts
```

---

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrow Keys | Move |
| Gamepad Left Stick | Move |
| ESC | Pause |
| Mouse Click | Select upgrades & menu buttons |

Weapons fire automatically at the nearest enemy. No aiming required.

---

## How to Play

1. Click **START** on the title screen
2. If wallet connected: approve the session key (1 popup, enables gasless kills)
3. Move your character to dodge enemies — weapons fire automatically
4. Collect blue XP gems dropped by enemies
5. On level up, choose 1 of 3 upgrades (new weapons or passive stat boosts)
6. Survive 10 minutes to win, or die to an NFT enemy (their kill counter goes up!)
7. Visit **SACRIFICE** to deposit NFTs into the vault with an animated ritual
8. Check the **GRAVEYARD** to see deposited enemies and top killers
9. View the **LEADERBOARD** for Top Runs and Top Killers rankings

---

## Enemies

| Type | Behavior | Appears At |
|------|----------|-----------|
| Swarm (green) | Chase player | 0:00 |
| Fast (yellow) | Fast chase | 1:00 |
| Tank (red) | Slow, high HP | 3:00 |
| Ranged (purple) | Keeps distance, fires projectiles | 4:00 |
| Exploder (orange) | Rushes and detonates on proximity | 5:00 |
| Elite (white) | Strong, periodic dash attacks | 7:00 |
| Boss (crimson) | Phase-based: chase + burst fire | 9:30 |

---

## Weapons

| Weapon | Description |
|--------|-------------|
| Magic Bolt | Homing bolts at the nearest enemy (starting weapon) |
| Knife Fan | Spread of knives in movement direction |
| Orbit Aura | Rotating damage orbs around the player |
| Chain Lightning | Hits nearest enemy, chains to nearby targets |
| Bomb Toss | Lobs bombs that explode in AoE |
| Drone Summon | Orbiting drones that independently fire at enemies |

All weapons upgradeable to level 5.

---

## Devnet Addresses

| Account | Address |
|---------|---------|
| Arena Program | `8WUCDRofKewY1oGh93eGa1dpacVjYV1LGgbZZN5JKkS4` |
| ArenaConfig PDA | `93ir4MyzbppTT59NYNTHjEwqKoyTyaGhFfHwPAmj4D9t` |
| ArenaVault PDA | `4wWwH5FQZadNEGEPwZBwQvqqqq53Z5NoeZjLec6zB5dj` |
| Collection Mint | `DmAgbcrmyAYkEYyg5NNkDMQyC8Zuaruv6JcAnVUaviny` |
| MagicBlock Session Keys | `KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5` |

---

## Art Pipeline

Every enemy goes through a 3-step pipeline: **NFT IMAGE → Concept Art → in-game pixel sprite**.

<table>
  <tr>
    <th>Enemy 1</th>
    <th>Enemy 2</th>
    <th>Enemy 3</th>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/a73ea054-ca5c-40fa-bce6-7e04ada22d4c" width="250" /></td>
    <td><img src="https://github.com/user-attachments/assets/a5d97ece-5dcb-4c02-aea8-f94dcb413799" width="250" /></td>
    <td><img src="https://github.com/user-attachments/assets/97e97c35-99f8-4431-bf00-98ee2f600716" width="250" /></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/ec607a09-35fc-455a-9760-e1294dbb0ada" width="250" /></td>
    <td><img src="https://github.com/user-attachments/assets/70417901-a6f1-4fda-a4c0-c706be209687" width="250" /></td>
    <td><img src="https://github.com/user-attachments/assets/31ebb824-aee7-4e4c-bcb5-774d202eae92" width="250" /></td>
  </tr>
  <tr>
    <td align="center"><img src="https://github.com/user-attachments/assets/67fbeb0b-8d72-497e-929c-eaf2333076e8" width="96" /></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/c40f4c68-1058-4943-a448-e22e880e0848" width="96" /></td>
    <td align="center"><img src="https://github.com/user-attachments/assets/18fa2c6f-48f5-413b-9ff8-eaa757aba8d2" width="96" /></td>
  </tr>
  <tr>
    <td align="center"><em>Game Sprite</em></td>
    <td align="center"><em>Game Sprite</em></td>
    <td align="center"><em>Game Sprite</em></td>
  </tr>
</table>

---

## Tweaking Balance

All game balance lives in `packages/core/src/balance/`:

- **weapons.ts** — Damage, cooldown, projectile count, speed, pierce per level
- **passives.ts** — Stat bonus values per level
- **enemies.ts** — HP, speed, damage, XP value per enemy type
- **xpCurve.ts** — XP required per player level
- **spawnTable.ts** — Which enemies appear at which minute, spawn rates

---

## License

MIT
