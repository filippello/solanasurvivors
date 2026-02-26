export interface IWalletAdapter {
    connect(): Promise<string | null>;
    disconnect(): Promise<void>;
    getAddress(): string | null;
    isConnected(): boolean;
}
//# sourceMappingURL=IWalletAdapter.d.ts.map