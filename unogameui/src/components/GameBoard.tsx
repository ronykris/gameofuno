import { Card as CardType } from '../lib/types'
import Card from './Card'
import { getCardFromHash } from '../lib/gameLogic'

interface GameBoardProps {
    currentCardHash: string
    players: string[]
    currentPlayerIndex: number
}

export default function GameBoard({ currentCardHash, players, currentPlayerIndex }: GameBoardProps) {
    const currentCard = getCardFromHash(currentCardHash)
    console.log('Current card:', currentCard);

    if (!currentCard) {
        console.error('Failed to retrieve current card from hash:', currentCardHash);
      }

  return (
    <div className="flex flex-col items-center">
      {currentCard ? (
        <Card card={currentCard} />
      ) : (
        <div className="w-20 h-32 rounded-lg bg-gray-300 flex items-center justify-center">
          No card
        </div>
      )}
      <div className="mt-4 text-white text-sm md:text-lg">
        {players.map((player, index) => (
          <div key={player} className={`${index === currentPlayerIndex ? 'font-bold' : ''}`}>
            {player}
          </div>
        ))}
      </div>
    </div>
  )
}