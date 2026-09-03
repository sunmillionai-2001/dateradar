# DateXray

DateXray is a relationship risk radar for dating conversations. This repository is being built milestone by milestone from the product specification in `codex-brief.md`.

## Current milestone

M5 adds the compliance and release-safety layer on top of the evidence-first analysis flow:

- Paste conversation text
- Upload multiple chat screenshots for Alibaba Cloud Qwen-OCR, with Tesseract.js as the no-key fallback
- Upload up to 10 minutes / 25 MB of audio for OpenAI Whisper transcription
- Analyze the normalized transcript with Anthropic by default or DeepSeek when selected
- Show the computed risk level, six-category radar, one-line read, and disclaimer
- Unlock evidence quotes, interpretations, response advice, and a next-date checklist
- Copy a read-only sharing link after the full report is unlocked
- Open a shareable 9:10 image report, celebrate the unlock, and download a branded PNG with a report QR code

Your conversation is processed securely and never permanently stored. Temporary processing data is deleted within minutes.
Screenshots and audio use request-scoped processing references that are released immediately after conversion. Before unlock, only the free report, an opaque report ID, and a one-time access token reach the browser; evidence, advice, and checklist data stay in a short-lived server memory store.
After a successful unlock, the complete report is returned once and may be kept in that browser tab's session storage. Read-only links contain the unlocked report in a server-signed token; anyone who receives a valid link can read its included evidence, while modified or forged tokens are rejected.

The Terms of Service, Privacy Policy, Disclaimer, and notice-and-removal channel are available under `/legal`. `POST /api/analyze` is limited to 10 requests per client IP per hour and returns standard rate-limit headers plus `Retry-After` when blocked.

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
| `DEV_MODE` | Local development only: `true` auto-unlocks via the server endpoint; it is ignored in production |
| `SHARE_SIGNING_SECRET` | Server-only secret (at least 32 characters) used to sign and verify read-only report links; required outside local dev mode |

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

### Full-report access and development mode

`POST /api/analyze` returns only the free tier: risk level, summary, radar values, and disclaimer. It keeps the evidence chain, response advice, and next-date checklist in server memory for 10 minutes. `POST /api/unlock` requires both the opaque report ID and its one-time random access token. A valid unlock returns the full tier once, deletes the pending server copy, and issues a signed read-only sharing token. Replays, expired credentials, and modified share tokens are rejected.

The first 100 production unlocks per UTC day are complimentary. After that quota is reached, the UI displays the reserved $4.99 Paddle offer as coming soon; no payment is collected yet. With `DEV_MODE=true`, locally generated reports auto-unlock through the same server endpoint without consuming the quota. Production explicitly ignores `DEV_MODE`.

The pending-report store and daily counter are intentionally in-memory for this milestone. They are process-local: a multi-instance or serverless deployment can lose pending reports between requests and cannot enforce a globally exact daily quota. Before horizontally scaled production, replace `src/lib/server/report-store.ts` with a shared TTL store and atomic counter such as Redis/KV. The API boundary and browser data split do not change.

The first unlock also opens a shareable image-report preview. The poster is rendered from the real report, ranks up to three signal highlights by severity and category, and exports as a 3x PNG in the browser. Its QR code points to the same read-only report URL. Poster conclusions and guidance describe possible risk and offer reference actions only; they never make a relationship decision for the user.

Run the M5 locked-data and signed-link regression against an isolated local production server:

```bash
npm run test:m5-security
```

This verifies that analysis responses contain no full-tier fields, invalid tokens do not consume reports, unlock credentials are one-time, the 101st daily unlock receives the payment-required response, and tampered or unsigned share links do not reveal report evidence.
