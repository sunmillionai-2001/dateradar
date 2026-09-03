import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";
import { LEGAL_CONTACT_EMAIL } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of DateXray.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" description="These terms govern your access to DateXray and explain what you agree to when submitting conversation content for analysis.">
      <section>
        <h2>1. Acceptance and eligibility</h2>
        <p>By using DateXray, you agree to these Terms and the Privacy Policy. You must be at least 18 years old and legally able to enter into this agreement.</p>
      </section>
      <section>
        <h2>2. Informational service</h2>
        <p>DateXray compares submitted conversation text with a structured catalog of observable behavior signals. Results are generated with automated systems and may be incomplete, inaccurate, or affected by missing context. The service does not diagnose a person, determine intent, or make relationship decisions for you.</p>
      </section>
      <section>
        <h2>3. Your content and your rights</h2>
        <p>You retain ownership of content you submit. You represent and warrant that you own the content or have all rights, permissions, and lawful authority needed to upload, process, and use it with DateXray, including any consent required for recordings in your jurisdiction.</p>
        <p>You grant DateXray a limited, non-exclusive license to process the submitted content only as needed to provide, secure, and troubleshoot the requested service. This license ends when that processing is complete, except where limited temporary handling is required for security, abuse prevention, or legal compliance.</p>
      </section>
      <section>
        <h2>4. Prohibited use</h2>
        <p>Do not submit content unlawfully; violate another person&apos;s privacy or intellectual-property rights; attempt to identify, harass, threaten, defame, or discriminate against someone; bypass usage limits or payment controls; probe the service for vulnerabilities; or use a report as a definitive accusation.</p>
      </section>
      <section>
        <h2>5. Recording consent</h2>
        <p>Recording laws differ by location. DateXray does not encourage covert recording. You are responsible for obtaining all legally required notice and consent before recording or uploading audio.</p>
      </section>
      <section>
        <h2>6. Availability and changes</h2>
        <p>We may modify, suspend, or discontinue features to maintain security, comply with law, or improve the service. We may update these Terms and will post the revised effective date here.</p>
      </section>
      <section>
        <h2>7. Warranty and liability limits</h2>
        <p>DateXray is provided on an “as is” and “as available” basis to the extent permitted by law. We do not guarantee that a report will identify every risk or be error-free. To the extent permitted by law, DateXray is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the service.</p>
      </section>
      <section>
        <h2>8. General reports, removal, and contact</h2>
        <p>To report unlawful, harmful, or privacy-invasive content, or to request review or deletion, email <a href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=DateXray%20report%20or%20removal%20request`}>{LEGAL_CONTACT_EMAIL}</a>. Include the report URL or identifier, identify the material, explain the basis for the request, and provide a reliable way to contact you. We may restrict access while reviewing a sufficiently complete notice and remove qualifying material promptly.</p>
      </section>
      <section>
        <h2>9. Copyright notice-and-takedown</h2>
        <p>DateXray&apos;s copyright notice contact is the DateXray Copyright Agent at <a href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=DMCA%20copyright%20notice`}>{LEGAL_CONTACT_EMAIL}</a>. A copyright takedown notice should include:</p>
        <ul>
          <li>A physical or electronic signature of the copyright owner or a person authorized to act for the owner.</li>
          <li>Identification of the copyrighted work, or a representative list when one notice covers multiple works.</li>
          <li>Identification and location of the material claimed to infringe, including the report URL or other information sufficient for us to find it.</li>
          <li>Your name and sufficient contact information, including an email address.</li>
          <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
          <li>A statement that the notice is accurate and, under penalty of perjury, that you are the owner or authorized to act for the owner.</li>
        </ul>
        <p>We may promptly remove or disable access to material covered by a valid notice and, when possible, notify the person who supplied it. A person who believes material was removed by mistake may send a counter-notice to the same address identifying the removed material and its prior location, providing a physical or electronic signature and contact details, stating under penalty of perjury a good-faith belief that removal resulted from mistake or misidentification, and consenting to the jurisdiction and service-of-process requirements applicable under 17 U.S.C. § 512(g).</p>
        <p>DateXray may restrict or terminate access for repeat infringers in appropriate circumstances. Copyright safe-harbor eligibility also depends on operational and registration steps outside these Terms.</p>
      </section>
    </LegalPage>
  );
}
