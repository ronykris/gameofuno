import { Card as CardType } from '../lib/types'
import Card from './Card'

interface GameBoardProps {
  currentCard: CardType
  players: string[]
  currentPlayerIndex: number
}

export default function GameBoard({ currentCard, players, currentPlayerIndex }: GameBoardProps) {
  return (
    <div className="flex flex-col items-center">
      <Card card={currentCard} />
      <div className="mt-4">
        {players.map((player, index) => (
          <div key={player} className={`${index === currentPlayerIndex ? 'font-bold' : ''}`}>
            {player}
          </div>
        ))}
      </div>
    </div>
  )
}