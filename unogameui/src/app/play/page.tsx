'use client'

import StyledButton from '@/components/styled-button'
import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import TokenInfoBar from '@/components/TokenBar'
import { UnoGameContract } from '@/lib/types';
import { getContract, getContractNew } from '@/lib/web3';
import io, { Socket } from "socket.io-client";
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useWriteContract } from 'wagmi';
import UNOContractJson from '@/constants/UnoGame.json'
import { useLaunchParams } from '@telegram-apps/sdk-react';

const CONNECTION = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'https://unosocket-6k6gsdlfoa-el.a.run.app/';

export default function PlayGame() {

    const { address, status } = useAccount()
    const { ready, user, authenticated, login, connectWallet, logout, linkWallet } = usePrivy();
    const [open, setOpen] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [joinLoading, setJoinLoading] = useState(false)
    const [account, setAccount] = useState<string | null>(null)
    const [contract, setContract] = useState<UnoGameContract | null>(null)
    const [games, setGames] = useState<BigInt[]>([])
    const router = useRouter()
    const lp = useLaunchParams();

    const socket = useRef<Socket | null>(null);

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
        if (!socket.current) {
            socket.current = io(CONNECTION, {
                transports: ["websocket"],
            }) as any; // Type assertion to fix the type mismatch

            console.log("Socket connection established");
        }

    }, [socket]);

    useEffect(() => {
        if (contract) {
            console.log("Contract initialized, calling fetchGames"); // Add this line
            fetchGames();

            if (socket.current) {
                console.log("Socket connection established");
                // Add listener for gameRoomCreated event
                socket.current.on("gameRoomCreated", () => {
                    console.log("Game room created event received"); // Add this line
                    fetchGames();
                });

                // Cleanup function
                return () => {
                    if (socket.current) {
                        socket.current.off("gameRoomCreated");
                    }
                };
            }
        } else {
            console.log("Contract not initialized yet"); // Add this line
        }
    }, [contract, socket])


    const ISSERVER = typeof window === "undefined";

    const openHandler = () => {
        setOpen(false)
    }

    const createGame = async () => {
        if (contract) {
            try {
                setCreateLoading(true)
                console.log('Creating game...')
                const tx = await contract.createGame(account as `0x${string}` | undefined)
                console.log('Transaction hash:', tx.hash)
                await tx.wait()
                console.log('Game created successfully')

                if (socket && socket.current) {
                    socket.current.emit("createGameRoom");
                }

                fetchGames()
                setCreateLoading(false)
            } catch (error) {
                console.error('Failed to create game:', error)
                setCreateLoading(false)
            }
        }
    }

    const joinGame = async (gameId: BigInt) => {
        if (contract) {
            try {
                setJoinLoading(true)
                console.log(`Joining game ${gameId.toString()}...`)
                const gameIdBigint = BigInt(gameId.toString())
                const tx = await contract.joinGame(gameIdBigint, account as `0x${string}` | undefined)
                console.log('Transaction hash:', tx.hash)
                await tx.wait()

                setJoinLoading(false)

                console.log('Joined game successfully')
                router.push(`/room/${gameId.toString()}`)
            } catch (error) {
                console.error('Failed to join game:', error)
            }
        }
    }

    const setup = async () => {
        if (address) {
            try {
                const { contract } = await getContractNew()
                setContract(contract)
                setAccount(address)
            } catch (error) {
                console.error('Failed to setup contract:', error)
            }
        }
    }

    useEffect(() => {
        if (status === 'connected' && address) {
            setup()
        } else {
            setAccount(null)
            setContract(null)
        }
    }, [status, address, authenticated])

    return (
        <div className='relative'>
            <TokenInfoBar />
            <div className='bg-white w-full max-w-[1280px] h-[720px] overflow-hidden mx-auto my-8 px-4 py-2 rounded-lg bg-cover bg-[url("/bg-2.jpg")] relative shadow-[0_0_20px_rgba(0,0,0,0.8)]'>
                <div className='absolute inset-0 bg-no-repeat bg-[url("/table-1.png")]'></div>
                <div className='absolute left-8 -right-8 top-14 -bottom-14 bg-no-repeat bg-[url("/dealer.png")] transform-gpu'>
                    <div className='absolute -left-8 right-8 -top-14 bottom-14 bg-no-repeat bg-[url("/card-0.png")] animate-pulse'></div>
                </div>
                <div className='absolute top-0 md:left-1/2 md:right-0 bottom-0 w-[calc(100%-2rem)] md:w-auto md:pr-20 py-12'>
                    <div className='text-[#ffffff] font-bold text-4xl text-shadow-md mb-2'>Hello {lp.initData?.user?.firstName ?? "User"},</div>
                    {!address ?
                        <div className='relative text-center flex justify-center'>
                            <img src='/login-button-bg.png' />
                            <div className='left-1/2 -translate-x-1/2 absolute bottom-4'>
                                <StyledButton disabled={!ready} data-testid="connect" roundedStyle='rounded-full' className='bg-[#ff9000] text-2xl' onClick={login}>{authenticated ? `Connected Wallet` : `Connect Wallet`}</StyledButton>
                            </div>
                        </div>
                        : <>
                            <StyledButton onClick={() => createGame()} className='w-fit bg-[#00b69a] bottom-4 text-2xl my-3 mx-auto'>{createLoading == true ? 'Creating...' : 'Create Game Room'}</StyledButton>
                            <p className='text-white text-sm font-mono'>Note: Don't join the room where game is already started</p>
                            {joinLoading == true && <div className='text-white mt-2 text-2xl shadow-lg'>Wait, while we are joining your game room...</div>}
                            <h2 className="text-2xl font-bold mb-4 text-white">Active Game Rooms:</h2>
                            <ScrollArea className="h-[620px] rounded-md border border-gray-200 bg-white p-4">
                                <ul className="space-y-2">
                                    {games.toReversed().map(gameId => (
                                        <li key={gameId.toString()} className="mb-2 bg-gray-100 p-4 rounded-lg shadow flex flex-row justify-between items-center">
                                            <h2 className="text-xl font-semibold text-gray-800">Game {gameId.toString()}</h2>
                                            <StyledButton onClick={() => joinGame(gameId)} className='w-fit bg-[#00b69a] bottom-4 text-2xl'>Join Game </StyledButton>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </>
                    }
                    {/* {"hello" &&
                        <div className='flex flex-col items-center'>
                            <StyledButton onClick={() => router.push("/create")} className='w-fit bg-[#00b69a] bottom-4 text-2xl mt-6'>Create Table </StyledButton>
                            <StyledButton onClick={() => router.push("/game/join")} className='w-fit bg-[#00b69a] bottom-4 text-2xl mt-6'>Join Game </StyledButton>
                            {loading &&
                                <div className='text-white mt-2 text-2xl shadow-lg'>
                                    Wait, while we are retriving your details...
                                </div>
                            }
                        </div>
                    } */}
                </div>
            </div>
        </div >
    )
}