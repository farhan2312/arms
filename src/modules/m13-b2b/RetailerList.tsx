import { useState, useMemo } from 'react';
import { Search, Plus, Pencil } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import type { RetailerAccount, RetailerTier } from '../../types/b2b';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<RetailerTier, 'gray' | 'blue' | 'yellow' | 'purple'> = {
  Standard: 'gray',
  Silver:   'blue',
  Gold:     'yellow',
  Preferred:'purple',
};

const SALES_EXECS = MOCK_USERS.filter((u) => u.role === 'B2BSalesExecutive');

/** Retailers whose oldest unpaid invoice is past due — hardcoded from data analysis. */
const OVERDUE_IDS = new Set(['ret-001', 'ret-002', 'ret-005', 'ret-008']);

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function creditTermLabel(days: number) {
  if (days === 0) return 'Advance';
  return `${days}-Day`;
}

function availableCreditColor(pct: number): string {
  if (pct > 50) return 'text-emerald-600 font-semibold';
  if (pct >= 25) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-semibold';
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  retailers: RetailerAccount[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (r: RetailerAccount) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RetailerList({ retailers, onSelect, onAdd, onEdit }: Props) {
  const [search, setSearch]           = useState('');
  const [tierFilter, setTierFilter]   = useState<RetailerTier | 'All'>('All');
  const [distFilter, setDistFilter]   = useState('All');
  const [execFilter, setExecFilter]   = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const districts = useMemo(
    () => ['All', ...Array.from(new Set(retailers.map((r) => r.address.district))).sort()],
    [retailers],
  );

  const filtered = useMemo(() => {
    return retailers.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.firmName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.gstIn.toLowerCase().includes(q);
      const matchTier   = tierFilter === 'All' || r.tier === tierFilter;
      const matchDist   = distFilter === 'All' || r.address.district === distFilter;
      const matchExec   = execFilter === 'All' || r.salesExecUserId === execFilter;
      const matchOverdue = !overdueOnly || OVERDUE_IDS.has(r.id);
      return matchSearch && matchTier && matchDist && matchExec && matchOverdue;
    });
  }, [retailers, search, tierFilter, distFilter, execFilter, overdueOnly]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-60">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firm name, owner, GST, mobile…"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors flex-shrink-0"
        >
          <Plus size={14} />
          Add Retailer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Tier pills */}
        {(['All', 'Standard', 'Silver', 'Gold', 'Preferred'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              tierFilter === t
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* District */}
        <select
          value={distFilter}
          onChange={(e) => setDistFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {districts.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>)}
        </select>

        {/* Sales Exec */}
        <select
          value={execFilter}
          onChange={(e) => setExecFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Sales Execs</option>
          {SALES_EXECS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {/* Overdue toggle */}
        <button
          onClick={() => setOverdueOnly((v) => !v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            overdueOnly
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Overdue Only
        </button>

        <span className="ml-auto text-xs text-gray-400">{filtered.length} accounts</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Business</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">District</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tier</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Credit Limit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Available</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Terms</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sales Exec</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => {
                const available = r.creditLimitAmt - r.outstandingAmt;
                const availPct  = r.creditLimitAmt > 0 ? (available / r.creditLimitAmt) * 100 : 100;
                const exec      = r.salesExecUserId ? MOCK_USERS.find((u) => u.id === r.salesExecUserId) : undefined;
                const isOverdue = OVERDUE_IDS.has(r.id);

                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelect(r.id)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${isOverdue ? 'bg-red-50/40' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-xs leading-snug">{r.firmName}</p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{r.gstIn}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.ownerName}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">{r.mobile}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.address.district}</td>
                    <td className="px-4 py-3">
                      <Badge label={r.tier} variant={TIER_BADGE[r.tier]} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600">{fmt(r.creditLimitAmt)}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={r.outstandingAmt > 0 && isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {fmt(r.outstandingAmt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={availableCreditColor(availPct)}>{fmt(Math.max(0, available))}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{creditTermLabel(r.creditDays)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{exec?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {isOverdue
                        ? <Badge label="Overdue" variant="red" />
                        : r.isActive
                          ? <Badge label="Active" variant="green" />
                          : <Badge label="Inactive" variant="gray" />
                      }
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(r)}
                        className="text-gray-300 hover:text-emerald-600 transition-colors"
                        title="Edit retailer"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-400">
                    No retailer accounts match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
