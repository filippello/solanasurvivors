import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import type { INftProvider, NftAsset } from '@solanasurvivors/core';

const CACHE_TTL_MS = 60_000;

/**
 * Hardcoded demo NFTs for devnet.
 *
 * After running `scripts/mint-demo-nfts.ts`, paste the output here.
 * The `image` paths point to local assets served by Vite.
 * Only NFTs that are still in the user's wallet (have a token balance) are shown.
 */
const DEVNET_DEMO_NFTS: NftAsset[] = [
  {
    id: 'BCGzRJjd8Zyt7HyhnEERYkZhiXvWwBY99KN6V2TkJu81',
    name: 'Fire Monkey',
    image: '/assets/enemies/monkey1.png',
    collection: 'DmAgbcrmyAYkEYyg5NNkDMQyC8Zuaruv6JcAnVUaviny',
    standard: 'NonFungible',
  },
  {
    id: '7F8TpbMpz8bSmM1HQtupvMdoCbWJLKhaZCB388Rk1Uu4',
    name: 'Neon Serpent',
    image: '/assets/enemies/tank.png',
    collection: 'DmAgbcrmyAYkEYyg5NNkDMQyC8Zuaruv6JcAnVUaviny',
    standard: 'NonFungible',
  },
  {
    id: '22mgzuS5A9UUchuSruum9PxtWNS6jzpsJV5KaNPKWVLX',
    name: 'Phantom Swarm',
    image: '/assets/enemies/ranged.png',
    collection: 'DmAgbcrmyAYkEYyg5NNkDMQyC8Zuaruv6JcAnVUaviny',
    standard: 'NonFungible',
  },
];

/**
 * Fetches a wallet's NFTs via the Helius DAS (Digital Asset Standard) API.
 * On devnet, uses hardcoded demo NFT list with on-chain ownership check.
 */
export class HeliusNftProvider implements INftProvider {
  private whitelistedCollections: Set<string>;
  private cache: Map<string, { ts: number; assets: NftAsset[] }> = new Map();

  constructor(whitelistedCollections: string[]) {
    this.whitelistedCollections = new Set(whitelistedCollections);
  }

  async getOwnedNfts(wallet: string): Promise<NftAsset[]> {
    // Check cache
    const cached = this.cache.get(wallet);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.assets;
    }

    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || '';
    const isDevnet = rpcUrl.includes('devnet');

    // On devnet, use hardcoded demo NFTs with on-chain ownership check
    if (isDevnet && DEVNET_DEMO_NFTS.length > 0) {
      const assets = await this.getDevnetOwnedNfts(wallet);
      this.cache.set(wallet, { ts: Date.now(), assets });
      return assets;
    }

    // Mainnet path: use Helius DAS API
    const apiKey = import.meta.env.VITE_HELIUS_API_KEY;
    if (!apiKey) {
      console.warn('[HeliusNftProvider] No VITE_HELIUS_API_KEY set — returning empty list');
      return [];
    }

    try {
      const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-assets',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: wallet,
            page: 1,
            limit: 100,
          },
        }),
      });

      const data = await response.json();
      const items: any[] = data?.result?.items ?? [];

      const assets: NftAsset[] = items
        .map((item: any): NftAsset | null => {
          const collection =
            item.grouping?.find((g: any) => g.group_key === 'collection')?.group_value ?? '';
          const standard = this.mapStandard(item.interface);

          if (standard !== 'NonFungible') return null;
          if (!this.whitelistedCollections.has(collection)) return null;

          return {
            id: item.id,
            name: item.content?.metadata?.name ?? 'Unknown',
            image: item.content?.links?.image ?? item.content?.files?.[0]?.uri ?? '',
            collection,
            standard,
          };
        })
        .filter((a): a is NftAsset => a !== null);

      this.cache.set(wallet, { ts: Date.now(), assets });
      return assets;
    } catch (err) {
      console.error('[HeliusNftProvider] Failed to fetch NFTs', err);
      return [];
    }
  }

  /**
   * Devnet path: check on-chain token accounts to see which hardcoded
   * demo NFTs the connected wallet still owns (balance > 0).
   */
  private async getDevnetOwnedNfts(wallet: string): Promise<NftAsset[]> {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    const owner = new PublicKey(wallet);

    const owned: NftAsset[] = [];

    for (const nft of DEVNET_DEMO_NFTS) {
      try {
        const mint = new PublicKey(nft.id);
        const ata = getAssociatedTokenAddressSync(mint, owner);
        const balance = await connection.getTokenAccountBalance(ata);
        if (Number(balance.value.amount) > 0) {
          owned.push(nft);
        }
      } catch {
        // ATA doesn't exist or error — user doesn't own this NFT
      }
    }

    console.log(`[HeliusNftProvider] Devnet: ${owned.length}/${DEVNET_DEMO_NFTS.length} demo NFTs owned by ${wallet.slice(0, 6)}...`);
    return owned;
  }

  private mapStandard(iface: string | undefined): NftAsset['standard'] {
    switch (iface) {
      case 'V1_NFT':
      case 'Custom': // legacy
        return 'NonFungible';
      case 'ProgrammableNFT':
        return 'ProgrammableNonFungible';
      default:
        return 'other';
    }
  }
}
