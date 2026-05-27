import { useState, useMemo } from 'react';
import type { B2BInvoice, RetailerAccount, RetailerTier } from '../../types/b2b';
import type { AgeBucket } from './ReceivablesSummary';
import { ageBucket } from './ReceivablesSummary';
import Badge from '../../components/ui/Badge';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<RetailerTier, 'gray' | 'blue' | 'yellow' | 'purple'> = {
  Standard: 'gray', Silver: 'blue', Gold: 'yellow', Preferred: 'purple',
};

const SALES_EXECS = MOCK_USERS.filter((u) => u.role === 'B2BSalesExecutive');

// Last payment date per retailer (derived from partial-payment invoices)
const LAST_PAYMENT_DATE: Record<string, string> = {
  'ret-001': '2026-04-05',
  'ret-002': '2026-05-01',
  'ret-006': '2026-03-17',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface RetailerRow {
  retailer: RetailerAccount;
  current: number;
  d1_30: number;
  d31_60: number;
  d61_90: number;
  d90plus: number;
  total: number;
  lastPayDate: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n === 0) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  invoices: B2BInvoice[];
  retailers: RetailerAccount[];
  activeBucket: AgeBucket;
  onSelectRetailer: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceivablesTable({ invoices, retailers, activeBucket, onSelectRetailer }: Props) {
  const [execFilter, setExecFilter]   = useState('All');
  const [distFilter, setDistFilter]   = useState('All');
  const [tierFilter, setTierFilter]   = useState<RetailerTier | 'All'>('All');

  const districts = useMemo(
    () => ['All', ...Array.from(new Set(retailers.map((r) => r.address.district))).sort()],
    [retailers],
  );

  // Build per-retailer ageing rows
  const rows = useMemo<RetailerRow[]>(() => {
    return retailers
      .map((retailer) => {
        const ri = invoices.filter((inv) => inv.retailerId === retailer.id && inv.outstandingAmt > 0);
        const bucketSum = (b: AgeBucket) => ri.filter((inv) => ageBucket(inv.dueDate) === b).reduce((s, inv) => s + inv.outstandingAmt, 0);
        return {
          retailer,
          current: bucketSum('current'),
          d1_30:   bucketSum('1-30'),
          d31_60:  bucketSum('31-60'),
          d61_90:  bucketSum('61-90'),
          d90plus: bucketSum('90+'),
          total:   ri.reduce((s, inv) => s + inv.outstandingAmt, 0),
          lastPayDate: LAST_PAYMENT_DATE[retailer.id] ?? null,
        };
      })
      .filter((r) => r.total > 0); // hide fully-paid retailers
  }, [invoices, retailers]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const r = row.retailer;
      const matchExec = execFilter === 'All' || r.salesExecUserId === execFilter;
      const matchDist = distFilter === 'All' || r.address.district === distFilter;
      const matchTier = tierFilter === 'All' || r.tier === tierFilter;
      const matchBucket = activeBucket === 'all' || (() => {
        if (activeBucket === 'current') return row.current > 0;
        if (activeBucket === '1-30')   return row.d1_30 > 0;
        if (activeBucket === '31-60')  return row.d31_60 > 0;
        if (activeBucket === '61-90')  return row.d61_90 > 0;
        if (activeBucket === '90+')    return row.d90plus > 0;
        return true;
      })();
      return matchExec && matchDist && matchTier && matchBucket;
    });
  }, [rows, execFilter, distFilter, tierFilter, activeBucket]);

  const totals = useMemo(() => ({
    current: filtered.reduce((s, r) => s + r.current, 0),
    d1_30:   filtered.reduce((s, r) => s + r.d1_30, 0),
    d31_60:  filtered.reduce((s, r) => s + r.d31_60, 0),
    d61_90:  filtered.reduce((s, r) => s + r.d61_90, 0),
    d90plus: filtered.reduce((s, r) => s + r.d90plus, 0),
    total:   filtered.reduce((s, r) => s + r.total, 0),
  }), [filtered]);

  function rowHighlight(row: RetailerRow): string {
    if (row.d90plus > 0) return 'bg-red-50/60';
    if (row.d31_60 > 0)  return 'bg-amber-50/50';
    return '';
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
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
        <select
          value={distFilter}
          onChange={(e) => setDistFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {districts.map((d) => <option key={d}>{d === 'All' ? 'All Districts' : d}</option>)}
        </select>
        <select
          value={execFilter}
          onChange={(e) => setExecFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Sales Execs</option>
          {SALES_EXECS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} accounts</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Retailer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sales Exec</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wide">Current</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-amber-500 uppercase tracking-wide">1–30d</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-orange-500 uppercase tracking-wide">31–60d</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-red-500 uppercase tracking-wide">61–90d</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-red-800 uppercase tracking-wide">90d+</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row) => {
                const exec = row.retailer.salesExecUserId
                  ? MOCK_USERS.find((u) => u.id === row.retailer.salesExecUserId)
                  : undefined;
                return (
                  <tr key={row.retailer.id} className={`transition-colors hover:brightness-95 ${rowHighlight(row)}`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectRetailer(row.retailer.id)}
                        className="text-left group"
                      >
                        <p className="text-xs font-semibold text-emerald-700 group-hover:underline leading-snug">
                          {row.retailer.firmName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge label={row.retailer.tier} variant={TIER_BADGE[row.retailer.tier]} />
                          <span className="text-[11px] text-gray-400">{row.retailer.address.district}</span>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{exec?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-xs text-emerald-700 font-medium">{fmt(row.current)}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={row.d1_30 > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}>{fmt(row.d1_30)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={row.d31_60 > 0 ? 'text-orange-600 font-semibold' : 'text-gray-400'}>{fmt(row.d31_60)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={row.d61_90 > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>{fmt(row.d61_90)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <span className={row.d90plus > 0 ? 'text-red-800 font-bold' : 'text-gray-400'}>{fmt(row.d90plus)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">
                      ₹{row.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.lastPayDate ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals footer */}
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-3 text-xs font-bold text-gray-600" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-right text-xs font-bold text-emerald-700">
                  {totals.current > 0 ? `₹${totals.current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-amber-600">
                  {totals.d1_30 > 0 ? `₹${totals.d1_30.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-orange-600">
                  {totals.d31_60 > 0 ? `₹${totals.d31_60.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-red-600">
                  {totals.d61_90 > 0 ? `₹${totals.d61_90.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-red-800">
                  {totals.d90plus > 0 ? `₹${totals.d90plus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">
                  ₹{totals.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
