'use client'; 'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { networkConfig } from '@/lib/networkConfig';
import { RegisterEnokiWallets } from '@/components/register-enoki-wallets';
import { SuiClientProvider, WalletProvider, createNetworkConfig, useDisconnectWallet } from '@mysten/dapp-kit';
import React, { useEffect, useRef } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/workflow';

// Create QueryClient
const queryClient = new QueryClient();


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider>
          <RegisterEnokiWallets />
            {children}
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
