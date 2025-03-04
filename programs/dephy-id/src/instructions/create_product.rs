use anchor_lang::prelude::*;

use crate::{PRODUCT_SEED_PREFIX, error::ErrorCode};

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CreateProductArgs {
    pub name: String,
    pub uri: String,
}

#[derive(Accounts)]
#[instruction(args: CreateProductArgs)]
pub struct CreateProduct<'info> {
    /// The authority of the product
    pub vendor: Signer<'info>,
    /// CHECK: This will be created by mpl-core as a collection
    #[account(mut, seeds = [PRODUCT_SEED_PREFIX, vendor.key().as_ref(), args.name.as_ref()], bump)]
    pub product_asset: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: The mpl-core program address
    #[account(address = mpl_core::ID @ ErrorCode::InvalidMplCoreProgram)]
    pub mpl_core: UncheckedAccount<'info>,
}

pub fn handle_create_product(ctx: Context<CreateProduct>, args: CreateProductArgs) -> Result<()> {
    mpl_core::instructions::CreateCollectionV2Cpi::new(
        &ctx.accounts.mpl_core,
        mpl_core::instructions::CreateCollectionV2CpiAccounts {
            collection: &ctx.accounts.product_asset,
            update_authority: Some(&ctx.accounts.product_asset),
            payer: &ctx.accounts.payer,
            system_program: &ctx.accounts.system_program,
        },
        mpl_core::instructions::CreateCollectionV2InstructionArgs {
            name: args.name.clone(),
            uri: args.uri,
            plugins: None, // TODO: add plugins
            external_plugin_adapters: Some(vec![
                mpl_core::types::ExternalPluginAdapterInitInfo::AppData(
                    mpl_core::types::AppDataInitInfo {
                        data_authority: mpl_core::types::PluginAuthority::UpdateAuthority,
                        init_plugin_authority: None,
                        schema: Some(mpl_core::types::ExternalPluginAdapterSchema::Binary),
                    },
                ),
                mpl_core::types::ExternalPluginAdapterInitInfo::LinkedAppData(
                    mpl_core::types::LinkedAppDataInitInfo {
                        data_authority: mpl_core::types::PluginAuthority::UpdateAuthority,
                        init_plugin_authority: None,
                        schema: Some(mpl_core::types::ExternalPluginAdapterSchema::Binary),
                    },
                ),
            ]),
        },
    )
    .invoke_signed(&[&[
        PRODUCT_SEED_PREFIX,
        ctx.accounts.vendor.key().as_ref(),
        args.name.as_ref(),
        &[ctx.bumps.product_asset],
    ]])?;

    mpl_core::instructions::WriteCollectionExternalPluginAdapterDataV1Cpi::new(
        &ctx.accounts.mpl_core,
        mpl_core::instructions::WriteCollectionExternalPluginAdapterDataV1CpiAccounts {
            collection: &ctx.accounts.product_asset,
            payer: &ctx.accounts.payer,
            authority: Some(&ctx.accounts.product_asset),
            buffer: None,
            system_program: &ctx.accounts.system_program,
            log_wrapper: None,
        },
        mpl_core::instructions::WriteCollectionExternalPluginAdapterDataV1InstructionArgs {
            key: mpl_core::types::ExternalPluginAdapterKey::AppData(
                mpl_core::types::PluginAuthority::UpdateAuthority
            ),
            data: Some(ctx.accounts.vendor.key.to_bytes().to_vec()),
        },
    )
    .invoke_signed(&[
        &[
            PRODUCT_SEED_PREFIX,
            ctx.accounts.vendor.key().as_ref(),
            args.name.as_ref(),
            &[ctx.bumps.product_asset],
        ],
    ])?;

    Ok(())
}
