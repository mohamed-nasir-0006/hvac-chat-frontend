import React, { useState, useRef, useEffect } from "react";

import {
  streamChatMessage,
  listSessions,
  getSessionMessages,
  deleteSession,
  Msg,
  ParsedIntent,
  Session,
} from "./api";

type Message = {
  role: "user" | "assistant";
  text: string;
  rawJson?: string;
  parsed?: ParsedIntent | null;
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSessions = async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch {
      console.error("Failed to load sessions");
    }
  };

  const loadSession = async (sid: string) => {
    try {
      const data = await getSessionMessages(sid);
      const loaded: Message[] = data.messages.map((m: any) => ({
        role: m.role,
        text: m.content,
        parsed: m.parsed_intent || null,
      }));
      setMessages(loaded);
      setSessionId(sid);
      setHistory(
        data.messages.map((m: any) => ({ role: m.role, content: m.content }))
      );
      setShowSidebar(false);
    } catch {
      console.error("Failed to load session");
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setHistory([]);
    setSessionId(null);
    setShowSidebar(false);
  };

  const handleDeleteSession = async (sid: string) => {
    await deleteSession(sid);
    if (sessionId === sid) startNewChat();
    loadSessions();
  };

const sendMessage = async () => {
  const trimmed = input.trim();
  if (!trimmed || loading) return;

  const userMsg: Message = { role: "user", text: trimmed };
  setMessages((prev) => [...prev, userMsg]);
  setInput("");
  setLoading(true);

  // Add empty assistant message for streaming
  setMessages((prev) => [
    ...prev,
    { role: "assistant", text: "", rawJson: "", parsed: null },
  ]);

  await streamChatMessage(
    trimmed,
    history,
    sessionId,

    // onToken — raw JSON tokens streaming in
    (token: string) => {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          updated[updated.length - 1] = {
            ...lastMsg,
            rawJson: (lastMsg.rawJson || "") + token,  // ← Collect raw JSON
          };
        }
        return updated;
      });
    },

    // onDone — replace with human reply, attach parsed intent
    (parsed: ParsedIntent | null, newSessionId: string, reply: string | null) => {
      setSessionId(newSessionId);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          updated[updated.length - 1] = {
            ...lastMsg,
            text: reply || lastMsg.rawJson || "",  // ← Show human reply
            parsed: parsed,
          };
        }
        return updated;
      });

      setHistory((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        { role: "assistant", content: reply || "" },
      ]);
    }
  );

  setLoading(false);
  loadSessions();
};

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      {showSidebar && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Chat History</h3>
            <button onClick={() => setShowSidebar(false)} style={styles.closeBtn}>✕</button>
          </div>

          <button onClick={startNewChat} style={styles.newChatBtn}>
            ➕ New Chat
          </button>

          <div style={styles.sessionList}>
            {sessions.length === 0 ? (
              <p style={styles.noSessions}>No previous chats</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.session_id}
                  style={{
                    ...styles.sessionItem,
                    ...(sessionId === s.session_id ? styles.sessionActive : {}),
                  }}
                >
                  <div
                    onClick={() => loadSession(s.session_id)}
                    style={styles.sessionContent}
                  >
                    <p style={styles.sessionTitle}>{s.title}</p>
                    <p style={styles.sessionDate}>
                      {new Date(s.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(s.session_id)}
                    style={styles.sessionDeleteBtn}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={styles.menuBtn}
            >
              ❄️ History
            </button>
            <h2 style={styles.title}></h2>
          </div>
          <label style={styles.debugLabel}>
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
            />
            Developer Chat
          </label>
        </div>

        {/* Messages */}
        <div style={styles.messagesArea}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <p style={styles.emptyIcon}>💬</p>
              <p style={styles.emptyText}>Ask me anything about HVAC!</p>
              <p style={styles.emptyHint}>
                Try: <i>"Set temperature 24 degree in living room"</i>
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                ...styles.bubble,
                ...(m.role === "user" ? styles.userBubble : styles.botBubble),
              }}>
                {/* Show raw JSON while streaming (Developer Chat ON) OR human reply when done */}
                {m.role === "assistant" && showDebug && m.rawJson && !m.text ? (
                  // Still streaming — show raw JSON
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
                    {m.rawJson}
                  </pre>
                ) : (
                  // Done — show human reply
                  m.text
                )}
                {/* Blinking cursor while streaming */}
                {loading && m.role === "assistant" && i === messages.length - 1 && !m.text && (
                  <span style={{
                    display: "inline-block",
                    width: 2,
                    height: "1em",
                    backgroundColor: "#e94560",
                    marginLeft: 2,
                    animation: "blink 0.7s infinite",
                    verticalAlign: "text-bottom",
                  }} />
                )}
                
                {showDebug && m.parsed && m.text && (
                  <pre style={{
                    marginTop: 8,
                    padding: 8,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderRadius: 6,
                    fontSize: "0.8rem",
                    whiteSpace: "pre-wrap",
                  }}>
                    {JSON.stringify(m.parsed, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.text === "" && (
            <div style={styles.thinking}>● ● ● Thinking...</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <input
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              ...styles.sendBtn,
              ...(loading || !input.trim() ? styles.sendBtnDisabled : {}),
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================
// Styles
// =========================
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    height: "calc(100vh - 60px)",
  },
  // Sidebar
  sidebar: {
    width: 280,
    backgroundColor: "rgba(15, 20, 40, 0.95)",
    borderRight: "1px solid #0f3460",
    display: "flex",
    flexDirection: "column",
    padding: "1rem",
    overflowY: "auto",
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  sidebarTitle: {
    margin: 0,
    fontSize: "1rem",
    color: "#e0e0e0",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1.2rem",
    cursor: "pointer",
  },
  newChatBtn: {
    padding: "0.6rem",
    borderRadius: 8,
    border: "1px dashed #0f3460",
    backgroundColor: "transparent",
    color: "#06e5c0e3",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  sessionList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  noSessions: {
    color: "#666",
    fontSize: "0.8rem",
    textAlign: "center",
  },
  sessionItem: {
    display: "flex",
    alignItems: "center",
    padding: "0.5rem",
    borderRadius: 8,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "all 0.2s",
  },
  sessionActive: {
    backgroundColor: "rgba(233, 69, 96, 0.15)",
    borderColor: "#e94560",
  },
  sessionContent: {
    flex: 1,
    overflow: "hidden",
  },
  sessionTitle: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#e0e0e0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  sessionDate: {
    margin: 0,
    fontSize: "0.65rem",
    color: "#666",
  },
  sessionDeleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.75rem",
    opacity: 0.5,
  },
  // Main chat
  container: {
    flex: 1,
    maxWidth: 700,
    margin: "0 auto",
    padding: "1.5rem",
    fontFamily: "'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
  },
  menuBtn: {
    background: "rgba(15, 20, 40, 0.95)",
    color: "#06e5c0e3",
    fontSize: "1.2rem",
    padding: "0.3rem 0.6rem",
    borderRadius: 6,
    cursor: "pointer",
  },
  title: {
    background: "rgba(137, 139, 147, 0.95)",
    margin: 0,
    fontSize: "1.4rem",
    color: "#090301ff",
  },
  debugLabel: {
    background: "rgba(15, 20, 40, 0.95)",
    padding: "0.1rem 0.3rem",
    borderRadius: 6,
    fontSize: "0.75rem",
    color: "#06e5c0e3",
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    cursor: "pointer",
  },
  messagesArea: {
    flex: 1,
    borderRadius: 12,
    padding: "1rem",
    overflowY: "auto",
    backgroundColor: "rgba(22, 33, 62, 0.9)",
    border: "1px solid #0f3460",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem 1rem",
  },
  emptyIcon: {
    fontSize: "2.5rem",
    margin: 0,
  },
  emptyText: {
    color: "#e0e0e0",
    fontSize: "1.1rem",
    margin: "0.5rem 0",
  },
  emptyHint: {
    color: "#888",
    fontSize: "0.85rem",
  },
  bubble: {
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: 16,
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  userBubble: {
    backgroundColor: "#e94560",
    color: "#ffffff",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#0f3460",
    color: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  debugBox: {
    margin: "2px 0 8px 0",
    padding: "8px 10px",
    backgroundColor: "rgba(255, 193, 7, 0.15)",
    border: "1px solid rgba(255, 193, 7, 0.4)",
    borderRadius: 8,
    fontSize: "0.75rem",
    fontFamily: "monospace",
    color: "#ffc107",
  },
  thinking: {
    marginTop: 8,
    fontSize: "0.8rem",
    color: "#888",
  },
  inputArea: {
    marginTop: "0.8rem",
    display: "flex",
    gap: "0.5rem",
  },
  input: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: 24,
    border: "1px solid #0f3460",
    backgroundColor: "rgba(22, 33, 62, 0.9)",
    color: "#e0e0e0",
    fontSize: "0.9rem",
    outline: "none",
  },
  sendBtn: {
    padding: "10px 20px",
    borderRadius: 24,
    border: "none",
    backgroundColor: "#e94560",
    color: "#ffffff",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  sendBtnDisabled: {
    backgroundColor: "#555",
    cursor: "not-allowed",
  },
};

export default Chat;