'use client';

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { config } from "../lib/wagmi";
import { WagmiProvider } from 'wagmi';
import RecoilProvider from '../userstate/RecoilProvider';

const queryClient = new QueryClient();

export function Providers({ children }) {


  return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RecoilProvider>
            {children}
          </RecoilProvider>
        </WagmiProvider>
      </QueryClientProvider>
  );
}