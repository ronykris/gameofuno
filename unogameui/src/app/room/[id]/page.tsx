'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { UnoGameContract, OffChainGameState, OnChainGameState, Card, Action, ActionType } from '../../../lib/types'
import { applyActionToOffChainState, isValidPlay, canPlay, hashState, initializeOffChainState, hashAction, hashCard, startGame, storePlayerHand, getPlayerHand, createDeck } from '../../../lib/gameLogic'
import { getContract, getContractNew } from '../../../lib/web3'
import GameBoard from '../../../components/GameBoard'
import PlayerHand from '../../../components/PlayerHand'
import { io, Socket } from 'socket.io-client'
import { updateGlobalCardHashMap, getGlobalCardHashMap } from '../../../lib/globalState';
import StyledButton from '@/components/styled-button'
import { convertBigIntsToStrings } from '@/lib/gameLogic'
import { useAccount } from 'wagmi'
import { Toaster, toast } from 'react-hot-toast'
import Header from './header'

const CONNECTION = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'https://unosocket-6k6gsdlfoa-el.a.run.app/';

const Room: React.FC = () => {
    const { id } = useParams()
    const { address, status } = useAccount()
    const [gameId, setGameId] = useState<bigint | null>(null)
    const accountRef = useRef<string | null>(null);
    const [account, setAccount] = useState<string | null>(null)
    const [contract, setContract] = useState<UnoGameContract | null>(null)
    const [onChainGameState, setOnChainGameState] = useState<OnChainGameState | null>(null)
    const [offChainGameState, setOffChainGameState] = useState<OffChainGameState | null>(null)
    const [pendingActions, setPendingActions] = useState<{ action: any, txHash: string }[]>([])
    const [stateMismatchError, setStateMismatchError] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [playerHand, setPlayerHand] = useState<string[]>([])
    const [playerToStart, setPlayerToStart] = useState<string | null>(null)

    const socket = useRef<Socket | null>(null);

    // Update accountRef and account whenever address changes
    useEffect(() => {
        if (address) {
            accountRef.current = address;
            setAccount(address);
        } else {
            accountRef.current = null;
            setAccount(null);
        }
    }, [address]);

    useEffect(() => {
        if (!socket.current) {
            socket.current = io(CONNECTION, {
                transports: ["websocket"],
            });

            // Join the game room
            if (id && socket.current) {
                const roomId = `game-${id}`;
                socket.current.emit('joinRoom', roomId);
                console.log(`Joined game room: ${roomId}`);

                // Listen for gameStarted event for this specific room
                socket.current.on(`gameStarted-${roomId}`, (data) => {
                    console.log(`Game started event received for room ${roomId}:`, data);
                    const { newState, cardHashMap } = data;

                    // Update the global card hash map
                    updateGlobalCardHashMap(cardHashMap);

                    // Update the game state
                    setOffChainGameState(newState);

                    // Update player hand
                    if (accountRef.current) {
                        console.log('Account: ', account)
                        const playerHandHashes = newState.playerHands[accountRef.current];
                        setPlayerHand(playerHandHashes);
                        storePlayerHand(BigInt(id as string), accountRef.current, playerHandHashes);
                    }

                    // Update other relevant state
                    setPlayerToStart(newState.players[newState.currentPlayerIndex]);
                });

                // Listen for cardPlayed event
                socket.current.on(`cardPlayed-${roomId}`, (data) => {
                    console.log(`Card played event received for room ${roomId}:`, data);
                    const { action, newState } = data;

                    // Update the off-chain game state
                    setOffChainGameState(newState);

                    // Update player hand if necessary
                    if (accountRef.current && newState.playerHands[accountRef.current]) {
                        setPlayerHand(newState.playerHands[accountRef.current]);
                    }
                });
            }
        }

        // Cleanup function
        return () => {
            if (socket.current) {
                socket.current.off('receiveGameStart');
                socket.current.off(`cardPlayed-${id}`);
            }
        };
    }, [id, gameId, socket]);

    useEffect(() => {
        const setup = async () => {
            if (status === 'connected' && address) {
                const { contract } = await getContractNew()
                setContract(contract)
                console.log('Account: ', address, 'contract: ', contract)
                if (contract && id) {
                    const bigIntId = BigInt(id as string)
                    setGameId(bigIntId)
                    console.log('Game ID: ', bigIntId)
                    await fetchGameState(contract, bigIntId, address)
                }
            }
        }
        setup()
    }, [id, status, address])

    useEffect(() => {
        if (playerToStart) {
            console.log('Player to start (from state): ', playerToStart)
        }
    }, [playerToStart])

    const fetchGameState = async (contract: UnoGameContract, gameId: bigint, account: string) => {
        try {
            const onChainGameState = await contract.getGameState(gameId)
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
                console.log('Current player hand (hashes):', playerHand);
            }

            setOffChainGameState(offChainGameState)
            console.log('Off chain game state: ', offChainGameState)

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
        if (!contract || !account || !offChainGameState || !gameId) return

        const newState = startGame(offChainGameState, socket)
        console.log('New State:', newState)
        const startingPlayer = newState.players[newState.currentPlayerIndex]
        console.log('Player chosen to start: ', startingPlayer)
        setPlayerToStart(startingPlayer)
        console.log('Player to start: ', playerToStart)
        const action: Action = { type: 'startGame', player: account }
        const actionHash = hashAction(action)

        try {
            const tx = await contract.startGame(gameId, newState.stateHash)
            await tx.wait()
            //setOffChainGameState(newState)

            // Store the player's hand locally
            // for (const player of newState.players) {
            //   const playerHandHashes = newState.playerHands[player];
            //   storePlayerHand(gameId, account, playerHandHashes)
            //   console.log('Player Hands: ', playerHandHashes)
            //   console.log(`Stored hand for player ${player}:`, playerHandHashes);
            // }
            // setOffChainGameState(newState);
            // const currentPlayerHandHashes = newState.playerHands[account];
            // setPlayerHand(currentPlayerHandHashes);
            // console.log('Current player hand set:', currentPlayerHandHashes);
            //setPlayerHand(getPlayerHand(gameId, account))

            const optimisticUpdate = applyActionToOffChainState(newState, action)
            setOffChainGameState(optimisticUpdate)
            //setPlayerHand(getPlayerHand(gameId, account))
        } catch (error) {
            console.error('Error starting game:', error)
            setError('Failed to start game. Please try again.')
        }
    }

    const playCard = async (cardHash: string) => {
        if (!contract || !account || !offChainGameState || !gameId || !socket.current) return
        const action: Action = { type: 'playCard', player: account, cardHash }
        const newState = applyActionToOffChainState(offChainGameState, action)
        const actionHash = hashAction(action)

        const toastId = toast.loading('Playing card...')

        try {
            const tx = await contract.submitAction(gameId, actionHash, account)
            await tx.wait()
            setOffChainGameState(newState)

            // Broadcast the action to all players in the room
            const roomId = `game-${id.toString()}`;
            socket.current.emit('playCard', { roomId, action, newState: convertBigIntsToStrings(newState) });

            toast.success('Card played successfully!', { id: toastId })
        } catch (error) {
            console.error('Error playing card:', error)
            setError('Failed to submit action. Please try again.')
            toast.error('Failed to play card. Please try again.', { id: toastId })
        }
    }

    const drawCard = async () => {
        console.log('Drawing card...')
        if (!contract || !account || !offChainGameState || !onChainGameState) return

        const action = { type: 'startGame' as ActionType, player: account }

        const toastId = toast.loading('Drawing card...')

        try {
            // Optimistically update the local state
            const newOffChainState = applyActionToOffChainState(offChainGameState, action)
            setOffChainGameState(newOffChainState)

            const actionHash = hashState(newOffChainState)
            const tx = await contract.submitAction(gameId!, actionHash, account)

            // Add to pending actions
            setPendingActions(prev => [...prev, { action, txHash: tx.hash }])

            // Wait for transaction confirmation
            await tx.wait()

            // Remove from pending actions once confirmed
            setPendingActions(prev => prev.filter(a => a.txHash !== tx.hash))

            // Fetch latest state after confirmation
            await fetchGameState(contract, BigInt(id as string), account)

            toast.success('Card drawn successfully!', { id: toastId })
        } catch (error) {
            console.error('Error drawing card:', error)
            // Revert the optimistic update
            await fetchGameState(contract, BigInt(id as string), account)
            toast.error('Failed to draw card. Please try again.', { id: toastId })
        }
    }

    if (!account || !contract || !onChainGameState || !offChainGameState) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="loader"></div>
                <style jsx>{`
                .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #6f03fc;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 2s linear infinite;
                }

                @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
                }
            `}</style>
            </div>
        );
    }

    return (
        <>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                }}
            />
            <div className='hidden scale-[0.975]'></div>
            <div className='transition-transform relative w-full max-w-[1280px] h-[720px] m-20 mt-10 mx-auto bg-[url("/bg-3.jpg")] select-none rounded-3xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)]' >
                <Header />
                {offChainGameState && onChainGameState && (
                    <div className='flex flex-col items-center justify-center mt-20 px-2'>
                        {!offChainGameState.isStarted && !onChainGameState.isStarted ? (
                            <>
                                <StyledButton onClick={handleStartGame} className='w-fit bg-[#00b69a] bottom-4 text-2xl mt-6'>Start Game </StyledButton>
                                <p className='text-xl mt-4 text-white text-center'>
                                    Note: Please wait for another player to join before starting. This game is designed for two players.
                                </p>
                            </>
                        ) : (
                            <div>
                                <GameBoard
                                    currentCardHash={offChainGameState.lastPlayedCardHash!}
                                    players={onChainGameState.players}
                                    currentPlayerIndex={Number(onChainGameState.currentPlayerIndex)}
                                />
                                <PlayerHand
                                    //hand={getPlayerHand(gameId!, account!)}
                                    //hand={offChainGameState.playerHands[account!] || []}
                                    hand={playerHand}
                                    onCardPlay={playCard}
                                />
                                <div className='flex justify-center items-center'>
                                    <StyledButton
                                        onClick={drawCard}
                                        className='w-fit bg-blue-500 bottom-4 text-2xl mt-6'
                                        disabled={!canPlay(getPlayerHand(gameId!, account!), offChainGameState.currentColor!, offChainGameState.currentValue!)}
                                    >
                                        Draw Card
                                    </StyledButton>
                                </div>
                                {pendingActions.length > 0 && (
                                    <div className="mt-4">
                                        <h2 className="text-xl font-bold">Pending Actions:</h2>
                                        <ul>
                                            {pendingActions.map((action, index) => (
                                                <li key={index}>
                                                    {action.action.type === 'playCard'
                                                        ? `Playing card ${action.action.cardHash}`
                                                        : action.action.type === 'drawCard'
                                                            ? 'Drawing a card'
                                                            : 'Unknown action'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}

export default Room