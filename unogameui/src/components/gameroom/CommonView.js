import React from "react";

const CommonView = ({playedCardsPile, onCardDrawnHandler, isDrawDisabled, onUnoClicked, isUnoDisabled}) => {
  return (
    <div className='middleInfo'>
      <button
        className='game-button'
        disabled={isDrawDisabled}
        onClick={onCardDrawnHandler}
        style={isDrawDisabled ? {pointerEvents: "none"} : null}
      >
        DRAW CARD
      </button>
      {playedCardsPile && playedCardsPile.length > 0 && (
        <img
          style={{pointerEvents: "none"}}
          className='Card'
          alt={`cards-front ${playedCardsPile[playedCardsPile.length - 1]}`}
          src={`../assets/cards-front/${playedCardsPile[playedCardsPile.length - 1]}.png`}
        />
      )}
      <button
        className='game-button orange'
        disabled={isUnoDisabled}
        onClick={onUnoClicked}
        style={isUnoDisabled ? {pointerEvents: "none"} : null}
      >
        UNO
      </button>
    </div>
  );
};

export default CommonView;
