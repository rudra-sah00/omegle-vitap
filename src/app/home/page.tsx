"use client";

import { useState, useEffect, useRef } from "react";
import VideoPlaceholder from "./_components/VideoPlaceholder";
import ChatWindow from "./_components/ChatWindow";
import { useChat } from "@/hooks/useChat";
import { userQueueService } from "@/services/userQueueService";

export default function HomePage() {
  // UI State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // User & matching state
  const [userId, setUserId] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>("");
  const [channelName, setChannelName] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs for cleanup
  const unsubscribePartnerRef = useRef<(() => void) | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Chat hook
  const {
    messages,
    partnerTyping,
    sendMessage,
    sendSystemMessage,
    setTypingIndicator,
    clearMessages,
    cleanup: cleanupChat,
  } = useChat(userId, channelName);

  // Generate userId on mount
  useEffect(() => {
    const newUserId = userQueueService.generateUserId();
    setUserId(newUserId);
    console.log('Generated user ID:', newUserId);
  }, []);

  // Search for partner - INSTANT MATCHING
  const searchForPartner = async () => {
    if (!userId || isConnected || isSearching) return;

    setIsSearching(true);
    
    try {
      // Add self to queue
      await userQueueService.addToQueue(userId);
      console.log('Added to queue, searching for partner...');

      // Try instant match first
      const partner = await userQueueService.tryInstantMatch(userId);
      
      if (partner) {
        // INSTANT MATCH FOUND!
        console.log('Instant match found:', partner);
        connectToPartner(partner);
        return;
      }

      // No instant match - listen for someone else to match us
      const unsubscribe = userQueueService.onPartnerConnected(userId, (partnerId) => {
        if (partnerId) {
          console.log('Partner connected:', partnerId);
          connectToPartner(partnerId);
        }
      });
      
      unsubscribePartnerRef.current = unsubscribe;

      // Keep trying to match every 500ms (fast!)
      searchIntervalRef.current = setInterval(async () => {
        const partner = await userQueueService.tryInstantMatch(userId);
        if (partner) {
          console.log('Found partner in polling:', partner);
          
          // Clear search interval
          if (searchIntervalRef.current) {
            clearInterval(searchIntervalRef.current);
            searchIntervalRef.current = null;
          }
        }
      }, 500); // Much faster - 500ms instead of 2000ms

    } catch (error) {
      console.error('Failed to search for partner:', error);
      setIsSearching(false);
    }
  };

  // Connect to partner - extracted for reuse
  const connectToPartner = (partnerId: string) => {
    setPartnerId(partnerId);
    
    // Create channel name (sorted to ensure both users get same name)
    const channel = [userId, partnerId].sort().join('_');
    setChannelName(channel);
    
    setIsSearching(false);
    setIsConnected(true);
    
    // Clear interval if exists
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    
    // Send system message
    setTimeout(() => {
      sendSystemMessage('You are now connected with a stranger!');
    }, 300);

    // Listen for partner disconnect - disconnect immediately when partner leaves
    const unsubDisconnect = userQueueService.onPartnerDisconnected(userId, () => {
      console.log('Partner disconnected! Showing "Stranger has disconnected"');
      sendSystemMessage('Stranger has disconnected.');
      
      // Auto-disconnect after 2 seconds
      setTimeout(() => {
        handlePartnerLeft();
      }, 2000);
    });

    // Store the disconnect listener (will be cleaned up on next/stop)
    if (unsubscribePartnerRef.current) {
      unsubscribePartnerRef.current();
    }
    unsubscribePartnerRef.current = unsubDisconnect;
  };

  // Handle when partner leaves
  const handlePartnerLeft = () => {
    setIsConnected(false);
    setPartnerId("");
    setChannelName("");
    clearMessages();
    
    // Clean up listeners
    if (unsubscribePartnerRef.current) {
      unsubscribePartnerRef.current();
      unsubscribePartnerRef.current = null;
    }
  };

  // Handle start button
  const handleStart = () => {
    searchForPartner();
  };

  // Handle next/skip - FAST AS FUCK
  const handleNext = async () => {
    if (!userId) return;

    // Clear messages immediately (no wait)
    clearMessages();
    
    // Set searching state immediately for UI feedback
    setIsSearching(true);
    setIsConnected(false);

    // Cleanup in background (don't wait)
    disconnectFromPartner().then(() => {
      // Immediately start searching again
      searchForPartner();
    });
  };

  // Disconnect from partner - optimized
  const disconnectFromPartner = async () => {
    // Clear search interval
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }

    // Unsubscribe from partner listener
    if (unsubscribePartnerRef.current) {
      unsubscribePartnerRef.current();
      unsubscribePartnerRef.current = null;
    }

    // Remove from queue and clear channel
    try {
      // removeFromQueue will automatically delete the chat
      if (userId) {
        await userQueueService.removeFromQueue(userId);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }

    // Reset state
    setPartnerId("");
    setChannelName("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromPartner();
      cleanupChat();
      if (userId) {
        userQueueService.cleanup(userId);
      }
    };
  }, [userId]);

  // ESC key to disconnect (like Omegle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConnected) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnected]);

  // Handle message send
  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  // Handle typing
  const handleTyping = () => {
    setTypingIndicator();
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left side - Video panels */}
      <div className="flex flex-col gap-4 p-4" style={{ width: '60%' }}>
        {/* Stranger's video - equal size */}
        <div className="flex-1 min-h-0">
          <VideoPlaceholder 
            label={isSearching ? "Searching for someone..." : (isConnected ? "Stranger's video" : "Waiting for stranger...")} 
            fullHeight 
          />
        </div>
        
        {/* Your video - equal size with controls */}
        <div 
          className="flex-1 min-h-0 relative"
          onClick={() => setShowControls(!showControls)}
        >
          <VideoPlaceholder label="Your video" isUser={true} fullHeight />
          
          {/* Start button in center (only when not connected and not searching) */}
          {!isConnected && !isSearching && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStart();
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-12 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-lg z-10"
            >
              Start
            </button>
          )}

          {/* Searching indicator */}
          {isSearching && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded">
                Looking for someone to chat with...
              </p>
            </div>
          )}

          {/* Controls overlay (only when connected and clicked) */}
          {isConnected && showControls && (
            <div 
              className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={
                    "px-6 py-2 rounded-lg font-semibold transition-colors " +
                    (isMicOn
                      ? "bg-white text-gray-900 hover:bg-gray-200"
                      : "bg-red-600 text-white hover:bg-red-700")
                  }
                >
                  {isMicOn ? "🎤 Mute" : "🔇 Unmute"}
                </button>

                <button
                  onClick={() => setIsCameraOn(!isCameraOn)}
                  className={
                    "px-6 py-2 rounded-lg font-semibold transition-colors " +
                    (isCameraOn
                      ? "bg-white text-gray-900 hover:bg-gray-200"
                      : "bg-red-600 text-white hover:bg-red-700")
                  }
                >
                  {isCameraOn ? "📹 Stop Camera" : "📷 Start Camera"}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="px-8 py-2 rounded-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                >
                  ⏭️ Next
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectFromPartner();
                  }}
                  className="px-8 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  ⏹️ Stop
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Chat window */}
      <div className="flex-1">
        <ChatWindow 
          messages={messages}
          partnerTyping={partnerTyping}
          partnerOnline={isConnected}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}
