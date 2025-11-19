"use client";

import { useState, useEffect, useRef } from "react";
import { userQueueService } from "@/services/userQueueService";

interface UseMatchingReturn {
  userId: string;
  partnerId: string;
  channelName: string;
  isSearching: boolean;
  isConnected: boolean;
  searchForPartner: () => void;
  handleNext: () => void;
  handleStop: () => void;
  onPartnerConnected: (callback: () => void) => void;
  onPartnerDisconnected: (callback: () => void) => void;
}

export function useMatching(
  onSystemMessage: (message: string) => void,
  onClearMessages: () => void
): UseMatchingReturn {
  const [userId, setUserId] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>("");
  const [channelName, setChannelName] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const unsubscribePartnerRef = useRef<(() => void) | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const partnerConnectedCallbackRef = useRef<(() => void) | null>(null);
  const partnerDisconnectedCallbackRef = useRef<(() => void) | null>(null);

  // Generate userId on mount
  useEffect(() => {
    const newUserId = userQueueService.generateUserId();
    setUserId(newUserId);
  }, []);

  // Connect to partner
  const connectToPartner = (newPartnerId: string) => {
    // Prevent duplicate connections
    if (isConnected || partnerId) {
      return;
    }

    // Clear search intervals/timeouts immediately
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    setPartnerId(newPartnerId);

    const channel = [userId, newPartnerId].sort().join('_');
    setChannelName(channel);

    setIsSearching(false);

    // Show "You're now chatting" message immediately
    setTimeout(() => {
      onSystemMessage('You are now connected with a stranger!');
      setIsConnected(true);
    }, 300);

    // Notify callback
    if (partnerConnectedCallbackRef.current) {
      partnerConnectedCallbackRef.current();
    }

    // Listen for partner disconnect
    const unsubDisconnect = userQueueService.onPartnerDisconnected(userId, () => {
      onSystemMessage('Stranger has disconnected.');

      if (partnerDisconnectedCallbackRef.current) {
        partnerDisconnectedCallbackRef.current();
      }

      // Reset state and start searching again
      setTimeout(() => {
        handlePartnerLeft();
        // Auto-search for next partner after disconnect with timeout
        setTimeout(() => {
          searchForPartner();
        }, 500);
      }, 1500);
    });

    if (unsubscribePartnerRef.current) {
      unsubscribePartnerRef.current();
    }
    unsubscribePartnerRef.current = unsubDisconnect;
  };

  // Handle partner left
  const handlePartnerLeft = () => {
    setIsConnected(false);
    setPartnerId("");
    setChannelName("");
    onClearMessages();

    if (unsubscribePartnerRef.current) {
      unsubscribePartnerRef.current();
      unsubscribePartnerRef.current = null;
    }
  };

  // Search for partner
  const searchForPartner = async () => {
    if (!userId || isConnected || isSearching) {
      return;
    }

    setIsSearching(true);

    try {
      // Get user info from localStorage
      const userInfoStr = localStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
      const gender = userInfo?.gender || 'other';
      const name = userInfo?.name || 'Anonymous';
      const year = userInfo?.year || '';
      const interests = userInfo?.interests || '';

      await userQueueService.addToQueue(userId, gender, name, year, interests);

      const partner = await userQueueService.tryInstantMatch(userId);

      if (partner) {
        connectToPartner(partner);
        return;
      }

      // Clear any existing listener before setting new one
      if (unsubscribePartnerRef.current) {
        unsubscribePartnerRef.current();
        unsubscribePartnerRef.current = null;
      }

      const unsubscribe = userQueueService.onPartnerConnected(userId, (partnerId) => {
        if (partnerId) {
          connectToPartner(partnerId);
        }
      });

      unsubscribePartnerRef.current = unsubscribe;

      searchIntervalRef.current = setInterval(async () => {
        const partner = await userQueueService.tryInstantMatch(userId);
        if (partner) {

          if (searchIntervalRef.current) {
            clearInterval(searchIntervalRef.current);
            searchIntervalRef.current = null;
          }
          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
          }
          // Actually connect to the partner!
          connectToPartner(partner);
        }
      }, 500);

      // Auto-cancel search after 15 seconds
      searchTimeoutRef.current = setTimeout(async () => {
        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }
        await disconnectFromPartner();
        setIsSearching(false);
        onSystemMessage('No match found. Click "Start" to search again.');
      }, 15000);

    } catch (error) {
      setIsSearching(false);
    }
  };

  // Handle next
  const handleNext = async () => {
    if (!userId) return;

    // Clear messages and states first
    onClearMessages();
    setIsConnected(false);
    setPartnerId("");
    setChannelName("");

    // Disconnect from current partner and queue
    await disconnectFromPartner();

    // Small delay before starting new search to ensure cleanup
    setTimeout(() => {
      setIsSearching(true);
      searchForPartner();
    }, 100);
  };

  // Handle stop
  const handleStop = async () => {
    if (!userId) return;

    // Clear messages regardless of state
    onClearMessages();

    // If connected, disconnect from partner
    if (isConnected) {
      onSystemMessage('You have disconnected.');
      setIsConnected(false);
      setPartnerId("");
      setChannelName("");
      await disconnectFromPartner();
    }
    // If searching, just stop searching
    else if (isSearching) {
      setIsSearching(false);
      await disconnectFromPartner();
    }
  };

  // Disconnect from partner
  const disconnectFromPartner = async () => {
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    if (unsubscribePartnerRef.current) {
      unsubscribePartnerRef.current();
      unsubscribePartnerRef.current = null;
    }

    try {
      if (userId) {
        await userQueueService.removeFromQueue(userId);
      }
    } catch (error) {
    }

    setPartnerId("");
    setChannelName("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup all timers and listeners on unmount
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (unsubscribePartnerRef.current) {
        unsubscribePartnerRef.current();
      }

      // Remove from queue and cleanup
      if (userId) {
        // Use Promise.allSettled to ensure both cleanups attempt to run
        Promise.allSettled([
          userQueueService.removeFromQueue(userId),
          userQueueService.cleanup(userId)
        ]);
      }
    };
  }, [userId]);

  // Register callbacks
  const onPartnerConnected = (callback: () => void) => {
    partnerConnectedCallbackRef.current = callback;
  };

  const onPartnerDisconnected = (callback: () => void) => {
    partnerDisconnectedCallbackRef.current = callback;
  };

  return {
    userId,
    partnerId,
    channelName,
    isSearching,
    isConnected,
    searchForPartner,
    handleNext,
    handleStop,
    onPartnerConnected,
    onPartnerDisconnected,
  };
}
