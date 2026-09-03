import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { Redis } from "@upstash/redis";

import { isStoredAnalysis, type StoredAnalysis } from "@/lib/analysis-report";

const REPORT_TTL_SECONDS = 10 * 60;
const REPORT_TTL_MS = REPORT_TTL_SECONDS * 1_000;
const MAX_PENDING_REPORTS = 5_000;
const DAILY_FREE_UNLOCK_LIMIT = 100;
const REDIS_KEY_PREFIX = "datexray:v1";

const UNLOCK_SCRIPT = `
local pending = redis.call("GET", KEYS[1])
if not pending then
  return {"invalid"}
end

local separator = string.find(pending, "\\n", 1, true)
if not separator then
  redis.call("DEL", KEYS[1])
  return {"invalid"}
end

if string.sub(pending, 1, separator - 1) ~= ARGV[1] then
  return {"invalid"}
end

if ARGV[2] ~= "1" then
  local used = tonumber(redis.call("GET", KEYS[2]) or "0")
  if used >= tonumber(ARGV[3]) then
    return {"payment_required"}
  end

  redis.call("INCR", KEYS[2])
  if used == 0 then
    redis.call("EXPIREAT", KEYS[2], tonumber(ARGV[4]))
  end
end

redis.call("DEL", KEYS[1])
return {"unlocked", string.sub(pending, separator + 1)}
`;

type PendingReport = {
  accessTokenHash: Buffer;
  expiresAt: number;
  stored: StoredAnalysis;
  timer: ReturnType<typeof setTimeout>;
};

type RuntimeReportState = {
  dailyUnlocks: { count: number; utcDate: string };
  pendingReports: Map<string, PendingReport>;
};

type UnlockResult =
  | { status: "invalid" }
  | { status: "payment_required" }
  | { status: "unlocked"; stored: StoredAnalysis };

const runtimeGlobal = globalThis as typeof globalThis & {
  __datexrayReportState?: RuntimeReportState;
  __datexrayRedisClient?: Redis;
};

const state = runtimeGlobal.__datexrayReportState ?? {
  dailyUnlocks: { count: 0, utcDate: new Date().toISOString().slice(0, 10) },
  pendingReports: new Map<string, PendingReport>(),
};
runtimeGlobal.__datexrayReportState = state;

export class ReportStoreUnavailableError extends Error {
  constructor() {
    super("The secure report store is temporarily unavailable. Please try again.");
    this.name = "ReportStoreUnavailableError";
  }
}

function hasRedisEnvironment() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();
  return { token, url };
}

function getRedis() {
  const { token, url } = hasRedisEnvironment();
  if (!url && !token) return null;
  if (!url || !token) throw new ReportStoreUnavailableError();

  runtimeGlobal.__datexrayRedisClient ??= new Redis({
    automaticDeserialization: false,
    enableAutoPipelining: false,
    enableTelemetry: false,
    responseEncoding: false,
    token,
    url,
  });
  return runtimeGlobal.__datexrayRedisClient;
}

export function getReportStoreMode() {
  const { token, url } = hasRedisEnvironment();
  return url || token ? "redis" : "memory";
}

function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest();
}

function hashAccessTokenHex(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function pendingRedisKey(reportId: string) {
  return `${REDIS_KEY_PREFIX}:pending:${reportId}`;
}

function dailyRedisKey(now: Date) {
  return `${REDIS_KEY_PREFIX}:daily-unlocks:${now.toISOString().slice(0, 10)}`;
}

function nextUtcMidnightSeconds(now: Date) {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) / 1_000);
}

function deletePendingReportFromMemory(reportId: string) {
  const pending = state.pendingReports.get(reportId);
  if (pending) clearTimeout(pending.timer);
  state.pendingReports.delete(reportId);
}

function sweepExpiredMemoryReports(now: number) {
  for (const [reportId, pending] of state.pendingReports) {
    if (pending.expiresAt <= now) deletePendingReportFromMemory(reportId);
  }
}

function createPendingReportInMemory(stored: StoredAnalysis, reportId: string, accessToken: string, expiresAt: number) {
  sweepExpiredMemoryReports(Date.now());

  while (state.pendingReports.size >= MAX_PENDING_REPORTS) {
    const oldestId = state.pendingReports.keys().next().value;
    if (typeof oldestId !== "string") break;
    deletePendingReportFromMemory(oldestId);
  }

  const timer = setTimeout(() => deletePendingReportFromMemory(reportId), REPORT_TTL_MS);
  timer.unref?.();
  state.pendingReports.set(reportId, {
    accessTokenHash: hashAccessToken(accessToken),
    expiresAt,
    stored,
    timer,
  });
}

