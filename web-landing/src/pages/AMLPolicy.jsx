import { ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';

export default function AMLPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Internal AML & Fraud Control Policy
          </h1>
          <p className="text-slate-500 dark:text-white/50 text-lg">
            Last updated: March 2026
          </p>
        </div>

        {/* Content */}
        <div className="card p-8 sm:p-12 space-y-10 text-slate-600 dark:text-white/70 leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">1.</span> Purpose
            </h2>
            <p>
              This Anti-Money Laundering and Fraud Control Policy (“Policy”) establishes the framework adopted by ThinkTrophy (“the Platform”) to prevent, detect, investigate, and report financial crime, including money laundering, fraud, and misuse of platform functionality.
            </p>
            <p>
              This Policy is designed to align with applicable Nigerian regulatory expectations and the compliance requirements of payment service providers, including Paystack and Flutterwave.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">2.</span> Scope
            </h2>
            <p>This Policy applies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>all users of the Platform;</li>
              <li>all wallet funding, gameplay, and payout activities;</li>
              <li>all transactions processed through integrated payment providers;</li>
              <li>all internal monitoring, investigation, and reporting processes.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">3.</span> Risk-Based Approach
            </h2>
            <p>ThinkTrophy adopts a risk-based approach to compliance, applying controls proportionate to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>transaction value and frequency;</li>
              <li>user verification status;</li>
              <li>behavioural and transactional risk indicators;</li>
              <li>emerging fraud patterns and regulatory expectations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">4.</span> Customer Due Diligence (KYC)
            </h2>
            <div className="space-y-4">
              <p><strong>4.1</strong> ThinkTrophy shall implement identity verification measures, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>phone and/or email verification;</li>
                <li>collection of personal identification data;</li>
                <li>verification prior to withdrawals or risk-triggered events.</li>
              </ul>
              <p><strong>4.2</strong> Enhanced due diligence may be applied where:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>suspicious activity is detected;</li>
                <li>transaction thresholds are exceeded;</li>
                <li>account behaviour deviates from expected patterns.</li>
              </ul>
              <p><strong>4.3</strong> ThinkTrophy reserves the right to restrict, suspend, or terminate accounts where verification requirements are not satisfied.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">5.</span> Transaction Monitoring
            </h2>
            <div className="space-y-4">
              <p><strong>5.1</strong> ThinkTrophy shall implement continuous monitoring of transactions and user activity.</p>
              <p><strong>5.2</strong> Monitoring shall include detection of:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>rapid funding and withdrawal cycles;</li>
                <li>structured or high-frequency transactions;</li>
                <li>inconsistencies between funding and withdrawal patterns;</li>
                <li>linked or coordinated accounts;</li>
                <li>abnormal gameplay or behavioural patterns.</li>
              </ul>
              <p><strong>5.3</strong> Monitoring may be conducted through automated systems, rule-based detection, and manual review.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">6.</span> Escalation Procedures
            </h2>
            <div className="space-y-4">
              <p><strong>6.1</strong> All suspicious activity shall be assessed using a tiered escalation model:</p>
              
              <ul className="space-y-4 mt-4">
                <li>
                  <strong className="text-brand-dark dark:text-white block mb-1">Level 1 – Low Risk</strong>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>activity logged;</li>
                    <li>continued monitoring.</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-brand-dark dark:text-white block mb-1">Level 2 – Medium Risk</strong>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>temporary restriction on withdrawals;</li>
                    <li>request for additional verification.</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-brand-dark dark:text-white block mb-1">Level 3 – High Risk</strong>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>account suspension;</li>
                    <li>transaction hold;</li>
                    <li>escalation to compliance review.</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-brand-dark dark:text-white block mb-1">Level 4 – Critical Risk</strong>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>permanent account restriction;</li>
                    <li>withholding of funds (where permitted);</li>
                    <li>preparation for reporting through appropriate channels.</li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">7.</span> Fraud Case Handling Procedure
            </h2>
            <div className="space-y-4">
              <p><strong>7.1</strong> All flagged activity shall follow a standard investigation process:</p>
              
              <ul className="space-y-4 mt-4">
                <li>
                  <strong className="text-brand-dark dark:text-white">Step 1 – Detection:</strong> Trigger generated via monitoring system or manual report.
                </li>
                <li>
                  <strong className="text-brand-dark dark:text-white">Step 2 – Review:</strong> Assessment of transaction history, gameplay behaviour, device/IP data, and account linkage.
                </li>
                <li>
                  <strong className="text-brand-dark dark:text-white block mb-1">Step 3 – Classification:</strong>
                  Determination of:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>no issue;</li>
                    <li>suspicious activity;</li>
                    <li>confirmed fraud.</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-brand-dark dark:text-white block mb-1">Step 4 – Action:</strong>
                  Appropriate action taken, including:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>account release;</li>
                    <li>enhanced verification;</li>
                    <li>restriction or suspension;</li>
                    <li>escalation.</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-brand-dark dark:text-white block mb-1">Step 5 – Documentation:</strong>
                  All cases must be logged with:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>user identifier;</li>
                    <li>reason for flag;</li>
                    <li>actions taken;</li>
                    <li>final outcome.</li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">8.</span> Suspicious Transaction Reporting (STR Workflow)
            </h2>
            <div className="space-y-4">
              <p><strong>8.1</strong> Where suspicious activity is reasonably established:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>the case shall be escalated internally to compliance oversight;</li>
                <li>supporting documentation shall be compiled.</li>
              </ul>
              <p><strong>8.2</strong> Reporting shall be conducted:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>through licensed payment partners (e.g., Paystack, Flutterwave), where applicable; or</li>
                <li>directly to relevant authorities, where required by law.</li>
              </ul>
              <p><strong>8.3</strong> Reporting shall be conducted within required timelines following confirmation of suspicion.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">9.</span> Payment Integrity Controls
            </h2>
            <div className="space-y-4">
              <p><strong>9.1</strong> ThinkTrophy shall implement safeguards to ensure secure payment processing, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>confirmation of successful payment prior to wallet credit;</li>
                <li>monitoring of chargebacks, reversals, and failed transactions;</li>
                <li>detection of mismatched funding and withdrawal channels;</li>
                <li>delayed or conditional withdrawal eligibility where risk is identified.</li>
              </ul>
              <p><strong>9.2</strong> ThinkTrophy shall cooperate with payment providers in the investigation and resolution of disputed or fraudulent transactions.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">10.</span> Fair Use and Abuse Prevention
            </h2>
            <div className="space-y-4">
              <p><strong>10.1</strong> The Platform prohibits:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>use of automated tools or bots;</li>
                <li>collusion or coordinated gameplay;</li>
                <li>operation of multiple accounts;</li>
                <li>exploitation of system vulnerabilities.</li>
              </ul>
              <p><strong>10.2</strong> Violations may result in:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>disqualification;</li>
                <li>forfeiture of funds;</li>
                <li>suspension or termination of account access.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">11.</span> Record Keeping
            </h2>
            <div className="space-y-4">
              <p><strong>11.1</strong> ThinkTrophy shall maintain records of:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>user verification data;</li>
                <li>transaction and wallet activity;</li>
                <li>fraud investigations and compliance actions.</li>
              </ul>
              <p><strong>11.2</strong> Records shall be securely stored and retained in accordance with applicable legal and operational requirements.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">12.</span> Data Protection
            </h2>
            <p>All personal data processed under this Policy shall be handled in accordance with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>the Nigeria Data Protection Act (NDPA) 2023;</li>
              <li>ThinkTrophy’s Privacy & Data Protection Policy.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">13.</span> Governance and Oversight
            </h2>
            <p>ThinkTrophy shall maintain internal oversight of compliance and fraud risk management, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>assignment of compliance responsibilities;</li>
              <li>periodic review of monitoring rules;</li>
              <li>updates to controls based on emerging risks.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">14.</span> Cooperation with Payment Partners and Authorities
            </h2>
            <p>ThinkTrophy shall cooperate with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>payment service providers, including Paystack and Flutterwave;</li>
              <li>financial institutions;</li>
              <li>regulatory and law enforcement authorities;</li>
            </ul>
            <p>where necessary to prevent fraud, investigate suspicious activity, or comply with legal obligations.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">15.</span> Compliance Checklist (Operational Readiness)
            </h2>
            <p>ThinkTrophy maintains the following minimum compliance controls:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>user identity verification mechanisms;</li>
              <li>transaction monitoring systems;</li>
              <li>escalation and investigation procedures;</li>
              <li>suspicious activity reporting process;</li>
              <li>fraud prevention and payment integrity controls;</li>
              <li>record keeping and audit trail systems.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">16.</span> Amendments
            </h2>
            <p>ThinkTrophy reserves the right to amend this Policy at any time to reflect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>regulatory updates;</li>
              <li>changes in payment provider requirements;</li>
              <li>evolving fraud and risk conditions.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
