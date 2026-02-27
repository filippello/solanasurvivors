use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{transfer_checked, Mint, Token, TokenAccount, TransferChecked};
use session_keys::{session_auth_or, Session, SessionError, SessionToken};

declare_id!("8WUCDRofKewY1oGh93eGa1dpacVjYV1LGgbZZN5JKkS4");

/// Maximum number of whitelisted collections.
const MAX_COLLECTIONS: usize = 5;

/// Metaplex Token Metadata program ID.
pub const MPL_TOKEN_METADATA_ID: Pubkey =
    pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

/// MagicBlock Delegation program ID.
pub const DELEGATION_PROGRAM_ID: Pubkey =
    pubkey!("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

#[program]
pub mod arena {
    use super::*;

    /// Initialize the arena: creates ArenaConfig and ArenaVault PDAs.
    pub fn init_arena(ctx: Context<InitArena>) -> Result<()> {
        let config = &mut ctx.accounts.arena_config;
        config.admin = ctx.accounts.admin.key();
        config.whitelisted_collections = Vec::new();
        config.bump = ctx.bumps.arena_config;

        let vault = &mut ctx.accounts.arena_vault;
        vault.bump = ctx.bumps.arena_vault;

        Ok(())
    }

    /// Admin-only: overwrite the whitelist of accepted collection mints.
    pub fn set_whitelist(ctx: Context<SetWhitelist>, collections: Vec<Pubkey>) -> Result<()> {
        require!(
            collections.len() <= MAX_COLLECTIONS,
            ArenaError::TooManyCollections
        );
        let config = &mut ctx.accounts.arena_config;
        require!(
            config.admin == ctx.accounts.admin.key(),
            ArenaError::Unauthorized
        );
        config.whitelisted_collections = collections;
        Ok(())
    }

    /// Deposit a legacy Metaplex NonFungible NFT into the arena vault.
    pub fn deposit_nft(ctx: Context<DepositNft>) -> Result<()> {
        let mint = &ctx.accounts.mint;
        let user_ata = &ctx.accounts.user_ata;

        // 1. Verify NFT properties
        require!(user_ata.amount == 1, ArenaError::InvalidNftAmount);
        require!(mint.decimals == 0, ArenaError::InvalidNftDecimals);
        require!(mint.supply == 1, ArenaError::InvalidNftSupply);

        // 2. Deserialize and verify Metaplex metadata
        let metadata_info = &ctx.accounts.metadata;
        let metadata_data = metadata_info.try_borrow_data()?;

        // Verify PDA seeds: ["metadata", mpl_program, mint]
        let (expected_metadata_key, _bump) = Pubkey::find_program_address(
            &[
                b"metadata",
                MPL_TOKEN_METADATA_ID.as_ref(),
                mint.key().as_ref(),
            ],
            &MPL_TOKEN_METADATA_ID,
        );
        require!(
            metadata_info.key() == expected_metadata_key,
            ArenaError::InvalidMetadata
        );

        // Parse metadata: discriminator(1) + key(1) + update_authority(32) + mint(32) + name(36)
        // + symbol(14) + uri(204) + seller_fee(2) + creators option ...
        // token_standard is at a known offset after the variable-length fields.
        // For safety, we do a simplified check: look for the collection fields.
        //
        // Metaplex Metadata v1.1+ layout (after the 1-byte key):
        //   key: 1
        //   update_authority: 32
        //   mint: 32
        //   name: 4 + var (max 32)
        //   symbol: 4 + var (max 10)
        //   uri: 4 + var (max 200)
        //   seller_fee_basis_points: 2
        //   creators: Option<Vec<Creator>> -> 1 + (4 + n*34)
        //   collection: Option<Collection> -> 1 + (1 bool verified + 32 pubkey)
        //   uses: Option<Uses>
        //   token_standard: Option<u8>
        //
        // We parse collection using mpl_token_metadata deserialization.
        use mpl_token_metadata::accounts::Metadata;
        let metadata = Metadata::safe_deserialize(&metadata_data)
            .map_err(|_| ArenaError::InvalidMetadata)?;

        // 3. Check token standard: must be NonFungible (0), reject ProgrammableNonFungible (4)
        if let Some(standard) = metadata.token_standard {
            require!(
                standard == mpl_token_metadata::types::TokenStandard::NonFungible,
                ArenaError::InvalidTokenStandard
            );
        } else {
            // No token standard set — allow for older legacy NFTs
        }

        // 4. Check collection is verified
        let collection = metadata
            .collection
            .ok_or(ArenaError::NoCollection)?;
        require!(collection.verified, ArenaError::CollectionNotVerified);

        // 5. Check collection is whitelisted
        let config = &ctx.accounts.arena_config;
        require!(
            config
                .whitelisted_collections
                .contains(&collection.key),
            ArenaError::CollectionNotWhitelisted
        );

        // 6. Transfer NFT to vault ATA
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.user_ata.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        transfer_checked(CpiContext::new(cpi_program, cpi_accounts), 1, 0)?;

        // 7. Init EnemyAssetAccount
        let enemy = &mut ctx.accounts.enemy_asset;
        enemy.mint = mint.key();
        enemy.depositor = ctx.accounts.user.key();
        enemy.deposited_at = Clock::get()?.unix_timestamp;
        enemy.collection = collection.key;
        enemy.kill_counter = 0;
        enemy.is_active = true;
        enemy.bump = ctx.bumps.enemy_asset;

        Ok(())
    }

    /// Initialize a player account PDA (one-time, stores wallet authority).
    pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player_account;
        player.authority = ctx.accounts.signer.key();
        player.bump = ctx.bumps.player_account;
        Ok(())
    }

    /// Increment the kill counter for the enemy NFT that killed a player.
    /// Accepts either a session key or a direct wallet signer.
    #[session_auth_or(
        ctx.accounts.player_account.authority.key() == ctx.accounts.signer.key(),
        ArenaError::Unauthorized
    )]
    pub fn record_player_death(ctx: Context<RecordPlayerDeath>, _run_id: u64) -> Result<()> {
        let enemy = &mut ctx.accounts.enemy_asset;
        require!(enemy.is_active, ArenaError::EnemyNotActive);
        enemy.kill_counter = enemy.kill_counter.checked_add(1).unwrap();
        Ok(())
    }

    /// Delegate an EnemyAssetAccount to MagicBlock Ephemeral Rollups.
    pub fn delegate_enemy_asset(ctx: Context<DelegateEnemyAsset>) -> Result<()> {
        // CPI into MagicBlock Delegation Program
        let enemy_info = ctx.accounts.enemy_asset.to_account_info();
        let payer_info = ctx.accounts.payer.to_account_info();

        let seeds = &[
            b"enemy_asset",
            ctx.accounts.enemy_asset.mint.as_ref(),
            &[ctx.accounts.enemy_asset.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Build delegation CPI
        // The delegation program expects: account_to_delegate, owner_program, payer
        let ix = solana_program::instruction::Instruction {
            program_id: DELEGATION_PROGRAM_ID,
            accounts: vec![
                solana_program::instruction::AccountMeta::new(enemy_info.key(), false),
                solana_program::instruction::AccountMeta::new_readonly(crate::ID, false),
                solana_program::instruction::AccountMeta::new(payer_info.key(), true),
                solana_program::instruction::AccountMeta::new_readonly(
                    solana_program::system_program::ID,
                    false,
                ),
            ],
            data: vec![0], // delegate instruction discriminator
        };

        solana_program::program::invoke_signed(
            &ix,
            &[
                enemy_info,
                payer_info,
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;

        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitArena<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = ArenaConfig::SPACE,
        seeds = [b"arena_config"],
        bump
    )]
    pub arena_config: Account<'info, ArenaConfig>,

    #[account(
        init,
        payer = admin,
        space = ArenaVault::SPACE,
        seeds = [b"arena_vault"],
        bump
    )]
    pub arena_vault: Account<'info, ArenaVault>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetWhitelist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"arena_config"],
        bump = arena_config.bump,
        constraint = arena_config.admin == admin.key() @ ArenaError::Unauthorized
    )]
    pub arena_config: Account<'info, ArenaConfig>,
}

