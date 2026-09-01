# DateXray

DateXray is a relationship risk radar for dating conversations. This repository is being built milestone by milestone from the product specification in `codex-brief.md`.

## Current milestone

M2 includes three input paths that all produce the same editable, normalized transcript:

- Paste conversation text
- Upload multiple chat screenshots for in-browser OCR with Tesseract.js
- Upload up to 10 minutes / 25 MB of audio for OpenAI Whisper transcription

Screenshots are processed locally and their browser file references are cleared as soon as OCR finishes. Audio is never written to the DateXray filesystem and its request/file references are released immediately after transcription.

AI behavior-signal analysis is intentionally deferred to M3.

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

### Whisper development mode

The real `whisper-1` request is implemented in `src/app/api/transcribe/route.ts`. When `OPENAI_API_KEY` is empty, the route returns a clearly labeled mock transcript so the complete audio-to-editable-text flow can be tested without a key. Add the key to `.env.local` and restart the development server to enable real transcription automatically.
