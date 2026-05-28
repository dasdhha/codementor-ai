# CodeMentor AI — MVP

This repository contains a Vite + React + TypeScript MVP for CodeMentor AI.

Run locally:

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

Features in this initial MVP:
- Core layout with sidebar, editor, and AI chat
- Monaco Editor integration
- Python sandbox via Pyodide (CDN)
- JavaScript sandbox in secure iframe
- IndexedDB persistence (idb)
- Onboarding that generates a saved profile
- Modular AI provider with a local tutor implementation

Recent product upgrades (transition toward product-grade):
- Streaming AI chat support and provider adapter for Google Gemini (client-side test mode with proxy notes)
- Contextual memory stored in IndexedDB: conversations, lessons, and progress
- Lesson engine that generates a personalized roadmap from onboarding
- AI "Fix" action in editor: sends code+error context to AI and applies suggested fixes
- Progress & gamification basics: XP, levels, streaks
- Dashboard with lesson list and activity heatmap

Security & production notes:
- Do NOT store API keys in client-side code in production. Use a secure server-side proxy for Gemini/OpenAI.
- The Gemini provider included is an adapter that expects a proxy endpoint; replace `api.example-gemini` with your production proxy.

Next steps being worked on: full Gemini streaming via server proxy, deeper code analysis pipelines, adaptive difficulty algorithms, and richer gamification UI.

Next steps: add Gemini/OpenAI provider adapters, lesson engine, quizzes, gamification UI, and multi-language support.
