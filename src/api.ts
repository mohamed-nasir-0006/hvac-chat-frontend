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

export async function streamChatMessage(
  message: string,
  history: Msg[],
  sessionId: string | null,
  onToken: (token: string) => void,
  onDone: (parsed: ParsedIntent | null, sessionId: string, reply: string | null) => void
) {
  const res = await fetch(`${BASE_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
      session_id: sessionId,
    }),
  });

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const dataLine = line.replace(/^data: /, "").trim();
      if (!dataLine) continue;

      try {
        const data = JSON.parse(dataLine);

        if (data.done) {
          onDone(data.parsed || null, data.session_id, data.reply || null);
        } else if (data.token) {
          onToken(data.token);
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }
}