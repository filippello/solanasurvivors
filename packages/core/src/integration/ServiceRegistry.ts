import type { IWalletAdapter } from './IWalletAdapter';
import type { INftProvider } from './INftProvider';

export interface IServiceRegistry {
  wallet: IWalletAdapter;
  nftProvider: INftProvider;
}
