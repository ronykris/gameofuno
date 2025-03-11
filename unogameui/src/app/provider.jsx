'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { config } from "../lib/wagmi";
import { WagmiProvider } from 'wagmi';

const queryClient = new QueryClient();

export function Providers({ children }) {


  return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
  );
}