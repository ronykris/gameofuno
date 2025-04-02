'use client';

import React, { useState } from 'react';
import { claimableBalanceUtils } from '@/utils/claimableBalanceUtils';

interface AddClaimableBalanceProps {
  userAddress: string | null;
  onBalanceAdded: () => void;
}

const AddClaimableBalance: React.FC<AddClaimableBalanceProps> = ({ 
  userAddress, 
  onBalanceAdded 
}) => {
  const [balanceId, setBalanceId] = useState('');
  const [amount, setAmount] = useState('');
  const [assetType, setAssetType] = useState('XLM');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAddress || !balanceId.trim()) {
      setStatus({
        type: 'error',
        message: 'User address and balance ID are required'
      });
      return;
    }
    
    setIsLoading(true);
    setStatus({ type: null, message: '' });
    
    try {
      await claimableBalanceUtils.addClaimableBalance(
        userAddress,
        balanceId,
        amount || undefined,
        assetType || undefined
      );
      
      setStatus({
        type: 'success',
        message: 'Claimable balance added successfully!'
      });
      
      // Reset form
      setBalanceId('');
      setAmount('');
      setAssetType('XLM');
      
      // Notify parent component
      onBalanceAdded();
    } catch (error: any) {
      console.error('Error adding claimable balance:', error);
      setStatus({
        type: 'error',
        message: `Failed to add claimable balance: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userAddress) {
    return null;
  }

  return (
    <div className="bg-black/30 p-6 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-4">Add Claimable Balance</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="balanceId" className="block text-sm font-medium mb-1">
            Balance ID <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="balanceId"
            value={balanceId}
            onChange={(e) => setBalanceId(e.target.value)}
            className="w-full bg-black/30 border border-gray-600 rounded-md px-3 py-2 text-white"
            placeholder="Enter balance ID"
            required
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium mb-1">
            Amount
          </label>
          <input
            type="text"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-black/30 border border-gray-600 rounded-md px-3 py-2 text-white"
            placeholder="Enter amount (optional)"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="assetType" className="block text-sm font-medium mb-1">
            Asset Type
          </label>
          <input
            type="text"
            id="assetType"
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="w-full bg-black/30 border border-gray-600 rounded-md px-3 py-2 text-white"
            placeholder="Enter asset type (default: XLM)"
            disabled={isLoading}
          />
        </div>
        
        {status.type && (
          <div className={`p-3 rounded-md ${
            status.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            <p>{status.message}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || !balanceId.trim()}
          className="bg-[#8a2be2] hover:bg-[#7a1bd2] text-white font-bold py-2 px-4 rounded-full transition-colors disabled:opacity-50 w-full"
        >
          {isLoading ? 'Adding...' : 'Add Claimable Balance'}
        </button>
      </form>
    </div>
  );
};

export default AddClaimableBalance;
