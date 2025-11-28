'use client';

import { useEffect, useRef, memo, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface MatchConfettiProps {
  isActive: boolean;
}

const MatchConfettiComponent = ({ isActive }: MatchConfettiProps) => {
  const wasActiveRef = useRef(false);

  const fireConfetti = useCallback(() => {
    const scalar = 2;
    const triangle = confetti.shapeFromPath({
      path: "M0 10 L5 0 L10 10z",
    });
    const square = confetti.shapeFromPath({
      path: "M0 0 L10 0 L10 10 L0 10 Z",
    });
    const heart = confetti.shapeFromPath({
      path: "M5 3 C5 0 0 0 0 3 C0 6 5 9 5 9 C5 9 10 6 10 3 C10 0 5 0 5 3 Z",
    });
    const star = confetti.shapeFromPath({
      path: "M5 0 L6 3 L10 4 L7 6 L8 10 L5 8 L2 10 L3 6 L0 4 L4 3 Z",
    });

    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#ff6b9d', '#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'],
      shapes: [triangle, square, heart, star],
      scalar,
    };

    const shoot = () => {
      // Center burst
      confetti({
        ...defaults,
        particleCount: 40,
        origin: { x: 0.5, y: 0.5 },
      });

      // Left side
      confetti({
        ...defaults,
        particleCount: 25,
        origin: { x: 0.2, y: 0.6 },
        angle: 60,
        spread: 80,
      });

      // Right side
      confetti({
        ...defaults,
        particleCount: 25,
        origin: { x: 0.8, y: 0.6 },
        angle: 120,
        spread: 80,
      });

      // Small circles
      confetti({
        ...defaults,
        particleCount: 20,
        scalar: scalar / 2,
        shapes: ['circle'],
        origin: { x: 0.5, y: 0.5 },
      });
    };

    // Fire confetti in sequence
    shoot();
    setTimeout(shoot, 150);
    setTimeout(shoot, 300);
  }, []);

  useEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = isActive;

    // Rising edge detection: fire confetti when isActive changes from false to true
    if (isActive && !wasActive) {
      // Schedule in next microtask to avoid synchronous calls
      queueMicrotask(fireConfetti);
    }
  }, [isActive, fireConfetti]);

  // Show "MATCHED!" text when active
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-match-popup">
        <div 
          className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 
                     drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          style={{
            textShadow: '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.4)',
          }}
        >
          🎉 MATCHED! 🎉
        </div>
      </div>

      <style jsx>{`
        @keyframes match-popup {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          30% {
            transform: scale(1.2);
            opacity: 1;
          }
          60% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        :global(.animate-match-popup) {
          animation: match-popup 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export const MatchConfetti = memo(MatchConfettiComponent);