async function createPendingReportInRedis(redis: Redis, stored: StoredAnalysis, reportId: string, accessToken: string) {
  const value = `${hashAccessTokenHex(accessToken)}\n${JSON.stringify(stored)}`;
  const result = await redis.set(pendingRedisKey(reportId), value, { ex: REPORT_TTL_SECONDS, nx: true });
  if (result !== "OK") throw new ReportStoreUnavailableError();
}

export async function createPendingReport(stored: StoredAnalysis) {
  const now = Date.now();
  const reportId = randomUUID();
  const accessToken = randomBytes(32).toString("base64url");
  const expiresAt = now + REPORT_TTL_MS;
  const redis = getRedis();

  if (redis) {
    try {
      await createPendingReportInRedis(redis, stored, reportId, accessToken);
    } catch (error) {
      if (error instanceof ReportStoreUnavailableError) throw error;
      throw new ReportStoreUnavailableError();
    }
  } else {
    createPendingReportInMemory(stored, reportId, accessToken, expiresAt);
  }

  return { reportId, accessToken, expiresAt };
}

function getDailyUnlockAvailability(now: Date) {
  const utcDate = now.toISOString().slice(0, 10);
  if (state.dailyUnlocks.utcDate !== utcDate) state.dailyUnlocks = { count: 0, utcDate };
  return state.dailyUnlocks.count < DAILY_FREE_UNLOCK_LIMIT;
}

function unlockPendingReportInMemory(reportId: string, accessToken: string, bypassDailyLimit: boolean): UnlockResult {
  const now = Date.now();
  const pending = state.pendingReports.get(reportId);

  if (!pending || pending.expiresAt <= now) {
    if (pending) deletePendingReportFromMemory(reportId);
    return { status: "invalid" };
  }

  const suppliedHash = hashAccessToken(accessToken);
  if (suppliedHash.length !== pending.accessTokenHash.length || !timingSafeEqual(suppliedHash, pending.accessTokenHash)) {
    return { status: "invalid" };
  }

  if (!bypassDailyLimit && !getDailyUnlockAvailability(new Date(now))) return { status: "payment_required" };

  deletePendingReportFromMemory(reportId);
  if (!bypassDailyLimit) state.dailyUnlocks.count += 1;
  return { status: "unlocked", stored: pending.stored };
}

async function unlockPendingReportInRedis(redis: Redis, reportId: string, accessToken: string, bypassDailyLimit: boolean): Promise<UnlockResult> {
  const now = new Date();
  const result = await redis.eval<unknown[], unknown>(
    UNLOCK_SCRIPT,
    [pendingRedisKey(reportId), dailyRedisKey(now)],
    [
      hashAccessTokenHex(accessToken),
      bypassDailyLimit ? "1" : "0",
      String(DAILY_FREE_UNLOCK_LIMIT),
      String(nextUtcMidnightSeconds(now)),
    ],
  );

  if (!Array.isArray(result) || typeof result[0] !== "string") throw new ReportStoreUnavailableError();
  if (result[0] === "invalid") return { status: "invalid" };
  if (result[0] === "payment_required") return { status: "payment_required" };
  if (result[0] !== "unlocked" || typeof result[1] !== "string") throw new ReportStoreUnavailableError();

  try {
    const stored = JSON.parse(result[1]) as unknown;
    if (!isStoredAnalysis(stored)) throw new ReportStoreUnavailableError();
    return { status: "unlocked", stored };
  } catch (error) {
    if (error instanceof ReportStoreUnavailableError) throw error;
    throw new ReportStoreUnavailableError();
  }
}

export async function unlockPendingReport(reportId: string, accessToken: string, bypassDailyLimit: boolean): Promise<UnlockResult> {
  const redis = getRedis();
  if (!redis) return unlockPendingReportInMemory(reportId, accessToken, bypassDailyLimit);

  try {
    return await unlockPendingReportInRedis(redis, reportId, accessToken, bypassDailyLimit);
  } catch (error) {
    if (error instanceof ReportStoreUnavailableError) throw error;
    throw new ReportStoreUnavailableError();
  }
}
