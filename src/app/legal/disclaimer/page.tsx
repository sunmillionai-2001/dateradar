import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";
import { LEGAL_CONTACT_EMAIL } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important limits of DateXray relationship signal reports.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" description="Read this before relying on any DateXray report or suggested next step.">
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-950">
        <h2>Informational only — not a diagnosis or verdict</h2>
        <p><strong>DateXray provides informational screening only. A report is not a medical or mental-health diagnosis, professional advice, proof of intent, a definitive judgment about another person, or a substitute for your own assessment.</strong></p>
      </section>
      <section>
        <h2>1. Reports identify possible signals</h2>
        <p>DateXray looks for observable wording that may match a limited signal catalog. It cannot know full context, tone, history, identity, truthfulness, or what happened outside the submitted excerpt. False positives and missed signals are possible.</p>
      </section>
      <section>
        <h2>2. You remain the decision-maker</h2>
        <p>Treat every result as one input, not a verdict. Suggestions are reference options only. Consider whether a pattern persists over time, seek context, and use your own judgment before making relationship, financial, legal, health, or safety decisions.</p>
      </section>
      <section>
        <h2>3. No professional relationship</h2>
        <p>Using DateXray does not create a doctor-patient, therapist-client, attorney-client, fiduciary, investigator, or other professional relationship. Consult an appropriately qualified professional when you need advice for your circumstances.</p>
      </section>
      <section>
        <h2>4. Safety and suspected fraud</h2>
        <p>If you believe you are in immediate danger, contact local emergency services. If money or account access may be at risk, consider pausing irreversible transfers while independently verifying details and contacting the relevant bank, payment provider, platform, or trusted professional.</p>
      </section>
      <section>
        <h2>5. Report or removal requests</h2>
        <p>To report a report or request review or removal, email <a href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=DateXray%20report%20or%20removal%20request`}>{LEGAL_CONTACT_EMAIL}</a> with the report URL or identifier, the specific concern, and a reliable way to contact you.</p>
      </section>
    </LegalPage>
  );
}
