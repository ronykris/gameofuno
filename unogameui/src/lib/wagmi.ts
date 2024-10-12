import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
    Chain,
} from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';
import { http } from 'viem';

export const arbitriumSepolia = {
    id: 421614,
    name: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] },
    },
    blockExplorers: {
        default: { name: 'arbiscan', url: 'https://sepolia.arbiscan.io' },
    },
    testnet: true,
} as const satisfies Chain;

export const config = createConfig({
    chains: [arbitriumSepolia],
    transports: {
        [arbitriumSepolia.id]: http(),
    },
});