import type { Metadata } from "next";

import { ReportView } from "@/components/report-view";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Signal report",
  description: "Your private DateXray relationship signal snapshot.",
};

export default async function ReportPage({ params }: PageProps<"/report/[id]">) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <SiteHeader showAnalyzeAction={false} />
      <ReportView key={id} reportId={id} />
    </main>
  );
}
