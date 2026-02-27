/**
 * mint-demo-nfts.ts
 *
 * Mints 3 new NFTs into the payer wallet (NOT deposited) so they can be
 * sacrificed via the UI for the demo video.
 *
 * Uses the EXISTING collection: DmAgbcrmyAYkEYyg5NNkDMQyC8Zuaruv6JcAnVUaviny
 *
 * Run: cd scripts && npx tsx mint-demo-nfts.ts
 *
 * After running, copy the printed mint addresses into
 *   apps/web/src/integration/HeliusNftProvider.ts  →  DEVNET_DEMO_NFTS
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import {
  createNft,
  verifySizedCollectionItem,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";
import { toWeb3JsPublicKey, fromWeb3JsKeypair } from "@metaplex-foundation/umi-web3js-adapters";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RPC_URL = "https://api.devnet.solana.com";
const EXISTING_COLLECTION = "DmAgbcrmyAYkEYyg5NNkDMQyC8Zuaruv6JcAnVUaviny";

// These names + images match the local assets in apps/web/public/assets/enemies/
const DEMO_NFTS = [
  { name: "Fire Monkey",    image: "monkey1.png",  type: "boss"    },
  { name: "Neon Serpent",    image: "tank.png",     type: "tank"    },
  { name: "Phantom Swarm",   image: "ranged.png",   type: "ranged"  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadKeypair(filePath: string): Keypair {
  const resolved = filePath.replace("~", process.env.HOME!);
  const secret = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Mint Demo NFTs for Sacrifice Flow ===\n");

  const payer = loadKeypair("~/.config/solana/payer.json");
  console.log("Payer:", payer.publicKey.toBase58());

  const connection = new Connection(RPC_URL, "confirmed");
  const balance = await connection.getBalance(payer.publicKey);
  console.log("Balance:", (balance / 1e9).toFixed(4), "SOL\n");

  // Setup UMI
  const umi = createUmi(RPC_URL);
  umi.use(mplToolbox());
  umi.use(mplTokenMetadata());
  umi.use(keypairIdentity(fromWeb3JsKeypair(payer)));

  const collectionMintUmi = umiPublicKey(EXISTING_COLLECTION);

  const mintAddresses: string[] = [];

  for (let i = 0; i < DEMO_NFTS.length; i++) {
    const { name, image, type } = DEMO_NFTS[i];
    console.log(`Minting "${name}" (${type}, ${image})...`);

    const nftMint = generateSigner(umi);

    // Create NFT in the existing collection (unverified initially)
    await createNft(umi, {
      mint: nftMint,
      name,
      symbol: "SSE",
      uri: `https://arweave.net/placeholder-demo-${i}`,
      sellerFeeBasisPoints: percentAmount(0),
      collection: { key: collectionMintUmi, verified: false },
    }).sendAndConfirm(umi, { confirm: { commitment: "finalized" } });

    // Verify collection membership
    await verifySizedCollectionItem(umi, {
      metadata: findMetadataPda(umi, { mint: nftMint.publicKey }),
      collectionAuthority: umi.identity,
      collectionMint: collectionMintUmi,
      collection: findMetadataPda(umi, { mint: collectionMintUmi }),
      collectionMasterEditionAccount: findMasterEditionPda(umi, { mint: collectionMintUmi }),
    }).sendAndConfirm(umi);

    const addr = toWeb3JsPublicKey(nftMint.publicKey).toBase58();
    mintAddresses.push(addr);
    console.log(`  ✓ Mint: ${addr}\n`);

    if (i < DEMO_NFTS.length - 1) await sleep(1000);
  }

  // Print the config block to paste into HeliusNftProvider.ts
  console.log("=== Done! ===\n");
  console.log("Paste this into HeliusNftProvider.ts → DEVNET_DEMO_NFTS:\n");
  console.log("const DEVNET_DEMO_NFTS: NftAsset[] = [");
  mintAddresses.forEach((addr, i) => {
    const { name, image } = DEMO_NFTS[i];
    console.log(`  {`);
    console.log(`    id: '${addr}',`);
    console.log(`    name: '${name}',`);
    console.log(`    image: '/assets/enemies/${image}',`);
    console.log(`    collection: '${EXISTING_COLLECTION}',`);
    console.log(`    standard: 'NonFungible' as const,`);
    console.log(`  },`);
  });
  console.log("];");

  console.log("\nAlso add to EnemyPoolService.ts → MINT_TYPE_OVERRIDES:\n");
  mintAddresses.forEach((addr, i) => {
    const { name, type } = DEMO_NFTS[i];
    console.log(`  '${addr}': '${type}',  // ${name}`);
  });
}

main().catch((err) => {
  console.error("\nMint failed:", err);
  process.exit(1);
});
