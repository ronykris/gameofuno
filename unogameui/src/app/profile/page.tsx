'use client';

import ProfilePage from '@/components/profile/ProfilePage';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { userAccountState } from '@/userstate/userState';

export default function Profile() {
  const [userAccount, setUserAccount] = useRecoilState(userAccountState);
  const [isLoading, setIsLoading] = useState(false);

  async function connectWallet() {
    if (window.diam) {
      try {
        setIsLoading(true);
        const result = await window.diam.connect();
        console.log('Wallet connected:', result);
        const diamPublicKey = result.message?.data?.[0].publicKey;
        console.log(`User active public key is: ${diamPublicKey}`);

        if (!diamPublicKey) {
          throw new Error('Failed to connect wallet');
        }

        localStorage.setItem('publicKey', diamPublicKey);
        setUserAccount(diamPublicKey);

        return diamPublicKey;
      } catch (error) {
        console.error(`Error: ${error}`);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Wallet extension not found');
      throw new Error('Wallet extension not found');
    }
  }

  useEffect(() => {
    // Check if user account exists in localStorage
    const storedPublicKey = localStorage.getItem('publicKey');
    if (storedPublicKey && !userAccount) {
      setUserAccount(storedPublicKey);
    }
  }, [userAccount, setUserAccount]);

  return (
    <main className="bg-cover bg-[url('/bg.png')] min-h-screen">
      <div className="container mx-auto py-6 px-4">
        <ProfilePage userAccount={userAccount} connectWallet={connectWallet} isLoading={isLoading} />
      </div>
    </main>
  );
}
