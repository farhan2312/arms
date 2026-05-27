// BookkeepingPage — tab shell for Daily Bookkeeping module
// Defines and exports shared types used by DailyBookkeepingForm and BookkeepingHistory

import { useState } from 'react';
import { FileText, Clock } from 'lucide-react';
import DailyBookkeepingForm from './DailyBookkeepingForm';
import BookkeepingHistory from './BookkeepingHistory';

// ── Shared types (imported by sub-components via `import type`) ───────────────

export type PettyCashCategory = 'Transport' | 'Cleaning' | 'Stationery' | 'Other';

export interface BookkeepingEntry {
  id: string;
  date: string;               // YYYY-MM-DD
  storeId: string;
  openingCash: number;
  closingCash: number;
  pettyCashLines: { category: PettyCashCategory; amount: number }[];
  pettyCashTotal: number;     // precomputed on submit
  expectedClosing: number;    // openingCash + cashSales − pettyCashTotal
  discrepancyAmt: number;     // |closingCash − expectedClosing|; 0 if balanced
  discrepancyNotes: string;
  status: 'Submitted' | 'Flagged';
  submittedAt: string;        // ISO 8601
}

// ── Seed data (a few pre-existing entries to populate the history table) ──────

const SEED_ENTRIES: BookkeepingEntry[] = [
  {
    id: 'bk-seed-001',
    date: '2026-05-25',
    storeId: 'str-akl-001',
    openingCash: 5000,
    closingCash: 5000,
    pettyCashLines: [],
    pettyCashTotal: 0,
    expectedClosing: 5000, // no cash sales on 25th for Akola
    discrepancyAmt: 0,
    discrepancyNotes: '',
    status: 'Submitted',
    submittedAt: '2026-05-25T19:45:00Z',
  },
  {
    id: 'bk-seed-002',
    date: '2026-05-23',
    storeId: 'str-amr-002',
    openingCash: 3200,
    closingCash: 2880,
    pettyCashLines: [{ category: 'Transport', amount: 320 }],
    pettyCashTotal: 320,
    expectedClosing: 2880, // 3200 + 0 cash sales − 320
    discrepancyAmt: 0,
    discrepancyNotes: '',
    status: 'Submitted',
    submittedAt: '2026-05-23T20:10:00Z',
  },
  {
    id: 'bk-seed-003',
    date: '2026-05-20',
    storeId: 'str-ngp-003',
    openingCash: 4000,
    closingCash: 4200,
    pettyCashLines: [{ category: 'Cleaning', amount: 150 }],
    pettyCashTotal: 150,
    expectedClosing: 3850, // 4000 + 0 cash sales − 150
    discrepancyAmt: 350,   // |4200 − 3850|
    discrepancyNotes: 'Extra ₹350 found in drawer — likely carryover from previous day cash bag. Will reconcile during monthly audit.',
    status: 'Flagged',
    submittedAt: '2026-05-20T21:00:00Z',
  },
];

// ── Tab definition ─────────────────────────────────────────────────────────────

type BKTab = 'form' | 'history';

const TABS: { key: BKTab; label: string; icon: React.ElementType }[] = [
  { key: 'form',    label: 'Daily Entry',  icon: FileText },
  { key: 'history', label: 'History',      icon: Clock },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BookkeepingPage() {
  const [entries, setEntries] = useState<BookkeepingEntry[]>(SEED_ENTRIES);
  const [tab, setTab] = useState<BKTab>('form');

  function handleSubmit(entry: BookkeepingEntry) {
    setEntries(prev => [entry, ...prev]);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Daily Bookkeeping</h1>
        <p className="text-sm text-gray-500 mt-0.5">End-of-day cash reconciliation and sales sign-off</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'form' && (
        <DailyBookkeepingForm entries={entries} onSubmit={handleSubmit} />
      )}
      {tab === 'history' && (
        <BookkeepingHistory entries={entries} />
      )}
    </div>
  );
}
