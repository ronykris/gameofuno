'use client'

import { useState, useEffect, MutableRefObject } from 'react'
import { useRouter } from 'next/navigation'
import { getContract, getContractNew } from '../lib/web3'
import { UnoGameContract } from '../lib/types'
import { ethers } from 'ethers'
import { useAccount } from 'wagmi'

export default function Lobby({ socket }: { socket: MutableRefObject<any> }) {
  const { address, status } = useAccount()
  const [contract, setContract] = useState<UnoGameContract | null>(null)
  const [games, setGames] = useState<BigInt[]>([])
  const router = useRouter()

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

  useEffect(() => {
    const setup = async () => {
      try {
        const { contract } = await getContractNew()
        setContract(contract)
      } catch (error) {
        console.error('Failed to setup contract:', error)
      }
    }
    setup()

  }, [])

  useEffect(() => {
    if (contract) {
      console.log("Contract initialized, calling fetchGames");
      fetchGames();

      if (socket.current) {
        console.log("Socket connection established");
        // Add listener for gameRoomCreated event
        socket.current.on("gameRoomCreated", () => {
          console.log("Game room created event received");
          fetchGames();
        });

        // Cleanup function
        return () => {
          socket.current.off("gameRoomCreated");
        };
      }
    } else {
      console.log("Contract not initialized yet");
    }
  }, [contract, socket])

  const createGame = async () => {
    if (contract) {
      try {
        console.log('Creating game...')
        const tx = await contract.createGame(address)
        console.log('Transaction hash:', tx.hash)
        await tx.wait()
        console.log('Game created successfully')

        if (socket && socket.current) {
          socket.current.emit("createGameRoom");
        }

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
        const gameIdBigint = BigInt(gameId.toString())
        const tx = await contract.joinGame(gameIdBigint, address)
        console.log('Transaction hash:', tx.hash)
        await tx.wait()
        console.log('Joined game successfully')
        router.push(`/game/${gameId.toString()}`)
      } catch (error) {
        console.error('Failed to join game:', error)
      }
    }
  }

  if (!address) {
    return <p>Please connect your wallet to play.</p>
  }

  return (
    <div>
      <p className="mb-4">Connected: {address}</p>
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