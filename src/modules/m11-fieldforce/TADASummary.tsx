// TA/DA Summary — Approver view (OperationsHead / Admin / Finance)
// PATCH /api/field-force/tada-claims/:userId when backend ready

import { useState, useMemo } from 'react';
import {
  CheckCircle2, Flag, AlertTriangle,
  TrendingUp, Coins, Users, ChevronDown,
} from 'lucide-react';
import { MOCK_USERS } from '../../data/mockUsers';
import { taRate, SEED_JOURNEYS, type Journey } from './JourneyLog';
import type { UserRole } from '../../types/roles';

// ── Types ─────────────────────────────────────────────────────────────────────

type ClaimStatus = 'Pending' | 'Approved' | 'Flagged';

interface ClaimRow {
  userId: string;
  name: string;
  role: UserRole;
  employeeCode: string;
  journeys: Journey[];
  totalKm: number;
  taAmount: number;
  daAmount: number;
  totalClaim: number;
  hasDeviation: boolean;   // any journey with claimed > 120% of expected
  deviationJourneys: number;
  status: ClaimStatus;
}

// ── Expected distances for deviation check ─────────────────────────────────────
// In production: fetched from Google Maps Distance Matrix API
const EXPECTED_KM: Record<string, number> = {
  'jrn-001': 98,    // Akola→Amravati: 98 km (claimed 120 → +22.4% ⚠)
  'jrn-002': 145,   // Amravati→Nagpur: 145 km (claimed 140 → -3.4% ✓)
  'jrn-003': 18,    // Warangal→Hanamkonda: 18 km (claimed 25 → +38.9% ⚠)
  'jrn-004': 52,    // Akola→Patur: 52 km (claimed 55 → +5.8% ✓)
};

const DEVIATION_THRESHOLD = 0.20; // 20%

function hasDeviation(j: Journey): boolean {
  const expected = EXPECTED_KM[j.id];
  if (!expected) return false;
  return (j.claimedDistanceKm - expected) / expected > DEVIATION_THRESHOLD;
}

// ── Month options ─────────────────────────────────────────────────────────────

const MONTHS = [
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
];

// ── Status styles ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ClaimStatus, string> = {
  Pending:  'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Flagged:  'bg-red-100 text-red-600',
};

