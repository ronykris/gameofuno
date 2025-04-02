import React from "react";
import PlayerViewofOpponent from "./PlayerViewofOpponent";
import CommonView from "./CommonView";
import MainPlayerView from "./MainPlayerView";
import MemoizedMessages from "./Messages";

const GameScreen = ({
  currentUser,
  turn,
  player1Deck,
  player2Deck,
  onUnoClicked,
  playedCardsPile,
  onCardPlayedHandler,
  onCardDrawnHandler,
  drawButtonPressed,
  onSkipButtonHandler,
}) => {
  const playerDeck = currentUser === "Player 1" ? player1Deck : player2Deck;
  const opponentDeck = currentUser === "Player 1" ? player2Deck : player1Deck;
  return (
    <>
      <PlayerViewofOpponent
        turn={turn}
        opponent={currentUser === "Player 1" ? "Player 2" : "Player 1"}
        opponentDeck={opponentDeck}
      />
      <br />
      <CommonView
        isDrawDisabled={turn !== currentUser || drawButtonPressed}
        playedCardsPile={playedCardsPile}
        onCardDrawnHandler={onCardDrawnHandler}
        isUnoDisabled={turn !== currentUser || playerDeck.length !== 2}
        onUnoClicked={onUnoClicked}
      />
      <br />
      <MainPlayerView
        turn={turn}
        mainPlayer={currentUser}
        playerDeck={playerDeck}
        onCardPlayedHandler={onCardPlayedHandler}
        isSkipButtonDisabled={turn !== currentUser || !drawButtonPressed}
        onSkipButtonHandler={onSkipButtonHandler}
      />
      <MemoizedMessages mainPlayer={currentUser} />
    </>
  );
};

export default GameScreen;
