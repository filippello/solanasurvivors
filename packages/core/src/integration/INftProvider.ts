export interface NftAsset {
  id: string;            // mint address
  name: string;
  image: string;         // URI
  collection: string;    // collection address
  standard: 'NonFungible' | 'ProgrammableNonFungible' | 'other';
}

export interface INftProvider {
  getOwnedNfts(wallet: string): Promise<NftAsset[]>;
}
