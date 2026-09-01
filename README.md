# DateRadar

DateRadar is a relationship risk radar for dating conversations. This repository is being built milestone by milestone from the product specification in `codex-brief.md`.

## Current milestone

M1 includes:

- Next.js App Router, TypeScript, and Tailwind CSS foundation
- English landing page
- Analyze page with transcript and audio upload entry points
- Client-side input validation and an “Analyzing…” demonstration state

Whisper transcription and AI analysis are intentionally not connected in M1.

## Local development

Requirements: Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local` or API keys.

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Default Claude analysis provider (M3) |
| `OPENAI_API_KEY` | Whisper transcription (M2) |
| `DEEPSEEK_API_KEY` | Optional DeepSeek analysis provider (M3) |
| `AI_PROVIDER` | `anthropic` by default; `deepseek` when selected |
| `DEV_MODE` | Enables development unlock flow in M4 |
