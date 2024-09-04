'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ethers } from 'ethers'
import { UnoGameContract, OffChainGameState, OnChainGameState, Card, Action, ActionType } from '../../../lib/types'
import { applyActionToOffChainState, isValidPlay, canPlay, hashState, initializeOffChainState, hashAction, hashCard, startGame, storePlayerHand, getPlayerHand } from '../../../lib/gameLogic'
import { getContract } from '../../../lib/web3'
import GameBoard from '../../../components/GameBoard'
import PlayerHand from '../../../components/PlayerHand'
//import { reconstructActionFromHash } from '@/lib/stateManagement'


export default function Game() {
  const { id } = useParams()
  const [gameId, setGameId] = useState<bigint | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [contract, setContract] = useState<UnoGameContract | null>(null)
  const [onChainGameState, setOnChainGameState] = useState<OnChainGameState | null>(null)
  const [offChainGameState, setOffChainGameState] = useState<OffChainGameState | null>(null)
  const [pendingActions, setPendingActions] = useState<{action: any, txHash: string}[]>([])
  const [stateMismatchError, setStateMismatchError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [playerToStart, setPlayerToStart] = useState<string | null>(null)

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
        await fetchGameState(contract, bigIntId, account)
      }
      if (playerToStart) {
        console.log('Player to start (from state): ', playerToStart)
      }
    }
    setup()
  }, [id, playerToStart])

  const fetchGameState = async (contract: UnoGameContract, gameId: bigint, account: string) => {
    try {
      const onChainGameState = await contract.getGameState(gameId)
      setOnChainGameState(onChainGameState)
      console.log('On Chain Game state: ', onChainGameState)
      let offChainGameState = initializeOffChainState(gameId, onChainGameState.players)
      setOffChainGameState(offChainGameState)
      console.log('Off chain game state: ',offChainGameState)
      
      const actions = await contract.getGameActions(gameId)
      for (const action of actions) {
        const decodedAction: Action = {
          type: 'playCard', // This is a simplification. You'd need to properly decode the action.
          player: action.player,
          cardHash: action.actionHash
        }
        offChainGameState = applyActionToOffChainState(offChainGameState, decodedAction)
      }

      setOffChainGameState(offChainGameState)
    } catch (error) {
      console.error('Error fetching game state:', error)
      setError('Failed to fetch game state. Please try again.')
    }
  }

  const handleStartGame = async () => {
    if (!contract || !account || !offChainGameState || !gameId) return

    const newState = startGame(offChainGameState)
    const startingPlayer = newState.players[newState.currentPlayerIndex]    
    console.log('Player chosen to start: ',startingPlayer)
    setPlayerToStart(startingPlayer)
    console.log('Player to start: ', playerToStart)
    const action: Action = { type: 'startGame', player: account }
    const actionHash = hashAction(action)

    try {
      const tx = await contract.startGame(gameId, newState.stateHash)
      await tx.wait()
      //setOffChainGameState(newState)

      // Store the player's hand locally
      const playerHandHashes = newState.playerHands[account]
      storePlayerHand(gameId, account, playerHandHashes)
      setPlayerHand(getPlayerHand(gameId, account))

      const optimisticUpdate = applyActionToOffChainState(newState, action)
      setOffChainGameState(optimisticUpdate)
      setPlayerHand(getPlayerHand(gameId, account))
    } catch (error) {
      console.error('Error starting game:', error)
      setError('Failed to start game. Please try again.')
    }
  }
  
  const playCard = async (cardHash: string) => {
    if (!contract || !account || !offChainGameState || !gameId) return
    
    const action: Action = { type: 'playCard', player: account, cardHash }
    const newState = applyActionToOffChainState(offChainGameState, action)
    const actionHash = hashAction(action)

    try {
      const tx = await contract.submitAction(gameId, actionHash)
      await tx.wait()
      setOffChainGameState(newState)
    } catch (error) {
      console.error('Error playing card:', error)
      setError('Failed to submit action. Please try again.')
    }
  }

    const drawCard = async () => {
        if (!contract || !account || !offChainGameState || !onChainGameState) return
    
        const action = { type: 'startGame' as ActionType, player: account}
        
        // Optimistically update the local state
        const newOffChainState = applyActionToOffChainState(offChainGameState, action)
        setOffChainGameState(newOffChainState)
    
        try {
            const actionHash = hashState(newOffChainState)
            const tx = await contract.submitAction(gameId!, actionHash)
          
            // Add to pending actions
            setPendingActions(prev => [...prev, { action, txHash: tx.hash }])
    
            // Wait for transaction confirmation
            await tx.wait()
    
            // Remove from pending actions once confirmed
            setPendingActions(prev => prev.filter(a => a.txHash !== tx.hash))
    
            // Fetch latest state after confirmation
            await fetchGameState(contract, BigInt(id as string), account)
        } catch (error) {
            console.error('Error drawing card:', error)
            // Revert the optimistic update
            await fetchGameState(contract, BigInt(id as string), account)
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
            {offChainGameState && !offChainGameState.isStarted && (
                <button onClick={handleStartGame} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4" >Start Game</button>
            )}
            {playerToStart && (
                <div>Starting Player: {playerToStart}</div>
            )}
            {offChainGameState && offChainGameState.isStarted && (
                <>                 
                    <GameBoard
                        currentCardHash={offChainGameState.lastPlayedCardHash!}
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
                        disabled={canPlay(getPlayerHand(gameId!, account), offChainGameState.currentColor!, offChainGameState.currentValue!)}
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
                </>
                
            )}
        
        </div>
    )
}