import { Card as CardType } from '../lib/types'
import Card from './Card'
import { getCardFromHash } from '../lib/gameLogic'

interface PlayerHandProps {
  hand: string[]
  onCardPlay: (cardHash: string) => void
}

export default function PlayerHand({ hand, onCardPlay }: PlayerHandProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {hand.map((cardHash, index) => {
        const card = getCardFromHash(cardHash)
        return card ? (
          <Card 
            key={cardHash} 
            card={card} 
            onClick={() => onCardPlay(cardHash)} 
          />
        ) : (
          <div key={cardHash}>Unknown card</div>
        )
      })}
    </div>
  )
}