import { useState } from "react";
import axios from "axios";

import { Role } from "../context/RoleContext";
import { getApiClient } from "../services/api";

export type ChatMessage = {
  from: "user" | "assistant";
  text: string;
};

export const useChatAssistant = (role: Role) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { from: "user", text }]);
    setLoading(true);
    try {
      const client = getApiClient();
      const { data } = await client.post("/chat", {
        role,
        message: text,
      });
      setMessages((prev) => [...prev, { from: "assistant", text: data.reply }]);
      setSuggestions(data.suggestions ?? []);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          from: "assistant",
          text: "I'm having trouble reaching the assistant service right now.",
        },
      ]);
      if (axios.isAxiosError(error)) {
        console.error("Chat error", error.response?.data || error.message);
      } else {
        console.error("Chat error", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading, suggestions };
};
