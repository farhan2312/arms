import { useState, useMemo } from 'react';
import { Plus, Pencil } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import type { CreditNote, CreditNoteType, CreditNoteStatus } from './types';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CreditNoteStatus, string> = {
  Draft:           'Draft',
  PendingApproval: 'Pending Approval',
  Posted:          'Posted',
  Rejected:        'Rejected',
};

const STATUS_VARIANT: Record<CreditNoteStatus, BadgeVariant> = {
  Draft:           'gray',
  PendingApproval: 'amber',
  Posted:          'green',
  Rejected:        'red',
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
        <Card padding="10px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total Credit Notes</p>
          <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
        </Card>
        <Card padding="10px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Posted Value</p>
          <p className="text-lg font-bold text-emerald-700">{fmt(totalPosted)}</p>
        </Card>
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 16px',
          }}
        >
          <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest">Pending Approval</p>
          <p className="text-lg font-bold text-amber-700">{filtered.filter((cn) => cn.status === 'PendingApproval').length}</p>
        </div>
        <Button variant="primary" iconLeft={Plus} onClick={onCreate} className="ml-auto">
          Create Credit Note
        </Button>
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
      <TableWrap>
        <thead>
          <tr>
            <Th>CN Number</Th>
            <Th>Type</Th>
            <Th>Party</Th>
            <Th>Linked Ref</Th>
            <Th right>Amount</Th>
            <Th right>GST</Th>
            <Th right>Net Amount</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((cn) => {
            const reason = cn.supplierReason ?? cn.b2bReason;
            return (
              <Tr
                key={cn.id}
                onClick={() => onSelect(cn.id)}
              >
                <Td mono><span className="font-semibold text-gray-800">{cn.cnNo}</span></Td>
                <Td>
                  <Badge
                    label={cn.type === 'B2BCustomer' ? 'B2B Customer' : 'Supplier'}
                    variant={cn.type === 'Supplier' ? 'blue' : 'purple'}
                  />
                </Td>
                <Td>
                  <p className="text-xs font-medium text-gray-800 leading-snug">
                    {cn.supplierName ?? cn.retailerName ?? '—'}
                  </p>
                  {reason && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{REASON_LABELS[reason] ?? reason}</p>
                  )}
                </Td>
                <Td mono muted>{cn.linkedGrnId ?? cn.linkedInvoiceNo ?? '—'}</Td>
                <Td right muted>{fmt(cn.amount)}</Td>
                <Td right muted>{fmt(cn.gstAmt)}</Td>
                <Td right bold>{fmt(cn.netAmt)}</Td>
                <Td muted>{cn.date}</Td>
                <Td>
                  <Badge
                    label={STATUS_LABEL[cn.status]}
                    variant={STATUS_VARIANT[cn.status]}
                  />
                </Td>
                <Td>
                  {cn.status === 'Draft' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(cn); }}
                      className="text-gray-300 hover:text-emerald-600 transition-colors"
                      title="Edit draft"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </Td>
              </Tr>
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
      </TableWrap>
    </div>
  );
}
