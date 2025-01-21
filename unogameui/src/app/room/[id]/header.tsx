import React from "react";
import bgMusic from "../../../assets/sounds/game-bg-music.mp3";
import useSound from "use-sound";
import {useSoundProvider} from "../../../context/SoundProvider";

function Header() {
  const {isSoundMuted, toggleMute} = useSoundProvider();
  const [isMusicMuted, setMusicMuted] = React.useState(true);
  const [playBBgMusic, {pause}] = useSound(bgMusic, {loop: true});

  return (
    <div className='topInfo'>
      <span>
        {/* <button className='game-button green' onClick={toggleMute}>
          <span className='material-icons'>{isSoundMuted ? "volume_off" : "volume_up"}</span>
        </button> */}
        <button
          className='game-button green'
          onClick={() => {
            if (isMusicMuted) playBBgMusic();
            else pause();
            setMusicMuted(!isMusicMuted);
          }}
        >
          <span className='material-icons'>{isMusicMuted ? "music_off" : "music_note"}</span>
        </button>
      </span>
    </div>
  );
}
const MemoizedHeader = React.memo(Header);
export default MemoizedHeader;