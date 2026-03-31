import { ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';

export default function IntegrityPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Integrity & Fair Play Policy
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
              ThinkTrophy is committed to providing a fair, competitive, and transparent environment where outcomes are determined solely by user skill.
            </p>
            <p>This Integrity & Fair Play Policy (“Policy”) sets out:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>the rules governing participation;</li>
              <li>the structure of competitions;</li>
              <li>acceptable and prohibited conduct;</li>
              <li>enforcement measures to protect platform integrity.</li>
            </ul>
            <p>
              This Policy operates alongside the ThinkTrophy Terms & Conditions and Compliance & Risk Statement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">2.</span> Skill-Based Competition
            </h2>
            <p>ThinkTrophy operates a skill-based model, where:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>outcomes are determined by user knowledge, accuracy, and speed;</li>
              <li>performance is not influenced by chance beyond random question selection;</li>
              <li>all users compete under the same conditions.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">3.</span> Competition Format and Game Rules
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">3.1 Structure of a Game Session</h3>
              <p>Each competition consists of 10 questions. Users have a total of 60 seconds to complete all questions. Questions are presented sequentially.</p>
              <p>The session ends when:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>all questions are answered; or</li>
                <li>the time limit expires.</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.2 Category Selection</h3>
              <p>Users must select the required number of categories before gameplay begins. Questions are randomly generated from selected categories. No repeated questions occur within a single session.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.3 Answer Submission</h3>
              <p>Users must select one answer per question. Answers are final once submitted. Unanswered questions at the end of the timer are treated as incorrect.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.4 Scoring and Outcomes</h3>
              <p>Results are determined based on correct answers:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>10/10 correct → Full win (2× stake)</li>
                <li>9/10 correct → Partial win (0.5× stake)</li>
                <li>8 or fewer correct → No payout</li>
              </ul>
              <p>Results are calculated automatically by the system. All outcomes are based strictly on performance.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.5 Finality of Results</h3>
              <p>Results are final once generated, except in cases of verified system error. ThinkTrophy reserves the right to review or adjust results where integrity concerns arise.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">4.</span> Fair Play Principles
            </h2>
            <p>All users must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>compete independently and honestly;</li>
              <li>rely solely on their own knowledge and ability;</li>
              <li>respect the integrity of the Platform and other participants.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">5.</span> Prohibited Conduct
            </h2>
            <p>Users must not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>use bots, scripts, automation, or AI tools during gameplay;</li>
              <li>receive assistance from any external source while playing;</li>
              <li>operate multiple accounts or share accounts;</li>
              <li>engage in collusion or coordinated gameplay;</li>
              <li>exploit bugs, system errors, or vulnerabilities;</li>
              <li>attempt to manipulate scores, outcomes, or payouts.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">6.</span> Account Integrity
            </h2>
            <p>Each user is permitted to operate one account only. Accounts must not be shared or transferred. ThinkTrophy may detect account misuse through behavioural, device, and system analysis.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">7.</span> Monitoring and Detection
            </h2>
            <p>To maintain fairness, ThinkTrophy may implement:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>gameplay behaviour analysis;</li>
              <li>answer pattern detection;</li>
              <li>device and session monitoring;</li>
              <li>anomaly detection systems.</li>
            </ul>
            <p>Monitoring is conducted to ensure compliance with this Policy and protect platform integrity.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">8.</span> Enforcement and Penalties
            </h2>
            <p>Where a violation is identified, ThinkTrophy may:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>disqualify competition results;</li>
              <li>forfeit winnings;</li>
              <li>restrict gameplay or withdrawals;</li>
              <li>suspend or permanently terminate accounts.</li>
            </ul>
            <p>Actions taken will be proportionate to the severity of the breach.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">9.</span> Financial Integrity
            </h2>
            <p>Where a violation impacts financial outcomes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>winnings may be withheld, reversed, or cancelled;</li>
              <li>wallet access may be restricted pending review.</li>
            </ul>
            <p>ThinkTrophy reserves the right to take necessary action to protect the integrity of the Platform.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">10.</span> Reporting Violations
            </h2>
            <p>Users may report suspected violations through official ThinkTrophy support channels.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">11.</span> Updates
            </h2>
            <p>ThinkTrophy reserves the right to update this Policy to reflect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>improvements to the Platform;</li>
              <li>changes in competition structure;</li>
              <li>evolving integrity and fairness requirements.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">12.</span> Relationship with Other Policies
            </h2>
            <p>This Policy operates alongside:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Terms and Conditions</li>
              <li>Privacy and Data Protection Policy</li>
              <li>Payment, Withdrawals and Refund Policy</li>
              <li>Compliance & Risk Statement</li>
              <li>Internal AML & Fraud Control Policy</li>
            </ul>
            <p>Each document serves a distinct purpose within the ThinkTrophy compliance framework.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
