import { Card as CardType } from '../lib/types'

interface CardProps {
  card: CardType
  onClick?: () => void
}

export default function Card({ card, onClick }: CardProps) {

  return (
    <div
      className={`w-16 h-24 sm:w-20 sm:h-32 rounded-lg flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform overflow-hidden`}
      onClick={onClick}
    >
      <img
        src={`/${card.color}/${card.color}_${card.value}.png`}
        alt={`${card.color} ${card.value}`}
        className="w-full h-full object-cover"
      />
    </div>
  )
}