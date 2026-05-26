import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, AlertCircle } from 'lucide-react';

// Routes that exist in the sidebar but have no built page yet
const COMING_SOON = new Set([
  '/bookkeeping',
  '/stores',
  '/outreach',
  '/retailers',
  '/credit-notes',
  '/b2b-receivables',
]);

export default function NotFound() {
  const { pathname } = useLocation();
  const isComingSoon = COMING_SOON.has(pathname);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 py-20 px-6 text-center">
      {isComingSoon ? (
        <>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
            <Clock size={28} className="text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h1>
          <p className="text-sm text-gray-500 max-w-xs">
            This module is under construction. Check back in a future release.
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-5">
            <AlertCircle size={28} className="text-gray-400" />
          </div>
          <p className="text-5xl font-bold text-gray-200 mb-3">404</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
          <p className="text-sm text-gray-500 max-w-xs">
            The path{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{pathname}</code>{' '}
            doesn&apos;t exist.
          </p>
        </>
      )}

      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <Home size={15} />
        Back to Dashboard
      </Link>
    </div>
  );
}
