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
  const partnerConnectedCallbackRef = useRef<(() => void) | null>(null);
  const partnerDisconnectedCallbackRef = useRef<(() => void) | null>(null);

  // Generate userId on mount
  useEffect(() => {
    const newUserId = userQueueService.generateUserId();
    setUserId(newUserId);
    console.log('Generated user ID:', newUserId);
  }, []);

  // Connect to partner
  const connectToPartner = (newPartnerId: string) => {
    setPartnerId(newPartnerId);
    
    const channel = [userId, newPartnerId].sort().join('_');
    setChannelName(channel);
    
    setIsSearching(false);
    setIsConnected(true);
    
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    
    setTimeout(() => {
      onSystemMessage('You are now connected with a stranger!');
    }, 300);

    // Notify callback
    if (partnerConnectedCallbackRef.current) {
      partnerConnectedCallbackRef.current();
    }

    // Listen for partner disconnect
    const unsubDisconnect = userQueueService.onPartnerDisconnected(userId, () => {
      console.log('Partner disconnected!');
      onSystemMessage('Stranger has disconnected.');
      
      if (partnerDisconnectedCallbackRef.current) {
        partnerDisconnectedCallbackRef.current();
      }
      
      setTimeout(() => {
        handlePartnerLeft();
      }, 2000);
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
    if (!userId || isConnected || isSearching) return;

    setIsSearching(true);
    
    try {
      await userQueueService.addToQueue(userId);
      console.log('Added to queue, searching for partner...');

      const partner = await userQueueService.tryInstantMatch(userId);
      
      if (partner) {
        console.log('Instant match found:', partner);
        connectToPartner(partner);
        return;
      }

      const unsubscribe = userQueueService.onPartnerConnected(userId, (partnerId) => {
        if (partnerId) {
          console.log('Partner connected:', partnerId);
          connectToPartner(partnerId);
        }
      });
      
      unsubscribePartnerRef.current = unsubscribe;

      searchIntervalRef.current = setInterval(async () => {
        const partner = await userQueueService.tryInstantMatch(userId);
        if (partner) {
          console.log('Found partner in polling:', partner);
          
          if (searchIntervalRef.current) {
            clearInterval(searchIntervalRef.current);
            searchIntervalRef.current = null;
          }
        }
      }, 500);

    } catch (error) {
      console.error('Failed to search for partner:', error);
      setIsSearching(false);
    }
  };

  // Handle next
  const handleNext = async () => {
    if (!userId) return;

    onClearMessages();
    setIsSearching(true);
    setIsConnected(false);

    disconnectFromPartner().then(() => {
      searchForPartner();
    });
  };

  // Handle stop
  const handleStop = async () => {
    setIsSearching(false);
    await disconnectFromPartner();
  };

  // Disconnect from partner
  const disconnectFromPartner = async () => {
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
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
      console.error('Disconnect error:', error);
    }

    setPartnerId("");
    setChannelName("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromPartner();
      if (userId) {
        userQueueService.cleanup(userId);
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
