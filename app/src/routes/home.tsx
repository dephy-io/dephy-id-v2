import { Link } from "react-router";
import type { Route } from "./+types/home";
import { useWalletUi } from "@wallet-ui/react";
import { CommonCard as Card } from "~/components/common-ui"

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Solana dapp Home" },
    { name: "description", content: "Solana dapp template" },
  ];
}

export default function Home() {
  const { account } = useWalletUi()

  return (
    <div>
      <h1>Welcome</h1>

      {account && <Card title="Shortcuts">
        <Link to={`/user-stakes-for-user/${account.address}`}>My User Stakes</Link>
      </Card>}
    </div>
  );
}
