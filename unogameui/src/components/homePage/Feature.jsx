'use client';

import { useState } from 'react';
import Image from 'next/image';

const Feature = () => {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: "Experience",
      description: "Multiplayer Matchmaking - Play with friends or join global online matches.",
      image: "/images/gaming-experience.jpg"
    },
    {
      title: "Gaming Experience",
      description: "Multiplayer Matchmaking - Play with friends or join global online matches.",
      image: "/images/gaming-experience-2.jpg"
    },
    {
      title: "Gaming",
      description: "Multiplayer Matchmaking - Play with friends or join global online matches.",
      image: "/images/gaming-experience-3.jpg"
    }
  ];

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev === features.length - 1 ? 0 : prev + 1));
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev === 0 ? features.length - 1 : prev - 1));
  };

  return (
    <section className="py-20 bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12">
          <h3 className="text-[#FDB813] text-xl mb-2">Features</h3>
          <h2 className="text-white text-4xl font-bold">What we bring to the table</h2>
        </div>

        {/* Feature Carousel */}
        <div className="relative">
          {/* Feature Cards Container */}
          <div className="flex items-center justify-center gap-6">
            {/* Previous Feature */}
            <div className="relative w-64 h-64 opacity-50 transition-all duration-500">
              <Image
                src={features[(currentFeature - 1 + features.length) % features.length].image}
                alt="Previous feature"
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 rounded-lg">
                <div className="p-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">
                    {features[(currentFeature - 1 + features.length) % features.length].title}
                  </h3>
                  <p className="text-sm opacity-80">
                    {features[(currentFeature - 1 + features.length) % features.length].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Feature */}
            <div className="relative w-96 h-96 z-10 transition-all duration-500">
              <Image
                src={features[currentFeature].image}
                alt="Current feature"
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent rounded-lg">
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-2xl font-semibold mb-3">{features[currentFeature].title}</h3>
                  <p className="text-lg opacity-90">{features[currentFeature].description}</p>
                </div>
              </div>
            </div>

            {/* Next Feature */}
            <div className="relative w-64 h-64 opacity-50 transition-all duration-500">
              <Image
                src={features[(currentFeature + 1) % features.length].image}
                alt="Next feature"
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 rounded-lg">
                <div className="p-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">
                    {features[(currentFeature + 1) % features.length].title}
                  </h3>
                  <p className="text-sm opacity-80">
                    {features[(currentFeature + 1) % features.length].description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevFeature}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
            aria-label="Previous feature"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={nextFeature}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
            aria-label="Next feature"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Feature;
