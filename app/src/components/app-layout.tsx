import React from 'react'
import { createSolanaDevnet, createSolanaLocalnet, createWalletUiConfig, WalletUi } from "@wallet-ui/react";
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
    createSolanaDevnet(),
    createSolanaLocalnet(),
  ]
})

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletUi config={config}>
        <div className="flex flex-col min-h-screen">
          <AppHeader />
          <main className="flex-grow container mx-auto p-4">
            <ClusterChecker>
              <AccountChecker />
            </ClusterChecker>
            {children}
            <Toaster />
          </main>
        </div>
      </WalletUi>
    </QueryClientProvider>
  )
}
