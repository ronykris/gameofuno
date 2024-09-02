import Lobby from '../components/Lobby'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">UNO Game Lobby</h1>
      <Lobby />
    </main>
  )
}