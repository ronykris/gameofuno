'use client';

import React, { useEffect, useState } from 'react';
import { ClaimableBalance, claimableBalancesApi } from '@/utils/supabase';
import {
  Aurora,
  Keypair,
  Operation,
  TransactionBuilder,
  BASE_FEE,
} from "diamnet-sdk";
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface ClaimableBalancesProps {
  userAddress: string | null;
}

const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const TESTNET = "Diamante Testnet 2024";

const ClaimableBalances: React.FC<ClaimableBalancesProps> = ({ userAddress }) => {
  const [balances, setBalances] = useState<ClaimableBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBalanceId, setSelectedBalanceId] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const { toast } = useToast()

  useEffect(() => {
    const fetchBalances = async () => {
      if (!userAddress) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await claimableBalancesApi.getUserClaimableBalances(userAddress);
        setBalances(data);
      } catch (err) {
        console.error('Error fetching balances:', err);
        setError('Failed to load claimable balances. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [userAddress]);

  const handleClaim = async (balance_id: string) => {
    if (!userAddress) return;

    setIsLoading(true);
    setSelectedBalanceId(balance_id);
    setClaimStatus({ status: 'loading', message: 'Processing your claim...' });

    try {
      const claimOp = Operation.claimClaimableBalance({
        balanceId: balance_id, // The BalanceID of the claimable balance
      });

      const sourceAccount = await server.loadAccount(userAddress as string);

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: TESTNET,
      })
        .addOperation(claimOp)
        .setTimeout(30)
        .build();

      const transactionXDR = transaction.toXDR()
      const signedTx = window.diam?.sign(transactionXDR, true, TESTNET);

      if (signedTx && signedTx.status === 200 && signedTx.message?.data?.hash) {
        const txHash = signedTx.message.data.hash;
        const txUrl = `https://testnetexplorer.diamante.io/about-tx-hash/${txHash}`;
        toast({
          title: "Transaction Successful",
          description: (
            <div>
              <p>Successfully claimed!</p>
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 hover:text-blue-800"
              >
                View transaction details
              </a>
            </div>
          ),
          variant: "success",
        });
      }

      // Mark the balance as claimed in the database
      await claimableBalancesApi.markBalanceAsClaimed(balance_id);

      setClaimStatus({
        status: 'success',
        message: 'Successfully claimed balance!'
      });

      // Refresh the balances
      const updatedBalances = await claimableBalancesApi.getUserClaimableBalances(userAddress);
      setBalances(updatedBalances);

      // Reset the state after a short delay
      setTimeout(() => {
        setSelectedBalanceId(null);
        setClaimStatus({ status: 'idle', message: '' });
      }, 3000);
    } catch (err: any) {
      console.error('Error claiming balance:', err);
      setClaimStatus({
        status: 'error',
        message: `Error: ${err.message || 'Unknown error occurred'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAddress) {
    return null;
  }

  return (
    <div className="bg-black/30 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Claimable Balances</h2>

      {isLoading && selectedBalanceId === null && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 p-4 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      )}

      {claimStatus.status !== 'idle' && (
        <div className={`mb-4 p-3 rounded-md ${claimStatus.status === 'loading' ? 'bg-blue-500/20 text-blue-300' :
          claimStatus.status === 'success' ? 'bg-green-500/20 text-green-300' :
            'bg-red-500/20 text-red-300'
          }`}>
          <p>{claimStatus.message}</p>
        </div>
      )}

      {!isLoading && balances.length === 0 ? (
        <div className="bg-black/20 p-4 rounded-lg text-center">
          <p>No claimable balances found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {balances.map((balance) => (
            <div
              key={balance.id}
              className={`bg-black/20 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${balance.claimed ? 'opacity-60' : ''
                }`}
            >
              <div className="flex-1">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400">Balance ID:</span>
                  <span className="font-mono text-sm break-all">{balance.balance_id}</span>
                </div>

                {balance.amount && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-400">Amount:</span>
                    <span className="ml-2 font-semibold">{balance.amount} {balance.asset_type || ''}</span>
                  </div>
                )}

                <div className="mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${balance.claimed ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                    {balance.claimed ? 'Claimed' : 'Unclaimed'}
                  </span>
                </div>
              </div>

              {!balance.claimed && (
                <button
                  onClick={() => handleClaim(balance.balance_id)}
                  disabled={isLoading}
                  className="bg-[#8a2be2] hover:bg-[#7a1bd2] text-white font-bold py-2 px-4 rounded-full transition-colors disabled:opacity-50"
                >
                  {isLoading && selectedBalanceId === balance.balance_id ? 'Processing...' : 'Claim'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <Toaster />
    </div>
  );
};

export default ClaimableBalances;
