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

export function initializeOffChainState(gameId: bigint, players: string[]): OffChainGameState {
    const initialState: OffChainGameState = {
      id: gameId,
      players,
      isActive: true,
      currentPlayerIndex: 0,
      lastActionTimestamp: BigInt(Math.floor(Date.now() / 1000)),
      turnCount: BigInt(0),
      directionClockwise: true,
      playerHandsHash: {},
      deckHash: '',
      discardPileHash: '',
      currentColor: null,
      currentValue: null,
      lastPlayedCardHash: null,
      stateHash: '',
      isStarted: false
    };
  
    initialState.stateHash = hashState(initialState);
    return initialState;
  }

  export function startGame(state: OffChainGameState): OffChainGameState {
    const newState = { ...state };
    const deck = shuffleDeck(createDeck(), Number(state.id));
    console.log(deck)
    
    // Deal cards
    newState.playerHandsHash = {};
    state.players.forEach(player => {
      const hand = deck.splice(0, 7);
      newState.playerHandsHash[player] = hashCards(hand);
    });
  
    // Set up discard pile
    const firstCard = deck.pop()!;
    newState.discardPileHash = hashCards([firstCard]);
    newState.currentColor = firstCard.color;
    newState.currentValue = firstCard.value;
    newState.lastPlayedCardHash = hashCard(firstCard);
  
    // Hash remaining deck
    newState.deckHash = hashCards(deck);
  
    // Randomly choose first player
    newState.currentPlayerIndex = Math.floor(Math.random() * state.players.length);
  
    newState.isStarted = true;
    newState.stateHash = hashState(newState);
  
    return newState;
  }

  export function applyActionToOffChainState(state: OffChainGameState, action: Action): OffChainGameState {
    const newState = { ...state };
  
    // Highlight start
    switch (action.type) {
      case 'startGame':
        return startGame(state);
      case 'playCard':
        // Implementation depends on how you want to handle card playing with hashed states
        break;
      case 'drawCard':
        // Implementation depends on how you want to handle card drawing with hashed states
        break;
    }
    // Highlight end
  
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
    newState.turnCount++;
    newState.lastActionTimestamp = BigInt(Math.floor(Date.now() / 1000));
  
    newState.stateHash = hashState(newState);
  
    return newState;
  }

function getNextPlayer(currentPlayer: string, playerHands: { [address: string]: Card[] }): string {
  const players = Object.keys(playerHands);
  const currentIndex = players.indexOf(currentPlayer);
  return players[(currentIndex + 1) % players.length];
}

export function hashState(state: OffChainGameState): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedState = abiCoder.encode(
      ['uint256', 'address[]', 'bool', 'uint256', 'uint256', 'uint256', 'bool', 'string', 'string', 'string', 'string', 'string', 'string', 'bool'],
      [
        state.id,
        state.players,
        state.isActive,
        state.currentPlayerIndex,
        state.lastActionTimestamp,
        state.turnCount,
        state.directionClockwise,
        JSON.stringify(state.playerHandsHash),
        state.deckHash,
        state.discardPileHash,
        state.currentColor || '',
        state.currentValue || '',
        state.lastPlayedCardHash || '',
        state.isStarted
      ]
    );
    return ethers.keccak256(encodedState);
  }

export function hashAction(action: Action): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedAction = abiCoder.encode(
      ['string', 'address', 'string'],
      [
        action.type,
        action.player,
        action.cardHash || ''
      ]
    );
    return ethers.keccak256(encodedAction);
  }

  export function hashCard(card: Card): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedCard = abiCoder.encode(
      ['string', 'string'],
      [card.color, card.value]
    );
    return ethers.keccak256(encodedCard);
  }

  export function hashCards(cards: Card[]): string {
    const cardHashes = cards.map(hashCard);
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encodedCards = abiCoder.encode(['bytes32[]'], [cardHashes]);
    return ethers.keccak256(encodedCards);
  }

  export function storePlayerHand(gameId: bigint, playerAddress: string, hand: Card[]): void {
    const key = `game_${gameId}_player_${playerAddress}`;
    const encryptedHand = JSON.stringify(hand); // In a real implementation, encrypt this data
    localStorage.setItem(key, encryptedHand);
  }
  
  export function getPlayerHand(gameId: bigint, playerAddress: string): Card[] {
    const key = `game_${gameId}_player_${playerAddress}`;
    const encryptedHand = localStorage.getItem(key);
    if (encryptedHand) {
      return JSON.parse(encryptedHand); // In a real implementation, decrypt this data
    }
    return [];
  }