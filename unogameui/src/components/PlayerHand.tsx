import { Card as CardType } from '../lib/types'
import Card from './Card'
import { getCardFromHash } from '../lib/gameLogic'

interface PlayerHandProps {
  hand: string[]
  onCardPlay: (cardHash: string) => void
}

export default function PlayerHand({ hand, onCardPlay }: PlayerHandProps) {
  console.log('Player hand (hashes):', hand);
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {hand.map((cardHash, index) => {
        const card = getCardFromHash(cardHash)
        console.log(`Card ${index}:`, { hash: cardHash, card });
        return card ? (
          <Card 
            key={cardHash}
            card={card} 
            onClick={() => onCardPlay(cardHash)} 
          />
        ) : (
          <div key={cardHash} className="w-20 h-32 rounded-lg bg-gray-300 flex items-center justify-center">
            Unknown
          </div>
        )
      })}
    </div>
  )
}