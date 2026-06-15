# Copilot instructions for HVAC training workspace

## Scope and architecture
- This workspace is split into two apps: `hvac-chat-frontend/` (Vite + React + TypeScript) and `hvac-backend/` (FastAPI).
- Frontend sends user chat text to backend `POST /chat`; backend returns `{ "reply": string }`.
- Keep request/response contract synchronized across both apps.
- Backend logic is currently a placeholder (keyword matching) and intended for later LLM/API integration.

## Frontend patterns (`hvac-chat-frontend`)
- Entry flow: `src/main.tsx` -> `src/App.tsx` -> `src/Chat.tsx`.
- `src/api.ts` is the HTTP boundary; do not scatter Axios calls across components.
- Backend URL is hardcoded as `http://localhost:8000` in `src/api.ts`.
- Chat state is local in `src/Chat.tsx` using:
  - `messages: { role: "user" | "assistant"; text: string }[]`
  - `input`, `loading`
- Send flow in `Chat.tsx`:
  - trim input -> append user message -> call `sendChatMessage()` -> append assistant reply.
- Error strategy in `src/api.ts`: return a fallback reply string (no thrown error to caller).
- Styling is mostly inline in `src/Chat.tsx` with base global styles in `src/index.css`; keep styling approach consistent unless refactoring intentionally.

## Backend patterns to respect (`hvac-backend`)
- Main backend is `app.py` with FastAPI and Pydantic models `ChatRequest`/`ChatResponse`.
- Routes:
  - `GET /`
  - `POST /chat` with `response_model=ChatResponse`
- CORS allows Vite dev origins (`localhost:5173`, `127.0.0.1:5173`).

## Developer workflows
- Frontend dev server: `npm run dev` (port 5173 in `vite.config.ts`).
- Frontend build/preview: `npm run build`, `npm run preview`.
- Backend run from `hvac-backend/`: `uvicorn app:app --reload --port 8000`.
- No test framework is configured; verify changes by running both apps and chatting through the UI.

## Change guidance for agents
- Any API shape change must be applied in both places:
  - backend `app.py`
  - frontend `src/api.ts` and UI usage in `src/Chat.tsx`
- Keep code beginner-friendly: explicit types, straightforward control flow, low abstraction.
- Avoid introducing new architectural layers unless explicitly requested.
