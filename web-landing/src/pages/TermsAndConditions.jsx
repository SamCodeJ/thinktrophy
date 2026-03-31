import { FileText } from 'lucide-react';
import { useEffect } from 'react';

export default function TermsAndConditions() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <FileText size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Terms and Conditions
          </h1>
          <p className="text-slate-500 dark:text-white/50 text-lg">
            Last updated: March 2026
          </p>
        </div>

        {/* Content */}
        <div className="card p-8 sm:p-12 space-y-10 text-slate-600 dark:text-white/70 leading-relaxed">
          
          <section className="space-y-4">
            <p className="font-medium">
              These Terms and Conditions ("Terms") govern your use of ThinkTrophy Website and Mobile Application, developed by ThinkTrophy Team. By Visiting the website, downloading, installing, or using the App, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the website site/App.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">1.</span> Definitions and Interpretation
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">1.1 Definitions</h3>
              <ul className="space-y-2">
                <li><strong>“Platform”</strong> means the ThinkTrophy mobile application, website, and all associated services.</li>
                <li><strong>“ThinkTrophy”, “we”, “us”, or “our”</strong> refers to the operator of the Platform.</li>
                <li><strong>“User”, “you”, or “your”</strong> means any individual accessing or using the Platform.</li>
                <li><strong>“User Account”</strong> means a registered account created by a User to access the Platform.</li>
                <li><strong>“Wallet”</strong> means the in-app stored balance used to fund participation and receive payouts.</li>
                <li><strong>“Stake”</strong> means the amount of money committed by a User to participate in a Competition.</li>
                <li><strong>“Ring-fencing”</strong> means once a user stakes, that amount is locked in and reserved only for that game, it can’t be withdrawn, changed, or affected by anything else until the outcome is decided.</li>
                <li><strong>“Entry Fee”</strong> means the Stake required to enter a Competition.</li>
                <li><strong>“Competition”</strong> means a structured, skill-based question session consisting of a fixed number of questions answered within a defined time limit.</li>
                <li><strong>“Game Session”</strong> means a single Competition instance consisting of 10 questions to be answered within a 60-second timer.</li>
                <li><strong>“Skill-Based Question”</strong> means a question designed to assess knowledge, reasoning, or cognitive ability, where outcomes are determined by User performance rather than chance.</li>
                <li><strong>“Timer”</strong> means the fixed 60-second countdown within which all questions must be answered.</li>
                <li><strong>“Prize” / “Payout”</strong> means any reward credited to a User’s Wallet based on performance.</li>
                <li><strong>“Payment Provider”</strong> means third-party services used to process transactions, including but not limited to Paystack and Flutterwave.</li>
                <li><strong>“KYC (Know Your Customer)”</strong> means the identity verification process required before withdrawals.</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">1.2 Interpretation</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>References to “including”, “include”, or similar expressions shall be construed as illustrative and shall not limit the generality of the preceding words.</li>
                <li>Headings are for convenience only and shall not affect the interpretation of these Terms.</li>
                <li>Words in the singular include the plural and vice versa.</li>
                <li>Any reference to a person includes individuals, companies, partnerships, and other legal entities.</li>
                <li>These Terms shall be governed and interpreted in accordance with applicable laws and regulations in the relevant jurisdiction.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">2.</span> License to Use the Platform
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">2.1 Grant of License</h3>
              <p>Subject to your compliance with these Terms and Conditions, ThinkTrophy grants you a limited, non-exclusive, non-transferable, revocable licence to access and use the ThinkTrophy Platform; download and install any associated mobile application; and participate in Competitions solely for your personal, non-commercial use.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">2.2 Restrictions on Use</h3>
              <p>You agree that you shall not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>copy, reproduce, distribute, or commercially exploit any part of the Platform;</li>
                <li>modify, reverse engineer, decompile, or attempt to extract the source code of the Platform;</li>
                <li>use the Platform for any unlawful, fraudulent, or unauthorised purpose;</li>
                <li>transfer, sublicense, or assign your rights under this licence to any third party;</li>
                <li>use automated systems, bots, or scripts to access or interact with the Platform.</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">2.3 Suspension and Revocation</h3>
              <p>This licence is revocable at any time. ThinkTrophy reserves the right to suspend or terminate your access to the Platform immediately if you breach these Terms; your use of the Platform poses a risk to fairness, security, or integrity; or required by law or regulatory obligation.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">2.4 No Ownership Transfer</h3>
              <p>This licence does not grant you ownership of the Platform or any associated intellectual property. All rights, title, and interest remain with ThinkTrophy.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">3.</span> Eligibility Requirements
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">3.1 Minimum Age Requirement</h3>
              <p>You must be at least 18 years old to create a User Account and participate in any Competition on ThinkTrophy. By using the Platform, you confirm that you meet this requirement.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.2 Residency Restrictions</h3>
              <p>Access to ThinkTrophy may be restricted in certain jurisdictions. You agree that you are accessing the Platform from a jurisdiction where participation in skill-based competitions with monetary rewards is lawful; and you are solely responsible for complying with local laws and regulations applicable to your location. ThinkTrophy reserves the right to restrict or block access from certain regions at its discretion.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.3 Prohibited Users</h3>
              <p>The following individuals are not permitted to participate in Competitions:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>employees, contractors, or representatives of ThinkTrophy;</li>
                <li>any person involved in the development, operation, or testing of the Platform.</li>
              </ul>
              <p>None of the shareholders should participate in live game sessions in any capacity. Each shareholder may maintain a test account strictly for functionality purposes; however, deposits and withdrawals must be disabled on these accounts. Friends and family are permitted to participate, but any pattern of consistent or suspicious winnings should trigger a review process.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.4 One Account Per User</h3>
              <p>Each User is permitted to create and operate only one User Account. Multiple accounts, duplicate identities, or account sharing are strictly prohibited. ThinkTrophy reserves the right to suspend or terminate any duplicate or suspicious accounts.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">3.5 Verification Requirements (KYC)</h3>
              <p>ThinkTrophy reserves the right to request identity verification at any time, including proof of identity (e.g., government-issued ID); proof of address; verification of payment methods. Failure to provide requested information may result in account suspension or restriction of access to funds.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">4.</span> User Accounts & Responsibilities
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">4.1 Account Creation</h3>
              <p>To access and participate in ThinkTrophy, you must create a User Account by providing accurate, complete, and up-to-date information. You agree that all information provided during registration is true and not misleading; you will maintain and promptly update your details where necessary; you will not impersonate any other individual or entity. ThinkTrophy reserves the right to refuse account creation at its discretion.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">4.2 Account Security</h3>
              <p>You are solely responsible for maintaining the confidentiality of your account credentials, including your password. You agree to keep your login details secure; not to share your account with any third party; notify ThinkTrophy immediately of any unauthorised access or suspected breach. Thinktrophy will not by any means ask for your password. ThinkTrophy shall not be liable for any loss resulting from unauthorised use of your account.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">4.3 Wallet Responsibility</h3>
              <p>Users are responsible for maintaining sufficient Wallet balance and ensuring correct payment details. All transactions are recorded and traceable.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">4.4 User Obligations</h3>
              <p>By using the Platform, you agree to participate in Competitions honestly and in good faith; provide accurate responses based on your own knowledge and reasoning; comply with all applicable laws and regulations; follow all rules and instructions relating to each Competition.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">4.5 Fair Use & Anti-Cheating Policy</h3>
              <p>To maintain a fair and skill-based environment, the following actions are strictly prohibited:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>use of bots, scripts, automation tools, or AI assistance to answer questions;</li>
                <li>collusion with other users to manipulate outcomes;</li>
                <li>use of multiple accounts or identities;</li>
                <li>exploitation of system errors, bugs, or loopholes;</li>
                <li>attempting to bypass platform safeguards or security mechanisms.</li>
              </ul>
              <p>ThinkTrophy operates a zero-tolerance policy toward unfair advantage.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">4.6 Monitoring and Enforcement</h3>
              <p>ThinkTrophy reserves the right to monitor user activity and gameplay patterns; investigate suspicious behaviour; use automated and manual detection systems to ensure fairness. Where a breach is suspected or confirmed, ThinkTrophy may take action without prior notice.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">4.7 Suspension and Termination</h3>
              <p>ThinkTrophy may suspend, restrict, or permanently terminate your User Account if you breach these Terms; you engage in prohibited conduct; your actions compromise the fairness, integrity, or security of the Platform; required by law or regulatory authorities.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">4.8 Consequences of Breach</h3>
              <p>In the event of a violation, ThinkTrophy reserves the right to void Competition results; withhold or cancel any Prize or Payout; freeze or reclaim funds associated with unfair activity; permanently ban access to the Platform.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">4.9 No Guarantee of Continuous Access</h3>
              <p>ThinkTrophy does not guarantee uninterrupted access to the Platform. Access may be limited due to maintenance; updates; technical issues; security concerns.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">5.</span> Competition Entry Rules
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">5.1 Game Structure</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>10 questions</li>
                <li>60-second total time limit</li>
                <li>questions served sequentially</li>
                <li>automatic submission when time expires</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">5.2 Category Selection</h3>
              <p>Users must select at least 7 categories. Questions are randomly selected and drawn from your selected categories. We aim to provide each user with a unique and non-repetitive question experience; however, repetition is not entirely guaranteed.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">5.3 Entry Process</h3>
              <p>To participate in a Competition, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>hold a valid and active User Account;</li>
                <li>have strong and working network;</li>
                <li>select an available category on the Platform;</li>
                <li>choose Stake (₦500 – ₦5,000) and confirm participation.</li>
              </ul>
              <p>Entry into a Competition is confirmed only upon registration and successful payment or available funds in your account. Stake is deducted and ring-fenced before the game begins.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">5.4 Determination of Results</h3>
              <p>An entry is valid only if completed within the Timer; no prohibited tools, assistance, or methods are used (e.g., AI or support from people around); the User complies fully with these Terms. Invalid or incomplete entries may be disqualified at ThinkTrophy’s discretion. All results are final unless a technical error is confirmed or fraud/misconduct is detected.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">5.5 Technical Interruptions</h3>
              <p>If a game is disrupted due to verified system error, ThinkTrophy may cancel the session and Stake may be refunded at its discretion. ThinkTrophy is not responsible for delays caused by internet connectivity, device issues, or user error.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">5.7 Errors and Adjustments</h3>
              <p>ThinkTrophy reserves the right to correct any errors in Competition setup, questions, or scoring; cancel or modify a Competition where necessary to preserve fairness; void affected entries where integrity has been compromised.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">5.8 Cancellation of Entry</h3>
              <p>ThinkTrophy may cancel a Competition if technical issues affect fairness; fraud or irregular activity is detected; failure to follow terms and conditions including all rules provided to you.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">6.</span> Prize, Payout Terms & Refund Policy
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">6.1 Nature of Competitions (Skill-Based Framework)</h3>
              <p>All Competitions on ThinkTrophy are skill-based. Outcomes are determined solely by accuracy of answers; speed and consistency of performance; adherence to Competition rules. ThinkTrophy does not rely on chance, randomness, or probability-based outcomes.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.2 Stake and Entry Fee Mechanics</h3>
              <p>To participate in a Competition, Users must place a stake between ₦500 and ₦5,000. The stake is deducted from the User’s wallet and ring-fenced for the duration of the Competition. Once a Competition begins, the stake is non-reversible, except where required by law.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.3 Payout Structure</h3>
              <p>Payouts are determined strictly based on performance:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>10/10 correct answers → User receives 2.0 × stake (Full Win)</li>
                <li>9/10 correct answers → User receives 0.5 × stake (Partial Win)</li>
                <li>8/10 or below → No payout (Loss of stake)</li>
              </ul>
              <p className="mt-2 text-sm">Example: If a User stakes ₦1,000: 10/10 → ₦2,000 | 9/10 → ₦500 | ≤8 → ₦0</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.4 Wallet and Payout Processing</h3>
              <p>All winnings are credited to the User’s in-app wallet. Wallet balances may be withdrawn subject to verification requirements. Payouts are typically processed instantly or within a reasonable timeframe, subject to system and payment provider availability. ThinkTrophy is not responsible for delays caused by third-party payment providers.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.5 Withdrawal Rules</h3>
              <p>Users may request withdrawal of available funds subject to: successful identity verification (KYC); compliance with anti-fraud and security checks; minimum withdrawal thresholds (if applicable); valid payment method registration. ThinkTrophy reserves the right to delay or restrict withdrawals where suspicious activity is detected.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.6 Refund Policy</h3>
              <p>Entry stakes are non-refundable once a Competition has started. Refunds may only be issued where a Competition is cancelled, a verified technical error prevents fair participation, or required by applicable law. Refund decisions are made at ThinkTrophy’s sole discretion.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.7 Taxes and User Responsibility</h3>
              <p>Users are solely responsible for declaring any winnings to relevant tax authorities; complying with all applicable financial and tax regulations in their jurisdiction. ThinkTrophy does not provide tax advice and does not withhold taxes unless required by law.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.8 Errors in Payout Calculation</h3>
              <p>ThinkTrophy reserves the right to correct any calculation errors; adjust or reverse incorrect payouts; recover funds credited in error.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">6.9 Fraud and Withholding of Funds</h3>
              <p>ThinkTrophy may withhold payouts; freeze wallet balances; cancel winnings if there is reasonable suspicion of cheating; multiple account usage; collusion; fraudulent payment activity.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">7.</span> Intellectual Property
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">7.1 Ownership of the Platform</h3>
              <p>All rights, title, and interest in and to the ThinkTrophy Platform remain the exclusive property of ThinkTrophy, including but not limited to software, code, and system architecture; question databases and content (including the 100,000+ question pool); game mechanics, scoring systems, and payout structures; visual design, user interface, and user experience elements; trademarks, logos, branding, and domain names. Nothing in these Terms shall transfer ownership of any intellectual property to you.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">7.2 Licence to Users</h3>
              <p>Users are granted a limited licence (as outlined in Section 2) to access and use the Platform for personal, non-commercial purposes only. This licence does not permit reproduction or redistribution of content; commercial use of any part of the Platform; extraction or reuse of data or question sets.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">7.3 Restrictions on Content Use</h3>
              <p>You agree that you shall not copy, scrape, reproduce, or store any questions or content from the Platform; publish or distribute any part of the question bank or Competition format; create derivative works based on ThinkTrophy content or mechanics; use the Platform to build or support a competing product or service.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">7.4 Trademarks and Branding</h3>
              <p>“ThinkTrophy” and all associated logos, marks, and branding elements are the exclusive property of ThinkTrophy. You may not use, reproduce, or display ThinkTrophy branding without prior written consent.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">7.5 User-Generated Content</h3>
              <p>If Users submit any content (e.g., feedback, suggestions, or ideas): such content may be used by ThinkTrophy without restriction; ThinkTrophy shall have a royalty-free, perpetual, worldwide licence to use, modify, and incorporate such content into the Platform.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">7.6 Reporting Infringement</h3>
              <p>If you believe that any content on the Platform infringes intellectual property rights, you may contact ThinkTrophy using the details provided in the Contact section.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">8.</span> Prohibited Conduct
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">8.1 General Principle</h3>
              <p>ThinkTrophy operates a strict fairness and integrity policy. Users must not engage in any conduct that undermines fair competition; platform security; financial integrity; user trust.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">8.2 Cheating and Unfair Advantage</h3>
              <p>The following are strictly prohibited: using external assistance during gameplay, including AI tools (e.g., chatbots or automated solvers); search engines or external resources during active sessions; attempting to gain an advantage through prior access to questions; deliberately manipulating timing or answer submission behaviour.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">8.3 Automation and System Abuse</h3>
              <p>You must not: use bots, scripts, macros, or automated tools; scrape or extract data from the Platform; interfere with or disrupt Platform functionality; attempt to bypass security, authentication, or monitoring systems.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">8.4 Multiple Accounts and Identity Misuse</h3>
              <p>It is prohibited to: create or operate multiple accounts; use another person’s identity or credentials; share accounts between individuals; create accounts to exploit promotions or payout structures.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">8.5 Collusion and Coordinated Behaviour</h3>
              <p>Users must not: collaborate with others to influence outcomes; share answers or strategies in real-time during gameplay; engage in any coordinated activity designed to manipulate results or payouts.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">8.6 Fraudulent Financial Activity</h3>
              <p>The following are strictly prohibited: use of stolen, unauthorised, or fraudulent payment methods; chargebacks or payment disputes made in bad faith; attempts to exploit wallet, payout, or transaction systems; laundering or transferring funds through the Platform for non-legitimate purposes.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">8.7 Exploitation of Errors</h3>
              <p>You must not: exploit bugs, glitches, or system errors; continue participation after identifying a known issue that provides advantage; attempt to replicate or distribute knowledge of such vulnerabilities.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">8.8 Consequences of Prohibited Conduct</h3>
              <p>If ThinkTrophy determines, at its sole discretion, that a User has engaged in prohibited conduct, we may: suspend or permanently terminate the User Account; void Competition entries and results; withhold, cancel, or recover Payouts; freeze or reclaim Wallet balances; restrict access to future Competitions; report activity to relevant authorities where required.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">8.9 No Compensation for Enforcement Actions</h3>
              <p>Users acknowledge that: enforcement actions are necessary to protect Platform integrity; ThinkTrophy shall not be liable for any loss resulting from such actions; decisions made in good faith to preserve fairness are final.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">9.</span> Disclaimers & Limitation of Liability
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">9.1 General Disclaimer</h3>
              <p>The ThinkTrophy Platform is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, ThinkTrophy makes no representations or warranties regarding: continuous, uninterrupted, or error-free operation of the Platform; accuracy, completeness, or reliability of content or questions; availability of Competitions at all times.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">9.2 Skill-Based Participation Acknowledgement</h3>
              <p>By using ThinkTrophy, you acknowledge that: participation involves risk of financial loss based on performance; outcomes are determined by your own knowledge, speed, and accuracy; no guarantees are made regarding winnings or success. Users participate at their own discretion and risk.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">9.3 No Liability for Losses</h3>
              <p>ThinkTrophy shall not be liable for: loss of Entry Fees or Stakes resulting from gameplay outcomes; missed winnings due to incorrect answers or time expiration; financial losses arising from user decisions or performance.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">9.4 Technical and Platform Limitations</h3>
              <p>ThinkTrophy is not responsible for: internet connectivity issues; device malfunctions or compatibility problems; delays, interruptions, or system downtime; failure of third-party services, including Payment Providers.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">9.5 Errors in Content or Competitions</h3>
              <p>While ThinkTrophy strives for accuracy: errors in questions, answers, or Competition setup may occur; ThinkTrophy reserves the right to correct such errors; affected Competitions may be adjusted, cancelled, or voided at our discretion.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">9.6 Third-Party Services</h3>
              <p>The Platform may rely on third-party services (e.g., Paystack, Flutterwave). ThinkTrophy is not liable for: payment processing delays or failures; errors or outages caused by third-party providers; unauthorised transactions outside ThinkTrophy’s control.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">9.7 Limitation of Liability</h3>
              <p>To the fullest extent permitted by law: ThinkTrophy’s total liability to any User shall not exceed the total amount of funds held in that User’s Wallet at the time of the claim; ThinkTrophy shall not be liable for indirect, incidental, consequential, or punitive damages.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">9.8 User Responsibility</h3>
              <p>Users are solely responsible for: ensuring compliance with applicable laws; maintaining secure access to their accounts; making informed decisions when participating in Competitions.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">10.</span> Dispute Resolution
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">10.1 Internal Complaints Process</h3>
              <p>If you have any complaint or dispute relating to the Platform, you must first contact ThinkTrophy through the official support channels provided. Your complaint should include: your full name and registered account details; a clear description of the issue; any relevant evidence or supporting information.</p>
              <p>ThinkTrophy will: acknowledge receipt within a reasonable timeframe; investigate the issue; provide a response or resolution within a reasonable period.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">10.2 Good Faith Resolution</h3>
              <p>Both parties agree to attempt to resolve any dispute in good faith before pursuing formal legal action. Users agree not to initiate external proceedings without first allowing ThinkTrophy a reasonable opportunity to resolve the matter internally.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">10.3 Platform Determinations</h3>
              <p>Where a dispute relates to: Competition results; gameplay integrity; suspected misconduct; payout decisions; ThinkTrophy’s determination, made in good faith and based on available data, shall be considered final and binding, except where required otherwise by law.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">10.4 Governing Law</h3>
              <p>These Terms and Conditions shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">10.5 Jurisdiction</h3>
              <p>Any disputes that cannot be resolved internally shall be subject to the exclusive jurisdiction of the courts of Nigeria.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">10.6 Limitation on Claims</h3>
              <p>To the extent permitted by law: Users must bring any claim within a reasonable period after the issue arises; failure to do so may result in the claim being waived.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">11.</span> Changes to the Terms
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">11.1 Right to Modify Terms</h3>
              <p>ThinkTrophy reserves the right to update, modify, or replace these Terms and Conditions at any time. Such changes may be made to reflect: updates to Platform features or services; changes in applicable laws or regulations; improvements to security, fairness, or operational processes.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">11.2 Notification of Changes</h3>
              <p>Where material changes are made, ThinkTrophy will take reasonable steps to notify Users, which may include: in-app notifications; email communication; updates posted on the Platform.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">11.3 Effective Date</h3>
              <p>Updated Terms will become effective: immediately upon publication on the Platform, unless otherwise stated; or from a specified date communicated to Users.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">11.4 Continued Use</h3>
              <p>By continuing to use ThinkTrophy after updated Terms take effect, you agree to be bound by the revised Terms. If you do not agree to the changes, you must discontinue use of the Platform.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">11.5 Review of Terms</h3>
              <p>Users are encouraged to periodically review these Terms to stay informed of any updates.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">12.</span> Contact Information
            </h2>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">12.1 General Enquiries</h3>
              <p>If you have any questions, concerns, or requests regarding these Terms and Conditions or general concerns, including legal or the ThinkTrophy Platform, you may contact us through the following channels:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Email:</strong> support@thinktrophy.com</li>
                <li><strong>In-App Support:</strong> Available within the ThinkTrophy application</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">12.2 Complaints and Disputes</h3>
              <p>For formal complaints or dispute-related matters, Users should contact:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Email:</strong> complaints@thinktrophy.com</li>
              </ul>
              <p>Please include: your full name; registered email/phone number; a clear description of the issue; any supporting evidence.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">12.3 Business Information</h3>
              <p>ThinkTrophy is operated by:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Registered Business Name:</strong> ThinkTrophy Limited</li>
                <li><strong>Registered Address:</strong> Nigeria</li>
              </ul>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">12.4 Support Hours</h3>
              <p>Customer support is available: Monday – Saturday, 8:00 AM – 8:00 PM WAT. Response times may vary depending on request volume and complexity.</p>

              <h3 className="text-lg font-bold text-brand-dark dark:text-white mt-6">12.5 Response Commitment</h3>
              <p>ThinkTrophy aims to: acknowledge enquiries within a reasonable timeframe; resolve issues as efficiently as possible; maintain clear and transparent communication with Users.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white flex items-center gap-3">
              <span className="text-brand-blue">13.</span> Relationship with Other Policies
            </h2>
            <p>This Policy operates alongside:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Privacy and Data protection</li>
              <li>Integrity & Fair Play Policy</li>
              <li>Compliance & Risk Statement</li>
              <li>Internal AML & Fraud Control Policy</li>
              <li>Payments/Refund Policy</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
