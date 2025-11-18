"use client";

import { useState, useEffect } from "react";
import type { ChatMessage } from "@/types";
import { ChatService } from "@/services";

export function useChat(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    setIsLoading(true);
    const unsubscribe = ChatService.subscribeToMessages(roomId, (newMessages) => {
      setMessages(newMessages);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  const sendMessage = async (message: ChatMessage) => {
    if (!roomId) return;
    await ChatService.sendMessage(roomId, message);
  };

  return {
    messages,
    sendMessage,
    isLoading,
  };
}
