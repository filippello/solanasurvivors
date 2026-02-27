# Solana Survivors — Roadmap

Internal reference for future development priorities.

---

## Phase 1: Core Loop Polish (current)

What we have now:

- [x] 10-min survival gameplay with 6 weapons + 7 enemy types
- [x] Wallet connect (Phantom / Solflare)
- [x] NFT deposit to Arena vault (Metaplex-verified)
- [x] MagicBlock Session Keys — gasless `record_player_death`
- [x] On-chain kill counter per deposited NFT
- [x] Community Arena UI (top killers, deposited enemies)
- [x] Local leaderboard (localStorage)
- [x] PlayerAccount PDA for session auth

### Pending / short-term fixes

- [ ] ArenaScene deposit button (UI exists, tx not wired yet)
- [ ] Handle session expiry mid-run gracefully (re-create or show message)
- [ ] Persist session keypair across page refreshes (sessionStorage or encrypted localStorage)
- [ ] Skip session creation if wallet has no SOL (show warning instead of failed tx)
- [ ] Mobile touch controls (virtual joystick)

---

## Phase 2: MagicBlock Ephemeral Rollups

Move high-frequency game state to **MagicBlock Ephemeral Rollups** for true real-time on-chain gameplay.

### EnemyAsset Delegation

- [ ] `delegate_enemy_asset` instruction already exists in the program
- [ ] Wire delegation UI in ArenaScene (admin or depositor triggers it)
- [ ] Ephemeral Rollups handle kill counter updates at sub-second latency
- [ ] Periodic settlement back to Solana L1

### Real-time Kill Feed

- [ ] Subscribe to delegated EnemyAsset accounts via MagicBlock WebSocket
- [ ] Show live kill feed in Arena UI ("MonkeyNFT just killed Player3!")
- [ ] Animate kill counter incrementing in real-time

### Session Keys + Ephemeral Rollups combo

- [ ] Session key signs death tx → sent to MagicBlock Ephemeral Rollup (not devnet)
- [ ] Near-instant confirmation (~50ms vs ~400ms on devnet)
- [ ] Batch-settle kills back to L1 every N seconds
- [ ] Players never interact with L1 after session creation

---

## Phase 3: On-Chain Leaderboard & Rewards

### On-chain leaderboard

- [ ] `submit_run_result` instruction: stores run score, kills, time, level in a RunResult PDA
- [ ] Leaderboard PDA or Geyser plugin for top-N queries
- [ ] Replace localStorage leaderboard with on-chain data
- [ ] Session key signs run results too (gasless)

### Reward mechanics

- [ ] SOL or SPL token rewards for top weekly players
- [ ] ArenaVault accumulates entry fees (small SOL per run)
- [ ] Weekly payout to top 10 + NFT depositors of top killers
- [ ] Revenue split: 70% prize pool / 20% NFT depositors / 10% protocol

### NFT depositor income

- [ ] Kill-based rewards: depositors earn proportional to their NFTs' kill counts
- [ ] "Bounty" system: players can place bounties on specific NFT enemies
- [ ] Royalty on death: small SOL fee per death goes to the killer NFT's depositor

---

## Phase 4: NFT Cosmetics & Skins

### Player skins

- [ ] `INftProvider` already fetches wallet's NFTs via Helius
- [ ] Map owned NFTs to player sprite skins
- [ ] Show equipped skin in HomeScene and during gameplay
- [ ] Optional: on-chain skin selection (PlayerAccount stores equipped NFT mint)

### Enemy visuals from NFT metadata

- [ ] Use NFT image as enemy sprite (scale + crop to fit)
- [ ] Show NFT name above enemy
- [ ] Death screen shows full NFT art of the killer

### Weapon skins

- [ ] Special weapon skins tied to NFT ownership
- [ ] Visual-only, no gameplay advantage
- [ ] Tradeable on-chain

---

## Phase 5: Multiplayer & PvP

### Co-op mode

- [ ] 2-4 players in same run
- [ ] Shared enemy pool, individual XP/levels
- [ ] MagicBlock Ephemeral Rollups for real-time state sync
- [ ] Session keys for all players (gasless for everyone)

### PvP Arena

- [ ] 1v1 or FFA deathmatch mode
- [ ] Players are both dodging enemies and competing for kills
- [ ] On-chain match result (winner, scores)
- [ ] Wagered matches (SOL escrow → winner takes pot)

### Tournament system

- [ ] Bracket-based tournaments with on-chain registration
- [ ] Entry fee + prize pool
- [ ] NFT trophy for winners (soulbound)
- [ ] Streamed on Twitch/YouTube with live kill feed overlay

---

## Phase 6: Economy & Tokenomics

### $SURV token (future, not confirmed)

- [ ] Earn $SURV from gameplay (kills, survival time, achievements)
- [ ] Spend $SURV on: weapon skins, player skins, run power-ups, tournament entry
- [ ] Stake $SURV to boost earning rate
- [ ] NFT depositors earn $SURV based on their NFTs' kill counts

### Run entry & rewards

- [ ] Free runs (no on-chain interaction, no rewards)
- [ ] Paid runs (small SOL entry fee → prize pool)
- [ ] Daily challenges with fixed rewards
- [ ] Weekly tournaments with increasing buy-in tiers

### Marketplace

- [ ] Trade weapon skins, player skins as SPL tokens
- [ ] Auction house for rare drops
- [ ] Creator royalties on secondary sales

---

## Phase 7: Platform & Community

### Mobile

- [ ] Mobile web build (PWA)
- [ ] Virtual joystick controls
- [ ] Wallet connect via deep link (Phantom mobile)
- [ ] Session keys eliminate popup hell on mobile (even more critical)

### SDK / Modding

- [ ] `packages/core` is already framework-agnostic
- [ ] Publish as npm package for community mods
- [ ] Custom weapon plugins (define stats + behavior)
- [ ] Custom enemy plugins (sprite + AI)
- [ ] Map editor for community levels

### Community features

- [ ] On-chain profiles (username, avatar, stats)
- [ ] Guilds / clans with shared leaderboards
- [ ] Achievement system (on-chain badges as compressed NFTs)
- [ ] Referral program (invite → both earn bonus)

---

## Technical Debt & Infrastructure

- [ ] Upgrade to `@solana/web3.js` v2 when stable
- [ ] Move from raw instruction building to generated Anchor client (TypeScript IDL codegen)
- [ ] Add integration tests for session key flow (local validator + Anchor test suite)
- [ ] CI/CD pipeline: build → test → deploy program → deploy frontend
- [ ] Monitoring: track session key usage, tx success rates, gas costs
- [ ] Rate limiting on RPC calls (batch requests, caching)
- [ ] Asset pipeline: automated sprite generation and optimization
- [ ] Sound effects and music
- [ ] Analytics: gameplay telemetry (anonymized)

---

## Priority Order

| Priority | Phase | Why |
|----------|-------|-----|
| **Now** | Phase 1 remaining | Polish for hackathon submission |
| **Next** | Phase 2 (Ephemeral Rollups) | Full MagicBlock stack, strongest hackathon differentiator |
| **Soon** | Phase 3 (Leaderboard + Rewards) | Creates retention loop and real stakes |
| **Medium** | Phase 4 (NFT Cosmetics) | Monetization + community engagement |
| **Later** | Phase 5 (Multiplayer) | Major scope increase, needs infrastructure |
| **Future** | Phase 6-7 (Economy, Platform) | Requires traction and community first |
