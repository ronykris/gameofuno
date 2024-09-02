import { Card as CardType } from '../lib/types'

interface CardProps {
  card: CardType
  onClick?: () => void
}

export default function Card({ card, onClick }: CardProps) {
  const colorClass = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    wild: 'bg-gray-500',
  }[card.color]

  return (
    <div 
      className={`w-20 h-32 rounded-lg ${colorClass} text-white flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform`}
      onClick={onClick}
    >
      <span className="text-2xl font-bold">{card.value}</span>
    </div>
  )
}