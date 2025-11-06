import { useCallback, useEffect, useState } from "react";

type VoiceAssistant = {
  speak: (text: string, lang?: string) => void;
  supported: boolean;
  speaking: boolean;
  stop: () => void;
};

export const useVoiceAssistant = (): VoiceAssistant => {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
  }, []);

  const speak = useCallback((text: string, lang = "en-IN") => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  return { speak, supported, speaking, stop };
};
