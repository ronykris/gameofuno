import { ethers } from "ethers";

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4';

export interface Card {
  color: CardColor;
  value: CardValue;
}

export interface OffChainGameState {
  playerHands: { [address: string]: Card[] };
  deck: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  currentValue: CardValue;
  lastPlayedCard: Card | null;
}

export interface OnChainGameState {
  players: string[];
  isActive: boolean;
  currentPlayerIndex: number;
  initialStateHash: string;
  lastActionTimestamp: number;
  turnCount: number;
  directionClockwise: boolean;
  seed: number;
}

export interface Action {
  player: string;
  card: Card | null;  // null represents drawing a card
}

export interface UnoGameContract {
  createGame: () => Promise<any>;
  joinGame: (gameId: BigInt) => Promise<any>;
  submitAction: (gameId: number, actionHash: string, isReverse: boolean, isSkip: boolean, isDrawTwo: boolean, isWildDrawFour: boolean) => Promise<any>;
  getGameState: (gameId: number) => Promise<OnChainGameState>;
  getGameActions: (gameId: number) => Promise<{ player: string; actionHash: string; timestamp: number }[]>;
  endGame: (gameId: number) => Promise<any>;
  getActiveGames: () => Promise<BigInt[]>;
}