#[derive(Accounts)]
pub struct DepositNft<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = arena_vault,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    /// CHECK: Verified via PDA derivation in instruction logic.
    #[account(
        owner = MPL_TOKEN_METADATA_ID
    )]
    pub metadata: UncheckedAccount<'info>,

    #[account(
        seeds = [b"arena_config"],
        bump = arena_config.bump,
    )]
    pub arena_config: Account<'info, ArenaConfig>,

    #[account(
        seeds = [b"arena_vault"],
        bump = arena_vault.bump,
    )]
    pub arena_vault: Account<'info, ArenaVault>,

    #[account(
        init,
        payer = user,
        space = EnemyAssetAccount::SPACE,
        seeds = [b"enemy_asset", mint.key().as_ref()],
        bump
    )]
    pub enemy_asset: Account<'info, EnemyAssetAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitPlayer<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = PlayerAccount::SPACE,
        seeds = [b"player", signer.key().as_ref()],
        bump
    )]
    pub player_account: Account<'info, PlayerAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts, Session)]
pub struct RecordPlayerDeath<'info> {
    #[account(mut)]
    pub enemy_asset: Account<'info, EnemyAssetAccount>,

    #[account(
        seeds = [b"player", player_account.authority.as_ref()],
        bump = player_account.bump,
    )]
    pub player_account: Account<'info, PlayerAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[session(signer = signer, authority = player_account.authority.key())]
    pub session_token: Option<Account<'info, SessionToken>>,
}

