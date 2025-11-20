"use client";

import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

interface VideoPlaceholderProps {
  label: string;
  isUser?: boolean;
  fullHeight?: boolean;
}

export default function VideoPlaceholder({
  label,
  isUser = false,
  fullHeight = false,
}: VideoPlaceholderProps) {
  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 ${fullHeight ? "h-full" : isUser ? "h-48" : "h-64"}`}
    >
      {/* Animated dotted glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <DottedGlowBackground
          gap={18}
          radius={2.5}
          color="rgba(255, 255, 255, 0.9)"
          glowColor="rgba(59, 130, 246, 1)"
          opacity={0.9}
          backgroundOpacity={0}
          speedMin={0.6}
          speedMax={1.4}
          speedScale={1.5}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
        {/* User icon */}
        <div className="text-center">
          <div
            className={`${isUser ? "w-20 h-20" : "w-28 h-28"} mx-auto mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center shadow-xl border-2 border-gray-700`}
          >
            <svg
              className={`${isUser ? "w-10 h-10" : "w-14 h-14"} text-gray-400`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-gray-300 text-sm font-medium tracking-wide">{label}</p>
        </div>
      </div>

      <div className="absolute top-3 left-3 bg-gradient-to-r from-gray-900 to-gray-800 px-3 py-1.5 rounded-lg text-xs text-white font-medium shadow-md border border-gray-700 z-20">
        {isUser ? "You" : "Stranger"}
      </div>
    </div>
  );
}
