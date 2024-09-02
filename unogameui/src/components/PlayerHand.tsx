import { Card as CardType } from '../lib/types'
import Card from './Card'

interface PlayerHandProps {
  hand: CardType[]
  onCardPlay: (card: CardType) => void
}

export default function PlayerHand({ hand, onCardPlay }: PlayerHandProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {hand.map((card, index) => (
        <Card key={index} card={card} onClick={() => onCardPlay(card)} />
      ))}
    </div>
  )
}