import { FileWarning } from 'lucide-react';
import { useEffect } from 'react';

export default function CompliancePolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <FileWarning size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Compliance & Risk Statement
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
              This Compliance & Risk Statement (“Statement”) sets out the framework adopted by ThinkTrophy (“the Platform”, “we”, “us”, “our”) to identify, assess, monitor, and mitigate risks associated with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>financial crime, including money laundering and fraud;</li>
              <li>misuse of payment functionality;</li>
              <li>unfair or abusive platform behaviour;</li>
              <li>data protection and operational security risks.</li>
            </ul>
            <p>
              This Statement operates independently of, but in conjunction with, the ThinkTrophy Terms and Conditions and Privacy & Data Protection Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">2.</span> Regulatory Positioning
            </h2>
            <div className="space-y-4">
              <p><strong>2.1</strong> ThinkTrophy is a digital platform that enables users to participate in skill-based competitions and may facilitate wallet-based transactions, including funding, entry payments, and payouts.</p>
              <p><strong>2.2</strong> ThinkTrophy does not operate as a licensed financial institution or deposit-taking entity and, where applicable, relies on regulated third-party payment service providers for the processing of financial transactions.</p>
              <p><strong>2.3</strong> ThinkTrophy acknowledges that its activities may fall within the scope of applicable Nigerian regulatory frameworks, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Anti-Money Laundering, Counter-Terrorist Financing, and Counter-Proliferation Financing (AML/CFT/CPF) regulations;</li>
                <li>Nigeria Data Protection Act (NDPA) 2023;</li>
                <li>applicable directives issued by the Central Bank of Nigeria (CBN), Nigeria Financial Intelligence Unit (NFIU), and other competent authorities.</li>
              </ul>
              <p><strong>2.4</strong> ThinkTrophy commits to operating in a manner consistent with applicable laws and regulatory expectations and to updating its compliance framework as such requirements evolve.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">3.</span> Risk-Based Compliance Approach
            </h2>
            <div className="space-y-4">
              <p><strong>3.1</strong> ThinkTrophy adopts a risk-based approach to compliance, whereby controls are proportionate to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>the nature of services offered;</li>
                <li>the level of financial exposure;</li>
                <li>user behaviour and transaction patterns;</li>
                <li>identified fraud and money laundering risks.</li>
              </ul>
              <p><strong>3.2</strong> The Platform continuously evaluates risk exposure and implements controls to prevent, detect, and respond to suspicious or unlawful activity.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">4.</span> Anti-Money Laundering (AML) and Financial Crime Risk
            </h2>
            <div className="space-y-4">
              <p><strong>4.1</strong> ThinkTrophy recognises that digital platforms facilitating payments, rewards, or refunds may be exposed to financial crime risks, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>the use of accounts to introduce illicit funds into the financial system;</li>
                <li>conversion of unlawful funds into seemingly legitimate payouts;</li>
                <li>exploitation of platform features to disguise or transfer funds.</li>
              </ul>
              <p><strong>4.2</strong> Key risks identified include, but are not limited to:</p>
              <ul className="space-y-4 mt-2">
                <li><strong>(a) Mule Account Risk:</strong> Use of accounts by third parties to process illicit funds through the Platform.</li>
                <li><strong>(b) Structured Transaction Risk:</strong> Breaking down large-value transactions into smaller amounts to evade detection.</li>
                <li><strong>(c) Refund and Reversal Abuse:</strong> Exploitation of refund, cashback, or payout mechanisms to facilitate laundering.</li>
                <li><strong>(d) Account Takeover and Social Engineering:</strong> Unauthorised access to user accounts for fraudulent withdrawals or transfers.</li>
                <li><strong>(e) Collusion and Synthetic Identity Risk:</strong> Use of multiple or coordinated accounts to manipulate outcomes or financial flows.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">5.</span> Customer Due Diligence (KYC Controls)
            </h2>
            <div className="space-y-4">
              <p><strong>5.1</strong> ThinkTrophy implements proportionate identity verification measures, which may include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>collection of personal identification information;</li>
                <li>verification of contact details;</li>
                <li>identity verification prior to withdrawals or risk-triggered activity;</li>
                <li>enhanced due diligence for high-risk accounts.</li>
              </ul>
              <p><strong>5.2</strong> ThinkTrophy reserves the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>request additional identification documents;</li>
                <li>restrict or suspend accounts pending verification;</li>
                <li>deny access where identity cannot be reasonably verified.</li>
              </ul>
              <p><strong>5.3</strong> Where applicable, ThinkTrophy may integrate identity verification mechanisms through licensed partners, including BVN/NIN validation systems.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">6.</span> Transaction Monitoring and Risk Detection
            </h2>
            <div className="space-y-4">
              <p><strong>6.1</strong> ThinkTrophy implements monitoring systems to detect unusual, suspicious, or high-risk activity, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>abnormal transaction patterns;</li>
                <li>high-frequency or high-velocity transactions;</li>
                <li>immediate withdrawal following account funding;</li>
                <li>inconsistencies between user behaviour and transaction activity;</li>
                <li>linked or coordinated account activity.</li>
              </ul>
              <p><strong>6.2</strong> Monitoring may be conducted through automated systems, rule-based detection, and manual review processes.</p>
              <p><strong>6.3</strong> Where suspicious activity is identified, ThinkTrophy may:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>delay or restrict transactions;</li>
                <li>suspend account activity;</li>
                <li>initiate internal investigations;</li>
                <li>request additional user verification.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">7.</span> Suspicious Activity Handling and Reporting
            </h2>
            <div className="space-y-4">
              <p><strong>7.1</strong> ThinkTrophy maintains procedures for the identification and escalation of suspicious activity.</p>
              <p><strong>7.2</strong> Where required by applicable law or through regulated partners, suspicious transactions may be reported to relevant authorities, including the Nigeria Financial Intelligence Unit (NFIU).</p>
              <p><strong>7.3</strong> ThinkTrophy may share relevant information with payment service providers, financial institutions, or law enforcement agencies where necessary to prevent fraud or comply with legal obligations.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">8.</span> Sanctions, PEP and Screening Controls
            </h2>
            <div className="space-y-4">
              <p><strong>8.1</strong> ThinkTrophy may conduct screening of users or transactions against:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>sanctions lists;</li>
                <li>politically exposed persons (PEP) databases;</li>
                <li>fraud and watchlists.</li>
              </ul>
              <p><strong>8.2</strong> Screening may be conducted directly or through third-party service providers.</p>
              <p><strong>8.3</strong> Accounts associated with elevated risk may be restricted, suspended, or subject to enhanced review.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">9.</span> Payment Integrity and Fraud Prevention
            </h2>
            <div className="space-y-4">
              <p><strong>9.1</strong> ThinkTrophy implements safeguards to prevent misuse of payment systems, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>validation of successful payment before wallet credit;</li>
                <li>transaction limits and velocity controls;</li>
                <li>delayed withdrawal eligibility in certain cases;</li>
                <li>monitoring of mismatches between funding sources and withdrawal destinations.</li>
              </ul>
              <p><strong>9.2</strong> ThinkTrophy reserves the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>reverse or withhold transactions where fraud is suspected;</li>
                <li>investigate disputed or irregular payments;</li>
                <li>comply with chargeback and fraud-handling obligations imposed by payment partners.</li>
              </ul>
              <p>The Platform maintains controls to preserve integrity and prevent abuse of gameplay or system functionality. Detailed rules governing user conduct, prohibited behaviour, and enforcement measures are set out in the Integrity & Fair Play Policy.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">10.</span> Fair Play and Competition Integrity
            </h2>
            <div className="space-y-4">
              <p><strong>10.1</strong> ThinkTrophy operates as a skill-based platform and enforces strict rules to ensure fairness.</p>
              <p><strong>10.2</strong> Prohibited conduct includes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>use of bots, scripts, or automated answering tools;</li>
                <li>collusion between users;</li>
                <li>creation or operation of multiple accounts;</li>
                <li>exploitation of system vulnerabilities;</li>
                <li>use of external assistance during competitions.</li>
              </ul>
              <p><strong>10.3</strong> ThinkTrophy may use behavioural analytics, device tracking, and performance analysis to detect unfair advantage.</p>
              <p><strong>10.4</strong> Violations may result in:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>disqualification from competitions;</li>
                <li>forfeiture of winnings;</li>
                <li>suspension or termination of accounts.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">11.</span> Risk-Based User Segmentation
            </h2>
            <div className="space-y-4">
              <p><strong>11.1</strong> ThinkTrophy may classify users into risk categories based on:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>transaction behaviour;</li>
                <li>verification status;</li>
                <li>account history;</li>
                <li>detected anomalies or associations.</li>
              </ul>
              <p><strong>11.2</strong> Higher-risk users may be subject to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>enhanced monitoring;</li>
                <li>reduced transaction limits;</li>
                <li>delayed withdrawals;</li>
                <li>additional verification requirements.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">12.</span> Transaction Limits and Controls
            </h2>
            <div className="space-y-4">
              <p><strong>12.1</strong> ThinkTrophy may impose limits on:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>wallet funding;</li>
                <li>competition entry amounts;</li>
                <li>withdrawals;</li>
                <li>daily or cumulative transaction values.</li>
              </ul>
              <p><strong>12.2</strong> Limits may be adjusted dynamically based on user risk profile, regulatory expectations, or operational considerations.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">13.</span> Record Keeping and Audit
            </h2>
            <div className="space-y-4">
              <p><strong>13.1</strong> ThinkTrophy maintains records of:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>user identity and verification data;</li>
                <li>transaction history;</li>
                <li>gameplay activity;</li>
                <li>compliance reviews and investigations.</li>
              </ul>
              <p><strong>13.2</strong> Records are retained in accordance with applicable legal and operational requirements.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">14.</span> Data Protection and Security
            </h2>
            <div className="space-y-4">
              <p><strong>14.1</strong> ThinkTrophy implements technical and organisational measures to protect personal data in accordance with applicable law.</p>
              <p><strong>14.2</strong> Personal data is processed securely and protected against unauthorised access, loss, or misuse, in line with NDPA requirements regarding confidentiality, integrity, and security of data.</p>
              <p><strong>14.3</strong> In the event of a data breach:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>appropriate mitigation measures will be taken;</li>
                <li>relevant authorities may be notified;</li>
                <li>affected users may be informed where required.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">15.</span> Governance and Accountability
            </h2>
            <div className="space-y-4">
              <p><strong>15.1</strong> ThinkTrophy maintains internal oversight of compliance, fraud prevention, and risk management.</p>
              <p><strong>15.2</strong> This may include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>designated compliance responsibilities;</li>
                <li>internal policies and procedures;</li>
                <li>periodic risk assessments;</li>
                <li>staff awareness and training;</li>
                <li>vendor and partner due diligence.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">16.</span> Cooperation with Authorities
            </h2>
            <div className="space-y-4">
              <p><strong>16.1</strong> ThinkTrophy may cooperate with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>law enforcement agencies;</li>
                <li>regulatory authorities;</li>
                <li>payment service providers;</li>
                <li>financial institutions.</li>
              </ul>
              <p><strong>16.2</strong> Information may be disclosed where required by law or necessary to prevent fraud or protect users.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">17.</span> Updates to This Statement
            </h2>
            <div className="space-y-4">
              <p><strong>17.1</strong> ThinkTrophy reserves the right to update this Compliance & Risk Statement at any time to reflect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>regulatory developments;</li>
                <li>changes in risk environment;</li>
                <li>enhancements to platform controls.</li>
              </ul>
              <p><strong>17.2</strong> Updated versions will take effect upon publication unless otherwise stated.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">18.</span> Relationship with Other Policies
            </h2>
            <p>This Policy operates alongside:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Terms & Conditions</li>
              <li>Privacy and Data protection</li>
              <li>Integrity & Fair Play Policy</li>
              <li>Internal AML & Fraud Control Policy</li>
              <li>Payments/Refund Policy</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
