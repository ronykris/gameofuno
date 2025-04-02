"use client";

import React, { useState, useEffect, useRef } from "react";
import Game from "./Game";
import { useParams } from 'next/navigation'
import socket from "@/services/socket";
import Header from "./Header";
import CenterInfo from "./CenterInfo";
import { UnoGameContract, OffChainGameState, OnChainGameState, Card, Action, ActionType } from '../../lib/types'
import { useUserAccount } from '@/userstate/useUserAccount';
import { getContractNew } from '../../lib/web3'
import { decodeBase64To32Bytes } from "@/lib/utils";
import { applyActionToOffChainState, hashAction, startGame, storePlayerHand, getPlayerHand, createDeck, hashCard, initializeOffChainState } from '../../lib/gameLogic'
import { updateGlobalCardHashMap } from '../../lib/globalState';

type User = { 
  id: string;
  name: string;
  room: string;
};

const Room = () => {
  const { id } = useParams()
  //initialize socket state
  const [room] = useState(id);
  const [roomFull, setRoomFull] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User["name"]>("");
  const [gameStarted, setGameStarted] = useState(false);
  const { account } = useUserAccount();
  const [contract, setContract] = useState<UnoGameContract | null>(null)
  const accountRef = useRef<string | null>(null);
  const [gameId, setGameId] = useState<bigint | null>(null)

  const [offChainGameState, setOffChainGameState] = useState<OffChainGameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playerToStart, setPlayerToStart] = useState<string | null>(null)
  const [pendingActions, setPendingActions] = useState<{ action: any, txHash: string }[]>([])
  const [playerHand, setPlayerHand] = useState<string[]>([])
  const [onChainGameState, setOnChainGameState] = useState<OnChainGameState | null>(null)

  useEffect(() => {
    socket.emit("join", { room: room }, (error: any) => {
      if (error) setRoomFull(true);
    });

    //cleanup on component unmount
    return function cleanup() {
      socket.emit("quitRoom");
      socket.off();
    };
  }, [room]);

  useEffect(() => {
    const setup = async () => {
      if (account) {
        const { contract } = await getContractNew()
        setContract(contract)
        // console.log('Account: ', account, 'contract: ', contract)
        if (contract && id) {
          const bigIntId = BigInt(id as string)
          setGameId(bigIntId)
          // console.log('Game ID: ', bigIntId)
          await fetchGameState(contract, bigIntId, account)
        }
      }
    }
    setup()
  }, [id, account])

  useEffect(() => {

    // Join the game room
    if (id && socket) {
      const roomId = `game-${id}`;
      socket.emit('joinRoom', roomId);
      // console.log(`Joined game room: ${roomId}`);

      // Listen for gameStarted event for this specific room
      socket.on(`gameStarted-${roomId}`, (data: { newState: OffChainGameState; cardHashMap: any; }) => {
        console.log(`Game started event received for room ${roomId}:`, data);
        const { newState, cardHashMap } = data;

        // Update the global card hash map
        updateGlobalCardHashMap(cardHashMap);

        setGameStarted(true);

        // Update the game state
        setOffChainGameState(newState);

        // Update player hand
        if (account) {
          // console.log('Account: ', account)
          const playerHandHashes = newState.playerHands[account];
          setPlayerHand(playerHandHashes);
          storePlayerHand(BigInt(id as string), account, playerHandHashes);
        }

        // Update other relevant state
        setPlayerToStart(newState.players[newState.currentPlayerIndex]);
      });

      // Listen for cardPlayed event
      socket.on(`cardPlayed-${roomId}`, (data: { action: any; newState: OffChainGameState; }) => {
        // console.log(`Card played event received for room ${roomId}:`, data);
        const { action, newState } = data;

        // Update the off-chain game state
        setOffChainGameState(newState);

        // Update player hand if necessary
        if (account && newState.playerHands[account]) {
          setPlayerHand(newState.playerHands[account]);
        }
      });
    }
  }, [id, socket]);

  // Update accountRef whenever address changes
  useEffect(() => {
    if (account) {
      accountRef.current = account;
    } else {
      accountRef.current = null;
    }
  }, [account]);

  useEffect(() => {
    socket.on("roomData", ({ users }: { users: User[] }) => {
      setUsers(users);
    });

    socket.on("currentUserData", ({ name }: { name: User["name"] }) => {
      setCurrentUser(name);
    });
  }, []);

  const fetchGameState = async (contract: UnoGameContract, gameId: bigint, account: string) => {
    try {
        const onChainGameState = await contract.getGame(gameId)
        setOnChainGameState(onChainGameState)
        console.log('On Chain Game state: ', onChainGameState)

        let offChainGameState = initializeOffChainState(gameId, onChainGameState.players)

        if (onChainGameState.isStarted) {
            // If the game is already started, we need to reconstruct the cardHashMap
            const allCards = createDeck();
            const tempCardHashMap: Record<string, Card> = {};
            allCards.forEach(card => {
                const hash = hashCard(card);
                tempCardHashMap[hash] = card;
            });
            updateGlobalCardHashMap(tempCardHashMap);

            offChainGameState.playerHands = {};
            //for (const player of onChainGameState.players) {
            const playerHand = getPlayerHand(gameId, account);
            //offChainGameState.playerHands[player] = playerHand;
            //if (player === account) {
            setPlayerHand(playerHand);
            // console.log('Current player hand (hashes):', playerHand);
        }

        setOffChainGameState(offChainGameState)
        // console.log('Off chain game state: ', offChainGameState)

        const actions = await contract.getGameActions(gameId)
        for (const action of actions) {
            const decodedAction: Action = {
                type: 'playCard',
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
    console.log(contract, account, offChainGameState, gameId)
    if (!contract || !account || !offChainGameState || !gameId) return

    const newState = startGame(offChainGameState, socket)
    console.log('New State:', newState)

    const startingPlayer = newState.players[newState.currentPlayerIndex]
    setPlayerToStart(startingPlayer)

    const action: Action = { type: 'startGame', player: account }
    const actionHash = hashAction(action)

    try {
      const tx = await contract.startGame(gameId, newState.stateHash)
      await tx.wait()

      setGameStarted(true)

      const optimisticUpdate = applyActionToOffChainState(newState, action)
      setOffChainGameState(optimisticUpdate)

    } catch (error) {
      console.error('Error starting game:', error)
      setError('Failed to start game. Please try again.')
    }
  }

  return !roomFull ? (
    <div
      className={`Game backgroundColorB`}
      style={{
        height: "100vh",
        width: "100vw",
      }}
    >
      {users.length < 2 ? (
        <>
          <Header roomCode={room} />
          {currentUser === "Player 2" ? (
            <CenterInfo msg='Player 1 has left the game' />
          ) : (
            <CenterInfo msg='Waiting for Player 2 to join' />
          )}
        </>
      ) : (
        !gameStarted
          ? (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <h1 className='topInfoText text-white font-2xl font-bold'>Everyone has joined the game 🎉</h1>
              <br />
              <button onClick={() => handleStartGame()} className='game-button green'>start game</button>
            </div>
          )
          : (
            <Game room={room} currentUser={currentUser} />
          )
      )}
    </div>
  ) : (
    <CenterInfo msg='Room is full' />
  );
};

export default Room;
