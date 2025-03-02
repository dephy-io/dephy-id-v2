use anchor_lang::prelude::*;

use crate::PRODUCT_SEED_PREFIX;

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CreateProductArgs {
    pub name: String,
    pub uri: String,
}

#[derive(Accounts)]
#[instruction(args: CreateProductArgs)]
pub struct CreateProduct<'info> {
    pub vendor: Signer<'info>,
    /// CHECK:
    #[account(mut, seeds = [PRODUCT_SEED_PREFIX, vendor.key().as_ref(), args.name.as_ref()], bump)]
    pub product_asset: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK:
    #[account(address = mpl_core::ID)]
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
        b"DePHY_ID-PRODUCT",
        ctx.accounts.vendor.key().as_ref(),
        args.name.as_ref(),
        &[ctx.bumps.product_asset],
    ]])?;

    Ok(())
}
