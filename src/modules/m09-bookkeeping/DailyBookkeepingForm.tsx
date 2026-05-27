// DailyBookkeepingForm — end-of-day cash reconciliation form
// Auto-populates sales summary from mock data; manual cash and petty cash entry

import { useState, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, Plus, Trash2, Lock, Info } from 'lucide-react';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import { mockFarmers } from '../../data/mockFarmers';
import { mockStores } from '../../data/mockStores';
import { useAuth } from '../../context/AuthContext';
import type { BookkeepingEntry, PettyCashCategory } from './BookkeepingPage';

const TODAY = '2026-05-27';
const DISCREPANCY_THRESHOLD = 100;
const PETTY_CATEGORIES: PettyCashCategory[] = ['Transport', 'Cleaning', 'Stationery', 'Other'];

// Urea: 45 kg/bag, DAP: 50 kg/bag
const FERT_KG: Record<string, number> = { Urea: 45, DAP: 50 };

interface DayStats {
  b2cTotal: number;
  cashSales: number;
  upiSales: number;
  creditSales: number;  // Card + Credit + BNPL
  txnCount: number;
  ureaKg: number;
  dapKg: number;
  fertTxnCount: number;
  aadhaarVerifiedCount: number;
  b2bTotal: number;
  b2bOrderCount: number;
}

