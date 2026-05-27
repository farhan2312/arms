import type { B2BInvoice } from '../../types/b2b';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AgeBucket = 'all' | 'current' | '1-30' | '31-60' | '61-90' | '90+';

// ── Utils (shared within receivables module) ──────────────────────────────────

export function daysOverdue(dueDate: string): number {
  const due   = new Date(dueDate);
  const today = new Date('2026-05-27');
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

export function ageBucket(dueDate: string): AgeBucket {
  const d = daysOverdue(dueDate);
  if (d <= 0)  return 'current';
  if (d <= 30) return '1-30';
  if (d <= 60) return '31-60';
  if (d <= 90) return '61-90';
  return '90+';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  invoices: B2BInvoice[];
  activeBucket: AgeBucket;
  onBucketClick: (b: AgeBucket) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceivablesSummary({ invoices, activeBucket, onBucketClick }: Props) {
  function bucketTotal(b: AgeBucket): number {
    return invoices
      .filter((inv) => b === 'all' || ageBucket(inv.dueDate) === b)
      .reduce((s, inv) => s + inv.outstandingAmt, 0);
  }

  const cards: {
    id: AgeBucket;
    label: string;
    sub: string;
    value: number;
    activeClass: string;
    inactiveClass: string;
    dotClass: string;
  }[] = [
    {
      id: 'all',   label: 'Total Outstanding',  sub: 'All unpaid invoices',
      value: bucketTotal('all'),
      activeClass:   'bg-gray-900 text-white border-gray-900',
      inactiveClass: 'bg-white text-gray-800 border-gray-200 hover:border-gray-400',
      dotClass: 'bg-gray-400',
    },
    {
      id: 'current', label: 'Current',          sub: 'Not yet due',
      value: bucketTotal('current'),
      activeClass:   'bg-emerald-600 text-white border-emerald-600',
      inactiveClass: 'bg-white text-gray-800 border-gray-200 hover:border-emerald-400',
      dotClass: 'bg-emerald-500',
    },
    {
      id: '1-30',  label: '1–30 Days',          sub: 'Overdue',
      value: bucketTotal('1-30'),
      activeClass:   'bg-amber-500 text-white border-amber-500',
      inactiveClass: 'bg-white text-gray-800 border-gray-200 hover:border-amber-400',
      dotClass: 'bg-amber-400',
    },
    {
      id: '31-60', label: '31–60 Days',         sub: 'Overdue',
      value: bucketTotal('31-60'),
      activeClass:   'bg-orange-500 text-white border-orange-500',
      inactiveClass: 'bg-white text-gray-800 border-gray-200 hover:border-orange-400',
      dotClass: 'bg-orange-400',
    },
    {
      id: '61-90', label: '61–90 Days',         sub: 'Overdue',
      value: bucketTotal('61-90'),
      activeClass:   'bg-red-500 text-white border-red-500',
      inactiveClass: 'bg-white text-gray-800 border-gray-200 hover:border-red-400',
      dotClass: 'bg-red-400',
    },
    {
      id: '90+',   label: '90+ Days',           sub: 'Critical',
      value: bucketTotal('90+'),
      activeClass:   'bg-red-800 text-white border-red-800',
      inactiveClass: 'bg-white text-gray-800 border-gray-200 hover:border-red-700',
      dotClass: 'bg-red-700',
    },
  ];

  return (
    <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map(({ id, label, sub, value, activeClass, inactiveClass, dotClass }) => {
        const isActive = activeBucket === id;
        return (
          <button
            key={id}
            onClick={() => onBucketClick(isActive ? 'all' : id)}
            className={`text-left p-4 rounded-xl border transition-all ${isActive ? activeClass : inactiveClass}`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white/70' : dotClass}`} />
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                {label}
              </p>
            </div>
            <p className={`text-lg font-bold leading-none ${isActive ? 'text-white' : value > 0 && id !== 'all' && id !== 'current' ? 'text-gray-900' : 'text-gray-900'}`}>
              {fmt(value)}
            </p>
            <p className={`text-[11px] mt-1 ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{sub}</p>
          </button>
        );
      })}
    </div>
  );
}
