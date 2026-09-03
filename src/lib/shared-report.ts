import { isStoredAnalysis, type StoredAnalysis } from "@/lib/analysis-report";

export const SHARED_REPORT_ID = "shared";
export const SHARED_REPORT_HASH_PREFIX = "#share=";

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

export function createReadOnlyShareUrl(stored: StoredAnalysis, origin: string) {
  const payload = encodeBase64Url(JSON.stringify(stored));
  return `${origin}/report/${SHARED_REPORT_ID}${SHARED_REPORT_HASH_PREFIX}${payload}`;
}

export function readSharedAnalysis(hash: string): StoredAnalysis | null {
  if (!hash.startsWith(SHARED_REPORT_HASH_PREFIX)) return null;
  try {
    const encoded = hash.slice(SHARED_REPORT_HASH_PREFIX.length);
    if (!encoded || encoded.length > 100_000) return null;
    const parsed = JSON.parse(decodeBase64Url(encoded)) as unknown;
    return isStoredAnalysis(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
