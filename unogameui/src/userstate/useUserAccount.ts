'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { userAccountState, isUserConnectedState } from './userState';
import { decodeBase64To32Bytes } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function useUserAccount() {
  const [account, setAccount] = useRecoilState(userAccountState);
  const isConnected = useRecoilValue(isUserConnectedState);
  const [bytesAddress, setBytesAddress] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      const bytesFromDIAMAddress = decodeBase64To32Bytes(account as string);
      setBytesAddress(bytesFromDIAMAddress);
    } else {
      setBytesAddress(null);
    }
  }, [account]);

  const updateUserAccount = (newAccount: string | null) => {
    setAccount(newAccount);
  };

  return {
    account,
    isConnected,
    updateUserAccount,
    bytesAddress,
  };
}
