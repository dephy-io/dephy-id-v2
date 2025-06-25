use anchor_lang::prelude::*;

use crate::{error::ErrorCode, ProductAccount, PRODUCT_SEED_PREFIX};

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
    /// This will be created by mpl-core as a collection
    #[account(mut, seeds = [PRODUCT_SEED_PREFIX, vendor.key().as_ref(), args.name.as_ref()], bump)]
    pub product_asset: SystemAccount<'info>,
    #[account(init, payer = payer, space = 8 + ProductAccount::INIT_SPACE, seeds = [product_asset.key().as_ref()], bump)]
    pub product_account: Account<'info, ProductAccount>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: The mint authority of the product, defaults to vendor
    pub mint_authority: Option<UncheckedAccount<'info>>,
    pub system_program: Program<'info, System>,
    /// CHECK: The mpl-core program address
    #[account(address = mpl_core::ID @ ErrorCode::InvalidMplCoreProgram)]
    pub mpl_core: UncheckedAccount<'info>,
}

pub fn handle_create_product(ctx: Context<CreateProduct>, args: CreateProductArgs) -> Result<()> {
    let mint_authority = ctx
        .accounts
        .mint_authority
        .as_ref()
        .map(|account| account.key())
        .unwrap_or(ctx.accounts.vendor.key());

    mpl_core::instructions::CreateCollectionV2Cpi::new(
        &ctx.accounts.mpl_core,
        mpl_core::instructions::CreateCollectionV2CpiAccounts {
            collection: &ctx.accounts.product_asset,
            update_authority: Some(&ctx.accounts.product_account.to_account_info()),
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
            authority: Some(&ctx.accounts.product_account.to_account_info()),
            buffer: None,
            system_program: &ctx.accounts.system_program,
            log_wrapper: None,
        },
        mpl_core::instructions::WriteCollectionExternalPluginAdapterDataV1InstructionArgs {
            key: mpl_core::types::ExternalPluginAdapterKey::AppData(
                mpl_core::types::PluginAuthority::UpdateAuthority,
            ),
            data: Some(ctx.accounts.vendor.key.to_bytes().to_vec()),
        },
    )
    .invoke_signed(&[&[
        &ctx.accounts.product_asset.key().as_ref(),
        &[ctx.bumps.product_account],
    ]])?;

    let product_account = &mut ctx.accounts.product_account;
    product_account.vendor = ctx.accounts.vendor.key();
    product_account.collection = ctx.accounts.product_asset.key();
    product_account.mint_authority = mint_authority;

    Ok(())
}
