// BookkeepingPage — tab shell for Daily Bookkeeping module
// Defines and exports shared types used by DailyBookkeepingForm and BookkeepingHistory

import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
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

const TABS = [
  { id: 'form',    label: 'Daily Entry' },
  { id: 'history', label: 'History' },
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
      <PageHeader
        title="Daily Bookkeeping"
        subtitle="End-of-day cash reconciliation and sales sign-off"
      />

      <Tabs
        tabs={TABS}
        activeTab={tab}
        onTabChange={(id) => setTab(id as BKTab)}
      />

      <div className="mt-6">
        {tab === 'form' && (
          <DailyBookkeepingForm entries={entries} onSubmit={handleSubmit} />
        )}
        {tab === 'history' && (
          <BookkeepingHistory entries={entries} />
        )}
      </div>
    </div>
  );
}
