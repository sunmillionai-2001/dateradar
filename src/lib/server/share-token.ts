import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";

import { isStoredAnalysis, type StoredAnalysis } from "@/lib/analysis-report";

const MAX_SHARE_TOKEN_LENGTH = 100_000;
const MAX_DECOMPRESSED_BYTES = 250_000;
const shareTokenGlobal = globalThis as typeof globalThis & {
  __datexrayDevelopmentShareSecret?: Buffer;
};

type ShareEnvelope = {
  issuedAt: string;
  stored: StoredAnalysis;
  version: 1;
};

export class ShareSigningConfigurationError extends Error {
  constructor() {
    super("SHARE_SIGNING_SECRET must be configured before signed sharing can be enabled.");
    this.name = "ShareSigningConfigurationError";
  }
}

function getSigningSecret() {
  const configured = process.env.SHARE_SIGNING_SECRET?.trim();
  if (configured && configured.length >= 32) return Buffer.from(configured, "utf8");

  const localDevMode = process.env.NODE_ENV === "development" && process.env.DEV_MODE === "true";
  if (!localDevMode) throw new ShareSigningConfigurationError();

  shareTokenGlobal.__datexrayDevelopmentShareSecret ??= randomBytes(32);
  return shareTokenGlobal.__datexrayDevelopmentShareSecret;
}

export function createSignedShareToken(stored: StoredAnalysis) {
  const envelope: ShareEnvelope = { issuedAt: new Date().toISOString(), stored, version: 1 };
  const payload = deflateRawSync(Buffer.from(JSON.stringify(envelope)), { level: 9 }).toString("base64url");
  const signature = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function assertShareSigningConfigured() {
  getSigningSecret();
}

export function verifySignedShareToken(token: string): StoredAnalysis | null {
  if (!token || token.length > MAX_SHARE_TOKEN_LENGTH) return null;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (
    !payload ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    !/^[A-Za-z0-9_-]{43}$/.test(suppliedSignature ?? "") ||
    extra
  ) return null;

  try {
    const expectedSignature = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
    const suppliedBuffer = Buffer.from(suppliedSignature, "ascii");
    const expectedBuffer = Buffer.from(expectedSignature, "ascii");
    if (!timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;

    const compressed = Buffer.from(payload, "base64url");
    const json = inflateRawSync(compressed, { maxOutputLength: MAX_DECOMPRESSED_BYTES }).toString("utf8");
    const envelope = JSON.parse(json) as Partial<ShareEnvelope>;
    return envelope.version === 1 && typeof envelope.issuedAt === "string" && isStoredAnalysis(envelope.stored)
      ? envelope.stored
      : null;
  } catch {
    return null;
  }
}
