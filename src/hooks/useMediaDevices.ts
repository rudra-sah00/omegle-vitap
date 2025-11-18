"use client";

import { useEffect, useRef } from "react";
import { agoraService } from "@/services/agoraService";

export function useMediaDevices() {
  const initializeCalled = useRef(false);

  useEffect(() => {
    if (initializeCalled.current) return;
    initializeCalled.current = true;

    const initializeClient = async () => {
      try {
        // Only initialize client, tracks will be created by useVideoChat
        await agoraService.initClient('rtc');
        console.log('Agora client initialized');
      } catch (error: any) {
        console.error('Failed to initialize Agora client:', error);
      }
    };

    initializeClient();
  }, []);
}
