'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ethers } from 'ethers'
import { UnoGameContract, OffChainGameState, OnChainGameState, Card } from '../../../lib/types'
import { applyActionToOffChainState, isValidPlay, canPlay, hashState, initializeOffChainState } from '../../../lib/gameLogic'
import { getContract } from '../../../lib/web3'
import GameBoard from '../../../components/GameBoard'
import PlayerHand from '../../../components/PlayerHand'
import { reconstructActionFromHash } from '@/lib/stateManagement'


export default function Game() {
  const { id } = useParams()
  const [gameId, setGameId] = useState<bigint | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [contract, setContract] = useState<UnoGameContract | null>(null)
  const [onChainGameState, setOnChainGameState] = useState<OnChainGameState | null>(null)
  const [offChainGameState, setOffChainGameState] = useState<OffChainGameState | null>(null)
  const [pendingActions, setPendingActions] = useState<{action: any, txHash: string}[]>([])
  const [stateMismatchError, setStateMismatchError] = useState<string | null>(null)

  useEffect(() => {
    const setup = async () => {
      const { account, contract } = await getContract()
      setAccount(account)
      setContract(contract)
      console.log('Account: ', account, 'contract: ', contract)
      if (contract && id) {
        const bigIntId = BigInt(id as string)
        setGameId(bigIntId)
        console.log('Game ID: ', bigIntId)
        await fetchGameState(contract, bigIntId)
      }
    }
    setup()
  }, [id])

  const fetchGameState = async (contract: UnoGameContract, gameId: bigint) => {
    try {
        console.log('Fetching game state for game ID:', gameId.toString());
        const onChainState = await contract.getGameState(gameId)
        console.log('Fetched on-chain state:', onChainState);
        setOnChainGameState(onChainState)
        console.log('OnChain State: ',onChainState)
    
        const actions = await contract.getGameActions(gameId)
        console.log('Fetched game actions:', actions);

        // Reconstruct off-chain state
        let offChainState = initializeOffChainState(Number(onChainState.seed), onChainState.players)
        console.log('Initial OffChain State: ',offChainState)

        for (const action of actions) {
            const reconstructedAction = reconstructActionFromHash(action.actionHash, offChainState)
            console.log('Reconstructed action:', reconstructedAction)
            offChainState = applyActionToOffChainState(offChainState, reconstructedAction)
            console.log('State after applying action:', offChainState)
        }

        const reconstructedHash = hashState(offChainState)
        console.log('Reconstructed hash:', reconstructedHash)
        console.log('On-chain hash:', onChainState.stateHash)
        if (reconstructedHash !== onChainState.stateHash) {
            const errorMessage = 'Reconstructed state does not match on-chain hash'
            console.error(errorMessage)
            setStateMismatchError(errorMessage)
            // You might want to trigger a full state reset or reconciliation here
            return
        }
        setStateMismatchError(null) 
        

        for (const pendingAction of pendingActions) {
            offChainState = applyActionToOffChainState(offChainState, pendingAction.action)
        }
        setOffChainGameState(offChainState)
    } catch (error) {
        console.error('Error fetching game state:', error)
        setStateMismatchError('Failed to fetch game state. Please try again.')
    }     
  }

    const playCard = async (card: Card) => {
        if (!contract || !account || !offChainGameState || !onChainGameState) return
    
        if (!isValidPlay(card, offChainGameState)) {
            console.error('Invalid play')
            return
        }

        const action = { player: account, card }
    
        // Optimistically update the local state
        const newOffChainState = applyActionToOffChainState(offChainGameState, action)
        setOffChainGameState(newOffChainState)

        try {
            const actionHash = hashState(newOffChainState)
            const isReverse = card.value === 'reverse'
            const isSkip = card.value === 'skip'
            const isDrawTwo = card.value === 'draw2'
            const isWildDrawFour = card.value === 'wild_draw4'

            const tx = await contract.submitAction(gameId!, actionHash, isReverse, isSkip, isDrawTwo, isWildDrawFour)
      
            // Add to pending actions
            setPendingActions(prev => [...prev, { action, txHash: tx.hash }])

            // Wait for transaction confirmation
            await tx.wait()

            // Remove from pending actions once confirmed
            setPendingActions(prev => prev.filter(a => a.txHash !== tx.hash))

            // Fetch latest state after confirmation
            await fetchGameState(contract, BigInt(id as string))
        } catch (error) {
            console.error('Error playing card:', error)
            // Revert the optimistic update
            await fetchGameState(contract, BigInt(id as string))
        }
    }

    const drawCard = async () => {
        if (!contract || !account || !offChainGameState || !onChainGameState) return
    
        const action = { player: account, card: null }
        
        // Optimistically update the local state
        const newOffChainState = applyActionToOffChainState(offChainGameState, action)
        setOffChainGameState(newOffChainState)
    
        try {
            const actionHash = hashState(newOffChainState)
            const tx = await contract.submitAction(gameId!, actionHash, false, false, false, false)
          
            // Add to pending actions
            setPendingActions(prev => [...prev, { action, txHash: tx.hash }])
    
            // Wait for transaction confirmation
            await tx.wait()
    
            // Remove from pending actions once confirmed
            setPendingActions(prev => prev.filter(a => a.txHash !== tx.hash))
    
            // Fetch latest state after confirmation
            await fetchGameState(contract, BigInt(id as string))
        } catch (error) {
            console.error('Error drawing card:', error)
            // Revert the optimistic update
            await fetchGameState(contract, BigInt(id as string))
        }
    }
     
    if (!account || !contract || !onChainGameState || !offChainGameState) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">UNO Game {id}</h1>
          {stateMismatchError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{stateMismatchError}</span>
            </div>
            )}
          <GameBoard
            currentCard={offChainGameState.lastPlayedCard!}
            players={onChainGameState.players}
            currentPlayerIndex={Number(onChainGameState.currentPlayerIndex)}
          />
          <PlayerHand
            hand={offChainGameState.playerHands[account]}
            onCardPlay={playCard}
          />
          <button
            onClick={drawCard}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={canPlay(offChainGameState.playerHands[account], offChainGameState.currentColor, offChainGameState.currentValue)}
          >
            Draw Card
          </button>
          {pendingActions.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Pending Actions:</h2>
          <ul>
            {pendingActions.map((action, index) => (
              <li key={index}>
                {action.action.card ? `Playing ${action.action.card.color} ${action.action.card.value}` : 'Drawing a card'}
              </li>
            ))}
          </ul>
        </div>
      )}
        </div>
    )
}