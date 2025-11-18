"use client";

import { useState } from "react";
import ProtectedRoute from "@/app/_components/ProtectedRoute";
import VideoPlaceholder from "./_components/VideoPlaceholder";
import ChatWindow from "./_components/ChatWindow";
import StartChatModal from "./_components/StartChatModal";

export default function HomePage() {
  const [hasStarted, setHasStarted] = useState(false);

  const handleStartChat = () => {
    setHasStarted(true);
  };

  return (
    <ProtectedRoute>
      <StartChatModal isOpen={!hasStarted} onStart={handleStartChat} />
      
      <div className="flex h-screen bg-white overflow-hidden">
        {/* Left side - Video panels */}
        <div className="flex flex-col gap-4 p-4" style={{ width: '60%' }}>
          {/* Stranger's video - equal size */}
          <div className="flex-1 min-h-0">
            <VideoPlaceholder label="Waiting for stranger..." fullHeight />
          </div>
          
          {/* Your video - equal size */}
          <div className="flex-1 min-h-0">
            <VideoPlaceholder label="Camera off" isUser={true} fullHeight />
          </div>
        </div>

        {/* Right side - Chat window - takes remaining space */}
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>
    </ProtectedRoute>
  );
}
