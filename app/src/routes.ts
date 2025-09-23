import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index('routes/home.tsx'),
  route('account/:address', 'routes/account-detail.tsx'),
  route('account', 'routes/account-index.tsx'),
  route('dephy-id/:product/:device', 'routes/device-detail.tsx'),
  route('dephy-id/:product', 'routes/product-detail.tsx'),
  route('dephy-id', 'routes/dephy-id-index.tsx'),
  route('stake-pool/:address', 'routes/stake-pool-detail.tsx'),
  route('stake-pool', 'routes/stake-pool-index.tsx'),
  route('dev-tools', 'routes/dev-tools.tsx'),
  route('dodp-tools', 'routes/dodp-tools.tsx'),
  route('nft-stake/:address', 'routes/nft-stake-detail.tsx'),
  route('user-stake/:address', 'routes/user-stake-detail.tsx'),
  route('user-stakes-for-user/:address', 'routes/user-stakes-for-user.tsx'),
  route('nft-stakes-for-user/:address', 'routes/nft-stakes-for-user.tsx'),
  route('nft-stake-manager', 'routes/nft-stake-manager.tsx'),
] satisfies RouteConfig;
