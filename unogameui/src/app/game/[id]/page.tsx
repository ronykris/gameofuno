"use client";

import {SoundProvider} from "@/context/SoundProvider";
import Room from "@/components/newComponents/Room";

const GameWithSoundProvider = () => {
  return (
    <SoundProvider>
      <Room />
    </SoundProvider>
  );
};

export default GameWithSoundProvider;