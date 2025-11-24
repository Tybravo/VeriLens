'use client';'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { SuiClientProvider, WalletProvider, createNetworkConfig, useDisconnectWallet } from '@mysten/dapp-kit';
import React, { useEffect, useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/workflow';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Sui network configuration
const { networkConfig } = createNetworkConfig({
  testnet: { url: 'https://fullnode.testnet.sui.io:443' },
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443' },
  localnet: { url: 'http://127.0.0.1:9000' }
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <ReduxProvider store={store}>
              <IdleWalletGuard>{children}</IdleWalletGuard>
            </ReduxProvider>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function IdleWalletGuard({ children }: { children: React.ReactNode }) {
  const { mutate: disconnect } = useDisconnectWallet();
  const last = useRef<number>(Date.now());
  useEffect(() => {
    const bump = () => { last.current = Date.now(); };
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, bump));
    const interval = setInterval(() => {
      if (Date.now() - last.current > 30 * 60 * 1000) {
        disconnect();
        last.current = Date.now();
      }
    }, 60 * 1000);
    return () => {
      events.forEach(e => window.removeEventListener(e, bump));
      clearInterval(interval);
    };
  }, [disconnect]);
  return <>{children}</>;
}
