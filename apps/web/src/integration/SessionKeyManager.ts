import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import type { IWalletAdapter } from '@solanasurvivors/core';
import { SolanaWalletAdapter } from './SolanaWalletAdapter';

// MagicBlock Session Keys program
const SESSION_KEYS_PROGRAM_ID = new PublicKey('KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5');

// Instruction discriminators (from IDL / sha256)
const DISC_INIT_PLAYER = Buffer.from([114, 27, 219, 144, 50, 15, 228, 66]);
const DISC_RECORD_PLAYER_DEATH = Buffer.from([70, 213, 62, 250, 25, 119, 172, 161]);
// create_session discriminator: sha256("global:create_session")[0..8]
const DISC_CREATE_SESSION = Buffer.from([242, 193, 143, 179, 150, 25, 122, 227]);

// Session validity: 7 days (practical limit is ephemeral SOL balance)
const SESSION_VALIDITY_SECS = 7 * 24 * 60 * 60;
// SOL top-up for ephemeral keypair (pays gas for death txs)
const TOPUP_LAMPORTS = 0.01 * LAMPORTS_PER_SOL;

/**
 * Manages MagicBlock session keys for gasless `record_player_death` calls.
 *
 * Flow:
 * 1. `createSession()` — generates an ephemeral Keypair, inits PlayerAccount
 *    PDA if needed, creates a SessionToken on-chain. One wallet popup.
 * 2. `recordPlayerDeath()` — uses the ephemeral keypair to sign + send the
 *    death tx directly. Zero popups.
 * 3. `hasSession()` / `destroySession()` — check/clear local state.
 */
export class SessionKeyManager {
  private connection: Connection;
  private wallet: IWalletAdapter;
  private programId: PublicKey;

  // Ephemeral session state (in-memory only)
  private sessionKeypair: Keypair | null = null;
  private sessionValidUntil = 0; // unix seconds

