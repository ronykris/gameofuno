import React, {useState} from "react";
import {Link} from "react-router-dom";
import randomCodeGenerator from "../utils/randomCodeGenerator";

const Homepage = () => {
  const [roomCode, setRoomCode] = useState("");

  return (
    <div className='Homepage'>
      <div className='homepage-menu'>
        <img alt='uno-logo' src={"../assets/logo.png"} width='200px' />
        <div className='homepage-form'>
          <div className='homepage-join'>
            <input
              type='text'
              placeholder='Game Code'
              style={{padding: "0.25rem", fontSize: "1rem"}}
              onChange={(event) => setRoomCode(event.target.value)}
            />
            <Link to={`/test/room/${roomCode}`}>
              <button className='game-button green'>JOIN GAME</button>
            </Link>
          </div>
          <h1>OR</h1>
          <div className='homepage-create'>
            <Link to={`/test/room/${randomCodeGenerator(5)}`}>
              <button className='game-button orange'>CREATE GAME</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
