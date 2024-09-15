import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
    Chain,
} from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';
import { http } from 'viem';

export const kakarot = {
    id: 1802203764,
    name: 'Kakarot',
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://sepolia-rpc.kakarot.org'] },
    },
    blockExplorers: {
        default: { name: 'kakarotscan', url: 'https://sepolia.kakarotscan.org/' },
    },
    testnet: true,
} as const satisfies Chain;

export const config = createConfig({
    chains: [kakarot],
    transports: {
        [kakarot.id]: http(),
    },
});