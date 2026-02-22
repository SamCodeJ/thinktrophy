import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { label: 'Home',       href: '/#home' },
  { label: 'Features',   href: '/#features' },
  { label: 'How to Play',href: '/#how-it-works' },
  { label: 'Download',   href: '/#download' },
];

export default function Navbar() {
  const { isDark, toggle } = useTheme();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location]);

  const navBase = `fixed top-0 left-0 right-0 z-50 transition-all duration-300`;
  const navBg = scrolled || menuOpen
    ? 'bg-white/95 dark:bg-brand-darker/95 backdrop-blur-md shadow-lg dark:shadow-black/20 border-b border-slate-100 dark:border-white/5'
    : 'bg-transparent';

  return (
    <nav className={`${navBase} ${navBg}`}>
      <div className="section">
        <div className="flex items-center justify-between h-16 lg:h-18">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/favicon.png" alt="ThinkTrophy" className="w-9 h-9 rounded-xl" />
            <span className="font-bold text-lg tracking-tight text-brand-dark dark:text-white">
              Think<span className="gradient-text">Trophy</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-white/70
                           hover:text-brand-blue dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5
                           transition-all duration-150"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-xl flex items-center justify-center
                         bg-slate-100 dark:bg-white/10
                         hover:bg-slate-200 dark:hover:bg-white/20
                         text-slate-600 dark:text-white/70
                         transition-all duration-150"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* CTA */}
            <Link to="/signup" className="hidden md:inline-flex btn-primary py-2 px-5 text-sm shadow-md">
              Sign Up Free
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center
                         bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70
                         hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-slate-100 dark:border-white/5 pt-3">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium
                           text-slate-700 dark:text-white/80
                           hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <Link to="/signup" className="btn-primary w-full text-sm py-2.5">
                Sign Up Free
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
