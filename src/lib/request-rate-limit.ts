import { createHmac, randomBytes } from "node:crypto";

const ANALYZE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1_000;
const MAX_TRACKED_CLIENTS = 10_000;
const CLIENT_KEY_SALT = randomBytes(32);

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const buckets = new Map<string, RateLimitBucket>();
let lastSweepAt = 0;

function getClientAddress(request: Request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")
    ?? "unknown";

  return forwarded.split(",")[0]?.trim().slice(0, 128) || "unknown";
}

function getClientKey(request: Request) {
  return createHmac("sha256", CLIENT_KEY_SALT).update(getClientAddress(request)).digest("hex");
}

function sweepExpiredBuckets(now: number, force = false) {
  if (!force && now - lastSweepAt < RATE_LIMIT_WINDOW_MS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  lastSweepAt = now;
}

export function consumeAnalyzeRateLimit(request: Request, now = Date.now()): RateLimitResult {
  sweepExpiredBuckets(now, buckets.size >= MAX_TRACKED_CLIENTS);

  const key = getClientKey(request);
  const existing = buckets.get(key);
  const bucket = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
    : existing;

  if (!existing && buckets.size >= MAX_TRACKED_CLIENTS) {
    const oldestKey = buckets.keys().next().value;
    if (typeof oldestKey === "string") buckets.delete(oldestKey);
  }

  if (bucket.count >= ANALYZE_LIMIT) {
    return {
      allowed: false,
      limit: ANALYZE_LIMIT,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: true,
    limit: ANALYZE_LIMIT,
    remaining: ANALYZE_LIMIT - bucket.count,
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1_000)),
  };
}
