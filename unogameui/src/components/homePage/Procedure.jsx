'use client';

import Image from 'next/image';

const Procedure = () => {
  const steps = [
    {
      image: '/images/connect-wallet.png',
      title: 'Connect Wallet',
      isButton: true
    },
    {
      image: '/images/join-room.png',
      title: 'Join Room',
      isButton: true
    },
    {
      image: '/images/waiting-room.png',
      title: 'Wait for Player 2 to Join',
      isButton: true
    },
    {
      image: '/images/game-start.png',
      title: 'Game Starts!',
      isButton: true
    }
  ];

  return (
    <section className="py-20 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h3 className="text-[#FDB813] text-xl mb-2">how to join and play game</h3>
          <h2 className="text-white text-6xl font-bold">LET'S START</h2>
        </div>

        {/* Game Flow Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Lines */}
          <div className="absolute inset-0 z-0">
            <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
              {/* First curved line from Connect Wallet to Join Room */}
              <path
                d="M250,150 C350,150 400,250 500,250"
                fill="none"
                stroke="#FF9000"
                strokeWidth="2"
                strokeDasharray="6,6"
                className="animate-dash"
              />
              {/* Second curved line from Join Room to Wait for Player */}
              <path
                d="M650,250 C750,250 800,350 900,350"
                fill="none"
                stroke="#FF9000"
                strokeWidth="2"
                strokeDasharray="6,6"
                className="animate-dash"
              />
              {/* Third curved line from Wait for Player to Game Starts */}
              <path
                d="M1050,350 C1100,350 1150,450 1200,450"
                fill="none"
                stroke="#FF9000"
                strokeWidth="2"
                strokeDasharray="6,6"
                className="animate-dash"
              />
              {/* Animated dots */}
              <circle className="animate-move-dot" r="4" fill="#FF9000">
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  path="M250,150 C350,150 400,250 500,250 M650,250 C750,250 800,350 900,350 M1050,350 C1100,350 1150,450 1200,450"
                />
              </circle>
            </svg>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-2 gap-x-24 gap-y-32 relative z-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative ${
                  index % 2 === 0 ? 'transform -translate-y-8' : 'transform translate-y-8'
                }`}
              >
                {/* Step Image */}
                <div className="relative w-72 h-72 mx-auto border-2 border-[#00D1FF]/30 rounded-lg overflow-hidden group">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Step Label */}
                {step.isButton && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#00D1FF] text-black px-6 py-2 rounded-md font-medium shadow-[0_0_20px_rgba(0,209,255,0.5)] whitespace-nowrap">
                      {step.title}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Procedure;
