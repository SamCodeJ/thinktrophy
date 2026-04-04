import { HelpCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FAQ() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-500 dark:text-white/50 text-lg max-w-2xl mx-auto">
            Find answers to common questions about Think Trophy, staking, rewards, and more.
          </p>
        </div>

        {/* Content */}
        <div className="card p-8 sm:p-12 space-y-10 text-slate-600 dark:text-white/70 leading-relaxed">
          
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">
              General Questions
            </h2>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">What is Think Trophy?</h3>
              <p>Think Trophy is an academic-focused gaming platform where users can test their knowledge, sharpen their minds, and win rewards based on their performance. Our mission is to promote academic excellence through competitive play.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">How do I play?</h3>
              <p>Simply select a game category, stake your desired amount, and answer 10 academic-quality questions. Your reward is calculated based on your final score.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">
              Staking & Rewards
            </h2>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">How does staking work?</h3>
              <p>Before starting a game, you choose a stake amount. This amount is the "entry fee" for that specific round of 10 questions.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">What are the winning tiers and payouts?</h3>
              <p>We reward accuracy. The payout structure is as follows:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Perfect Score (10/10):</strong> You win <strong>2x (double)</strong> your stake.</li>
                <li><strong>High Honors (9/10):</strong> You win <strong>0.5x (half)</strong> of your stake back.</li>
                <li><strong>Standard Score (8/10 or below):</strong> No payout is awarded for scores below 9.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">Wait, what does 0.5x mean for a 9/10 score?</h3>
              <p>It means if you score 9/10, you receive half of the amount you staked. For example, if you stake <strong>₦1,000</strong> and get 9 questions right, you receive <strong>Remaining ₦500</strong>. This encourages users to aim for that perfect 10/10 to see a profit!</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">How do I withdraw my winnings?</h3>
              <p>Winnings are credited to your Think Trophy wallet. You can request a withdrawal to your registered bank account or mobile money provider directly from your dashboard.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">
              Technical & Account Help
            </h2>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">What happens if my internet cuts out during a game?</h3>
              <p>To maintain the integrity of the academic challenge, games must be completed in one sitting. We recommend ensuring you have a stable connection before you begin your stake.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">Can I change my login email?</h3>
              <p>For security purposes, your primary login email is fixed. If you have lost access to your account, please contact <a href="mailto:support@thinktrophy.com" className="text-brand-blue hover:underline">support@thinktrophy.com</a> for assistance.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">Is my data secure?</h3>
              <p>Absolutely. We use industry-standard encryption to ensure that your personal details and transaction history remain private and protected.</p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">
              Partnerships & Growth
            </h2>
            
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">Is Think Trophy available outside of Nigeria?</h3>
              <p>Currently, we are focused on providing the best experience for our Nigerian users. However, we have plans to expand to neighboring countries soon!</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-brand-dark dark:text-white">How can I suggest new question categories?</h3>
              <p>We love feedback! If there is a specific academic subject you’d like to see added, please email us at <a href="mailto:contact@thinktrophy.com" className="text-brand-blue hover:underline">contact@thinktrophy.com</a>.</p>
            </div>
          </section>

          {/* Footer CTA */}
          <div className="bg-brand-blue/5 dark:bg-brand-blue/10 border border-brand-blue/10 dark:border-brand-blue/20 rounded-2xl p-8 mt-12 text-center">
            <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-3">
              Still have questions?
            </h3>
            <p className="mb-6">
              If you couldn't find what you were looking for, feel free to reach out to us through our Contact Us page.
            </p>
            <Link to="/contact" className="btn-primary inline-flex items-center justify-center px-6 py-3">
              Contact Us
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}