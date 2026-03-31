import { Shield } from 'lucide-react';
import { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Privacy and Data Protection Policy
          </h1>
          <p className="text-slate-500 dark:text-white/50 text-lg">
            Last updated: March 2026
          </p>
        </div>

        {/* Content */}
        <div className="card p-8 sm:p-12 space-y-10 text-slate-600 dark:text-white/70 leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">1.</span> Introduction
            </h2>
            <p>
              ThinkTrophy (“we”, “us”, “our”) is committed to protecting personal data in accordance with the Nigeria Data Protection Act, 2023 (NDPA) and applicable regulatory directives.
            </p>
            <p>
              This Policy outlines how personal data is collected, processed, stored, and protected in a manner that is:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>lawful, fair, and transparent;</li>
              <li>limited to specific and legitimate purposes;</li>
              <li>secure and accountable.</li>
            </ul>
            <p>
              These principles reflect the statutory requirements under Section 24 of the NDPA.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">2.</span> Legal Basis & Scope
            </h2>
            <p>This Policy applies where:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>ThinkTrophy operates within Nigeria;</li>
              <li>personal data is processed within Nigeria; or</li>
              <li>personal data of individuals in Nigeria is processed.</li>
            </ul>
            <p>This aligns with the territorial scope of the NDPA.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">3.</span> Data Protection Principles
            </h2>
            <p>ThinkTrophy processes personal data in accordance with the following NDPA principles:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Lawfulness, fairness, and transparency</li>
              <li>Purpose limitation (data collected only for specific uses)</li>
              <li>Data minimisation (only necessary data collected)</li>
              <li>Accuracy and relevance</li>
              <li>Storage limitation</li>
              <li>Security and confidentiality</li>
            </ul>
            <p>We also maintain accountability and must demonstrate compliance at all times.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">4.</span> Lawful Basis for Processing
            </h2>
            <p>We process personal data only where lawful under NDPA Section 25, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>performance of a contract (e.g., competitions, payouts);</li>
              <li>compliance with legal obligations (e.g., AML, fraud checks);</li>
              <li>legitimate interests (e.g., fraud detection, platform improvement);</li>
              <li>consent (e.g., marketing, optional features).</li>
            </ul>
            <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 mt-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Legitimate interest will not apply where it overrides user rights.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">5.</span> Consent
            </h2>
            <p>Where processing is based on consent:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>consent must be freely given, specific, informed, and unambiguous;</li>
              <li>silence or inactivity does not constitute consent;</li>
              <li>users can withdraw consent at any time;</li>
              <li>withdrawal does not affect past lawful processing.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">6.</span> Information We Collect
            </h2>
            <p>
              We collect only data that is adequate, relevant, and limited to what is necessary for the purposes described in this Policy, in accordance with NDPA requirements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">7.</span> Data Privacy Impact Assessment
            </h2>
            <p>
              Where processing activities present a high risk to user rights, ThinkTrophy may conduct a Data Privacy Impact Assessment (DPIA) prior to processing.
            </p>
            <p>This includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>assessing risks to users;</li>
              <li>evaluating necessity and proportionality;</li>
              <li>implementing safeguards to mitigate risks.</li>
            </ul>
            <p>This is required under NDPA Section 28.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">8.</span> Children & Age Verification
            </h2>
            <p>
              ThinkTrophy is strictly available to individuals who are at least 18 years old (or the age of legal majority in their jurisdiction).
            </p>
            <p>
              By accessing or using the platform, you confirm that you meet this requirement. ThinkTrophy does not permit minors to register, access, or participate under any circumstances.
            </p>
            <p>
              We reserve the right to request identity verification at any time to confirm a user’s age. Any account found to be in violation of this requirement may be suspended or permanently terminated.
            </p>
            <p>
              Where necessary, ThinkTrophy reserves the right to take further action, including reporting to relevant authorities.
            </p>
            <p>This aligns with NDPA provisions on children’s data.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">9.</span> Data Security
            </h2>
            <p>ThinkTrophy implements measures including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>encryption and secure storage;</li>
              <li>system monitoring and fraud detection;</li>
              <li>periodic security assessments;</li>
              <li>access controls and authentication systems.</li>
            </ul>
            <p>These reflect NDPA security obligations.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">10.</span> Data Breach Notification
            </h2>
            <p>In the event of a personal data breach:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>ThinkTrophy will notify the Nigeria Data Protection Commission (NDPC) within 72 hours where required;</li>
              <li>affected users will be notified where the breach poses high risk;</li>
              <li>mitigation steps will be communicated clearly.</li>
            </ul>
            <p>This is mandated under NDPA Section 40.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">11.</span> Data Subject Rights
            </h2>
            <p>Users have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>access their personal data;</li>
              <li>request correction or deletion;</li>
              <li>restrict or object to processing;</li>
              <li>request portability of data;</li>
              <li>withdraw consent at any time;</li>
              <li>lodge complaints with the NDPC.</li>
            </ul>
            <p>These rights are guaranteed under NDPA Part VI.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">12.</span> Data Transfers
            </h2>
            <p>Where personal data is transferred outside Nigeria:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>transfers will only occur where adequate protection exists;</li>
              <li>ThinkTrophy will document the legal basis for such transfers.</li>
            </ul>
            <p>This aligns with NDPA cross-border transfer requirements.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">13.</span> Registration & Compliance
            </h2>
            <p>Where applicable, ThinkTrophy may:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>register as a Data Controller of Major Importance;</li>
              <li>comply with regulatory audits and filings;</li>
              <li>implement internal data governance structures.</li>
            </ul>
            <p>This reflects NDPA compliance obligations.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">14.</span> Relationship with Other Policies
            </h2>
            <p>This Policy operates alongside:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Terms and Conditions</li>
              <li>Payment</li>
              <li>Integrity & Fair Play Policy</li>
              <li>Compliance & Risk Statement</li>
              <li>Internal AML & Fraud Control Policy</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