#[derive(Accounts)]
pub struct DelegateEnemyAsset<'info> {
    #[account(
        mut,
        seeds = [b"enemy_asset", enemy_asset.mint.as_ref()],
        bump = enemy_asset.bump,
    )]
    pub enemy_asset: Account<'info, EnemyAssetAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: MagicBlock Delegation Program — validated by program ID.
    #[account(address = DELEGATION_PROGRAM_ID)]
    pub delegation_program: UncheckedAccount<'info>,
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[account]
pub struct ArenaConfig {
    pub admin: Pubkey,
    pub whitelisted_collections: Vec<Pubkey>,
    pub bump: u8,
}

impl ArenaConfig {
    /// 8 (discriminator) + 32 (admin) + 4 + 5*32 (vec) + 1 (bump)
    pub const SPACE: usize = 8 + 32 + (4 + MAX_COLLECTIONS * 32) + 1;
}

#[account]
pub struct ArenaVault {
    pub bump: u8,
}

impl ArenaVault {
    /// 8 (discriminator) + 1 (bump)
    pub const SPACE: usize = 8 + 1;
}

#[account]
pub struct PlayerAccount {
    pub authority: Pubkey, // wallet pubkey
    pub bump: u8,
}

impl PlayerAccount {
    /// 8 (discriminator) + 32 (authority) + 1 (bump)
    pub const SPACE: usize = 8 + 32 + 1;
}

#[account]
pub struct EnemyAssetAccount {
    pub mint: Pubkey,
    pub depositor: Pubkey,
    pub deposited_at: i64,
    pub collection: Pubkey,
    pub kill_counter: u64,
    pub is_active: bool,
    pub bump: u8,
}

impl EnemyAssetAccount {
    /// 8 + 32 + 32 + 8 + 32 + 8 + 1 + 1 = 122
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 32 + 8 + 1 + 1;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum ArenaError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Too many collections (max 5)")]
    TooManyCollections,
    #[msg("NFT amount must be 1")]
    InvalidNftAmount,
    #[msg("NFT decimals must be 0")]
    InvalidNftDecimals,
    #[msg("NFT supply must be 1")]
    InvalidNftSupply,
    #[msg("Invalid metadata account")]
    InvalidMetadata,
    #[msg("Token standard must be NonFungible")]
    InvalidTokenStandard,
    #[msg("NFT has no collection")]
    NoCollection,
    #[msg("Collection is not verified")]
    CollectionNotVerified,
    #[msg("Collection is not whitelisted")]
    CollectionNotWhitelisted,
    #[msg("Enemy is not active")]
    EnemyNotActive,
}
