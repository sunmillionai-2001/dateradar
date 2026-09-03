import { strFromU8, strToU8, unzlibSync, zlibSync } from "fflate";

import { isStoredAnalysis, type StoredAnalysis } from "@/lib/analysis-report";

export const SHARED_REPORT_ID = "shared";
export const SHARED_REPORT_HASH_PREFIX = "#share=";

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function createReadOnlyShareUrl(stored: StoredAnalysis, origin: string) {
  const compressed = zlibSync(strToU8(JSON.stringify(stored)), { level: 9 });
  const payload = `z${encodeBase64Url(compressed)}`;
  return `${origin}/report/${SHARED_REPORT_ID}${SHARED_REPORT_HASH_PREFIX}${payload}`;
}

export function readSharedAnalysis(hash: string): StoredAnalysis | null {
  if (!hash.startsWith(SHARED_REPORT_HASH_PREFIX)) return null;
  try {
    const encoded = hash.slice(SHARED_REPORT_HASH_PREFIX.length);
    if (!encoded || encoded.length > 100_000) return null;
    const json = encoded.startsWith("z")
      ? strFromU8(unzlibSync(decodeBase64Url(encoded.slice(1))))
      : new TextDecoder().decode(decodeBase64Url(encoded));
    if (json.length > 250_000) return null;
    const parsed = JSON.parse(json) as unknown;
    return isStoredAnalysis(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
