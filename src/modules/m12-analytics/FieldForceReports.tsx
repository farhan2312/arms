import { useState, useMemo } from 'react';
import { Download, FileText, Mail } from 'lucide-react';
import { MOCK_USERS } from '../../data/mockUsers';
import { SEED_JOURNEYS } from '../m11-fieldforce/JourneyLog';
import { SEED_MEETINGS } from '../m11-fieldforce/MeetingLog';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ── Export bar ────────────────────────────────────────────────────────────────

function ExportBar({ reportName }: { reportName: string }) {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <button onClick={() => console.log(`// GET /api/reports/${reportName}/csv`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white">
        <Download size={12} /> CSV
      </button>
      <button onClick={() => console.log(`// GET /api/reports/${reportName}/pdf`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white">
        <FileText size={12} /> PDF
      </button>
      <button onClick={() => console.log('// POST /api/reports/schedule', { report: reportName })}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-50 bg-white">
        <Mail size={12} /> Schedule Email
      </button>
    </div>
  );
}

// ── Month options ─────────────────────────────────────────────────────────────

const MONTHS = [
  { value: '2026-05', label: 'May 2026'   },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
];

// ── TA/DA Summary ─────────────────────────────────────────────────────────────

type ClaimStatus = 'Pending' | 'Approved' | 'Flagged';

const STATUS_STYLE: Record<ClaimStatus, string> = {
  Pending:  'bg-amber-100 text-amber-700',
  Approved: 'bg-emerald-100 text-emerald-700',
  Flagged:  'bg-red-100 text-red-700',
};

// Deviation threshold — >20% over expected distance
const EXPECTED_KM: Record<string, number> = {
  'jrn-001': 98,
  'jrn-002': 145,
  'jrn-003': 18,
  'jrn-004': 52,
};

function TADASummary() {
  const [month,    setMonth]    = useState('2026-05');
  const [statuses, setStatuses] = useState<Record<string, ClaimStatus>>({});

  const rows = useMemo(() => {
    const filteredJourneys = SEED_JOURNEYS.filter((j) => j.date.startsWith(month));

    const userMap: Record<string, {
      userId: string; name: string; role: string; employeeCode: string;
      journeyCount: number; totalKm: number; ta: number; da: number; deviations: number;
    }> = {};

    for (const j of filteredJourneys) {
      if (!userMap[j.userId]) {
        const user = MOCK_USERS.find((u) => u.id === j.userId);
        userMap[j.userId] = {
          userId: j.userId, name: j.userName, role: j.userRole,
          employeeCode: user?.employeeCode ?? '—',
          journeyCount: 0, totalKm: 0, ta: 0, da: 0, deviations: 0,
        };
      }
      const r = userMap[j.userId];
      r.journeyCount += 1;
      r.totalKm      += j.claimedDistanceKm;
      r.ta           += j.taAmount;
      r.da           += j.daAmount;

      const expected = EXPECTED_KM[j.id];
      if (expected && (j.claimedDistanceKm - expected) / expected > 0.2) {
        r.deviations += 1;
      }
    }

    return Object.values(userMap).sort((a, b) => b.totalKm - a.totalKm);
  }, [month]);

  const totalTA = rows.reduce((s, r) => s + r.ta, 0);
  const totalDA = rows.reduce((s, r) => s + r.da, 0);

  function getStatus(userId: string, deviations: number): ClaimStatus {
    if (statuses[userId]) return statuses[userId];
    return deviations > 0 ? 'Flagged' : 'Pending';
  }

  function approveAll() {
    const upd: Record<string, ClaimStatus> = {};
    rows.forEach((r) => { upd[r.userId] = 'Approved'; });
    setStatuses(upd);
    console.log('// PATCH /api/field-force/tada-claims/bulk-approve', { month });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700">
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <button onClick={approveAll}
          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          Approve All (Non-Flagged)
        </button>
        <ExportBar reportName="tada-summary" />
      </div>

      <div className="flex gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total TA</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalTA)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total DA</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalDA)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total Claim</p>
          <p className="text-lg font-bold text-emerald-700">{fmt(totalTA + totalDA)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Emp Code</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Journeys</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Total KM</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">TA</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">DA</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Total Claim</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => {
              const status = getStatus(r.userId, r.deviations);
              return (
                <tr key={r.userId} className={`hover:bg-gray-50 transition-colors ${r.deviations > 0 ? 'bg-red-50/40' : ''}`}>
                  <td className="px-3 py-2 font-medium text-gray-800">{r.name}</td>
                  <td className="px-3 py-2 text-gray-600">{r.role}</td>
                  <td className="px-3 py-2 font-mono text-gray-500">{r.employeeCode}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{r.journeyCount}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{r.totalKm}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{fmt(r.ta)}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{fmt(r.da)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(r.ta + r.da)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLE[status]}`}>
                      {status}
                      {r.deviations > 0 && status !== 'Approved' && ` (${r.deviations} dev.)`}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {status !== 'Approved' && (
                      <button
                        onClick={() => {
                          setStatuses((prev) => ({ ...prev, [r.userId]: 'Approved' }));
                          console.log('// PATCH /api/field-force/tada-claims/', r.userId, '{ status: Approved }');
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-10 text-center text-gray-400">No journeys logged for {MONTHS.find((m) => m.value === month)?.label}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Meeting Log Summary ───────────────────────────────────────────────────────

function MeetingLogSummary() {
  const [month, setMonth] = useState('2026-05');

  const rows = useMemo(() => {
    const filtered = SEED_MEETINGS.filter((m) => m.date.startsWith(month));

    const userMap: Record<string, {
      userId: string; name: string; role: string;
      farmerMeetings: number; retailerVisits: number;
      totalAttendees: number; meetingCount: number;
    }> = {};

    for (const mtg of filtered) {
      const uid = mtg.conductedByUserId;
      if (!userMap[uid]) {
        const user = MOCK_USERS.find((u) => u.id === uid);
        userMap[uid] = {
          userId: uid, name: user?.name ?? uid, role: user?.role ?? '—',
          farmerMeetings: 0, retailerVisits: 0, totalAttendees: 0, meetingCount: 0,
        };
      }
      const r = userMap[uid];
      r.meetingCount    += 1;
      r.totalAttendees  += mtg.attendeeCount;
      if (mtg.type === 'Farmer Group Meeting') r.farmerMeetings += 1;
      if (mtg.type === 'Retailer Visit')       r.retailerVisits += 1;
    }

    return Object.values(userMap).sort((a, b) => b.meetingCount - a.meetingCount);
  }, [month]);

  const totalFarmerMeetings = rows.reduce((s, r) => s + r.farmerMeetings, 0);
  const totalRetailerVisits = rows.reduce((s, r) => s + r.retailerVisits, 0);
  const totalAttendees      = rows.reduce((s, r) => s + r.totalAttendees, 0);
  const avgAttendance       = rows.reduce((s, r) => s + r.meetingCount, 0) > 0
    ? Math.round(totalAttendees / rows.reduce((s, r) => s + r.meetingCount, 0))
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700">
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <ExportBar reportName="meeting-log-summary" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Farmer Meetings</p>
          <p className="text-lg font-bold text-gray-900">{totalFarmerMeetings}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Retailer Visits</p>
          <p className="text-lg font-bold text-gray-900">{totalRetailerVisits}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Avg Attendance</p>
          <p className="text-lg font-bold text-emerald-700">{avgAttendance}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Month</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Farmer Meetings</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Retailer Visits</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Avg Attendance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => (
              <tr key={r.userId} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-800">{r.name}</td>
                <td className="px-3 py-2 text-gray-600">{r.role}</td>
                <td className="px-3 py-2 text-gray-600">{MONTHS.find((m) => m.value === month)?.label}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.farmerMeetings}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.retailerVisits}</td>
                <td className="px-3 py-2 text-right font-semibold text-gray-800">
                  {r.meetingCount > 0 ? Math.round(r.totalAttendees / r.meetingCount) : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-gray-400">No meetings logged for this month.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type SubTab = 'tada' | 'meetings';

export default function FieldForceReports() {
  const [sub, setSub] = useState<SubTab>('tada');

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([['tada', 'TA/DA Summary'], ['meetings', 'Meeting Log Summary']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              sub === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}</button>
        ))}
      </div>

      {sub === 'tada'     && <TADASummary />}
      {sub === 'meetings' && <MeetingLogSummary />}
    </div>
  );
}
