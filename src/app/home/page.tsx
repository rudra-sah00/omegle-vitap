"use client";

import ProtectedRoute from "@/app/_components/ProtectedRoute";
import VideoPlaceholder from "./_components/VideoPlaceholder";
import ChatWindow from "./_components/ChatWindow";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-white overflow-hidden">
        {/* Left side - Video panels - takes more space */}
        <div className="flex-1 flex flex-col gap-4 p-4">
          {/* Stranger's video - equal size */}
          <div className="flex-1 min-h-0">
            <VideoPlaceholder label="Waiting for stranger..." fullHeight />
          </div>
          
          {/* Your video - equal size */}
          <div className="flex-1 min-h-0">
            <VideoPlaceholder label="Camera off" isUser={true} fullHeight />
          </div>
        </div>

        {/* Right side - Chat window - fixed width */}
        <div className="w-96 flex-shrink-0">
          <ChatWindow />
        </div>
      </div>
    </ProtectedRoute>
  );
}
