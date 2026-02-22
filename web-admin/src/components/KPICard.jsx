export default function KPICard({ title, value, sub, icon: Icon, gradient = false, color = 'blue' }) {
  const colorMap = {
    blue:   'text-brand-blue bg-brand-blue/10',
    teal:   'text-brand-teal bg-brand-teal/10',
    green:  'text-green-400  bg-green-400/10',
    red:    'text-red-400    bg-red-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
  };

  return (
    <div className={`card p-5 ${gradient ? 'bg-brand-gradient border-none' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${gradient ? 'text-white/70' : 'text-white/50'}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${gradient ? 'text-white' : 'text-white'}`}>{value}</p>
          {sub && <p className={`text-xs mt-1 ${gradient ? 'text-white/60' : 'text-white/40'}`}>{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${gradient ? 'bg-white/20' : colorMap[color]}`}>
            <Icon size={20} className={gradient ? 'text-white' : ''} />
          </div>
        )}
      </div>
    </div>
  );
}
