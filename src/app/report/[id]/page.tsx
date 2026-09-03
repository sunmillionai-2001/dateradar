import type { Metadata } from "next";

import { ReportView } from "@/components/report-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { verifySignedShareToken } from "@/lib/server/share-token";
import { SHARED_REPORT_ID, SHARED_REPORT_QUERY_KEY } from "@/lib/shared-report";

export const metadata: Metadata = {
  title: "Signal report",
  description: "Your private DateXray relationship signal snapshot.",
  robots: { index: false, follow: false },
};

export default async function ReportPage({ params, searchParams }: PageProps<"/report/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const rawShareToken = query[SHARED_REPORT_QUERY_KEY];
  const shareToken = typeof rawShareToken === "string" ? rawShareToken : "";
  const sharedAnalysis = id === SHARED_REPORT_ID ? verifySignedShareToken(shareToken) : null;
  const devMode = process.env.NODE_ENV === "development" && process.env.DEV_MODE === "true";
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <SiteHeader showAnalyzeAction={false} />
      <ReportView
        key={`${id}-${shareToken.slice(-12)}`}
        reportId={id}
        devMode={devMode}
        sharedAnalysis={sharedAnalysis}
        shareToken={sharedAnalysis ? shareToken : ""}
        invalidSharedLink={id === SHARED_REPORT_ID && !sharedAnalysis}
      />
      <SiteFooter />
    </main>
  );
}
