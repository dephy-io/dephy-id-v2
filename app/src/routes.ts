import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index('routes/home.tsx'),
  route('account/:address', 'routes/account-detail.tsx'),
  route('account', 'routes/account-index.tsx'),
] satisfies RouteConfig;
