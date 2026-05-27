import { useState, useMemo } from 'react';
import { Download, FileText, Mail } from 'lucide-react';
import { MOCK_USERS } from '../../data/mockUsers';
import { SEED_JOURNEYS } from '../m11-fieldforce/JourneyLog';
import { SEED_MEETINGS } from '../m11-fieldforce/MeetingLog';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Input';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import Badge, { getStatusVariant } from '../../components/ui/Badge';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ── Export bar ────────────────────────────────────────────────────────────────

function ExportBar({ reportName }: { reportName: string }) {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <Button variant="secondary" size="sm" iconLeft={Download}
        onClick={() => console.log(`// GET /api/reports/${reportName}/csv`)}>
        CSV
      </Button>
      <Button variant="secondary" size="sm" iconLeft={FileText}
        onClick={() => console.log(`// GET /api/reports/${reportName}/pdf`)}>
        PDF
      </Button>
      <Button variant="secondary" size="sm" iconLeft={Mail}
        onClick={() => console.log('// POST /api/reports/schedule', { report: reportName })}>
        Schedule Email
      </Button>
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
        <div style={{ width: '160px' }}>
          <Select value={month} onChange={setMonth}>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
        <Button variant="primary" size="sm" onClick={approveAll}>
          Approve All (Non-Flagged)
        </Button>
        <ExportBar reportName="tada-summary" />
      </div>

      <div className="flex gap-3">
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total TA</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalTA)}</p>
        </Card>
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total DA</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalDA)}</p>
        </Card>
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total Claim</p>
          <p className="text-lg font-bold text-emerald-700">{fmt(totalTA + totalDA)}</p>
        </Card>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Emp Code</Th>
            <Th right>Journeys</Th>
            <Th right>Total KM</Th>
            <Th right>TA</Th>
            <Th right>DA</Th>
            <Th right>Total Claim</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = getStatus(r.userId, r.deviations);
            return (
              <Tr key={r.userId} className={r.deviations > 0 ? 'bg-red-50/40' : ''}>
                <Td bold>{r.name}</Td>
                <Td>{r.role}</Td>
                <Td mono muted>{r.employeeCode}</Td>
                <Td right>{r.journeyCount}</Td>
                <Td right>{r.totalKm}</Td>
                <Td right>{fmt(r.ta)}</Td>
                <Td right>{fmt(r.da)}</Td>
                <Td right bold>{fmt(r.ta + r.da)}</Td>
                <Td>
                  <Badge
                    label={`${status}${r.deviations > 0 && status !== 'Approved' ? ` (${r.deviations} dev.)` : ''}`}
                    variant={getStatusVariant(status)}
                  />
                </Td>
                <Td>
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
                </Td>
              </Tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">No journeys logged for {MONTHS.find((m) => m.value === month)?.label}.</td></tr>
          )}
        </tbody>
      </TableWrap>
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
      r.meetingCount   += 1;
      r.totalAttendees += mtg.attendeeCount;
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
        <div style={{ width: '160px' }}>
          <Select value={month} onChange={setMonth}>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
        <ExportBar reportName="meeting-log-summary" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Farmer Meetings</p>
          <p className="text-lg font-bold text-gray-900">{totalFarmerMeetings}</p>
        </Card>
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Retailer Visits</p>
          <p className="text-lg font-bold text-gray-900">{totalRetailerVisits}</p>
        </Card>
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Avg Attendance</p>
          <p className="text-lg font-bold text-emerald-700">{avgAttendance}</p>
        </Card>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Role</Th>
            <Th>Month</Th>
            <Th right>Farmer Meetings</Th>
            <Th right>Retailer Visits</Th>
            <Th right>Avg Attendance</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.userId}>
              <Td bold>{r.name}</Td>
              <Td>{r.role}</Td>
              <Td muted>{MONTHS.find((m) => m.value === month)?.label}</Td>
              <Td right>{r.farmerMeetings}</Td>
              <Td right>{r.retailerVisits}</Td>
              <Td right bold>
                {r.meetingCount > 0 ? Math.round(r.totalAttendees / r.meetingCount) : '—'}
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No meetings logged for this month.</td></tr>
          )}
        </tbody>
      </TableWrap>
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
