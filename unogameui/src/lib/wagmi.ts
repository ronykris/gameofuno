import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
    Chain,
} from 'wagmi/chains';

const kakarot = {
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

export const config = getDefaultConfig({
    appName: 'RainbowKit App',
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
    chains: [
        kakarot,
    ],
    ssr: true,
});