# Agent Guidelines & Development Standards

This document preserves persistent coding standards, scope boundaries, and design guidelines for Google AI Photo Search.

## 1. Core Intent & Scope Discipline
- Build strictly what the user requests: clean personal photo management with natural language semantic search.
- Never add unsolicited third-party SDKs, mock external social features, or unsolicited complex multi-tab layouts.
- Prefer deletion and simplification over adding unnecessary code.

## 2. Google Ecosystem Utilization
- **Vision & Embeddings**: Always use `@google/genai` TypeScript SDK (`gemini-2.5-flash` for vision analysis and `gemini-embedding-2-preview` for embeddings).
- **Vector Search**: Use Vertex AI Vector Search principles for cosine similarity matching.
- **Persistence**: Use Google Cloud Firestore as the source of truth for photo and album records.
- **Object Storage**: Store image references using Google Cloud Storage URI conventions (`gs://...`).

## 3. UI & Styling Architecture
- **Palette**: Neutral soft clay `#EEF2F6` with subtle raised and inset neomorphic shadows.
- **Sidebar**: Floating, sticky layout docked via `sticky top-4 self-start` with internal scrolling (`max-h-[calc(100vh-5.5rem)] overflow-y-auto`).
- **Icons**: Always import icons from `lucide-react`.
- **Motion**: Use `motion` for layout and modal transitions.

## 4. Full-Stack Conventions
- Dev command: `tsx server.ts`
- Build command: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
- Always bind Express to `0.0.0.0` and port `3000`.
