import { Bell, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

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
  '/analytics':       'Operations',
  '/tier-management': 'Tier Management',
  '/coupons':         'Coupons',
  '/settings':        'Settings',
  '/compliance':      'Compliance',
  '/procurement':     'Procurement',
};

export default function Topbar() {
  const location = useLocation();
  const pageLabel = ROUTE_LABELS[location.pathname] ?? 'Page';

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: '32px',
        flexShrink: 0,
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>ARMS</span>
        <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
          {pageLabel}
        </span>
      </nav>

      {/* Right — notification bell only */}
      <button
        style={{
          position: 'relative',
          width: '34px',
          height: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          transition: 'background-color 120ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-page)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
      >
        <Bell size={17} />
        <span
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
          }}
        />
      </button>
    </header>
  );
}
