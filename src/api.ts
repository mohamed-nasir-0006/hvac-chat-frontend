import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export type Msg = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ParsedIntent = {
  intent: string;
  zone?: string | null;
  value?: number | null;
  unit?: string | null;
  mode?: string | null;
  schedule?: string | null;
  confidence?: number | null;
};

export type ChatResponse = {
  reply: string;
  parsed?: ParsedIntent | null;
  history: Msg[];
  llm_raw?: any;
};

export async function sendChatMessage(
  message: string,
  history: Msg[]
): Promise<ChatResponse> {
  try {
    const res = await axios.post<ChatResponse>(`${BASE_URL}/chat`, {
      message,
      history,
    });
    return res.data;
  } catch (err: any) {
    console.error("Error calling backend /chat:", err);
    return {
      reply: "Error talking to server.",
      parsed: null,
      history,
      llm_raw: null,
    };
  }
}