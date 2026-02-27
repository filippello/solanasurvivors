/**
 * setup-devnet.ts
 *
 * Initializes the arena program on devnet, creates a test NFT collection,
 * mints 5 enemy NFTs, whitelists the collection, and deposits all NFTs.
 *
 * Run: cd scripts && npm install && npx tsx setup-devnet.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
  createNft,
  verifySizedCollectionItem,
  findMasterEditionPda,
  findMetadataPda,
  TokenStandard,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
} from "@metaplex-foundation/umi";
import { toWeb3JsPublicKey, fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRAM_ID = new PublicKey("8WUCDRofKewY1oGh93eGa1dpacVjYV1LGgbZZN5JKkS4");
const MPL_TOKEN_METADATA_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const RPC_URL = "https://api.devnet.solana.com";

const ENEMY_NAMES = [
  "Skull Wraith",
  "Bone Golem",
  "Shadow Imp",
  "Crystal Spider",
  "Void Serpent",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadKeypair(filePath: string): Keypair {
  const resolved = filePath.replace("~", process.env.HOME!);
  const secret = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function findPda(seeds: (Buffer | Uint8Array)[], programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

function getMetadataPda(mint: PublicKey): PublicKey {
  return findPda(
    [Buffer.from("metadata"), MPL_TOKEN_METADATA_ID.toBuffer(), mint.toBuffer()],
    MPL_TOKEN_METADATA_ID
  );
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function confirmTx(connection: Connection, sig: string) {
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ signature: sig, ...latestBlockhash }, "confirmed");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Solana Survivors: Devnet Setup ===\n");

  // Load wallet
  const payer = loadKeypair("~/.config/solana/payer.json");
  console.log("Payer:", payer.publicKey.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");
  const balance = await connection.getBalance(payer.publicKey);
  console.log("Balance:", (balance / 1e9).toFixed(4), "SOL\n");

  // Load IDL
  const idlPath = path.join(__dirname, "..", "idl", "arena.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  // Setup Anchor provider + program
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);
  const program = new anchor.Program(idl, provider);

  // Derive PDAs
  const [arenaConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("arena_config")],
    PROGRAM_ID
  );
  const [arenaVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("arena_vault")],
    PROGRAM_ID
  );

  // -----------------------------------------------------------------------
  // Step 1: init_arena (idempotent)
  // -----------------------------------------------------------------------
  console.log("--- Step 1: init_arena ---");
  const arenaConfigInfo = await connection.getAccountInfo(arenaConfig);
  if (arenaConfigInfo) {
    console.log("ArenaConfig already exists, skipping init_arena.");
  } else {
    const tx = await program.methods
      .initArena()
      .accounts({
        admin: payer.publicKey,
        arenaConfig,
        arenaVault,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();
    await confirmTx(connection, tx);
    console.log("init_arena tx:", tx);
  }
  console.log("ArenaConfig PDA:", arenaConfig.toBase58());
  console.log("ArenaVault PDA:", arenaVault.toBase58());
  console.log();

  // -----------------------------------------------------------------------
  // Step 2: Create Collection NFT (Metaplex UMI)
  // -----------------------------------------------------------------------
  console.log("--- Step 2: Create Collection NFT ---");

  const umi = createUmi(RPC_URL);
  umi.use(mplToolbox());
  umi.use(mplTokenMetadata());
  const umiKeypair = fromWeb3JsKeypair(payer);
  umi.use(keypairIdentity(umiKeypair));

  const collectionMint = generateSigner(umi);
  await createNft(umi, {
    mint: collectionMint,
    name: "Solana Survivors Enemies",
    symbol: "SSE",
    uri: "https://arweave.net/placeholder-collection",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  }).sendAndConfirm(umi);

  const collectionPubkey = toWeb3JsPublicKey(collectionMint.publicKey);
  console.log("Collection Mint:", collectionPubkey.toBase58());
  console.log();

  // -----------------------------------------------------------------------
  // Step 3: Mint 5 NFTs with verified collection
  // -----------------------------------------------------------------------
  console.log("--- Step 3: Mint 5 enemy NFTs ---");

  const nftMints: PublicKey[] = [];

  for (let i = 0; i < ENEMY_NAMES.length; i++) {
    const nftMint = generateSigner(umi);
    const name = ENEMY_NAMES[i];
    console.log(`  Minting "${name}"...`);

    // Create NFT (creates mint + metadata + master edition + token account)
    const createSig = await createNft(umi, {
      mint: nftMint,
      name,
      symbol: "SSE",
      uri: `https://arweave.net/placeholder-enemy-${i}`,
      sellerFeeBasisPoints: percentAmount(0),
      collection: { key: collectionMint.publicKey, verified: false },
    }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

    // Verify collection (sized collection V1 path)
    await verifySizedCollectionItem(umi, {
      metadata: findMetadataPda(umi, { mint: nftMint.publicKey }),
      collectionAuthority: umi.identity,
      collectionMint: collectionMint.publicKey,
      collection: findMetadataPda(umi, { mint: collectionMint.publicKey }),
      collectionMasterEditionAccount: findMasterEditionPda(umi, { mint: collectionMint.publicKey }),
    }).sendAndConfirm(umi);

    const web3Pubkey = toWeb3JsPublicKey(nftMint.publicKey);
    nftMints.push(web3Pubkey);
    console.log(`    Mint: ${web3Pubkey.toBase58()} [verified]`);

    // Small delay to avoid rate limits
    if (i < ENEMY_NAMES.length - 1) await sleep(500);
  }
  console.log();

  // -----------------------------------------------------------------------
  // Step 4: set_whitelist
  // -----------------------------------------------------------------------
  console.log("--- Step 4: set_whitelist ---");

  const tx2 = await program.methods
    .setWhitelist([collectionPubkey])
    .accounts({
      admin: payer.publicKey,
      arenaConfig,
    })
    .signers([payer])
    .rpc();
  await confirmTx(connection, tx2);
  console.log("set_whitelist tx:", tx2);
  console.log();

  // -----------------------------------------------------------------------
  // Step 5: deposit_nft × 5
  // -----------------------------------------------------------------------
  console.log("--- Step 5: Deposit 5 NFTs ---");

  for (let i = 0; i < nftMints.length; i++) {
    const mint = nftMints[i];
    const name = ENEMY_NAMES[i];
    console.log(`  Depositing "${name}" (${mint.toBase58()})...`);

    const userAta = getAssociatedTokenAddressSync(mint, payer.publicKey);
    const vaultAta = getAssociatedTokenAddressSync(mint, arenaVault, true);
    const metadata = getMetadataPda(mint);
    const [enemyAsset] = PublicKey.findProgramAddressSync(
      [Buffer.from("enemy_asset"), mint.toBuffer()],
      PROGRAM_ID
    );

    const tx = await program.methods
      .depositNft()
      .accounts({
        user: payer.publicKey,
        mint,
        userAta,
        vaultAta,
        metadata,
        arenaConfig,
        arenaVault,
        enemyAsset,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();
    await confirmTx(connection, tx);
    console.log(`    deposit_nft tx: ${tx}`);
    console.log(`    EnemyAsset PDA: ${enemyAsset.toBase58()}`);

    if (i < nftMints.length - 1) await sleep(500);
  }
  console.log();

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log("=== Setup Complete ===\n");
  console.log("Collection Mint:", collectionPubkey.toBase58());
  console.log("NFT Mints:");
  nftMints.forEach((m, i) => console.log(`  ${ENEMY_NAMES[i]}: ${m.toBase58()}`));
  console.log();
  console.log(
    "Update WHITELISTED_COLLECTIONS in apps/web/src/integration/GameServices.ts:"
  );
  console.log(`  "${collectionPubkey.toBase58()}"`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main().catch((err) => {
  console.error("\nSetup failed:", err);
  process.exit(1);
});
