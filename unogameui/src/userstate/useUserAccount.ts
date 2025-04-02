'use client';

import { useRecoilState, useRecoilValue } from 'recoil';
import { userAccountState, isUserConnectedState } from './userState';

export function useUserAccount() {
  const [account, setAccount] = useRecoilState(userAccountState);
  const isConnected = useRecoilValue(isUserConnectedState);

  const updateUserAccount = (newAccount: string | null) => {
    setAccount(newAccount);
  };

  return {
    account,
    isConnected,
    updateUserAccount,
  };
}
