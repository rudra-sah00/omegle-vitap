"use client";

import { useEffect, useRef } from "react";
import { agoraService } from "@/services/agoraService";

/**
 * Hook to initialize Agora media devices
 * Ensures the Agora client is initialized once for the application
 */
export function useMediaDevices() {
  const initializeCalled = useRef(false);

  useEffect(() => {
    if (initializeCalled.current) return;
    initializeCalled.current = true;

    const initializeClient = async () => {
      try {
        // Only initialize client, tracks will be created by useVideoChat
        await agoraService.initClient("rtc");
      } catch (_error) {}
    };

    initializeClient();
  }, []);
}
