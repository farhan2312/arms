import { Bell, ChevronRight, Store } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROUTE_LABELS: Record<string, string> = {
  '/':                'Dashboard',
  '/pos':             'Point of Sale',
  '/inventory':       'Inventory',
  '/products':        'Catalogue',
  '/farmers':         'Farmers',
  '/bookkeeping':     'Daily Bookkeeping',
  '/wallet-lookup':   'Loyalty Lookup',
  '/stores':          'Stores',
  '/outreach':        'Outreach',
  '/field-force':     'Field Force',
  '/loyalty':         'Loyalty Dashboard',
  '/b2b-orders':      'B2B Orders',
  '/b2b-new':         'New B2B Order',
  '/retailers':       'Retailer Accounts',
  '/reports':         'Reports',
  '/credit-notes':    'Credit Notes',
  '/b2b-receivables': 'B2B Receivables',
  '/analytics':       'Ops Dashboard',
  '/tier-management': 'Tier Management',
  '/coupons':         'Coupons',
  '/settings':        'Settings',
};

export default function Topbar() {
  const { currentUser, currentStore } = useAuth();
  const location = useLocation();

  const pageLabel = ROUTE_LABELS[location.pathname] ?? 'Page';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5">
        <span className="text-gray-400 text-xs font-medium tracking-wide">ARMS</span>
        <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
        <span className="text-gray-900 font-semibold text-sm">{pageLabel}</span>
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Store chip — visible when user is store-scoped */}
        {currentStore && (
          <div className="hidden md:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs">
            <Store size={11} className="text-gray-400 flex-shrink-0" />
            <span className="font-medium text-gray-700 truncate max-w-36">{currentStore.name}</span>
            <span className="text-gray-400 font-mono">{currentStore.code}</span>
          </div>
        )}

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* Avatar — static, role switching is in the sidebar */}
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
          {currentUser.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </div>
      </div>
    </header>
  );
}
