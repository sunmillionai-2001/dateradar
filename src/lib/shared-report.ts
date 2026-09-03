export const SHARED_REPORT_ID = "shared";
export const SHARED_REPORT_QUERY_KEY = "share";

export function createReadOnlyShareUrl(shareToken: string, origin: string) {
  return `${origin}/report/${SHARED_REPORT_ID}?${SHARED_REPORT_QUERY_KEY}=${encodeURIComponent(shareToken)}`;
}
