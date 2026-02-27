import { Connection } from '@solana/web3.js';
import type { IServiceRegistry } from '@solanasurvivors/core';
import { SolanaWalletAdapter } from './SolanaWalletAdapter';
import { HeliusNftProvider } from './HeliusNftProvider';
import { EnemyPoolService } from './EnemyPoolService';
import { SessionKeyManager } from './SessionKeyManager';
import { LeaderboardService } from './LeaderboardService';

// Whitelisted collections for the arena (configured per deployment)
const WHITELISTED_COLLECTIONS: string[] = [
  'DmAgbcrmyAYkEYyg5NNkDMQyC8Zuaruv6JcAnVUaviny',
];

export interface GameServicesBundle extends IServiceRegistry {
  enemyPool: EnemyPoolService;
  sessionKeys: SessionKeyManager;
  leaderboard: LeaderboardService;
}

let services: GameServicesBundle | null = null;

/**
 * Initialize all game services. Call once before Phaser.Game creation.
 */
export function initServices(): GameServicesBundle {
  if (services) return services;

  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const programId = import.meta.env.VITE_ARENA_PROGRAM_ID || 'ArenAV1tXMFgUUx3JKe6WCRfG8ztMBBjrctTMGr2pzr';
  const connection = new Connection(rpcUrl, 'confirmed');

  const wallet = new SolanaWalletAdapter();
  const nftProvider = new HeliusNftProvider(WHITELISTED_COLLECTIONS);
  const enemyPool = new EnemyPoolService(connection, programId);
  const sessionKeys = new SessionKeyManager(connection, wallet, programId);
  const leaderboard = new LeaderboardService();

  services = {
    wallet,
    nftProvider,
    enemyPool,
    sessionKeys,
    leaderboard,
  };

  // Try to silently reconnect the wallet (no popup if user previously approved)
  wallet.tryReconnect().catch(() => {});

  // Load enemy pool from on-chain (fire-and-forget; pool will be ready by the time the player starts a run)
  enemyPool.refresh().catch((err) =>
    console.warn('[GameServices] Initial enemy pool refresh failed:', err),
  );

  return services;
}

/**
 * Get the initialized services singleton.
 * Throws if called before initServices().
 */
export function getServices(): GameServicesBundle {
  if (!services) throw new Error('GameServices not initialized — call initServices() first');
  return services;
}
