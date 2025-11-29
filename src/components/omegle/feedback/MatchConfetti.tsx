'use client';

import { useEffect, useRef, memo, useCallback, useState } from 'react';
import confetti from 'canvas-confetti';

interface MatchConfettiProps {
  isActive: boolean;
}

/**
 * Optimized confetti for match celebration
 *
 * Performance optimizations:
 * - Detects low-end devices and reduces particle count
 * - Uses simpler shapes on low-end devices
 * - Reduces number of bursts
 * - Uses requestIdleCallback for non-critical animations
 * - Respects prefers-reduced-motion
 */
const MatchConfettiComponent = ({ isActive }: MatchConfettiProps) => {
  const wasActiveRef = useRef(false);
  const isLowEndRef = useRef(false);

  // Initialize with a function to avoid hydration mismatch
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Detect device capabilities and listen for motion preference changes
  useEffect(() => {
    // Listen for changes to reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // Detect low-end device heuristics
    const detectLowEnd = () => {
      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 4;

      // Check device memory (if available)
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8;

      // Check if mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Consider low-end if: few cores, low memory, or older mobile
      return cores <= 2 || memory <= 2 || (isMobile && cores <= 4);
    };

    isLowEndRef.current = detectLowEnd();

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  const prefersReducedMotionRef = useRef(prefersReducedMotion);
  useEffect(() => {
    prefersReducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  const fireConfetti = useCallback(() => {
    // Skip confetti entirely if user prefers reduced motion
    if (prefersReducedMotionRef.current) return;

    const isLowEnd = isLowEndRef.current;

    // Optimized settings based on device capability
    const particleMultiplier = isLowEnd ? 0.4 : 1;

    // Simple shapes for better performance (avoid custom paths on low-end)
    const shapes: confetti.Shape[] = isLowEnd
      ? ['circle', 'square']
      : (() => {
          const triangle = confetti.shapeFromPath({ path: 'M0 10 L5 0 L10 10z' });
          const square = confetti.shapeFromPath({ path: 'M0 0 L10 0 L10 10 L0 10 Z' });
          return [triangle, square, 'circle'];
        })();

    const defaults: confetti.Options = {
      spread: isLowEnd ? 180 : 360,
      ticks: isLowEnd ? 50 : 80,
      gravity: 1,
      decay: 0.92,
      startVelocity: isLowEnd ? 20 : 25,
      colors: ['#ff6b9d', '#c084fc', '#60a5fa', '#34d399', '#fbbf24'],
      shapes,
      scalar: isLowEnd ? 1.5 : 2,
      disableForReducedMotion: true,
    };

    const shoot = () => {
      // Single center burst for low-end, multiple for high-end
      confetti({
        ...defaults,
        particleCount: Math.floor(30 * particleMultiplier),
        origin: { x: 0.5, y: 0.5 },
      });

      // Additional side bursts only on capable devices
      if (!isLowEnd) {
        confetti({
          ...defaults,
          particleCount: 15,
          origin: { x: 0.25, y: 0.6 },
          angle: 60,
          spread: 60,
        });

        confetti({
          ...defaults,
          particleCount: 15,
          origin: { x: 0.75, y: 0.6 },
          angle: 120,
          spread: 60,
        });
      }
    };

    // Fire confetti - fewer bursts on low-end
    const burstCount = isLowEnd ? 1 : 3;
    shoot();

    if (burstCount > 1) {
      setTimeout(shoot, 200);
    }
    if (burstCount > 2) {
      setTimeout(shoot, 400);
    }
  }, []);

  useEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = isActive;

    // Rising edge detection: fire confetti when isActive changes from false to true
    if (isActive && !wasActive) {
      // Use requestIdleCallback on low-end devices for better main thread performance
      if (isLowEndRef.current && 'requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
          fireConfetti
        );
      } else {
        // Use microtask for capable devices
        queueMicrotask(fireConfetti);
      }
    }
  }, [isActive, fireConfetti]);

  // Show "MATCHED!" text when active (CSS animation is lightweight)
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-match-popup">
        <div
          className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
          style={{
            textShadow: prefersReducedMotion ? 'none' : '0 0 30px rgba(168, 85, 247, 0.5)',
          }}
        >
          🎉 MATCHED! 🎉
        </div>
      </div>

      <style jsx>{`
        @keyframes match-popup {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          40% {
            transform: scale(1.1);
            opacity: 1;
          }
          70% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        :global(.animate-match-popup) {
          animation: match-popup 1.2s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.animate-match-popup) {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export const MatchConfetti = memo(MatchConfettiComponent);
