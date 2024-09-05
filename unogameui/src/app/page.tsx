"use client"

import { useEffect, useRef } from 'react';
import Lobby from '../components/Lobby'
import io from "socket.io-client";

const CONNECTION = 'localhost:4000';
// const CONNECTION = "/";

export default function Home() {

  const socket = useRef();

  useEffect(() => {
    if (!socket.current) {
      socket.current = io(CONNECTION, {
        transports: ["websocket"],
      }) as any; // Type assertion to fix the type mismatch
    }

  }, [socket]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">UNO Game Lobby</h1>
      <Lobby socket={socket}/>
    </main>
  )
}