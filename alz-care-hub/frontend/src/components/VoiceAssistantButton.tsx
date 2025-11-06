import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

import { useVoiceAssistant } from "../hooks/useVoiceAssistant";

type Props = {
  message: string;
  label?: string;
};

export const VoiceAssistantButton = ({ message, label = "Play voice prompt" }: Props) => {
  const { speak, supported, speaking, stop } = useVoiceAssistant();

  if (!supported) {
    return null;
  }

  return (
    <button
      className="large-button"
      style={{ background: speaking ? "#0f5cc8" : "#1f7aec", width: "auto", padding: "0.85rem 1.5rem" }}
      onClick={() => (speaking ? stop() : speak(message))}
    >
      {speaking ? <FaVolumeMute /> : <FaVolumeUp />} {label}
    </button>
  );
};
