import React from "react";
import MemoizedSpinner from "./Spinner";

const PlayerViewofOpponent = ({ opponentDeck, turn, opponent }) => {
  return (
    <div className={`${opponent === "Player 1" ? "player1" : "player2"}Deck`}>
      {opponentDeck.map((item, i) => (
        <img
          style={{ pointerEvents: "none" }}
          key={item + i}
          alt={`opponent-cards-back`}
          className={`Card ${turn === opponent ? "glow" : ""}`}
          src={`../assets/card-back.png`}
        />
      ))}
      {turn === opponent ? <MemoizedSpinner /> : null}
    </div>
  );
};

export default PlayerViewofOpponent;
