import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Header({ onMenuClick }) {
  const { admin } = useAuth();
  return (
    <header className="h-16 bg-brand-dark border-b border-white/5 flex items-center px-6 gap-4 flex-shrink-0">
      <button onClick={onMenuClick} className="text-white/50 hover:text-white transition-colors lg:hidden">
        <Menu size={20} />
      </button>
      <div className="flex-1" />
      <button className="text-white/50 hover:text-white transition-colors relative">
        <Bell size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white">
          {admin?.name?.[0]?.toUpperCase() || 'A'}
        </div>
        <span className="text-sm text-white/70 hidden sm:block">{admin?.name}</span>
      </div>
    </header>
  );
}