// ── Format helpers ────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TADASummary() {
  const [selectedMonth, setSelectedMonth] = useState('2026-05');
  const [statuses, setStatuses] = useState<Record<string, ClaimStatus>>({});
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Build claim rows from seed journeys (grouped by user)
  const claimRows: ClaimRow[] = useMemo(() => {
    const monthJourneys = SEED_JOURNEYS.filter(j => j.date.startsWith(selectedMonth));
    const grouped = new Map<string, Journey[]>();
    for (const j of monthJourneys) {
      const arr = grouped.get(j.userId) ?? [];
      arr.push(j);
      grouped.set(j.userId, arr);
    }

    return Array.from(grouped.entries()).map(([userId, journeys]) => {
      const user = MOCK_USERS.find(u => u.id === userId);
      const role = user?.role ?? 'FieldAgent' as UserRole;
      const totalKm    = journeys.reduce((s, j) => s + j.claimedDistanceKm, 0);
      const taAmount   = journeys.reduce((s, j) => s + j.taAmount, 0);
      const daAmount   = journeys.reduce((s, j) => s + j.daAmount, 0);
      const totalClaim = taAmount + daAmount;
      const deviationJourneys = journeys.filter(hasDeviation).length;

      return {
        userId,
        name:             user?.name ?? userId,
        role,
        employeeCode:     user?.employeeCode ?? '',
        journeys,
        totalKm,
        taAmount,
        daAmount,
        totalClaim,
        hasDeviation:     deviationJourneys > 0,
        deviationJourneys,
        status:           statuses[userId] ?? 'Pending',
      };
    }).sort((a, b) => b.totalClaim - a.totalClaim);
  }, [selectedMonth, statuses]);

  function setStatus(userId: string, status: ClaimStatus) {
    // PATCH /api/field-force/tada-claims/:userId when backend ready
    console.log(`// PATCH /api/field-force/tada-claims/${userId}`, { status, month: selectedMonth });
    setStatuses(prev => ({ ...prev, [userId]: status }));
  }

  const pendingCount   = claimRows.filter(r => r.status === 'Pending').length;
  const totalPayable   = claimRows.filter(r => r.status !== 'Flagged').reduce((s, r) => s + r.totalClaim, 0);
  const flaggedCount   = claimRows.filter(r => r.hasDeviation || r.status === 'Flagged').length;

  return (
    <div className="space-y-5">

      {/* ── Header controls ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">TA / DA Claims</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Review and approve field staff travel expense claims</p>
        </div>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={e => { setSelectedMonth(e.target.value); setStatuses({}); }}
            className="appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Summary KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={13} className="text-blue-500" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Claimants</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{claimRows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={13} className="text-amber-500" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Pending</p>
          </div>
          <p className="text-xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={13} className="text-red-500" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Deviations</p>
          </div>
          <p className="text-xl font-bold text-red-600">{flaggedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Coins size={13} className="text-emerald-500" />
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Payable</p>
          </div>
          <p className="text-lg font-bold text-emerald-700">{fmt(totalPayable)}</p>
        </div>
      </div>

      {/* ── Claims table ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[1.6fr_1fr_0.6fr_0.7fr_0.8fr_0.8fr_0.9fr_1fr_1fr] gap-x-3 px-5 py-3 border-b border-gray-100 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          <span>Employee</span>
          <span>Role</span>
          <span className="text-right">Trips</span>
          <span className="text-right">Total KM</span>
          <span className="text-right">TA</span>
          <span className="text-right">DA</span>
          <span className="text-right">Total Claim</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {claimRows.length === 0 ? (
          <div className="py-14 text-center text-xs text-gray-400">
            No claims for {MONTHS.find(m => m.value === selectedMonth)?.label ?? selectedMonth}.
          </div>
        ) : (
          <div>
            {claimRows.map(row => {
              const isExpanded = expandedUserId === row.userId;
              return (
                <div key={row.userId} className="border-b border-gray-50 last:border-0">
                  {/* Main row */}
                  <div
                    className={`grid grid-cols-[1.6fr_1fr_0.6fr_0.7fr_0.8fr_0.8fr_0.9fr_1fr_1fr] gap-x-3 px-5 py-3.5 items-center hover:bg-gray-50/60 cursor-pointer transition-colors ${
                      row.hasDeviation && row.status !== 'Approved' ? 'bg-red-50/30' : ''
                    }`}
                    onClick={() => setExpandedUserId(isExpanded ? null : row.userId)}
                  >
                    {/* Employee */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-gray-900 truncate">{row.name}</p>
                        {row.hasDeviation && row.status !== 'Approved' && (
                          <span title={`${row.deviationJourneys} journey(s) exceed 20% distance deviation`}
                            className="flex items-center gap-0.5 text-[9px] font-bold bg-red-100 text-red-600 px-1 py-0.5 rounded flex-shrink-0">
                            <AlertTriangle size={8} /> Deviation
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{row.employeeCode}</p>
                    </div>

                    {/* Role */}
                    <p className="text-xs text-gray-600 truncate">{row.role}</p>

                    {/* Trips */}
                    <p className="text-xs text-right tabular-nums text-gray-700 font-medium">{row.journeys.length}</p>

                    {/* KM */}
                    <p className="text-xs text-right tabular-nums font-semibold text-gray-800">{row.totalKm}</p>

                    {/* TA */}
                    <p className="text-xs text-right tabular-nums text-gray-700">{fmt(row.taAmount)}</p>

                    {/* DA */}
                    <p className="text-xs text-right tabular-nums text-gray-500">
                      {row.daAmount > 0 ? fmt(row.daAmount) : '—'}
                    </p>

                    {/* Total claim */}
                    <p className="text-sm text-right tabular-nums font-bold text-gray-900">{fmt(row.totalClaim)}</p>

                    {/* Status */}
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[row.status]}`}>
                        {row.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {row.status !== 'Approved' && (
                        <button
                          onClick={() => setStatus(row.userId, 'Approved')}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <CheckCircle2 size={10} /> Approve
                        </button>
                      )}
                      {row.status !== 'Flagged' && (
                        <button
                          onClick={() => setStatus(row.userId, 'Flagged')}
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                        >
                          <Flag size={10} /> Flag
                        </button>
                      )}
                      {row.status === 'Flagged' && (
                        <button
                          onClick={() => setStatus(row.userId, 'Pending')}
                          className="text-[10px] font-medium text-gray-500 hover:text-gray-700 underline transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded journey breakdown */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 px-5 py-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                        Journey Breakdown · {row.name}
                      </p>
                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b border-gray-100 text-gray-400">
                              <th className="text-left px-3 py-2 font-medium">Date</th>
                              <th className="text-left px-3 py-2 font-medium">Route</th>
                              <th className="text-left px-3 py-2 font-medium">Mode</th>
                              <th className="text-right px-3 py-2 font-medium">Claimed KM</th>
                              <th className="text-right px-3 py-2 font-medium">Expected KM</th>
                              <th className="text-right px-3 py-2 font-medium">Deviation</th>
                              <th className="text-right px-3 py-2 font-medium">Rate/km</th>
                              <th className="text-right px-3 py-2 font-medium">TA</th>
                              <th className="text-right px-3 py-2 font-medium">DA</th>
                              <th className="text-right px-3 py-2 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {row.journeys.map(j => {
                              const expected   = EXPECTED_KM[j.id];
                              const deviationPct = expected != null
                                ? ((j.claimedDistanceKm - expected) / expected) * 100
                                : null;
                              const isDeviated = deviationPct != null && deviationPct > DEVIATION_THRESHOLD * 100;
                              return (
                                <tr key={j.id} className={isDeviated ? 'bg-red-50' : ''}>
                                  <td className="px-3 py-2 text-gray-600 tabular-nums">{j.date}</td>
                                  <td className="px-3 py-2 text-gray-800 font-medium">{j.from} → {j.to}</td>
                                  <td className="px-3 py-2 text-gray-600">{j.mode}</td>
                                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-800">{j.claimedDistanceKm}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                                    {expected ?? <span className="text-gray-300 italic">n/a</span>}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {deviationPct != null ? (
                                      <span className={`font-semibold ${isDeviated ? 'text-red-600' : 'text-gray-600'}`}>
                                        {deviationPct > 0 ? '+' : ''}{deviationPct.toFixed(1)}%
                                        {isDeviated && ' ⚠'}
                                      </span>
                                    ) : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">₹{taRate(j.userRole)}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">{fmt(j.taAmount)}</td>
                                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                                    {j.daAmount > 0 ? fmt(j.daAmount) : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-900">{fmt(j.totalClaim)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 bg-gray-50">
                              <td colSpan={3} className="px-3 py-2 font-semibold text-gray-600">Total</td>
                              <td className="px-3 py-2 text-right font-bold text-gray-900 tabular-nums">{row.totalKm} km</td>
                              <td colSpan={2}></td>
                              <td></td>
                              <td className="px-3 py-2 text-right font-bold text-gray-900 tabular-nums">{fmt(row.taAmount)}</td>
                              <td className="px-3 py-2 text-right font-bold text-gray-900 tabular-nums">{row.daAmount > 0 ? fmt(row.daAmount) : '—'}</td>
                              <td className="px-3 py-2 text-right font-bold text-emerald-700 tabular-nums">{fmt(row.totalClaim)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {row.hasDeviation && (
                        <p className="text-[11px] text-red-600 mt-2 flex items-center gap-1">
                          <AlertTriangle size={11} />
                          {row.deviationJourneys} journey{row.deviationJourneys !== 1 ? 's' : ''} exceed{row.deviationJourneys === 1 ? 's' : ''} the 20% distance deviation threshold.
                          Route-expected distances are sourced from a reference table (production: Google Maps Distance Matrix API).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500">
          <span>
            {claimRows.filter(r => r.status === 'Approved').length} approved ·{' '}
            {claimRows.filter(r => r.status === 'Flagged').length} flagged ·{' '}
            {pendingCount} pending
          </span>
          <span className="font-semibold text-gray-700">
            Total payable: <span className="text-emerald-700">{fmt(totalPayable)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
