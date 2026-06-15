import React, { useState } from "react";
import { sendChatMessage, Msg, ParsedIntent } from "./api";

type Message = {
  role: "user" | "assistant";
  text: string;
  parsed?: ParsedIntent | null;
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const res = await sendChatMessage(trimmed, history);
    setHistory(res.history);

    const botMsg: Message = {
      role: "assistant",
      text: res.reply,
      parsed: res.parsed,
    };
    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "80vh",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>HVAC AI Assistant</h2>
        <label style={{ fontSize: 12 }}>
          <input
            type="checkbox"
            checked={showDebug}
            onChange={(e) => setShowDebug(e.target.checked)}
          />
          Show parsed intent
        </label>
      </div>

      <div
        style={{
          flex: 1,
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 12,
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#777", fontSize: 14 }}>
            Try: <i>"Set temperature 24 degree in living room tomorrow morning 8 am"</i>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            <div
              style={{
                margin: "6px 0",
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "8px 12px",
                  borderRadius: 16,
                  background: m.role === "user" ? "#1976d2" : "#e0e0e0",
                  color: m.role === "user" ? "white" : "black",
                  fontSize: 14,
                }}
              >
                {m.text}
              </div>
            </div>

            {/* Show parsed intent below assistant messages */}
            {showDebug && m.role === "assistant" && m.parsed && (
              <div
                style={{
                  margin: "2px 0 8px 0",
                  padding: "6px 10px",
                  background: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              >
                <strong>Parsed Intent:</strong>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(m.parsed, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ marginTop: 4, fontSize: 12, color: "#777" }}>
            Assistant is thinking…
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <input
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 20,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: "none",
            background: loading ? "#aaa" : "#1976d2",
            color: "white",
            cursor: loading ? "default" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;