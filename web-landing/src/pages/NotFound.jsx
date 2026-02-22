import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-brand-gradient mx-auto flex items-center justify-center shadow-xl shadow-brand-blue/20">
          <Trophy size={36} className="text-white" />
        </div>
        <div>
          <h1 className="text-7xl font-black gradient-text">404</h1>
          <h2 className="text-2xl font-bold text-brand-dark dark:text-white mt-2">Page not found</h2>
          <p className="text-slate-500 dark:text-white/50 mt-2">
            This question isn't in our database. Let's get you back on track.
          </p>
        </div>
        <Link to="/" className="btn-primary inline-flex">
          <ArrowLeft size={17} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
