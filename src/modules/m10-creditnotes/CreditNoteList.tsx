import { useState, useMemo } from 'react';
import { Plus, Pencil } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import type { CreditNote, CreditNoteType, CreditNoteStatus } from './types';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<CreditNoteStatus, { label: string; cls: string }> = {
  Draft:            { label: 'Draft',            cls: 'bg-gray-100 text-gray-600' },
  PendingApproval:  { label: 'Pending Approval', cls: 'bg-amber-100 text-amber-700' },
  Posted:           { label: 'Posted',           cls: 'bg-emerald-100 text-emerald-700' },
  Rejected:         { label: 'Rejected',         cls: 'bg-red-100 text-red-700' },
};

const REASON_LABELS: Record<string, string> = {
  VolumeDiscount: 'Volume Discount',
  QualityClaim:   'Quality Claim',
  Returns:        'Returns',
  Scheme:         'Scheme',
  DamagedGoods:   'Damaged Goods',
  WrongProduct:   'Wrong Product',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  notes: CreditNote[];
  onCreate: () => void;
  onSelect: (id: string) => void;
  onEdit: (note: CreditNote) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreditNoteList({ notes, onCreate, onSelect, onEdit }: Props) {
  const [typeFilter,   setTypeFilter]   = useState<CreditNoteType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<CreditNoteStatus | 'All'>('All');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');

  const filtered = useMemo(() => {
    return notes.filter((cn) => {
      const matchType   = typeFilter   === 'All' || cn.type   === typeFilter;
      const matchStatus = statusFilter === 'All' || cn.status === statusFilter;
      const matchFrom   = !dateFrom || cn.date >= dateFrom;
      const matchTo     = !dateTo   || cn.date <= dateTo;
      return matchType && matchStatus && matchFrom && matchTo;
    });
  }, [notes, typeFilter, statusFilter, dateFrom, dateTo]);

  const totalPosted = filtered
    .filter((cn) => cn.status === 'Posted')
    .reduce((s, cn) => s + cn.netAmt, 0);

  return (
    <div className="space-y-5">
      {/* Summary pills */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total Credit Notes</p>
          <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Posted Value</p>
          <p className="text-lg font-bold text-emerald-700">{fmt(totalPosted)}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl px-4 py-2.5">
          <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest">Pending Approval</p>
          <p className="text-lg font-bold text-amber-700">{filtered.filter((cn) => cn.status === 'PendingApproval').length}</p>
        </div>
        <button
          onClick={onCreate}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus size={14} />
          Create Credit Note
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type */}
        {(['All', 'Supplier', 'B2BCustomer'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              typeFilter === t
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t === 'B2BCustomer' ? 'B2B Customer' : t}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200" />
        {/* Status */}
        {(['All', 'Draft', 'PendingApproval', 'Posted', 'Rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === s
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'PendingApproval' ? 'Pending' : s}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200" />
        {/* Date range */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-600"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-600"
        />
        <span className="ml-auto text-xs text-gray-400">{filtered.length} credit notes</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CN Number</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Party</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Linked Ref</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">GST</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Net Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((cn) => {
              const sb = STATUS_BADGE[cn.status];
              const reason = cn.supplierReason ?? cn.b2bReason;
              return (
                <tr
                  key={cn.id}
                  onClick={() => onSelect(cn.id)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-800">{cn.cnNo}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={cn.type === 'B2BCustomer' ? 'B2B Customer' : 'Supplier'}
                      variant={cn.type === 'Supplier' ? 'blue' : 'purple'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-gray-800 leading-snug">
                      {cn.supplierName ?? cn.retailerName ?? '—'}
                    </p>
                    {reason && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{REASON_LABELS[reason] ?? reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">
                    {cn.linkedGrnId ?? cn.linkedInvoiceNo ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-600">{fmt(cn.amount)}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">{fmt(cn.gstAmt)}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900">{fmt(cn.netAmt)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{cn.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${sb.cls}`}>
                      {sb.label}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {cn.status === 'Draft' && (
                      <button
                        onClick={() => onEdit(cn)}
                        className="text-gray-300 hover:text-emerald-600 transition-colors"
                        title="Edit draft"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                  No credit notes match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
