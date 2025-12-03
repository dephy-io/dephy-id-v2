import type { DasApiAssetInterface, DasApiAssetList, DasApiParamAssetSortBy, DisplayOptions, TokenType } from "@metaplex-foundation/digital-asset-standard-api";
import { createDefaultRpcTransport, createRpc, createJsonRpcApi, type ClusterUrl, type OptionOrNullable, type Address } from '@solana/kit';


type Pagination = {
  /**
   * Sorting criteria.
   */
  sortBy?: OptionOrNullable<DasApiParamAssetSortBy>;
  /**
   * The maximum number of assets to retrieve.
   */
  limit?: OptionOrNullable<number>;
  /**
   * The index of the `"page"` to retrieve. The first page has index `1`.
   */
  page?: OptionOrNullable<number>;
  /**
   * Retrieve assets before the specified `ID` value.
   */
  before?: OptionOrNullable<string>;
  /**
   * Retrieve assets after the specified `ID` value.
   */
  after?: OptionOrNullable<string>;
  /**
   *
   */
  cursor?: OptionOrNullable<string>;
};

export type SearchAssetsRpcInput = {
  /**
   * The address of the authority.
   */
  authority?: OptionOrNullable<Address>;
  /**
   * The address of the creator.
   */
  creator?: OptionOrNullable<Address>;
  /**
   * Indicates whether the creator must be verified or not.
   */
  creatorVerified?: OptionOrNullable<boolean>;
  /**
   * The grouping (`key`, `value`) pair.
   */
  grouping?: OptionOrNullable<[string, string]>;
  /**
   * The interface value of the asset.
   */
  interface?: OptionOrNullable<DasApiAssetInterface>;
  /**
   * Indicates whether the search criteria should be inverted or not.
   */
  negate?: OptionOrNullable<boolean>;
  /**
   * The name of the asset.
   */
  name?: OptionOrNullable<string>;
  /**
   * Indicates whether to retrieve all or any asset that matches the search criteria.
   */
  conditionType?: OptionOrNullable<'all' | 'any'>;
  /**
   * The address of the owner.
   */
  ownerAddress?: OptionOrNullable<Address>;
  /**
   * Type of ownership.
   */
  ownerType?: OptionOrNullable<'single' | 'token'>;
  /**
   * The address of the delegate.
   */
  delegate?: OptionOrNullable<Address>;
  /**
   * Indicates whether the asset is frozen or not.
   */
  frozen?: OptionOrNullable<boolean>;
  /**
   * The supply of the asset.
   */
  supply?: OptionOrNullable<number>;
  /**
   * The address of the supply mint.
   */
  supplyMint?: OptionOrNullable<Address>;
  /**
   * The type of token to search for.
   */
  tokenType?: OptionOrNullable<TokenType>;
  /**
   * Indicates whether the asset is compressed or not.
   */
  compressed?: OptionOrNullable<boolean>;
  /**
   * Indicates whether the asset is compressible or not.
   */
  compressible?: OptionOrNullable<boolean>;
  /**
   * Type of royalty.
   */
  royaltyModel?: OptionOrNullable<'creators' | 'fanout' | 'single'>;
  /**
   * The target address for royalties.
   */
  royaltyTarget?: OptionOrNullable<Address>;
  /**
   * The royalties amount.
   */
  royaltyAmount?: OptionOrNullable<number>;
  /**
   * Indicates whether the asset is burnt or not.
   */
  burnt?: OptionOrNullable<boolean>;
  /**
   * The value for the JSON URI.
   */
  jsonUri?: OptionOrNullable<string>;
  /**
   * Display options for the query
   */
  displayOptions?: DisplayOptions;
} & Pagination;

type JsonRpcResponse<T> = {
  jsonrpc: string;
  id: number | string;
  result: T;
}

export type DasApi = {
  searchAssets: (args: SearchAssetsRpcInput) => Promise<DasApiAssetList>;
}

const api = createJsonRpcApi<DasApi>({
  requestTransformer: ({ methodName, params }) => {
    return { methodName, params: (params as object[])[0] }
  },
  responseTransformer: (response) => {
    return (response as JsonRpcResponse<unknown>).result
  }
})

export function createDasRpc(url: ClusterUrl) {
  const transport = createDefaultRpcTransport({ url });

  return createRpc({ api, transport });
}
