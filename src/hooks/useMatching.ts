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
  onClearMessages: () => void,
  onError?: (message: string) => void
): UseMatchingReturn {
  const [userId, setUserId] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>("");
  const [channelName, setChannelName] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [recentPartners, setRecentPartners] = useState<string[]>([]);

  const unsubscribePartnerRef = useRef<(() => void) | null>(null);
  const searchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const partnerConnectedCallbackRef = useRef<(() => void) | null>(null);
  const partnerDisconnectedCallbackRef = useRef<(() => void) | null>(null);

  // Generate userId on mount
  useEffect(() => {
    const newUserId = userQueueService.generateUserId();
    setUserId(newUserId);
    
    // Load recent partners from localStorage
    const storedRecent = localStorage.getItem('recentPartners');
    if (storedRecent) {
      try {
        const parsed = JSON.parse(storedRecent);
        setRecentPartners(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setRecentPartners([]);
      }
    }
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

    // Track this partner in recent partners (keep last 5)
    const updatedRecent = [newPartnerId, ...recentPartners.filter(id => id !== newPartnerId)].slice(0, 5);
    setRecentPartners(updatedRecent);
    localStorage.setItem('recentPartners', JSON.stringify(updatedRecent));

    const channel = [userId, newPartnerId].sort().join('_');
    setChannelName(channel);

    setIsSearching(false);

    // Show "You're now chatting" message after a delay
    // This allows time for video connection to initialize
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

      await userQueueService.addToQueue(userId, gender, name, year, interests, recentPartners);

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
    if (!userId || isSearching) return; // Prevent if already searching

    try {
      // Clear all intervals and timeouts first
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current);
        searchIntervalRef.current = null;
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }

      // Clear listeners
      if (unsubscribePartnerRef.current) {
        unsubscribePartnerRef.current();
        unsubscribePartnerRef.current = null;
      }

      // Disconnect from queue (this triggers partner disconnect on backend)
      if (userId) {
        await userQueueService.removeFromQueue(userId);
      }

      // Clear UI state
      onClearMessages();
      setIsConnected(false);
      setPartnerId("");
      setChannelName("");

      // Show searching message
      onSystemMessage('Looking for a new stranger...');

      // Wait for cleanup to complete before searching
      await new Promise(resolve => setTimeout(resolve, 500));

      // Start new search
      setIsSearching(true);
      searchForPartner();
    } catch (error) {
      setIsSearching(false);
    }
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
