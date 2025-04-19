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
  const { account, bytesAddress } = useUserAccount();
  const [contract, setContract] = useState<UnoGameContract | null>(null)
  const [gameId, setGameId] = useState<bigint | null>(null)

  const [offChainGameState, setOffChainGameState] = useState<OffChainGameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playerToStart, setPlayerToStart] = useState<string | null>(null)
  const [playerHand, setPlayerHand] = useState<string[]>([])

  useEffect(() => {
    socket.emit("join", { room: room }, (error: any) => {
      if (error) setRoomFull(true);
    });

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
        if (contract && id) {
          const bigIntId = BigInt(id as string)
          setGameId(bigIntId)
          await fetchGameState(contract, bigIntId, account)
        }
      }
    }
    setup()
  }, [id, account])

  useEffect(() => {
    if (!socket || !id) return;

    const roomId = `game-${id}`;
    
    console.log(`Joining room: ${roomId}`);
    socket.emit("joinRoom", roomId);

    if (socket) {
      socket.on(`gameStarted-${roomId}`, (data: { newState: OffChainGameState; cardHashMap: any; }) => {
        console.log(`Game started event received for room ${roomId}:`, data);
        
        try {
          const { newState, cardHashMap } = data;
          
          console.log('Received newState:', newState);
          console.log('Received cardHashMap:', cardHashMap);
          console.log('Current account:', account);
          
          if (!newState) {
            console.error('Error: Received empty game state in gameStarted event');
            return;
          }

          if (cardHashMap) {
            console.log('Updating global card hash map');
            updateGlobalCardHashMap(cardHashMap);
          } else {
            console.warn('Warning: No cardHashMap received in gameStarted event');
          }

          console.log('Setting game as started');
          setGameStarted(true);

          console.log('Updating off-chain game state');
          setOffChainGameState(newState);

          if (account) {
            console.log('Updating player hand for account:', account);
            console.log('Player hands in newState:', newState.playerHands);
            
            const playerHandHashes = newState.playerHands[account];
            console.log('Player hand hashes:', playerHandHashes);
            
            if (playerHandHashes) {
              setPlayerHand(playerHandHashes);
              storePlayerHand(BigInt(id as string), account, playerHandHashes);
              console.log('Player hand updated and stored');
            } else {
              console.error(`Error: No hand found for player ${account} in the game state`);
            }
          } else {
            console.error('Error: No account available to update player hand');
          }

          if (newState.players && newState.currentPlayerIndex !== undefined) {
            const startingPlayer = newState.players[newState.currentPlayerIndex];
            console.log('Setting player to start:', startingPlayer);
            setPlayerToStart(startingPlayer);
          } else {
            console.error('Error: Cannot determine starting player from game state');
          }
        } catch (error) {
          console.error('Error handling gameStarted event:', error);
        }
      });

      // Listen for cardPlayed event
      socket.on(`cardPlayed-${roomId}`, (data: { action: any; newState: OffChainGameState; }) => {
        const { action, newState } = data;

        setOffChainGameState(newState);

        if (account && newState.playerHands[account]) {
          setPlayerHand(newState.playerHands[account]);
        }
      });
    }
  }, [id, socket]);

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
      const [id, players, status, startTime, endTime, gameHash, moves] = await contract.getGame(gameId)
      console.log('On chain game state: ', { id, players, status, startTime, endTime, gameHash, moves })

      const gameData = {
        id,
        players,
        status,
        startTime,
        endTime,
        gameHash,
        moves
      };

      console.log('Formatted game data:', gameData);

      let offChainGameState: OffChainGameState = {
        id: gameData.id,
        players: Array.from(gameData.players), // Convert from Result object to array
        isActive: true, // Assume active if we can fetch it
        currentPlayerIndex: 0, // Will be set properly when game starts
        lastActionTimestamp: gameData.startTime,
        turnCount: BigInt(0), // Initialize to 0
        directionClockwise: true, // Default direction
        playerHandsHash: {},
        playerHands: {},
        deckHash: '',
        discardPileHash: '',
        currentColor: null,
        currentValue: null,
        lastPlayedCardHash: null,
        stateHash: gameData.gameHash || '',
        isStarted: gameData.status === 1 // 0=NotStarted, 1=Started, 2=Ended
      }

      if (offChainGameState.isStarted) {
        const allCards = createDeck()
        const tempCardHashMap: { [hash: string]: Card } = {}
        
        allCards.forEach((card: Card) => {
            const hash = hashCard(card);
            tempCardHashMap[hash] = card;
        });
        updateGlobalCardHashMap(tempCardHashMap);

        offChainGameState.playerHands = {};
        const playerHand = getPlayerHand(gameId, account);
        setPlayerHand(playerHand);
      }

      setOffChainGameState(offChainGameState)
      console.log('Off chain game state: ', offChainGameState)

      return offChainGameState;
    } catch (error) {
      console.error('Error fetching game state:', error)
      setError('Failed to fetch game state. Please try again.')
      return null;
    }
  }

  const handleStartGame = async () => {
    console.log('Starting game with:', { contract, account, offChainGameState, gameId })
    if (!contract || !account || !offChainGameState || !gameId) {
      console.error('Missing required data to start game')
      setError('Missing required data to start game')
      return
    }

    try {
      console.log('Starting game on contract...')
      console.log('Game started on contract')

      console.log('Initializing local game state...')
      const newState = startGame(offChainGameState, socket)
      console.log('New State:', newState)

      const startingPlayer = newState.players[newState.currentPlayerIndex]
      setPlayerToStart(startingPlayer)

      const action: Action = { type: 'startGame', player: bytesAddress! }
      const actionHash = hashAction(action)
      console.log('Action hash:', actionHash)

      console.log('Committing move to contract...')
      console.log('Move committed to contract')

      setGameStarted(true)

      const optimisticUpdate = applyActionToOffChainState(newState, action)
      setOffChainGameState(optimisticUpdate)
      console.log('Updated off-chain state:', optimisticUpdate)

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
