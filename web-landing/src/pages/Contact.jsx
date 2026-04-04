import { Mail, MessageSquare, HeadphonesIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Contact() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="section max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 dark:bg-brand-blue/15 text-brand-blue flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mb-4">
            Contact Think Trophy
          </h1>
          <p className="text-slate-500 dark:text-white/50 text-lg max-w-2xl mx-auto">
            We’re here to help you sharpen your mind and claim your rewards. Whether you have a question about your latest game or want to discuss a partnership, choose the best way to reach us below.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Support */}
            <div className="card p-8 sm:p-10 text-slate-600 dark:text-white/70 flex flex-col items-start h-full">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-6">
                <HeadphonesIcon size={24} />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-3">
                Customer Support & Game Help
              </h2>
              <p className="mb-6 flex-grow">
                For issues with your account, questions about staking, or technical help with a game session, our support team is ready to assist.
              </p>
              <div className="w-full">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Email</p>
                <a href="mailto:support@thinktrophy.com" className="text-brand-blue hover:text-brand-blue/80 font-medium text-lg transition-colors">
                  support@thinktrophy.com
                </a>
              </div>
            </div>

            {/* General Inquiries */}
            <div className="card p-8 sm:p-10 text-slate-600 dark:text-white/70 flex flex-col items-start h-full">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
                <Mail size={24} />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-3">
                General Inquiries
              </h2>
              <p className="mb-6 flex-grow">
                For everything else; feedback, partnership ideas, or general questions about the Think Trophy platform—reach out to our primary contact point.
              </p>
              <div className="w-full">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2">Email</p>
                <a href="mailto:contact@thinktrophy.com" className="text-purple-500 hover:text-purple-400 font-medium text-lg transition-colors">
                  contact@thinktrophy.com
                </a>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="card p-8 sm:p-10 text-slate-600 dark:text-white/70 text-center">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-white mb-4">
              Connect With Our Community
            </h2>
            <p className="mb-8 max-w-2xl mx-auto">
              Stay updated on the latest academic challenges, winner highlights, and platform updates by following us on social media:
            </p>
            <div className="flex flex-wrap justify-center gap-4">
               <a href="https://x.com/ThinkTrophy" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-brand-blue hover:text-white text-slate-700 dark:text-white/70 font-medium transition-all duration-200">
                  X (Twitter)
               </a>
               <a href="https://www.instagram.com/thinktrophy/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-brand-blue hover:text-white text-slate-700 dark:text-white/70 font-medium transition-all duration-200">
                  Instagram
               </a>
               <a href="https://www.tiktok.com/@thinktrophy" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-brand-blue hover:text-white text-slate-700 dark:text-white/70 font-medium transition-all duration-200">
                  TikTok
               </a>
               <a href="https://www.linkedin.com/company/think-trophy-inc/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-brand-blue hover:text-white text-slate-700 dark:text-white/70 font-medium transition-all duration-200">
                  LinkedIn
               </a>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-brand-blue/5 dark:bg-brand-blue/10 border border-brand-blue/10 dark:border-brand-blue/20 rounded-2xl p-8 sm:p-10">
            <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-6">
              Quick Tips for a Faster Response:
            </h3>
            <ul className="space-y-4 text-slate-600 dark:text-white/70">
              <li className="flex gap-3">
                <span className="text-brand-blue font-bold">•</span>
                <span><strong className="text-brand-dark dark:text-white font-semibold">Include your Username:</strong> If you are emailing about a specific game or stake, please include your Think Trophy username.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-blue font-bold">•</span>
                <span><strong className="text-brand-dark dark:text-white font-semibold">Include your Game ID:</strong> If you are emailing about a specific game session.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-blue font-bold">•</span>
                <span><strong className="text-brand-dark dark:text-white font-semibold">Check the FAQs:</strong> Most questions about payout multiples and game rules can be found in our <Link to="/faq" className="text-brand-blue hover:underline">FAQ</Link> page.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}