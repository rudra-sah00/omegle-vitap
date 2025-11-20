"use client";

import { useState, useEffect, useRef } from "react";
import { userQueueService } from "@/services/userQueueService";
import { analyticsService } from "@/services/analyticsService";

/**
 * Return type for useMatching hook
 */
interface UseMatchingReturn {
  /** Current user's ID */
  userId: string;
  /** Matched partner's ID */
  partnerId: string;
  /** Active channel name for communication */
  channelName: string;
  /** Whether currently searching for a partner */
  isSearching: boolean;
  /** Whether connected to a partner */
  isConnected: boolean;
  /** Start searching for a partner */
  searchForPartner: () => void;
  /** Skip to next partner */
  handleNext: () => void;
  /** Stop searching and disconnect */
  handleStop: () => void;
  /** Register callback for when partner connects */
  onPartnerConnected: (callback: () => void) => void;
  /** Register callback for when partner disconnects */
  onPartnerDisconnected: (callback: () => void) => void;
}

/**
 * Hook for managing user matching and partner connections
 * @param onSystemMessage - Callback for system messages
 * @param onClearMessages - Callback to clear chat messages
 * @param _onError - Optional error handler callback
 * @returns Matching state and control functions
 */
export function useMatching(
  onSystemMessage: (message: string) => void,
  onClearMessages: () => void,
  _onError?: (message: string) => void
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
  const isConnectingRef = useRef<boolean>(false);
  const manuallyStoppedRef = useRef<boolean>(false);

  // Generate userId on mount
  useEffect(() => {
    const newUserId = userQueueService.generateUserId();
    setUserId(newUserId);

    // Load recent partners from localStorage
    const storedRecent = localStorage.getItem("recentPartners");
    if (storedRecent) {
      try {
        const parsed = JSON.parse(storedRecent);
        setRecentPartners(Array.isArray(parsed) ? parsed : []);
      } catch (_e) {
        setRecentPartners([]);
      }
    }
  }, []);

  // Connect to partner
  const connectToPartner = (newPartnerId: string) => {
    // Prevent duplicate connections
    if (isConnected || partnerId || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

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

    // Track this partner in recent partners (keep last 2)
    const updatedRecent = [
      newPartnerId,
      ...recentPartners.filter((id) => id !== newPartnerId),
    ].slice(0, 2);
    setRecentPartners(updatedRecent);
    localStorage.setItem("recentPartners", JSON.stringify(updatedRecent));

    const channel = [userId, newPartnerId].sort().join("_");
    setChannelName(channel);

    setIsSearching(false);

    // Setup disconnect listener BEFORE marking as connected
    // This ensures we catch real disconnects but not the initial connection
    const unsubDisconnect = userQueueService.onPartnerDisconnected(userId, async () => {
      // Check if this user manually stopped - if so, don't auto-search
      if (manuallyStoppedRef.current) {
        manuallyStoppedRef.current = false; // Reset for next time
        return;
      }

      onSystemMessage("Stranger has disconnected.");

      // Track partner disconnection
      analyticsService.trackPartnerDisconnected();

      // Reset state immediately to trigger video chat disconnect
      isConnectingRef.current = false;
      setIsConnected(false);
      setPartnerId("");
      setChannelName("");

      // Call disconnect callback to ensure video chat leaves channel
      if (partnerDisconnectedCallbackRef.current) {
        partnerDisconnectedCallbackRef.current();
      }

      // Clear the disconnect listener to prevent loops
      if (unsubscribePartnerRef.current) {
        unsubscribePartnerRef.current();
        unsubscribePartnerRef.current = null;
      }

      // Remove from queue and wait for cleanup
      try {
        if (userId) {
          await userQueueService.removeFromQueue(userId);
        }
      } catch (_error) {
        // Error removing from queue
      }

      // Don't auto-search - user must click Start button to search again
      onSystemMessage("Stranger has disconnected. Click Start to find a new stranger.");
      onClearMessages();
    });

    if (unsubscribePartnerRef.current) {
      unsubscribePartnerRef.current();
    }
    unsubscribePartnerRef.current = unsubDisconnect;

    // Add delay to ensure both users' Firebase records are updated with partner info
    // before either one joins the Agora channel. This prevents mismatched channels.
    setTimeout(() => {
      onSystemMessage("You are now connected with a stranger!");
      setIsConnected(true);
      isConnectingRef.current = false;

      // Track partner found
      const waitTime = searchIntervalRef.current ? 0 : 0; // Simplified
      analyticsService.trackPartnerFound(waitTime);
    }, 500); // Increased delay from 300ms to 500ms to ensure both updates complete

    // Notify callback
    if (partnerConnectedCallbackRef.current) {
      partnerConnectedCallbackRef.current();
    }
  };

  // Handle partner left
  const _handlePartnerLeft = async () => {
    isConnectingRef.current = false;
    setIsConnected(false);
    setPartnerId("");
    setChannelName("");
    onClearMessages();

    if (unsubscribePartnerRef.current) {
      unsubscribePartnerRef.current();
      unsubscribePartnerRef.current = null;
    }

    // Remove user from queue when partner leaves
    try {
      if (userId) {
        await userQueueService.removeFromQueue(userId);
      }
    } catch (_error) {
      // Error removing from queue
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
      const userInfoStr = localStorage.getItem("userInfo");
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
      const gender = userInfo?.gender || "other";
      const name = userInfo?.name || "Anonymous";
      const year = userInfo?.year || "";
      const interests = userInfo?.interests || "";

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
        if (partnerId && !isConnected) {
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
      }, 1000); // Increased to 1 second to reduce DB queries

      // Auto-cancel search after 30 seconds (increased timeout)
      searchTimeoutRef.current = setTimeout(async () => {
        if (searchIntervalRef.current) {
          clearInterval(searchIntervalRef.current);
          searchIntervalRef.current = null;
        }
        await disconnectFromPartner();
        setIsSearching(false);
        onSystemMessage('No match found. Click "Start" to search again.');
      }, 30000);
    } catch (_error) {
      setIsSearching(false);
    }
  };

  // Handle next
  const handleNext = async () => {
    if (!userId || isSearching) {
      return; // Prevent if already searching
    }

    // Set flag to indicate this is a manual action (not partner disconnect)
    manuallyStoppedRef.current = true;

    try {
      // Track skip partner action
      analyticsService.trackSkipPartner();

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
      onSystemMessage("Looking for a new stranger...");

      // Wait for cleanup to complete before searching
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Start new search
      setIsSearching(true);
      searchForPartner();
    } catch (_error) {
      setIsSearching(false);
    }
  };

  // Handle stop
  const handleStop = async () => {
    if (!userId) {
      return;
    }

    // Set flag to indicate this is a manual stop (not partner disconnect)
    manuallyStoppedRef.current = true;

    // Clear messages regardless of state
    onClearMessages();

    // If connected, disconnect from partner
    if (isConnected) {
      onSystemMessage("You have disconnected.");
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
    } catch (_error) {
      // Error removing from queue
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
          userQueueService.cleanup(userId),
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
