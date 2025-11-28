'use client';

import { useEffect, useState, useRef, memo } from 'react';

interface MatchConfettiProps {
  isActive: boolean;
  duration?: number;
}

const MatchConfettiComponent = ({ isActive, duration = 1500 }: MatchConfettiProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    delay: number;
    rotation: number;
    shape: 'circle' | 'square' | 'star';
  }>>([]);
  
  // Track previous isActive state to detect rising edge (false -> true)
  const prevIsActiveRef = useRef(false);

  useEffect(() => {
    // Only trigger confetti on rising edge: when isActive goes from false to true
    const wasActive = prevIsActiveRef.current;
    prevIsActiveRef.current = isActive;
    
    if (isActive && !wasActive) {
      setShowConfetti(true);
      
      // Generate confetti particles
      const colors = ['#ff6b9d', '#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
      const shapes: Array<'circle' | 'square' | 'star'> = ['circle', 'square', 'star'];
      
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        delay: Math.random() * 0.3,
        rotation: Math.random() * 360,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      }));
      
      setParticles(newParticles);

      // Hide confetti after duration
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  if (!showConfetti || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${0.8 + Math.random() * 0.4}s`,
          }}
        >
          {particle.shape === 'circle' && (
            <div
              className="rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                transform: `rotate(${particle.rotation}deg)`,
                boxShadow: `0 0 ${particle.size / 2}px ${particle.color}40`,
              }}
            />
          )}
          {particle.shape === 'square' && (
            <div
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                transform: `rotate(${particle.rotation}deg)`,
                boxShadow: `0 0 ${particle.size / 2}px ${particle.color}40`,
              }}
            />
          )}
          {particle.shape === 'star' && (
            <svg
              width={particle.size}
              height={particle.size}
              viewBox="0 0 24 24"
              fill={particle.color}
              style={{ transform: `rotate(${particle.rotation}deg)` }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </div>
      ))}
      
      {/* Center "MATCHED!" text with glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
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
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes match-popup {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        :global(.animate-confetti-fall) {
          animation: confetti-fall ease-out forwards;
        }
        
        :global(.animate-match-popup) {
          animation: match-popup 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export const MatchConfetti = memo(MatchConfettiComponent);