  constructor(connection: Connection, wallet: IWalletAdapter, programId: string) {
    this.connection = connection;
    this.wallet = wallet;
    this.programId = new PublicKey(programId);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Create a session: generates ephemeral keypair, optionally inits
   * PlayerAccount, creates SessionToken on-chain.
   * Returns true on success. Shows ONE wallet popup.
   */
  async createSession(): Promise<boolean> {
    if (!this.wallet.isConnected()) return false;

    const walletAddr = this.wallet.getAddress();
    if (!walletAddr) return false;

    try {
      const walletPubkey = new PublicKey(walletAddr);

      // 1. Generate ephemeral keypair
      const ephemeral = Keypair.generate();

      // 2. Derive PDAs
      const [playerAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('player'), walletPubkey.toBuffer()],
        this.programId,
      );

      const validUntil = Math.floor(Date.now() / 1000) + SESSION_VALIDITY_SECS;

      const [sessionTokenPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('session_token'),
          this.programId.toBuffer(),
          ephemeral.publicKey.toBuffer(),
          walletPubkey.toBuffer(),
        ],
        SESSION_KEYS_PROGRAM_ID,
      );

      // 3. Build transaction
      const tx = new Transaction();

      // 3a. Check if PlayerAccount already exists
      const playerAccountInfo = await this.connection.getAccountInfo(playerAccountPda);
      if (!playerAccountInfo) {
        console.log('[SessionKeyManager] PlayerAccount not found — adding init_player ix');
        tx.add(this.buildInitPlayerIx(walletPubkey, playerAccountPda));
      }

      // 3b. Top-up ephemeral keypair so it can pay gas for death txs
      tx.add(
        SystemProgram.transfer({
          fromPubkey: walletPubkey,
          toPubkey: ephemeral.publicKey,
          lamports: TOPUP_LAMPORTS,
        }),
      );

      // 3c. create_session instruction (session program creates SessionToken PDA)
      tx.add(
        this.buildCreateSessionIx(
          walletPubkey,
          ephemeral.publicKey,
          sessionTokenPda,
          validUntil,
        ),
      );

      // 4. Set tx metadata
      tx.feePayer = walletPubkey;
      const { blockhash } = await this.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      // 5. Ephemeral keypair partial-signs
      tx.partialSign(ephemeral);

      // 6. Wallet signs and sends (1 popup)
      const solWallet = this.wallet as SolanaWalletAdapter;
      const sig = await solWallet.signAndSendTransaction(
        tx.serialize({ requireAllSignatures: false }),
      );

      console.log('[SessionKeyManager] Session created:', sig);
      console.log(`[SessionKeyManager] Ephemeral key: ${ephemeral.publicKey.toBase58()}`);
      console.log(`[SessionKeyManager] SessionToken PDA: ${sessionTokenPda.toBase58()}`);
      console.log(`[SessionKeyManager] Valid until: ${new Date(validUntil * 1000).toISOString()}`);

      // 7. Store state
      this.sessionKeypair = ephemeral;
      this.sessionValidUntil = validUntil;

      return true;
    } catch (err: any) {
      console.error('[SessionKeyManager] createSession failed:', err?.message || err);
      if (err?.logs) console.error('[SessionKeyManager] Logs:', err.logs);
      return false;
    }
  }

  /**
   * Returns true if we have a valid, non-expired session.
   */
  hasSession(): boolean {
    if (!this.sessionKeypair) return false;
    if (!this.wallet.isConnected()) return false;
    const now = Math.floor(Date.now() / 1000);
    return now < this.sessionValidUntil;
  }

  /**
   * Discard the ephemeral keypair (session is no longer usable).
   */
  destroySession(): void {
    this.sessionKeypair = null;
    this.sessionValidUntil = 0;
  }

  /**
   * Record a player death on-chain using the ephemeral session key.
   * Zero wallet popups — the ephemeral keypair signs directly.
   */
  async recordPlayerDeath(killerMint: string, runId: number): Promise<string | null> {
    if (!this.hasSession()) {
      console.warn('[SessionKeyManager] No active session — skipping record_player_death');
      return null;
    }

    const walletAddr = this.wallet.getAddress();
    if (!walletAddr) return null;

    const ephemeral = this.sessionKeypair!;

    try {
      const walletPubkey = new PublicKey(walletAddr);
      const mintPubkey = new PublicKey(killerMint);

      // Derive PDAs
      const [enemyAssetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('enemy_asset'), mintPubkey.toBuffer()],
        this.programId,
      );

      const [playerAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('player'), walletPubkey.toBuffer()],
        this.programId,
      );

      const [sessionTokenPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('session_token'),
          this.programId.toBuffer(),
          ephemeral.publicKey.toBuffer(),
          walletPubkey.toBuffer(),
        ],
        SESSION_KEYS_PROGRAM_ID,
      );

      console.log('[SessionKeyManager] record_player_death building tx:', {
        killerMint,
        runId,
        enemyAssetPda: enemyAssetPda.toBase58(),
        playerAccount: playerAccountPda.toBase58(),
        signer: ephemeral.publicKey.toBase58(),
        sessionToken: sessionTokenPda.toBase58(),
      });

      // Encode run_id as LE u64
      const runIdBuf = Buffer.alloc(8);
      runIdBuf.writeBigUInt64LE(BigInt(runId));

      const data = Buffer.concat([DISC_RECORD_PLAYER_DEATH, runIdBuf]);

      const ix = new TransactionInstruction({
        programId: this.programId,
        keys: [
          { pubkey: enemyAssetPda, isSigner: false, isWritable: true },
          { pubkey: playerAccountPda, isSigner: false, isWritable: false },
          { pubkey: ephemeral.publicKey, isSigner: true, isWritable: true },
          { pubkey: sessionTokenPda, isSigner: false, isWritable: false },
        ],
        data,
      });

      const tx = new Transaction().add(ix);
      tx.feePayer = ephemeral.publicKey;
      const { blockhash } = await this.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      // Ephemeral keypair signs — no wallet popup
      tx.sign(ephemeral);

      const sig = await this.connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
      });

      await this.connection.confirmTransaction(sig, 'confirmed');

      console.log('[SessionKeyManager] record_player_death confirmed:', sig);
      console.log(`[SessionKeyManager] View on explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
      return sig;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const logs = err?.logs || [];
      console.error('[SessionKeyManager] record_player_death failed:', errMsg);
      if (logs.length > 0) {
        console.error('[SessionKeyManager] Program logs:', logs);
      }
      if (errMsg.includes('custom program error')) {
        console.error('[SessionKeyManager] This is an Anchor program error. Check the error code against the IDL.');
      }
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Instruction builders
  // ---------------------------------------------------------------------------

  /**
   * Build `init_player` instruction.
   * Accounts: [signer (mut, signer), player_account (mut), system_program]
   */
  private buildInitPlayerIx(
    walletPubkey: PublicKey,
    playerAccountPda: PublicKey,
  ): TransactionInstruction {
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        { pubkey: walletPubkey, isSigner: true, isWritable: true },
        { pubkey: playerAccountPda, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: DISC_INIT_PLAYER,
    });
  }

  /**
   * Build `create_session` instruction (MagicBlock Session Keys program).
   *
   * Accounts (from source):
   *   0. session_token  (mut)         — PDA to create
   *   1. session_signer (mut, signer) — ephemeral pubkey
   *   2. authority      (mut, signer) — wallet that owns the session
   *   3. target_program (executable)  — program this session authorizes
   *   4. system_program
   *
   * Args (Borsh): Option<bool> top_up, Option<i64> valid_until, Option<u64> lamports
   */
  private buildCreateSessionIx(
    walletPubkey: PublicKey,
    ephemeralPubkey: PublicKey,
    sessionTokenPda: PublicKey,
    validUntil: number,
  ): TransactionInstruction {
    // Borsh encoding: discriminator(8) + Option<bool>(1+1) + Option<i64>(1+8) + Option<u64> = None(1)
    const buf = Buffer.alloc(8 + 2 + 9 + 1);
    let offset = 0;

    // Discriminator
    DISC_CREATE_SESSION.copy(buf, offset); offset += 8;

    // Option<bool> top_up = Some(false)  — we handle top-up via SystemProgram.transfer
    buf.writeUInt8(1, offset); offset += 1; // Some
    buf.writeUInt8(0, offset); offset += 1; // false

    // Option<i64> valid_until = Some(validUntil)
    buf.writeUInt8(1, offset); offset += 1; // Some
    buf.writeBigInt64LE(BigInt(validUntil), offset); offset += 8;

    // Option<u64> lamports = None
    buf.writeUInt8(0, offset); offset += 1; // None

    return new TransactionInstruction({
      programId: SESSION_KEYS_PROGRAM_ID,
      keys: [
        { pubkey: sessionTokenPda, isSigner: false, isWritable: true },
        { pubkey: ephemeralPubkey, isSigner: true, isWritable: true },
        { pubkey: walletPubkey, isSigner: true, isWritable: true },
        { pubkey: this.programId, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: buf,
    });
  }
}
