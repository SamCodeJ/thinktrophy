import { CreditCard } from 'lucide-react';
import { useEffect } from 'react';

export default function PaymentPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <CreditCard size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Payments, Withdrawals & Refund Policy
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
              This Payments, Withdrawals & Refund Policy (“Policy”) governs all financial transactions conducted on ThinkTrophy (“the Platform”, “we”, “us”, “our”), including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>wallet funding;</li>
              <li>competition entry payments (stakes);</li>
              <li>winnings and payouts;</li>
              <li>withdrawals;</li>
              <li>refunds and dispute handling.</li>
            </ul>
            <p>
              This Policy should be read alongside the ThinkTrophy Terms & Conditions and Compliance & Risk Statement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">2.</span> Currency
            </h2>
            <p>All transactions on ThinkTrophy are conducted in:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nigerian Naira (NGN ₦)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">3.</span> Wallet System
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">3.1 Wallet Functionality</h3>
              <p>Users must fund a wallet before participating in competitions.</p>
              <p>Wallet balances are used to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>enter competitions (stakes);</li>
                <li>receive winnings;</li>
                <li>process withdrawals.</li>
              </ul>
              
              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.2 Wallet Funding</h3>
              <p>Wallets may be funded via approved payment providers, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Paystack</li>
                <li>Flutterwave</li>
              </ul>
              <p>Funds are credited only after successful payment confirmation.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.3 Minimum and Maximum Stake</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Minimum stake: ₦500</li>
                <li>Maximum stake: ₦5,000</li>
              </ul>
              <p>ThinkTrophy reserves the right to adjust limits where necessary.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">4.</span> Competition Payments (Stakes)
            </h2>
            <p>When a user enters a competition:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>the selected stake is deducted and ring-fenced from the wallet;</li>
              <li>the amount is committed to that game session.</li>
            </ul>
            <p>Once a competition begins:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>the stake is considered used;</li>
              <li>it is non-refundable, except as provided in this Policy.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">5.</span> Payouts and Winnings
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">5.1 Payout Structure</h3>
              <p>Winnings are calculated based on performance:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>10/10 correct answers → users get 2× of stake</li>
                <li>9/10 correct → users get 0.5× of stake</li>
                <li>8 or fewer correct → no payout</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">5.2 Credit of Winnings</h3>
              <p>Winnings are credited to the user’s wallet shortly after game completion.</p>
              <p>All payouts are subject to system validation, compliance checks, and fraud and integrity review (where applicable).</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">5.3 Conditional Holds</h3>
              <p>ThinkTrophy may delay or hold payouts where:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>suspicious or abnormal activity is detected;</li>
                <li>verification is incomplete;</li>
                <li>gameplay integrity is under review.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">6.</span> Withdrawals
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">6.1 Withdrawal Requests</h3>
              <p>Users may request withdrawal of available wallet balances, subject to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>successful identity verification (where required);</li>
                <li>compliance checks;</li>
                <li>minimum withdrawal thresholds.</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.2 Processing Time</h3>
              <p>Withdrawals are typically processed within a reasonable timeframe. Processing time may vary depending on:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>payment provider timelines;</li>
                <li>verification requirements;</li>
                <li>compliance reviews.</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.3 Withdrawal Restrictions</h3>
              <p>ThinkTrophy may restrict or delay withdrawals where:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>suspicious activity is detected;</li>
                <li>account verification is incomplete;</li>
                <li>fraud or policy violations are suspected.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">7.</span> Refund Policy
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">7.1 General Rule</h3>
              <p>All competition entries (stakes) are final and non-refundable once gameplay has started.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">7.2 Eligible Refund Scenarios</h3>
              <p>Refunds may be considered only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>failed or incomplete game session due to system error;</li>
                <li>duplicate or failed payment with no wallet credit;</li>
                <li>technical malfunction preventing participation.</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">7.3 Non-Eligible Refunds</h3>
              <p>Refunds will not be granted for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>incorrect answers or poor performance;</li>
                <li>expired timers or incomplete gameplay;</li>
                <li>user errors or misunderstandings;</li>
                <li>loss of stake due to gameplay outcomes;</li>
                <li>User technical error; including but not limited to poor Network, Phone goes off during a game, disruptive incoming call.</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">7.4 Refund Processing</h3>
              <p>Approved refunds will be credited to the wallet.</p>
              <p>Refund timelines depend on internal review and payment provider processes.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">8.</span> Fraud and Payment Abuse
            </h2>
            <p>ThinkTrophy actively monitors transactions to prevent:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>fraudulent payments;</li>
              <li>chargeback abuse;</li>
              <li>misuse of wallet functionality.</li>
            </ul>
            <p>Where fraud is suspected, ThinkTrophy may:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>reverse or withhold transactions;</li>
              <li>restrict account access;</li>
              <li>cooperate with payment providers and authorities.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">9.</span> Chargebacks and Disputes
            </h2>
            <p>Users must contact ThinkTrophy support before initiating a chargeback.</p>
            <p>Unauthorised chargebacks may result in:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>account suspension;</li>
              <li>reversal of funds;</li>
              <li>restriction of future access.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">10.</span> User Responsibility
            </h2>
            <p>Users are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>ensuring accuracy of payment details;</li>
              <li>maintaining account security;</li>
              <li>reviewing gameplay rules before participating.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">11.</span> Third-Party Payment Providers
            </h2>
            <p>All payments are processed through licensed third-party providers.</p>
            <p>ThinkTrophy is not responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>external payment processing delays;</li>
              <li>provider-specific errors beyond its control.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">12.</span> Policy Updates
            </h2>
            <p>ThinkTrophy reserves the right to update this Policy to reflect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>changes in payment processes;</li>
              <li>regulatory requirements;</li>
              <li>operational improvements.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">13.</span> Relationship with Other Policies
            </h2>
            <p>This Policy operates alongside:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Terms and Conditions</li>
              <li>Privacy and Data protection</li>
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
