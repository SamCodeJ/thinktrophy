import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, HelpCircle, Tag, CreditCard,
  Users, Gamepad2, Settings, ChevronLeft, BarChart2, FileText, Shield, MessageSquareQuote,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/questions',     icon: HelpCircle,      label: 'Questions' },
  { to: '/categories',    icon: Tag,             label: 'Categories' },
  { to: '/testimonials',  icon: MessageSquareQuote, label: 'Testimonials' },
  { to: '/transactions',  icon: CreditCard,      label: 'Transactions' },
  { to: '/users',         icon: Users,           label: 'Users' },
  { to: '/game-sessions', icon: Gamepad2,        label: 'Game Sessions' },
  { to: '/statistics',    icon: BarChart2,       label: 'Statistics' },
  { to: '/logs',          icon: FileText,        label: 'Logs' },
  { to: '/webhooks',      icon: FileText,        label: 'Webhooks' },
  { to: '/admins',        icon: Shield,          label: 'Admins' },
  { to: '/settings',      icon: Settings,        label: 'Settings' },
];

export default function Sidebar({ open, setOpen }) {
  const { admin, logout } = useAuth();

  return (
    <aside
      className={`${open ? 'w-64' : 'w-20'} bg-brand-dark border-r border-white/5 flex flex-col
                  transition-all duration-300 ease-in-out flex-shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <img src="/favicon.png" alt="ThinkTrophy" className="w-9 h-9 rounded-xl flex-shrink-0" />
        {open && (
          <div>
            <p className="font-bold text-white leading-none">ThinkTrophy</p>
            <p className="text-xs text-white/40 mt-0.5">Admin Portal</p>
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          className="ml-auto text-white/40 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} className={`transition-transform ${open ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          // Hide Admins menu from non-super_admins
          if (to === '/admins' && admin?.role !== 'super_admin') return null;
          
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive
                   ? 'bg-brand-gradient text-white shadow-lg shadow-brand-blue/20'
                   : 'text-white/50 hover:text-white hover:bg-white/5'}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {open && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      {admin && (
        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center gap-3 px-3 py-2 ${!open && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {admin.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {open && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{admin.name}</p>
                <p className="text-xs text-white/40 truncate">{admin.role}</p>
              </div>
            )}
          </div>
          {open && (
            <button
              onClick={logout}
              className="mt-2 w-full text-left text-xs text-white/30 hover:text-red-400 px-3 py-1 transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
