import type { IWalletAdapter, IAssetRegistry, ISacrificeGate } from '@solanasurvivors/core';
import type { RunResult } from '@solanasurvivors/shared';

export class DummyWalletAdapter implements IWalletAdapter {
  async connect(): Promise<string | null> {
    console.log('[DummyWallet] connect() called - no-op');
    return null;
  }

  async disconnect(): Promise<void> {
    console.log('[DummyWallet] disconnect() called - no-op');
  }

  getAddress(): string | null {
    return null;
  }

  isConnected(): boolean {
    return false;
  }

  async signAndSendTransaction(_tx: Uint8Array): Promise<string> {
    console.log('[DummyWallet] signAndSendTransaction() called - no-op');
    return '';
  }

  async signTransaction(_tx: Uint8Array): Promise<Uint8Array> {
    console.log('[DummyWallet] signTransaction() called - no-op');
    return new Uint8Array();
  }
}

export class DummyAssetRegistry implements IAssetRegistry {
  async getOwnedSkins(): Promise<string[]> {
    return ['default'];
  }

  getActiveSkin(): string | null {
    return 'default';
  }

  setActiveSkin(_skinId: string): void {
    // no-op
  }
}

export class DummySacrificeGate implements ISacrificeGate {
  async canStartRun(): Promise<boolean> {
    return true;
  }

  async submitRunResult(_result: RunResult): Promise<void> {
    console.log('[DummySacrificeGate] Run result submitted (no-op)');
  }
}