function computeDayStats(storeId: string, date: string): DayStats {
  const farmerMap = new Map(mockFarmers.map(f => [f.id, f]));

  const txns = mockSaleTransactions.filter(
    t => t.storeId === storeId && t.invoiceDate === date && t.status !== 'Cancelled',
  );

  let b2cTotal = 0, cashSales = 0, upiSales = 0, creditSales = 0;
  let ureaKg = 0, dapKg = 0;
  const fertFarmerIds: string[] = [];

  txns.forEach(t => {
    b2cTotal += t.totalAmt;
    if (t.paymentMode === 'Cash') cashSales += t.totalAmt;
    else if (t.paymentMode === 'UPI') upiSales += t.totalAmt;
    else creditSales += t.totalAmt; // Card, Credit, BNPL

    let hasFert = false;
    t.lines.forEach(l => {
      if (l.productName.includes('Urea')) { ureaKg += l.qty * FERT_KG.Urea; hasFert = true; }
      if (l.productName.includes('DAP'))  { dapKg  += l.qty * FERT_KG.DAP;  hasFert = true; }
    });
    if (hasFert) fertFarmerIds.push(t.farmerId);
  });

  const aadhaarVerifiedCount = fertFarmerIds.filter(
    id => farmerMap.get(id)?.kycStatus === 'Verified',
  ).length;

  const b2bOrders = mockB2BOrders.filter(
    o =>
      o.fulfillmentStoreId === storeId &&
      o.dispatchByDate === date &&
      (o.status === 'Dispatched' || o.status === 'Invoiced' || o.status === 'Delivered'),
  );

  return {
    b2cTotal,
    cashSales,
    upiSales,
    creditSales,
    txnCount: txns.length,
    ureaKg,
    dapKg,
    fertTxnCount: fertFarmerIds.length,
    aadhaarVerifiedCount,
    b2bTotal: b2bOrders.reduce((s, o) => s + o.totalAmt, 0),
    b2bOrderCount: b2bOrders.length,
  };
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// ── Local form types ───────────────────────────────────────────────────────────

interface PettyCashLine {
  id: string;
  category: PettyCashCategory;
  amount: string;
}

interface Props {
  entries: BookkeepingEntry[];
  onSubmit: (entry: BookkeepingEntry) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DailyBookkeepingForm({ entries, onSubmit }: Props) {
  const { currentUser } = useAuth();
  const isStoreIncharge = currentUser.role === 'StoreIncharge';
  const defaultStoreId = currentUser.assignedStoreIds[0] ?? mockStores[0].id;

  const [date, setDate]           = useState(TODAY);
  const [storeId, setStoreId]     = useState(defaultStoreId);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [pettyCash, setPettyCash] = useState<PettyCashLine[]>([]);
  const [notes, setNotes]         = useState('');

  const stats = useMemo(() => computeDayStats(storeId, date), [storeId, date]);

  const pettyCashTotal = pettyCash.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const opening        = parseFloat(openingCash) || 0;
  const closing        = parseFloat(closingCash) || 0;
  const expectedClosing = opening + stats.cashSales - pettyCashTotal;
  const discrepancyAmt  = closingCash !== '' ? Math.abs(closing - expectedClosing) : 0;
  const hasDiscrepancy  = closingCash !== '' && opening !== 0 && discrepancyAmt > DISCREPANCY_THRESHOLD;

  const existingEntry = entries.find(e => e.date === date && e.storeId === storeId);
  const aadhaarOk     = stats.fertTxnCount === 0 || stats.aadhaarVerifiedCount === stats.fertTxnCount;
  const currentStoreName = mockStores.find(s => s.id === storeId)?.name ?? storeId;

  // ── Petty cash handlers ──────────────────────────────────────────────────────

  function addLine() {
    setPettyCash(prev => [...prev, { id: `pc-${Date.now()}`, category: 'Transport', amount: '' }]);
  }

  function removeLine(id: string) {
    setPettyCash(prev => prev.filter(l => l.id !== id));
  }

  function updateLine(id: string, field: 'category' | 'amount', value: string) {
    setPettyCash(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (!openingCash || !closingCash) return;
    if (hasDiscrepancy && !notes.trim()) return;

    const entry: BookkeepingEntry = {
      id: `bk-${Date.now()}`,
      date,
      storeId,
      openingCash: opening,
      closingCash: closing,
      pettyCashLines: pettyCash.map(l => ({
        category: l.category,
        amount: parseFloat(l.amount) || 0,
      })),
      pettyCashTotal,
      expectedClosing,
      discrepancyAmt: hasDiscrepancy ? discrepancyAmt : 0,
      discrepancyNotes: notes,
      status: hasDiscrepancy ? 'Flagged' : 'Submitted',
      submittedAt: new Date().toISOString(),
    };
    console.log('// POST /api/bookkeeping/entries', entry);
    onSubmit(entry);
    setOpeningCash('');
    setClosingCash('');
    setPettyCash([]);
    setNotes('');
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Date + Store ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Entry Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              Store
              {isStoreIncharge && <Lock size={10} className="text-gray-400" />}
            </label>
            {isStoreIncharge ? (
              <div className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">
                {currentStoreName}
              </div>
            ) : (
              <select
                value={storeId}
                onChange={e => setStoreId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {mockStores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── Already submitted banner ─────────────────────────────────────────── */}
      {existingEntry && (
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>
            Entry already submitted for <strong>{date}</strong> at{' '}
            <strong>{currentStoreName.replace('Bharat Agri Store – ', '')}</strong>
            {existingEntry.status === 'Flagged' && ' — flagged (discrepancy noted)'}
            {existingEntry.status === 'Submitted' && ' — signed off'}
            . Contact Finance to amend.
          </span>
        </div>
      )}

      {/* ── Auto-populated: Sales Summary ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Sales Summary</h3>
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium uppercase tracking-wide">
            Auto-populated · read-only
          </span>
        </div>

        {/* KPI cards row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">B2C Sales</p>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{fmt(stats.b2cTotal)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stats.txnCount} transaction{stats.txnCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">B2B Dispatches</p>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{fmt(stats.b2bTotal)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stats.b2bOrderCount} order{stats.b2bOrderCount !== 1 ? 's' : ''} dispatched</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">Payment Breakup</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Cash</span>
                <span className="font-semibold text-gray-800 font-mono">₹{fmt(stats.cashSales)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">UPI</span>
                <span className="font-semibold text-gray-800 font-mono">₹{fmt(stats.upiSales)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Credit / Card</span>
                <span className="font-semibold text-gray-800 font-mono">₹{fmt(stats.creditSales)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Regulated fertiliser */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-700">Regulated Fertiliser Sales</h4>
            {stats.fertTxnCount > 0 && (
              aadhaarOk
                ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <CheckCircle2 size={12} />
                    All {stats.fertTxnCount} sale{stats.fertTxnCount !== 1 ? 's' : ''} Aadhaar-verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                    <AlertTriangle size={12} />
                    {stats.aadhaarVerifiedCount}/{stats.fertTxnCount} Aadhaar-verified — check KYC
                  </span>
                )
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <span className="text-xs text-gray-600">Urea Sold</span>
              <span className="text-sm font-bold text-gray-900">{stats.ureaKg.toLocaleString()} kg</span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <span className="text-xs text-gray-600">DAP Sold</span>
              <span className="text-sm font-bold text-gray-900">{stats.dapKg.toLocaleString()} kg</span>
            </div>
          </div>
          {stats.fertTxnCount === 0 && (
            <p className="text-xs text-gray-400 mt-2.5">No Urea or DAP transactions on this date for this store.</p>
          )}
        </div>
      </div>

      {/* ── Manual: Cash Reconciliation ─────────────────────────────────────── */}
      <div className={`bg-white rounded-xl border border-gray-200 p-5 transition-opacity ${existingEntry ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Cash Reconciliation</h3>

        {/* Opening / Closing */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Opening Cash (₹)</label>
            <input
              type="number" min={0} step={1}
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Closing Cash (₹)</label>
            <input
              type="number" min={0} step={1}
              value={closingCash}
              onChange={e => setClosingCash(e.target.value)}
              placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Petty cash */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">Petty Cash Expenses</label>
            <button
              onClick={addLine}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Plus size={12} /> Add row
            </button>
          </div>

          {pettyCash.length === 0 && (
            <p className="text-xs text-gray-400 italic py-1">No entries — click "Add row" to record petty cash expenses.</p>
          )}

          {pettyCash.length > 0 && (
            <div className="space-y-2">
              {pettyCash.map(line => (
                <div key={line.id} className="flex items-center gap-2">
                  <select
                    value={line.category}
                    onChange={e => updateLine(line.id, 'category', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {PETTY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number" min={0} step={1}
                    value={line.amount}
                    onChange={e => updateLine(line.id, 'amount', e.target.value)}
                    placeholder="Amount (₹)"
                    className="w-32 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => removeLine(line.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2 mt-1">
                <span className="text-xs text-gray-500">Petty Cash Total:</span>
                <span className="text-sm font-bold text-gray-800 font-mono">₹{fmt(pettyCashTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Expected vs Actual reconciliation panel */}
        {(openingCash !== '' || closingCash !== '') && (
          <div className={`rounded-xl border px-4 py-3.5 mb-4 ${
            hasDiscrepancy ? 'bg-red-50 border-red-200 border-l-4 border-l-red-500' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Expected Closing Cash</span>
              <span className="font-mono font-bold text-gray-900">₹{fmt(expectedClosing)}</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-2">
              = Opening ₹{fmt(opening)} + Cash Sales ₹{fmt(stats.cashSales)} − Petty Cash ₹{fmt(pettyCashTotal)}
            </p>
            {closingCash !== '' && hasDiscrepancy && (
              <div className="flex items-start gap-1.5 text-red-700 mt-1">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                <span className="text-xs font-medium">
                  Discrepancy of ₹{fmt(discrepancyAmt)} — explanation required before sign-off
                </span>
              </div>
            )}
            {closingCash !== '' && !hasDiscrepancy && closing > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-700 mt-1">
                <CheckCircle2 size={13} />
                <span className="text-xs font-medium">Cash balanced — within ₹{DISCREPANCY_THRESHOLD} tolerance</span>
              </div>
            )}
          </div>
        )}

        {/* Mandatory discrepancy notes */}
        {hasDiscrepancy && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Explanation <span className="text-red-500">*</span>
              <span className="ml-1 text-gray-400 font-normal">(mandatory when discrepancy &gt; ₹{DISCREPANCY_THRESHOLD})</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the reason for the cash discrepancy…"
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-start gap-1.5 text-[10px] text-gray-400 max-w-xs">
            <Info size={11} className="flex-shrink-0 mt-0.5" />
            <span>Entry is locked after sign-off and cannot be edited. Contact Finance to raise an amendment.</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!openingCash || !closingCash || (hasDiscrepancy && !notes.trim())}
            className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit & Sign Off
          </button>
        </div>
      </div>
    </div>
  );
}
