'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getContract } from '../lib/web3'
import { UnoGameContract } from '../lib/types'
import { ethers } from 'ethers'

export default function Lobby() {
  const [account, setAccount] = useState<string | null>(null)
  const [contract, setContract] = useState<UnoGameContract | null>(null)
  const [games, setGames] = useState<BigInt[]>([])
  const router = useRouter()

  useEffect(() => {
    const setup = async () => {
      try {
        const { account, contract } = await getContract()
        setAccount(account)
        setContract(contract)
      } catch (error) {
        console.error('Failed to setup contract:', error)
      }
    }
    setup()
  }, [])

  useEffect(() => {
    if (contract) {
      fetchGames()
    }
  }, [contract])

  const createGame = async () => {
    if (contract) {
      try {
        console.log('Creating game...')
        const tx = await contract.createGame()
        console.log('Transaction hash:', tx.hash)
        await tx.wait()
        console.log('Game created successfully')
        fetchGames()
      } catch (error) {
        console.error('Failed to create game:', error)
      }
    }
  }

  const joinGame = async (gameId: BigInt) => {
    if (contract) {
      try {
        console.log(`Joining game ${gameId.toString()}...`)
        // Convert BigInt to bigint
        const gameIdBigint = BigInt(gameId.toString())
        const tx = await contract.joinGame(gameIdBigint)
        console.log('Transaction hash:', tx.hash)
        await tx.wait()
        console.log('Joined game successfully')
        router.push(`/game/${gameId.toString()}`)   
      } catch (error) {
        console.error('Failed to join game:', error)
      }
    }
  }

  const fetchGames = async () => {
    if (contract) {
      try {
        console.log('Fetching active games...')
        const activeGames = await contract.getActiveGames()
        console.log('Active games:', activeGames)
        setGames(activeGames)
      } catch (error) {
        console.error('Failed to fetch games:', error)
      }
    }
  }

  if (!account) {
    return <p>Please connect your wallet to play.</p>
  }

  return (
    <div>
      <p className="mb-4">Connected: {account}</p>
      <button
        onClick={createGame}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Create New Game
      </button>
      <h2 className="text-2xl font-bold mb-4">Active Games:</h2>
      <ul>
        {games.map(gameId => (
          <li key={gameId.toString()} className="mb-2">
            Game {gameId.toString()}
            <button
              onClick={() => joinGame(gameId)}
              className="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}