import { ethers } from 'ethers'
import { UnoGameContract } from './types'
import UNOContractJson from '../constants/UnoGame.json'

declare global {
  interface Window {
    ethereum?: any;
  }
}

async function verifyContract(provider: ethers.Provider, address: string) {
    const code = await provider.getCode(address);
    if (code === '0x') {
      throw new Error('No contract deployed at the specified address');
    }
    console.log('Contract verified at address:', address);
  }

export async function getContract() {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      const network = await provider.getNetwork()
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId)

      const signer = await provider.getSigner()
      console.log(signer)
      const address = await signer.getAddress()
      console.log(address)

      //const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x67d269191c92Caf3cD7723F116c85e6E9bf55933'
      const contractAddress = '0x7e25d8b74cc92E114C9275D04C814c6Fef3E4036'
      if (!contractAddress) {
        throw new Error('Contract address is not set');
      }
      const contractABI = UNOContractJson.abi

      
      await verifyContract(provider, contractAddress);
      const gameContract = new ethers.Contract(
        contractAddress!,
        contractABI,
        signer
      ) as ethers.Contract & UnoGameContract

      return { account: address, contract: gameContract }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }
  return { account: null, contract: null }
}