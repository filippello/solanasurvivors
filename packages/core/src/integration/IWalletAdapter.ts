export interface IWalletAdapter {
  connect(): Promise<string | null>;
  disconnect(): Promise<void>;
  getAddress(): string | null;
  isConnected(): boolean;
  signAndSendTransaction(tx: Uint8Array): Promise<string>;
  signTransaction(tx: Uint8Array): Promise<Uint8Array>;
}
