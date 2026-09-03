# DateXray

DateXray is a relationship risk radar for dating conversations. This repository is being built milestone by milestone from the product specification in `codex-brief.md`.

## Current milestone

M4 adds a local-first full-report unlock layer on top of the evidence-first analysis flow:

- Paste conversation text
- Upload multiple chat screenshots for Alibaba Cloud Qwen-OCR, with Tesseract.js as the no-key fallback
- Upload up to 10 minutes / 25 MB of audio for OpenAI Whisper transcription
- Analyze the normalized transcript with Anthropic by default or DeepSeek when selected
- Show the computed risk level, six-category radar, one-line read, and disclaimer
- Unlock evidence quotes, interpretations, response advice, and a next-date checklist
- Copy a read-only sharing link after the full report is unlocked

Screenshots and audio are processed securely, never written to the DateXray filesystem, and their request/file references are released immediately after conversion.
Free reports are kept only in the current browser tab through session storage; the server does not persist the transcript or report.
Unlock records stay in local storage. Read-only links carry the validated report in the URL fragment, which is not sent to or stored by the DateXray server; anyone who receives the link can read its included evidence.

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
| `ANTHROPIC_API_KEY` | Default Claude analysis provider; deterministic mock analysis is used when empty |
| `OPENAI_API_KEY` | Whisper transcription (M2) |
| `ALIYUN_OCR_API_KEY` | Alibaba Cloud Model Studio Qwen-OCR; local Tesseract is used when empty |
| `DEEPSEEK_API_KEY` | Optional DeepSeek analysis provider; mock analysis is used when selected but empty |
| `AI_PROVIDER` | `anthropic` by default; `deepseek` when selected |
| `DEV_MODE` | Set to `true` to unlock full reports without payment during M4 development |

### Whisper development mode

The real `whisper-1` request is implemented in `src/app/api/transcribe/route.ts`. When `OPENAI_API_KEY` is empty, the route returns a clearly labeled mock transcript so the complete audio-to-editable-text flow can be tested without a key. Add the key to `.env.local` and restart the development server to enable real transcription automatically.

### Screenshot OCR provider

`src/app/api/ocr/route.ts` uses Alibaba Cloud Model Studio's `qwen3.5-ocr` model when `ALIYUN_OCR_API_KEY` is configured. The API key stays on the server. When it is empty, the browser automatically uses Tesseract.js and labels the result `using local OCR fallback`. Screenshots are processed in selection order and cleared immediately after recognition; the merged transcript remains editable so speaker names can be corrected or added.

### AI analysis provider

`POST /api/analyze` uses the provider abstraction in `src/lib/ai`. `AI_PROVIDER=anthropic` is the default; set it to `deepseek` to switch providers. Both providers receive the same `signals.json` catalog, return the same fixed report schema, and run with `temperature=0`. The server validates evidence quotes and recomputes risk and radar values before returning the report. When the selected provider key is empty, a visible `Mock analysis` label is shown on the report.

Run the three built-in M3 regression conversations against a local server on port 3001:

```bash
npm run test:m3
```

Use `DATEXRAY_TEST_URL=http://localhost:3000 npm run test:m3` if the server is on another port.

### Full-report development mode

With `DEV_MODE=true`, every locally generated report opens its full evidence section automatically and records a per-report `dev_mode` unlock in browser local storage. With development mode disabled, the same section shows the locked $4.99 placeholder; Paddle checkout will replace that placeholder in a later payment integration. The free risk badge, radar, summary, and disclaimer remain above the fold and do not depend on unlock status.
