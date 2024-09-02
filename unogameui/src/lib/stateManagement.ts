import { ethers } from 'ethers';
import { OffChainGameState, OnChainGameState, Action, Card } from './types';
import { initializeOffChainState, applyActionToOffChainState, hashState, isValidPlay } from './gameLogic';

export function reconstructOffChainState(seed: number, players: string[], actionHashes: string[]): OffChainGameState {
  let state = initializeOffChainState(seed, players);
  for (const hash of actionHashes) {
    const action = reconstructActionFromHash(hash, state);
    state = applyActionToOffChainState(state, action);
  }
  return state;
}

export function reconstructActionFromHash(hash: string, currentState: OffChainGameState): Action {
  for (const [player, hand] of Object.entries(currentState.playerHands)) {
    for (const card of hand) {
      if (isValidPlay(card, currentState)) {
        const potentialAction = { player, card };
        const potentialNewState = applyActionToOffChainState(currentState, potentialAction);
        const potentialHash = hashState(potentialNewState);
        if (potentialHash === hash) {
          return potentialAction;
        }
      }
    }
    // Check for draw action
    const drawAction = { player, card: null };
    const drawState = applyActionToOffChainState(currentState, drawAction);
    const drawHash = hashState(drawState);
    if (drawHash === hash) {
      return drawAction;
    }
  }
  throw new Error('Failed to reconstruct action from hash');
}

export function verifyOffChainState(offChainState: OffChainGameState, onChainState: OnChainGameState): boolean {
  if (Object.keys(offChainState.playerHands).length !== onChainState.players.length) return false;
  if (offChainState.discardPile.length !== onChainState.turnCount + 1) return false;
  
  // Verify total number of cards
  const totalCards = Object.values(offChainState.playerHands).flat().length 
    + offChainState.deck.length 
    + offChainState.discardPile.length;
  if (totalCards !== 108) return false; // Standard UNO deck has 108 cards

  // Verify initial state hash
  const initialStateHash = hashState(offChainState);
  if (initialStateHash !== onChainState.initialStateHash) return false;

  return true;
}