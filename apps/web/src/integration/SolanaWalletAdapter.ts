import type { IWalletAdapter } from '@solanasurvivors/core';
import {
  Connection,
  Transaction,
  PublicKey,
} from '@solana/web3.js';

/**
 * Wraps a browser-extension wallet (Phantom / Solflare) that exposes the
 * standard `window.solana` or adapter interface.
 */
export class SolanaWalletAdapter implements IWalletAdapter {
  private connection: Connection;
  private publicKey: PublicKey | null = null;
  private provider: any = null;

  constructor() {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  getConnection(): Connection {
    return this.connection;
  }

  getPublicKey(): PublicKey | null {
    return this.publicKey;
  }

  // ---------- IWalletAdapter ----------

  /**
   * Try to silently reconnect if the user previously approved this site.
   * Call this once at startup — it will NOT show a popup.
   */
  async tryReconnect(): Promise<string | null> {
    try {
      const provider = this.detectProvider();
      if (!provider) return null;

      // { onlyIfTrusted: true } = no popup, only reconnect if already authorized
      const resp = await provider.connect({ onlyIfTrusted: true });
      const pk = resp?.publicKey ?? provider.publicKey;
      if (!pk) return null;

      this.provider = provider;
      this.publicKey = new PublicKey(pk.toString());
      this.listenForDisconnect();
      console.log('[SolanaWallet] Auto-reconnected:', this.publicKey.toBase58());
      return this.publicKey.toBase58();
    } catch {
      // User hasn't approved this site yet — that's fine
      return null;
    }
  }

  async connect(): Promise<string | null> {
    try {
      const provider = this.detectProvider();
      if (!provider) {
        console.warn('[SolanaWallet] No wallet provider detected');
        return null;
      }

      this.provider = provider;
      const resp = await provider.connect();
      // Phantom returns publicKey in the response OR on the provider itself
      const pk = resp?.publicKey ?? provider.publicKey;
      if (!pk) return null;

      this.publicKey = new PublicKey(pk.toString());
      this.listenForDisconnect();
      console.log('[SolanaWallet] Connected:', this.publicKey.toBase58());
      return this.publicKey.toBase58();
    } catch (err) {
      console.error('[SolanaWallet] connect failed', err);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.provider?.disconnect) {
        await this.provider.disconnect();
      }
    } catch { /* ignore */ }
    this.publicKey = null;
    this.provider = null;
  }

  getAddress(): string | null {
    return this.publicKey?.toBase58() ?? null;
  }

  isConnected(): boolean {
    return this.publicKey != null && this.provider?.isConnected === true;
  }

  async signAndSendTransaction(txBytes: Uint8Array): Promise<string> {
    if (!this.provider) throw new Error('Wallet not connected');
    const tx = Transaction.from(txBytes);
    const signed = await this.provider.signTransaction(tx);
    const sig = await this.connection.sendRawTransaction(signed.serialize());
    await this.connection.confirmTransaction(sig, 'confirmed');
    return sig;
  }

  async signTransaction(txBytes: Uint8Array): Promise<Uint8Array> {
    if (!this.provider) throw new Error('Wallet not connected');
    const tx = Transaction.from(txBytes);
    const signed = await this.provider.signTransaction(tx);
    return signed.serialize();
  }

  // ---------- Internals ----------

  private detectProvider(): any {
    const win = window as any;
    if (win.phantom?.solana?.isPhantom) return win.phantom.solana;
    if (win.solflare?.isSolflare) return win.solflare;
    if (win.solana?.isPhantom) return win.solana;
    return null;
  }

  /**
   * Listen for the wallet extension disconnecting (e.g. user revokes from Phantom).
   */
  private listenForDisconnect(): void {
    if (!this.provider) return;
    this.provider.on?.('disconnect', () => {
      console.log('[SolanaWallet] Wallet disconnected externally');
      this.publicKey = null;
      this.provider = null;
    });
  }
}
