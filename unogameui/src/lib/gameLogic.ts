import { ethers } from 'ethers';
import { Card, CardColor, CardValue, OffChainGameState, Action } from './types';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];

export function isValidPlay(card: Card, { currentColor, currentValue }: { currentColor: CardColor; currentValue: CardValue }): boolean {
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === currentValue) return true;
  return false;
}

export function canPlay(hand: Card[], currentColor: CardColor, currentValue: CardValue): boolean {
  return hand.some(card => isValidPlay(card, { currentColor, currentValue }));
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  COLORS.forEach(color => {
    VALUES.forEach(value => {
      deck.push({ color, value });
      if (value !== '0') {
        deck.push({ color, value });
      }
    });
  });
  // Add wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'wild', value: 'wild' });
    deck.push({ color: 'wild', value: 'wild_draw4' });
  }
  return deck;
}

export function shuffleDeck(deck: Card[], seed: number): Card[] {
  const shuffled = [...deck];
  let currentIndex = shuffled.length;
  let temporaryValue, randomIndex;

  // Seed the random number generator
  let random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  while (0 !== currentIndex) {
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = shuffled[currentIndex];
    shuffled[currentIndex] = shuffled[randomIndex];
    shuffled[randomIndex] = temporaryValue;
  }

  return shuffled;
}

export function initializeOffChainState(seed: number, players: string[]): OffChainGameState {
    const deck = shuffleDeck(createDeck(), seed)
    const playerHands: { [address: string]: Card[] } = {}
    players.forEach(player => {
      playerHands[player] = deck.splice(0, 7)
    })
    const firstCard = deck.pop()!
    return {
      playerHands,
      deck,
      discardPile: [firstCard],
      currentColor: firstCard.color,
      currentValue: firstCard.value,
      lastPlayedCard: firstCard
    }
  }

export function applyActionToOffChainState(currentState: OffChainGameState, action: Action): OffChainGameState {
    const newState = JSON.parse(JSON.stringify(currentState)) as OffChainGameState;
    const { player, card } = action;
  
    if (card) {
      // Play card
      newState.playerHands[player] = newState.playerHands[player].filter(c => !(c.color === card.color && c.value === card.value));
      newState.discardPile.push(card);
      newState.currentColor = card.color === 'wild' ? newState.currentColor : card.color;
      newState.currentValue = card.value;
      newState.lastPlayedCard = card;
  
      // Handle special cards
      switch (card.value) {
        case 'draw2':
          // Next player draws 2 cards
          const nextPlayer = getNextPlayer(player, newState.playerHands);
          newState.playerHands[nextPlayer].push(...newState.deck.splice(0, 2));
          break;
        case 'wild_draw4':
          // Next player draws 4 cards
          const nextPlayerWild4 = getNextPlayer(player, newState.playerHands);
          newState.playerHands[nextPlayerWild4].push(...newState.deck.splice(0, 4));
          break;
      }
    } else {
      // Draw card
      if (newState.deck.length === 0) {
        // Reshuffle discard pile if deck is empty
        newState.deck = shuffleDeck([...newState.discardPile.slice(0, -1)], Date.now());
        newState.discardPile = [newState.discardPile[newState.discardPile.length - 1]];
      }
      const drawnCard = newState.deck.pop()!;
      newState.playerHands[player].push(drawnCard);
    }
  
    return newState;
  }

function getNextPlayer(currentPlayer: string, playerHands: { [address: string]: Card[] }): string {
  const players = Object.keys(playerHands);
  const currentIndex = players.indexOf(currentPlayer);
  return players[(currentIndex + 1) % players.length];
}

export function hashState(state: OffChainGameState): string {
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(state)))
}