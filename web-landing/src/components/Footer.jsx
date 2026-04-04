import { Link } from 'react-router-dom';
import { Trophy, Twitter, Instagram, Linkedin } from 'lucide-react';

const TiktokIcon = ({ size = 15, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a3 3 0 0 1-3-3" />
  </svg>
);

const links = {
  Product:  [
    { label: 'Features',    href: '/#features' },
    { label: 'How to Play', href: '/#how-it-works' },
    { label: 'Download App',href: '/#download' },
    { label: 'Leaderboard', href: '#' },
  ],
  Company:  [
    { label: 'About Us',   href: '#' },
    { label: 'Blog',       href: '#' },
    { label: 'Careers',    href: '/careers' },
    { label: 'FAQ',        href: '/faq' },
    { label: 'Contact',    href: '/contact' },
  ],
  Legal:    [
    { label: 'Privacy Policy',   href: '/privacy-policy' },
    { label: 'Payment Policy',   href: '/payment-policy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Fair Play Policy', href: '/integrity-policy' },
    { label: 'Compliance & Risk', href: '/compliance-policy' },
    { label: 'AML Policy', href: '/aml-policy' },
  ],
};

const socials = [
  { icon: Twitter,    href: 'https://x.com/ThinkTrophy',                        label: 'X' },
  { icon: Instagram,  href: 'https://www.instagram.com/thinktrophy/',           label: 'Instagram' },
  { icon: TiktokIcon, href: 'https://www.tiktok.com/@thinktrophy',              label: 'TikTok' },
  { icon: Linkedin,   href: 'https://www.linkedin.com/company/think-trophy-inc/', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-brand-card border-t border-slate-100 dark:border-white/5 mt-auto">
      <div className="section py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 w-fit">
              <img src="/favicon.png" alt="ThinkTrophy" className="w-9 h-9 rounded-xl" />
              <span className="font-bold text-lg text-brand-dark dark:text-white">
                Think<span className="gradient-text">Trophy</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-white/50 max-w-xs leading-relaxed">
              Test your knowledge across dozens of categories, compete with players worldwide, and win real cash prizes. Think sharp. Win big.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center
                             bg-slate-100 dark:bg-white/5
                             hover:bg-brand-blue hover:text-white
                             text-slate-500 dark:text-white/40
                             transition-all duration-150"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-white/30 mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    {item.href.startsWith('/') && !item.href.includes('#') ? (
                      <Link
                        to={item.href}
                        className="text-sm text-slate-600 dark:text-white/60
                                   hover:text-brand-blue dark:hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-sm text-slate-600 dark:text-white/60
                                   hover:text-brand-blue dark:hover:text-white transition-colors"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 dark:text-white/30">
            © {new Date().getFullYear()} ThinkTrophy. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-white/30">
            Made with ❤️ for curious minds.
          </p>
        </div>
      </div>
    </footer>
  );
}
