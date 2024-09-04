import { ethers } from 'ethers';
import { Card, CardColor, CardValue, OffChainGameState, Action } from './types';
import CryptoJS from 'crypto-js';

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];

let cardHashMap: Map<string, Card> = new Map();

export function isValidPlay(cardHash: string, { currentColor, currentValue }: { currentColor: CardColor; currentValue: CardValue }): boolean {
    const card = getCardFromHash(cardHash);
    if (!card) return false;
    if (card.color === 'wild') return true;
    if (card.color === currentColor) return true;
    if (card.value === currentValue) return true;
    return false;
}

export function canPlay(handHashes: string[], currentColor: CardColor, currentValue: CardValue): boolean {
    return handHashes.some(cardHash => {
        const card = getCardFromHash(cardHash);
        return card ? isValidPlay(cardHash, { currentColor, currentValue }) : false;
      });
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
      playerHands: {},
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
    
    cardHashMap.clear()

    // Deal hands
    newState.playerHandsHash = {};
    newState.playerHands = {};
    state.players.forEach(player => {
      const hand = deck.splice(0, 7);
      const handHashes = hand.map(card => {
        const hash = hashCard(card);
        cardHashMap.set(hash, card);
        return hash;
      });
      newState.playerHandsHash[player] = hashCards(hand);
      newState.playerHands[player] = handHashes;
    });
  
    // Set up discard pile
    const firstCard = deck.pop()!;
    const firstCardHash = hashCard(firstCard);
    cardHashMap.set(firstCardHash, firstCard);
    newState.discardPileHash = hashCards([firstCard]);
    newState.currentColor = firstCard.color;
    newState.currentValue = firstCard.value;
    newState.lastPlayedCardHash = firstCardHash;
  
    // Hash remaining deck
    newState.deckHash = hashCards(deck);
    deck.forEach(card => {
        const hash = hashCard(card);
        cardHashMap.set(hash, card);
    });
  
    // Randomly choose first player
    newState.currentPlayerIndex = Math.floor(Math.random() * state.players.length);
  
    newState.isStarted = true;
    newState.stateHash = hashState(newState);
  
    return newState;
  }

  export function applyActionToOffChainState(state: OffChainGameState, action: Action): OffChainGameState {
    const newState = { ...state };
  
    switch (action.type) {
      case 'startGame':
        return startGame(state);
      case 'playCard':
        if (action.cardHash) {
            const playerHand = newState.playerHands[action.player];
            const cardIndex = playerHand.indexOf(action.cardHash);
            if (cardIndex !== -1) {
                playerHand.splice(cardIndex, 1);
            }
            // Update discard pile
            newState.discardPileHash = action.cardHash;
            newState.lastPlayedCardHash = action.cardHash;
            const playedCard = getCardFromHash(action.cardHash);
            if (playedCard) {
                newState.currentColor = playedCard.color;
                newState.currentValue = playedCard.value;
            }
        }
        break;
      case 'drawCard':
        // Implementation depends on how you want to handle card drawing with hashed states
        break;
    }
      
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

  function encryptHand(hand: Card[], gameId: bigint, playerAddress: string): string {
    const key = `${gameId}_${playerAddress}`;
    return CryptoJS.AES.encrypt(JSON.stringify(hand), key).toString();
  }

  function decryptHand(encryptedHand: string, gameId: bigint, playerAddress: string): string[] {
    const key = `${gameId}_${playerAddress}`;
    const bytes = CryptoJS.AES.decrypt(encryptedHand, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  export function storePlayerHand(gameId: bigint, playerAddress: string, handHashes: string[]): void {
    const key = `game_${gameId}_player_${playerAddress}`;
    console.log('Storing player hand:', { gameId, playerAddress, handHashes });
    const hand = handHashes.map(hash => getCardFromHash(hash)).filter(card => card !== undefined) as Card[];
    const encryptedHand = encryptHand(hand, gameId, playerAddress);
    localStorage.setItem(key, encryptedHand);
  }
  
  export function getPlayerHand(gameId: bigint, playerAddress: string): string[] {
    const key = `game_${gameId}_player_${playerAddress}`;
    const encryptedHand = localStorage.getItem(key);    
    if (encryptedHand) {
        console.log('Retrieved encrypted hand for player:', playerAddress);
        return decryptHand(encryptedHand, gameId, playerAddress);
    }
    console.log('No hand found for player:', playerAddress);
    return [];
  }

  // This function should be used when you need to get the actual Card objects
  export function getPlayerHandCards(gameId: bigint, playerAddress: string): Card[] {
    const hashes = getPlayerHand(gameId, playerAddress);
    return hashes.map(hash => getCardFromHash(hash)).filter((card): card is Card => card !== undefined);
  }

  export function getCardFromHash(cardHash: string): Card | undefined {
    console.log('Getting card for hash:', cardHash);
    const card = cardHashMap.get(cardHash);
    console.log('Retrieved card:', card);
    return card;
  }

  