import { Connection, PublicKey } from '@solana/web3.js';
import type { EnemyType } from '@solanasurvivors/shared';

const ENEMY_TYPES: EnemyType[] = ['swarm', 'fast', 'tank', 'ranged', 'exploder', 'elite', 'boss'];

/**
 * Hardcoded mint → enemy type for the first 5 deposited NFTs.
 * These are the ones we test with on devnet. Any mint not listed here
 * falls back to the deterministic hash mapping.
 */
const MINT_TYPE_OVERRIDES: Record<string, EnemyType> = {
  '674sNkvgHLmxYoyYrCfmrbueZS4Y4KsTCA9wEMV37ayv': 'swarm',     // Skull Wraith
  '61NFKDieo21UKeTPBt64SVYD1wmjg67HcbiKfSiin8A8':  'fast',      // Bone Golem
  'Bnay2rPp7jGCXEoDorvCPqeVRVeHKVRB5TkV3qwdrgXs':  'tank',      // Shadow Imp
  'Hg6AxgtqqsNbuwVzRGvKXAkoMaK6a1z2fD2G9opUykfs':  'ranged',    // Crystal Spider
  'Fhr4AyaG2Wbi1anxdSHwXmGjcUpm8fcpqyo7xWpPovet':  'exploder',  // Void Serpent
  'BCGzRJjd8Zyt7HyhnEERYkZhiXvWwBY99KN6V2TkJu81':  'boss',      // Fire Monkey (demo)
  '7F8TpbMpz8bSmM1HQtupvMdoCbWJLKhaZCB388Rk1Uu4':  'elite',     // Neon Serpent (demo)
  '22mgzuS5A9UUchuSruum9PxtWNS6jzpsJV5KaNPKWVLX':  'exploder',  // Phantom Swarm (demo)
};

export interface EnemyNftEntry {
  mint: string;
  depositor: string;
  collection: string;
  killCounter: number;
  name: string;
  image: string;
  enemyType: EnemyType;
}

/**
 * Fetches all deposited EnemyAssetAccount PDAs from on-chain
 * and maps them to game enemy types.
 */
export class EnemyPoolService {
  private connection: Connection;
  private programId: PublicKey;
  private pool: EnemyNftEntry[] = [];

  constructor(connection: Connection, programId: string) {
    this.connection = connection;
    this.programId = new PublicKey(programId);
  }

  getPool(): EnemyNftEntry[] {
    return this.pool;
  }

  /**
   * Select N random enemies from the pool for a run.
   * If the pool is empty, returns empty (game falls back to normal enemies).
   */
  selectForRun(count: number): EnemyNftEntry[] {
    if (this.pool.length === 0) return [];
    const shuffled = [...this.pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get the top killers sorted by kill_counter descending.
   */
  getTopKillers(limit: number): EnemyNftEntry[] {
    return [...this.pool]
      .sort((a, b) => b.killCounter - a.killCounter)
      .slice(0, limit);
  }

  /**
   * Fetch all active EnemyAssetAccount PDAs from on-chain.
   */
  async refresh(): Promise<void> {
    try {
      // EnemyAssetAccount discriminator (first 8 bytes of sha256("account:EnemyAssetAccount"))
      const discriminator = await this.getDiscriminator('EnemyAssetAccount');

      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          { memcmp: { offset: 0, bytes: discriminator } },
          // is_active = true at offset 8 + 32 + 32 + 8 + 32 + 8 = 120
          { memcmp: { offset: 120, bytes: '2' } }, // base58 for [1] (true)
        ],
      });

      this.pool = accounts.map((acc) => {
        const data = acc.account.data;
        // Skip 8-byte discriminator
        const mint = new PublicKey(data.subarray(8, 40)).toBase58();
        const depositor = new PublicKey(data.subarray(40, 72)).toBase58();
        // deposited_at at 72..80
        const collection = new PublicKey(data.subarray(80, 112)).toBase58();
        // kill_counter at 112..120 (little-endian u64)
        const killCounter = Number(data.readBigUInt64LE(112));

        return {
          mint,
          depositor,
          collection,
          killCounter,
          name: `NFT ${mint.slice(0, 6)}`,
          image: '',
          enemyType: this.mintToEnemyType(mint),
        };
      });

      console.log(`[EnemyPoolService] Loaded ${this.pool.length} enemies from on-chain`);
    } catch (err) {
      console.error('[EnemyPoolService] Failed to fetch enemy pool', err);
    }
  }

  /**
   * Maps a mint to an enemy type.
   * Uses the override table for known devnet NFTs, falls back to hash.
   */
  mintToEnemyType(mint: string): EnemyType {
    if (MINT_TYPE_OVERRIDES[mint]) return MINT_TYPE_OVERRIDES[mint];

    let hash = 0;
    for (let i = 0; i < mint.length; i++) {
      hash = ((hash << 5) - hash + mint.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % ENEMY_TYPES.length;
    return ENEMY_TYPES[idx];
  }

  /**
   * Compute Anchor account discriminator (first 8 bytes of sha256("account:<Name>")).
   * Returns a base58-encoded string for use in memcmp filters.
   */
  private async getDiscriminator(name: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`account:${name}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(hashBuffer).slice(0, 8);
    // Convert to base58 for memcmp
    return this.toBase58(bytes);
  }

  private toBase58(bytes: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt(0);
    for (const b of bytes) {
      num = num * 256n + BigInt(b);
    }
    let str = '';
    while (num > 0n) {
      str = ALPHABET[Number(num % 58n)] + str;
      num = num / 58n;
    }
    // Leading zeros
    for (const b of bytes) {
      if (b === 0) str = '1' + str;
      else break;
    }
    return str || '1';
  }
}
