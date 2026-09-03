import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";
import { LEGAL_CONTACT_EMAIL, PRIVACY_PROCESSING_NOTICE } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DateXray processes and protects submitted conversation data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" description="This policy explains what DateXray processes to provide a report and the choices available to you.">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
        <h2>Our processing commitment</h2>
        <p><strong>{PRIVACY_PROCESSING_NOTICE}</strong></p>
      </section>
      <section>
        <h2>1. Information we process</h2>
        <p>We process the conversation text you submit and, when selected, temporary screenshot or audio data needed to convert that material into text. We may also process limited technical information such as request time, error details, and a short-lived one-way representation of an IP address for security and rate limiting.</p>
      </section>
      <section>
        <h2>2. How we use information</h2>
        <p>We use submitted information to convert files, generate the requested signal report, prevent abuse, diagnose failures, and protect the service. We do not sell submitted conversation content or use it for targeted advertising.</p>
      </section>
      <section>
        <h2>3. Service providers</h2>
        <p>Depending on the feature and configured provider, submitted data may be processed by Anthropic or DeepSeek for analysis, OpenAI for audio transcription, and Alibaba Cloud for screenshot OCR. If cloud OCR is unavailable, local OCR may run in your browser. Providers process data under their own contractual and privacy terms.</p>
      </section>
      <section>
        <h2>4. Retention and local browser data</h2>
        <p>DateXray does not permanently store submitted conversations on its application server. Temporary processing references are released after the request and temporary report data is deleted within minutes. Before unlock, the browser tab keeps only the free report and short-lived access credentials in session storage. After unlock, that tab may keep the complete report in session storage so the page can function. Closing the tab or using your browser controls clears that local session data.</p>
      </section>
      <section>
        <h2>5. Sharing</h2>
        <p>If you deliberately create or copy a signed read-only report link, anyone who receives the valid link may see the information included in that shared report. Modified or forged links are rejected, but a valid link is a bearer credential, so do not share it with someone you do not trust. We may disclose limited information when required by law or when reasonably necessary to protect users, the service, or the public.</p>
      </section>
      <section>
        <h2>6. Security</h2>
        <p>We use reasonable technical and organizational safeguards designed to protect data during processing. No internet service can guarantee absolute security, so submit only the conversation material needed for the analysis and remove unnecessary identifying details.</p>
      </section>
      <section>
        <h2>7. Your choices and requests</h2>
        <p>You may ask what data is being processed, request deletion of qualifying data, or report a privacy concern by emailing <a href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=DateXray%20privacy%20or%20deletion%20request`}>{LEGAL_CONTACT_EMAIL}</a>. Include the relevant report URL or identifier and enough information for us to locate and evaluate the request.</p>
      </section>
      <section>
        <h2>8. Children and policy updates</h2>
        <p>DateXray is intended only for adults age 18 or older. We may update this policy as the service changes and will post the new effective date on this page.</p>
      </section>
    </LegalPage>
  );
}
