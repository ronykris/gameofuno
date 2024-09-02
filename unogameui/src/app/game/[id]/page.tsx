'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ethers } from 'ethers'
import { UnoGameContract, OffChainGameState, OnChainGameState, Card } from '../../../lib/types'
import { applyActionToOffChainState, isValidPlay, canPlay, hashState } from '../../../lib/gameLogic'
import { getContract } from '../../../lib/web3'
import GameBoard from '../../../components/GameBoard'
import PlayerHand from '../../../components/PlayerHand'

export default function Game() {
  const { id } = useParams()
  const [account, setAccount] = useState<string | null>(null)
  const [contract, setContract] = useState<UnoGameContract | null>(null)
  const [onChainGameState, setOnChainGameState] = useState<OnChainGameState | null>(null)
  const [offChainGameState, setOffChainGameState] = useState<OffChainGameState | null>(null)

  useEffect(() => {
    const setup = async () => {
      const { account, contract } = await getContract()
      setAccount(account)
      setContract(contract)
      if (contract && id) {
        await fetchGameState(contract, Number(id))
      }
    }
    setup()
  }, [id])

  const fetchGameState = async (contract: UnoGameContract, gameId: number) => {
    const onChainState = await contract.getGameState(gameId)
    setOnChainGameState(onChainState)
    console.log(onChainState)
    // Implement off-chain state reconstruction here
  }

  const playCard = async (card: Card) => {
    if (!contract || !account || !offChainGameState || !onChainGameState) return
    // Implement card playing logic
  }

  const drawCard = async () => {
    if (!contract || !account || !offChainGameState || !onChainGameState) return
    // Implement card drawing logic
  }

  if (!account || !contract || !onChainGameState || !offChainGameState) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">UNO Game {id}</h1>
      <GameBoard
        currentCard={offChainGameState.lastPlayedCard!}
        players={onChainGameState.players}
        currentPlayerIndex={onChainGameState.currentPlayerIndex}
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
    </div>
  )
}