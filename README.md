# DateXray

DateXray is a relationship risk radar for dating conversations. This repository is being built milestone by milestone from the product specification in `codex-brief.md`.

## Current milestone

M2 includes three input paths that all produce the same editable, normalized transcript:

- Paste conversation text
- Upload multiple chat screenshots for Alibaba Cloud Qwen-OCR, with Tesseract.js as the no-key fallback
- Upload up to 10 minutes / 25 MB of audio for OpenAI Whisper transcription

Screenshots and audio are processed securely, never written to the DateXray filesystem, and their request/file references are released immediately after conversion.

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
| `ALIYUN_OCR_API_KEY` | Alibaba Cloud Model Studio Qwen-OCR; local Tesseract is used when empty |
| `DEEPSEEK_API_KEY` | Optional DeepSeek analysis provider (M3) |
| `AI_PROVIDER` | `anthropic` by default; `deepseek` when selected |
| `DEV_MODE` | Enables development unlock flow in M4 |

### Whisper development mode

The real `whisper-1` request is implemented in `src/app/api/transcribe/route.ts`. When `OPENAI_API_KEY` is empty, the route returns a clearly labeled mock transcript so the complete audio-to-editable-text flow can be tested without a key. Add the key to `.env.local` and restart the development server to enable real transcription automatically.

### Screenshot OCR provider

`src/app/api/ocr/route.ts` uses Alibaba Cloud Model Studio's `qwen3.5-ocr` model when `ALIYUN_OCR_API_KEY` is configured. The API key stays on the server. When it is empty, the browser automatically uses Tesseract.js and labels the result `using local OCR fallback`. Screenshots are processed in selection order and cleared immediately after recognition; the merged transcript remains editable so speaker names can be corrected or added.
