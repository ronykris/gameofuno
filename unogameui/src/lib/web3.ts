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

export async function getContract(address: string) {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // await window.ethereum.request({ method: 'eth_requestAccounts' })
      const provider = new ethers.JsonRpcProvider('https://sepolia-rpc.kakarot.org')

      // const network = await provider.getNetwork()
      // console.log('Connected to network:', network.name, 'Chain ID:', network.chainId)

      const signer = await provider.getSigner(address)
      // console.log(signer)
      // const address = await signer.getAddress()
      // console.log(address)

      //TestNet
      const contractAddress = '0x7e25d8b74cc92E114C9275D04C814c6Fef3E4036'
      //Local
      //const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3' 
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

      return { contract: gameContract }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }
  return { account: null, contract: null }
}