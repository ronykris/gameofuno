/**
 * Connect to the Diam wallet
 * @param updateUserAccount Optional callback to update user account state
 * @returns The user's Diamnet public key or null if connection fails
 */
export async function connectWallet(updateUserAccount?: (publicKey: string) => void): Promise<string | null> {
  if (window.diam) {
    try {
      const result = await window.diam.connect();
      console.log('Wallet connected:', result);
      const diamPublicKey = result.message?.data?.[0].diamPublicKey;
      console.log(`User active public key is: ${diamPublicKey}`);

      if (!diamPublicKey) {
        throw new Error('Failed to connect wallet');
      }

      localStorage.setItem('publicKey', diamPublicKey);
      
      if (updateUserAccount) {
        updateUserAccount(diamPublicKey);
      }

      return diamPublicKey;
    } catch (error) {
      console.error(`Error connecting wallet: ${error}`);
      throw error;
    }
  } else {
    console.error('Diam wallet extension not found');
    alert('Wallet extension not found');
    return null;
  }
}

/**
 * Check if the wallet is connected
 * @returns The connected wallet address or null if not connected
 */
export function getConnectedWalletAddress(): string | null {
  return window.diam?.address || null;
}

/**
 * Type definition for the global window object with Diam wallet
 */
declare global {
  interface Window {
    diam?: {
      connect: () => Promise<any>;
      address?: string;
    };
  }
}
