import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Solana dapp Home" },
    { name: "description", content: "Solana dapp template" },
  ];
}

export default function Home() {
  return (
    <div>
      <h1>Welcome</h1>
    </div>
  );
}
