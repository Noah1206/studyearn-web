'use client';

import { useEffect, useState } from 'react';

interface Coin {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  type: 'gold' | 'silver' | 'bronze';
}

export function FallingCoins() {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    // Generate random coins
    const generatedCoins: Coin[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 20 + Math.random() * 30,
      rotation: Math.random() * 360,
      type: ['gold', 'silver', 'bronze'][Math.floor(Math.random() * 3)] as 'gold' | 'silver' | 'bronze',
    }));
    setCoins(generatedCoins);
  }, []);

  const coinColors = {
    gold: {
      bg: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500',
      shadow: 'shadow-yellow-500/30',
      inner: 'bg-yellow-200',
    },
    silver: {
      bg: 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400',
      shadow: 'shadow-gray-400/30',
      inner: 'bg-gray-100',
    },
    bronze: {
      bg: 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-500',
      shadow: 'shadow-orange-500/30',
      inner: 'bg-orange-200',
    },
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute animate-fall"
          style={{
            left: `${coin.left}%`,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
          }}
        >
          <div
            className={`
              rounded-full ${coinColors[coin.type].bg} ${coinColors[coin.type].shadow}
              shadow-lg flex items-center justify-center
              animate-spin-slow border-2 border-white/30
            `}
            style={{
              width: coin.size,
              height: coin.size,
              transform: `rotate(${coin.rotation}deg)`,
            }}
          >
            <div
              className={`rounded-full ${coinColors[coin.type].inner}`}
              style={{
                width: coin.size * 0.6,
                height: coin.size * 0.6,
              }}
            />
          </div>
        </div>
      ))}

      {/* Floating sparkles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute animate-float"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          <span className="text-2xl opacity-60">✨</span>
        </div>
      ))}

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
