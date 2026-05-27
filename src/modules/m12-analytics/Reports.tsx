import { useState } from 'react';
import { ShoppingCart, Package, Users, Route, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import SalesReports from './SalesReports';
import InventoryReports from './InventoryReports';
import FarmerLoyaltyReports from './FarmerLoyaltyReports';
import FieldForceReports from './FieldForceReports';
import ComplianceReports from './ComplianceReports';

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = 'sales' | 'inventory' | 'farmer' | 'fieldforce' | 'compliance';

const TABS: { id: TabId; label: string; icon: typeof ShoppingCart; description: string }[] = [
  { id: 'sales',      label: 'Sales',       icon: ShoppingCart, description: 'B2C & B2B sales registers, GST ledger' },
  { id: 'inventory',  label: 'Inventory',   icon: Package,      description: 'Stock ledger, COGS, expiry, movement'  },
  { id: 'farmer',     label: 'Farmer & Loyalty', icon: Users,  description: 'LTV, tier movement, outreach ROI'       },
  { id: 'fieldforce', label: 'Field Force', icon: Route,        description: 'TA/DA claims, meeting log summary'      },
  { id: 'compliance', label: 'Compliance',  icon: ShieldCheck,  description: 'Urea/DAP daily report, DBTL summary'   },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Reports() {
  const [tab, setTab] = useState<TabId>('sales');

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Exportable operational reports across sales, inventory, loyalty, field force and compliance"
      />

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
              tab === id
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
          <active.icon size={14} className="text-emerald-700" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{active.label} Reports</h2>
          <p className="text-xs text-gray-400">{active.description}</p>
        </div>
      </div>

      {/* Report content */}
      {tab === 'sales'      && <SalesReports />}
      {tab === 'inventory'  && <InventoryReports />}
      {tab === 'farmer'     && <FarmerLoyaltyReports />}
      {tab === 'fieldforce' && <FieldForceReports />}
      {tab === 'compliance' && <ComplianceReports />}
    </div>
  );
}
