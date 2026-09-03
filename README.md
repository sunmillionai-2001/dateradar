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
Screenshots and audio use request-scoped processing references that are released immediately after conversion. Before unlock, only the free report, an opaque report ID, and a one-time access token reach the browser; evidence, advice, and checklist data stay in a short-lived server-side TTL store.
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
| `DEV_MODE` | Local development only: `true` auto-unlocks via the server endpoint; omit it or set `false` in Vercel Production |
| `SHARE_SIGNING_SECRET` | Required in production. Server-only secret of at least 32 characters used to sign and verify read-only report links |
| `UPSTASH_REDIS_REST_URL` | Recommended in production. Upstash Redis REST endpoint injected by the Vercel Marketplace integration |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended in production. Server-only Upstash standard REST token; never prefix it with `NEXT_PUBLIC_` |
| `KV_REST_API_URL` | Optional legacy alias for the Upstash/Vercel KV REST URL |
| `KV_REST_API_TOKEN` | Optional legacy alias for the Upstash/Vercel KV REST token |

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

`POST /api/analyze` returns only the free tier: risk level, summary, radar values, and disclaimer. It keeps the evidence chain, response advice, and next-date checklist in a server-side TTL store for 10 minutes. `POST /api/unlock` requires both the opaque report ID and its one-time random access token. A valid unlock returns the full tier once, deletes the pending server copy, and issues a signed read-only sharing token. Replays, expired credentials, and modified share tokens are rejected.

The first 100 production unlocks per UTC day are complimentary. After that quota is reached, the UI displays the reserved $4.99 Paddle offer as coming soon; no payment is collected yet. With `DEV_MODE=true`, locally generated reports auto-unlock through the same server endpoint without consuming the quota. Production explicitly ignores `DEV_MODE`.

When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present, pending reports and the UTC-day counter use shared Redis. Unlock runs as one atomic Lua operation: token verification, quota enforcement, counter increment, and one-time report deletion cannot interleave across instances. The standard Upstash token stays server-only. `X-DateXray-Report-Store: redis` on analyze and unlock responses confirms the shared path.

When neither Redis variable is configured, local development falls back to the bounded in-memory store. This keeps development and an emergency single-instance deployment usable, but it is not suitable for a multi-instance Vercel production deployment: an unlock can reach a different instance and daily counts are not global. If only one Redis variable is present or Redis is unavailable, the API fails closed with HTTP 503 instead of silently weakening the control.

The first unlock also opens a shareable image-report preview. The poster is rendered from the real report, ranks up to three signal highlights by severity and category, and exports as a 3x PNG in the browser. Its QR code points to the same read-only report URL. Poster conclusions and guidance describe possible risk and offer reference actions only; they never make a relationship decision for the user.

Run the M5 locked-data and signed-link regression against an isolated local production server:

```bash
npm run test:m5-security
```

This starts two isolated production Next.js instances against the same simulated Redis. It verifies cross-instance analyze-to-unlock continuity, that analysis responses contain no full-tier fields, invalid tokens do not consume reports, unlock credentials are one-time, the shared 101st daily unlock receives the payment-required response, and tampered or unsigned share links do not reveal report evidence.

## Deploy to Vercel

### 1. Import and configure the project

1. Import the GitHub repository into Vercel as a Next.js project, or run `vercel link` from this directory.
2. Keep the default install command (`npm install`) and build command (`npm run build`). No custom output directory is required.
3. In the [Vercel Marketplace](https://vercel.com/docs/marketplace-storage), install [Upstash for Redis](https://vercel.com/marketplace/upstash), create a database near the Function region, and connect it to this project. The integration should inject `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; Upstash documents the same serverless REST variables in its [connection guide](https://upstash.com/docs/redis/howto/connect-with-upstash-redis).
4. In Project Settings → Environment Variables, add the server-only variables for the correct targets. Production needs `SHARE_SIGNING_SECRET`, the selected AI provider key, and both Redis variables. Add `OPENAI_API_KEY` for real audio transcription and `ALIYUN_OCR_API_KEY` for cloud screenshot OCR.
5. Leave `DEV_MODE` unset in Production, or set it to `false`. Preview may use `DEV_MODE=true` only when the preview URL is access-controlled and contains no real user data.

Generate a signing secret locally, then paste only its output into Vercel's secret field:

```bash
openssl rand -base64 48
```

Do not paste the value into source files, Git history, build logs, or a `NEXT_PUBLIC_` variable.

### 2. Preview, verify, and promote

```bash
vercel env ls production
vercel deploy
vercel logs --environment preview --level error --since 5m
vercel deploy --prod
vercel logs --environment production --level error --since 5m
```

On the preview deployment, run one analysis and inspect its network response before promotion:

- `/api/analyze` contains only `risk_level`, `summary`, `radar`, and `disclaimers` inside `report`.
- `/api/analyze` and `/api/unlock` return `X-DateXray-Report-Store: redis`.
- Unlock succeeds after navigating between requests and the same credentials fail on replay.
- A changed character in the read-only share URL renders “This shared report cannot be verified.”
- The real selected provider is shown instead of `Mock analysis`.

### 3. Deployment blockers and safe fallbacks

- `npm run build` must pass before deployment. The API routes explicitly use the Node.js runtime because crypto, zlib, and the Redis client are server-side dependencies.
- Missing `SHARE_SIGNING_SECRET` does not fail the static build, but production unlock fails closed with HTTP 503. Treat it as a launch blocker.
- Supplying only one Redis variable fails report creation/unlock with HTTP 503. Configure both variables. Supplying neither enables the documented memory fallback, which is acceptable for local development but not multi-instance production.
- Missing the selected `ANTHROPIC_API_KEY` or `DEEPSEEK_API_KEY` enables mock analysis rather than failing the build. This is useful locally but is a launch blocker for real reports.
- Missing `OPENAI_API_KEY` enables mock audio transcription; missing `ALIYUN_OCR_API_KEY` enables local OCR. Both are deployable fallbacks, but verify that they match the intended production experience.
- Changing `SHARE_SIGNING_SECRET` invalidates previously issued read-only links. Rotate it only with that consequence understood.

## Final launch checklist

- [ ] Provision `legal@datexray.com`, confirm it can receive mail, and test the Terms, Privacy, Disclaimer, and footer mail links.
- [ ] Configure the production Anthropic or DeepSeek key and confirm `AI_PROVIDER` selects that provider.
- [ ] Configure `OPENAI_API_KEY` and `ALIYUN_OCR_API_KEY` if production should use real Whisper and cloud OCR.
- [ ] Connect Upstash Redis and confirm both REST variables plus `X-DateXray-Report-Store: redis`.
- [ ] Configure a unique production `SHARE_SIGNING_SECRET` of at least 32 characters.
- [ ] Confirm `DEV_MODE` is absent or `false` in Vercel Production.
- [ ] Run a real low-, medium-, and critical-risk conversation; verify badge, radar, heart state, unlock, poster PNG, QR code, and signed share link.
- [ ] Verify the free analyze response contains no evidence quotes, advice, or checklist through browser DevTools.
- [ ] Optional, low priority: register a U.S. Copyright Office DMCA designated agent (currently a separate operator filing and fee) if relying on the U.S. safe-harbor process.
