const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export type Msg = { role: string; content: string };

export type ParsedIntent = {
  intent: string;
  device?: string;
  zone?: string;
  value?: string;
  time?: string;
};

export type ChatResponse = {
  reply: string;
  parsed: ParsedIntent | null;
  history: Msg[];
  session_id: string;
};

export type Session = {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

// Chat
export async function sendChatMessage(
  message: string,
  history: Msg[],
  sessionId?: string
): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      session_id: sessionId || null,
    }),
  });
  return res.json();
}

// Sessions
export async function listSessions(): Promise<Session[]> {
  const res = await fetch(`${BASE_URL}/sessions`);
  const data = await res.json();
  return data.sessions;
}

export async function getSessionMessages(sessionId: string) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}`);
  return res.json();
}

export async function createSession(): Promise<Session> {
  const res = await fetch(`${BASE_URL}/sessions`, { method: "POST" });
  return res.json();
}

export async function deleteSession(sessionId: string) {
  await fetch(`${BASE_URL}/sessions/${sessionId}`, { method: "DELETE" });
}