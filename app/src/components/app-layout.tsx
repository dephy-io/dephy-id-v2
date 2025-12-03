import React from 'react'
import { createSolanaDevnet, createSolanaLocalnet, createSolanaMainnet, createWalletUiConfig, WalletUi } from "@wallet-ui/react";
import { WalletUiGillProvider } from '@wallet-ui/react-gill';
import { AppHeader } from 'src/components/app-header'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClusterChecker } from 'src/components/cluster/cluster-ui'
import { AccountChecker } from 'src/components/account/account-ui'
import { Toaster } from './ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000,
    }
  }
})

const config = createWalletUiConfig({
  clusters: [
    createSolanaMainnet(import.meta.env.VITE_HELIUS_MAINNET_RPC_URL),
    createSolanaDevnet(import.meta.env.VITE_HELIUS_DEVNET_RPC_URL),
    createSolanaLocalnet(),
  ]
})

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletUi config={config}>
        <WalletUiGillProvider>
          <div className="flex flex-col min-h-screen font-mono">
            <AppHeader />
            <main className="flex-grow container mx-auto p-4">
              <ClusterChecker>
                <AccountChecker />
              </ClusterChecker>
              {children}
              <Toaster />
            </main>
          </div>
        </WalletUiGillProvider>
      </WalletUi>
    </QueryClientProvider>
  )
}
