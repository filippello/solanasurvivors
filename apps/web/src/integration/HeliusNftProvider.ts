import type { INftProvider, NftAsset } from '@solanasurvivors/core';

const CACHE_TTL_MS = 60_000;

/**
 * Fetches a wallet's NFTs via the Helius DAS (Digital Asset Standard) API.
 * Falls back to a no-op if no API key is configured.
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
