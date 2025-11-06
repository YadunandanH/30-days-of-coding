import { FormEvent, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

import { Role } from "../context/RoleContext";
import { useChatAssistant } from "../hooks/useChatAssistant";

type Props = {
  role: Role;
};

export const ChatAssistant = ({ role }: Props) => {
  const { messages, sendMessage, loading, suggestions } = useChatAssistant(role);
  const [input, setInput] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="chat-panel" aria-live="polite">
      <h3>Voice & Chat Assist</h3>
      <div className="chat-messages">
        {messages.length === 0 && <div className="chat-bubble system">How can I support you today?</div>}
        {messages.map((message, index) => (
          <div
            key={`${message.from}-${index}`}
            className={`chat-bubble ${message.from === "assistant" ? "system" : ""}`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
        <label className="sr-only" htmlFor="chat-input">
          Chat input
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type or dictate a question…"
          style={{
            flex: 1,
            borderRadius: "14px",
            border: "2px solid #d0d8e6",
            padding: "0.9rem 1rem",
            fontSize: "1.1rem",
          }}
        />
        <button type="submit" className="large-button" style={{ width: "auto", padding: "0.9rem 1.4rem" }}>
          <FaPaperPlane />
        </button>
      </form>
      {loading && <p style={{ marginTop: "0.5rem" }}>Thinking…</p>}
      {suggestions.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Try:</strong>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                style={{
                  border: "none",
                  background: "#eff6ff",
                  padding: "0.6rem 1rem",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
