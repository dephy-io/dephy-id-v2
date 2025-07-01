use anchor_lang::prelude::*;

use crate::{error::ErrorCode, ProductAccount, DEVICE_SEED_PREFIX};

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CreateDeviceArgs {
    pub seed: [u8; 32],
    pub name: String,
    pub uri: String,
    pub expiry: Option<u64>,
}

#[derive(Accounts)]
#[instruction(args: CreateDeviceArgs)]
pub struct CreateDevice<'info> {
    /// The authority of the product
    #[account()]
    pub mint_authority: Signer<'info>,
    /// CHECK: the address is checked in the instruction handler
    #[account(mut, owner = mpl_core::ID @ ErrorCode::InvalidMplCoreProgram)]
    pub product_asset: UncheckedAccount<'info>,
    #[account(seeds = [product_asset.key().as_ref()], bump)]
    pub product_account: Account<'info, ProductAccount>,
    /// This will be created by mpl-core as an asset of the product
    #[account(mut, seeds = [DEVICE_SEED_PREFIX, product_asset.key().as_ref(), &args.seed], bump)]
    pub device_asset: SystemAccount<'info>,
    /// CHECK: The owner of the device asset don't need to sign
    pub owner: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: The mpl-core program address
    #[account(address = mpl_core::ID @ ErrorCode::InvalidMplCoreProgram)]
    pub mpl_core: UncheckedAccount<'info>,
}

pub fn handle_create_device(ctx: Context<CreateDevice>, args: CreateDeviceArgs) -> Result<()> {
    {
        let product_account = &ctx.accounts.product_account;
        if product_account.mint_authority != ctx.accounts.mint_authority.key() {
            return Err(ErrorCode::InvalidAuthority.into());
        }

        if product_account.collection != ctx.accounts.product_asset.key() {
            return Err(ErrorCode::ProductAddressMismatch.into());
        }
    }

    if let Some(expiry) = args.expiry {
        let clock = Clock::get()?;
        if clock.unix_timestamp as u64 > expiry {
            return Err(ErrorCode::TransactionExpired.into());
        }
    }

    let attributes = {
        let device_seed = Pubkey::new_from_array(args.seed);
        vec![mpl_core::types::Attribute {
            key: "Seed".to_string(),
            value: device_seed.to_string(),
        }]
    };

    mpl_core::instructions::CreateV2Cpi::new(
        &ctx.accounts.mpl_core,
        mpl_core::instructions::CreateV2CpiAccounts {
            payer: &ctx.accounts.payer,
            system_program: &ctx.accounts.system_program,
            asset: &ctx.accounts.device_asset,
            collection: Some(&ctx.accounts.product_asset),
            authority: Some(&ctx.accounts.product_account.to_account_info()),
            owner: Some(&ctx.accounts.owner),
            update_authority: None,
            log_wrapper: None,
        },
        mpl_core::instructions::CreateV2InstructionArgs {
            data_state: mpl_core::types::DataState::AccountState,
            name: args.name,
            uri: args.uri,
            plugins: Some(vec![mpl_core::types::PluginAuthorityPair {
                plugin: mpl_core::types::Plugin::Attributes(mpl_core::types::Attributes {
                    attribute_list: attributes,
                }),
                authority: Some(mpl_core::types::PluginAuthority::UpdateAuthority),
            }]),
            external_plugin_adapters: None,
        },
    )
    .invoke_signed(&[
        &[
            DEVICE_SEED_PREFIX,
            ctx.accounts.product_asset.key().as_ref(),
            args.seed.as_ref(),
            &[ctx.bumps.device_asset],
        ],
        &[
            ctx.accounts.product_asset.key().as_ref(),
            &[ctx.bumps.product_account],
        ],
    ])?;

    mpl_core::instructions::WriteExternalPluginAdapterDataV1Cpi::new(
        &ctx.accounts.mpl_core,
        mpl_core::instructions::WriteExternalPluginAdapterDataV1CpiAccounts {
            asset: &ctx.accounts.device_asset,
            collection: Some(&ctx.accounts.product_asset),
            payer: &ctx.accounts.payer,
            authority: Some(&ctx.accounts.product_account.to_account_info()),
            buffer: None,
            system_program: &ctx.accounts.system_program,
            log_wrapper: None,
        },
        mpl_core::instructions::WriteExternalPluginAdapterDataV1InstructionArgs {
            key: mpl_core::types::ExternalPluginAdapterKey::LinkedAppData(
                mpl_core::types::PluginAuthority::UpdateAuthority,
            ),
            data: Some(args.seed.to_vec()),
        },
    )
    .invoke_signed(&[&[
        ctx.accounts.product_asset.key().as_ref(),
        &[ctx.bumps.product_account],
    ]])?;

    Ok(())
}
