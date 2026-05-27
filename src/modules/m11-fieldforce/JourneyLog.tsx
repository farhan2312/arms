// Journey Log — BDM / B2BSalesExecutive / FieldAgent
// POST /api/field-force/journeys when backend ready

import { useState, useMemo } from 'react';
import {
  Plus, Car, Bike, Train, Bus,
  MapPin, Coins,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import { useToast } from '../../hooks/useToast';
import { mockStores } from '../../data/mockStores';
import { mockRetailers } from '../../data/mockRetailers';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/roles';

// ── Config ────────────────────────────────────────────────────────────────────

const TA_RATE: Partial<Record<UserRole, number>> = {
  OperationsHead:      15,
  BDM:                 12,
  B2BSalesExecutive:   10,
  FieldAgent:           8,
};
const TA_RATE_DEFAULT = 6;

const DA_RATE: Partial<Record<UserRole, number>> = {
  OperationsHead:      800,
  BDM:                 600,
  B2BSalesExecutive:   500,
  FieldAgent:          350,
};
const DA_RATE_DEFAULT = 300;

type TransportMode = 'Two-Wheeler' | 'Car (Self)' | 'Car (Company)' | 'Train' | 'Bus' | 'Auto / Cab';

const TRANSPORT_MODES: TransportMode[] = [
  'Two-Wheeler', 'Car (Self)', 'Car (Company)', 'Train', 'Bus', 'Auto / Cab',
];

const PURPOSES = [
  'Retailer Visit', 'Farmer Group Meeting', 'Store Audit',
  'Distribution Review', 'Market Survey', 'Other',
];

const MODE_ICON: Record<TransportMode, typeof Car> = {
  'Two-Wheeler':   Bike,
  'Car (Self)':    Car,
  'Car (Company)': Car,
  'Train':         Train,
  'Bus':           Bus,
  'Auto / Cab':    Car,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Journey {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  date: string;
  from: string;
  to: string;
  mode: TransportMode;
  claimedDistanceKm: number;
  purpose: string;
  visitedStoreIds: string[];
  visitedRetailerIds: string[];
  nightsAwayFromHQ: number;
  taAmount: number;
  daAmount: number;
  totalClaim: number;
  submittedAt: string;
}

// ── Seed journeys (current-month entries for the logged-in BDM) ───────────────

const SEED_JOURNEYS: Journey[] = [
  {
    id: 'jrn-001', userId: 'usr-005', userName: 'Vikram Deshmukh', userRole: 'BDM',
    date: '2026-05-12', from: 'Akola HQ', to: 'Amravati', mode: 'Car (Self)',
    claimedDistanceKm: 120, purpose: 'Store Audit',
    visitedStoreIds: ['str-amr-002'], visitedRetailerIds: ['ret-003'],
    nightsAwayFromHQ: 2, taAmount: 1440, daAmount: 1200, totalClaim: 2640,
    submittedAt: '2026-05-12T18:00:00Z',
  },
  {
    id: 'jrn-002', userId: 'usr-005', userName: 'Vikram Deshmukh', userRole: 'BDM',
    date: '2026-05-18', from: 'Amravati', to: 'Nagpur', mode: 'Car (Self)',
    claimedDistanceKm: 140, purpose: 'Distribution Review',
    visitedStoreIds: ['str-ngp-003'], visitedRetailerIds: ['ret-001', 'ret-002'],
    nightsAwayFromHQ: 1, taAmount: 1680, daAmount: 600, totalClaim: 2280,
    submittedAt: '2026-05-18T19:00:00Z',
  },
  {
    id: 'jrn-003', userId: 'usr-007', userName: 'Kavitha Reddy', userRole: 'B2BSalesExecutive',
    date: '2026-05-20', from: 'Warangal', to: 'Hanamkonda Market', mode: 'Two-Wheeler',
    claimedDistanceKm: 25, purpose: 'Retailer Visit',
    visitedStoreIds: [], visitedRetailerIds: ['ret-005', 'ret-006'],
    nightsAwayFromHQ: 0, taAmount: 250, daAmount: 0, totalClaim: 250,
    submittedAt: '2026-05-20T17:00:00Z',
  },
  {
    id: 'jrn-004', userId: 'usr-006', userName: 'Santosh Pawar', userRole: 'FieldAgent',
    date: '2026-05-15', from: 'Akola', to: 'Patur', mode: 'Two-Wheeler',
    claimedDistanceKm: 55, purpose: 'Farmer Group Meeting',
    visitedStoreIds: ['str-akl-001'], visitedRetailerIds: [],
    nightsAwayFromHQ: 0, taAmount: 440, daAmount: 0, totalClaim: 440,
    submittedAt: '2026-05-15T16:00:00Z',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function taRate(role: UserRole) { return TA_RATE[role] ?? TA_RATE_DEFAULT; }
function daRate(role: UserRole) { return DA_RATE[role] ?? DA_RATE_DEFAULT; }

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JourneyLog() {
  const { currentUser } = useAuth();
  const role = currentUser.role;
  const toast = useToast();

  // Form state
  const [date,       setDate]       = useState('2026-05-26');
  const [from,       setFrom]       = useState('');
  const [to,         setTo]         = useState('');
  const [mode,       setMode]       = useState<TransportMode>('Two-Wheeler');
  const [km,         setKm]         = useState<number | ''>('');
  const [purpose,    setPurpose]    = useState(PURPOSES[0]);
  const [storeIds,   setStoreIds]   = useState<Set<string>>(new Set());
  const [retailIds,  setRetailIds]  = useState<Set<string>>(new Set());
  const [nights,     setNights]     = useState(0);
  const [errors,     setErrors]     = useState<string[]>([]);

  const [journeys,   setJourneys]   = useState<Journey[]>(SEED_JOURNEYS);

  // Computed TA / DA for live preview
  const taAmt  = typeof km === 'number' ? km * taRate(role) : 0;
  const daAmt  = nights * daRate(role);
  const total  = taAmt + daAmt;

  function toggleStore(id: string) {
    setStoreIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }
  function toggleRetailer(id: string) {
    setRetailIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!from.trim())    errs.push('From location is required.');
    if (!to.trim())      errs.push('To location is required.');
    if (!km || km <= 0)  errs.push('Distance must be > 0 km.');
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    const journey: Journey = {
      id:                  `jrn-new-${Date.now()}`,
      userId:              currentUser.id,
      userName:            currentUser.name,
      userRole:            role,
      date,
      from, to, mode,
      claimedDistanceKm:   km as number,
      purpose,
      visitedStoreIds:     [...storeIds],
      visitedRetailerIds:  [...retailIds],
      nightsAwayFromHQ:    nights,
      taAmount:            taAmt,
      daAmount:            daAmt,
      totalClaim:          total,
      submittedAt:         new Date().toISOString(),
    };

    // POST /api/field-force/journeys when backend ready
    console.log('// POST /api/field-force/journeys', journey);

    setJourneys(prev => [journey, ...prev]);
    toast.success(`Journey logged. TA: ${fmt(taAmt)} · DA: ${fmt(daAmt)} · Total: ${fmt(total)}`);

    // Reset
    setFrom(''); setTo(''); setKm(''); setNights(0);
    setStoreIds(new Set()); setRetailIds(new Set());
  }

  // Filter journeys to current user (for non-admin roles, show own only)
  const myJourneys = useMemo(() =>
    journeys.filter(j => j.userId === currentUser.id || ['Admin', 'SuperAdmin', 'OperationsHead'].includes(role))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [journeys, currentUser.id, role],
  );

  const ModeIcon = MODE_ICON[mode];

  return (
    <div className="space-y-5">

      {/* ── Rate info strip ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
        <Coins size={13} className="text-blue-500 flex-shrink-0" />
        <span>
          Your rates — TA: <strong className="text-gray-700">₹{taRate(role)}/km</strong> ·
          DA: <strong className="text-gray-700">₹{daRate(role)}/night</strong> ·
          Role: <strong className="text-gray-700">{role}</strong>
        </span>
      </div>

      {/* ── Errors ───────────────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
          {errors.map((e, i) => <p key={i} className="text-xs text-red-700">• {e}</p>)}
        </div>
      )}

      {/* ── Journey form ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Plus size={14} className="text-emerald-600" /> Log a Journey
        </h3>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

          {/* Date */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>

          {/* From */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              From <span className="text-red-500">*</span>
            </label>
            <input value={from} onChange={e => setFrom(e.target.value)} placeholder="e.g. Akola HQ"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>

          {/* To */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              To <span className="text-red-500">*</span>
            </label>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="e.g. Amravati"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>

          {/* Mode */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Transport Mode
            </label>
            <select value={mode} onChange={e => setMode(e.target.value as TransportMode)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              {TRANSPORT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Distance (km) <span className="text-red-500">*</span>
            </label>
            <input type="number" min={1} value={km} onChange={e => setKm(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder="0"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white tabular-nums" />
          </div>

          {/* Nights away */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Nights Away (DA)
            </label>
            <input type="number" min={0} max={14} value={nights} onChange={e => setNights(parseInt(e.target.value) || 0)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white tabular-nums" />
          </div>

          {/* Purpose */}
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Purpose
            </label>
            <select value={purpose} onChange={e => setPurpose(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Visited places multi-select */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Stores */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Stores Visited
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {mockStores.map(s => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={storeIds.has(s.id)} onChange={() => toggleStore(s.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-xs text-gray-700">{s.name.replace('Bharat Agri Store – ', '')}</span>
                  <span className="ml-auto text-[10px] text-gray-400 font-mono">{s.code}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Retailers */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Retailers Visited
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-[168px] overflow-y-auto">
              {mockRetailers.map(r => (
                <label key={r.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={retailIds.has(r.id)} onChange={() => toggleRetailer(r.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-xs text-gray-700 truncate">{r.firmName.replace(/ (Pvt Ltd|Ltd\.?)$/i, '')}</span>
                  <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">{r.address.district}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Live TA/DA preview + submit */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <ModeIcon size={13} className="text-gray-400" />
              <span className="text-gray-500">TA:</span>
              <span className="font-bold text-gray-800">{fmt(taAmt)}</span>
              <span className="text-gray-400">({km || 0} km × ₹{taRate(role)})</span>
            </div>
            <div>
              <span className="text-gray-500">DA:</span>
              <span className="font-bold text-gray-800 ml-1">{fmt(daAmt)}</span>
              <span className="text-gray-400 ml-1">({nights} night{nights !== 1 ? 's' : ''} × ₹{daRate(role)})</span>
            </div>
            <div className="text-base font-bold text-emerald-700">
              = {fmt(total)}
            </div>
          </div>
          <Button variant="primary" onClick={handleSubmit}>
            Submit Journey
          </Button>
        </div>
      </div>

      {/* ── Journey history ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Journey History</h3>
          <span className="text-[11px] text-gray-400">{myJourneys.length} entries · May 2026</span>
        </div>

        {myJourneys.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400">No journeys logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Route</Th>
                  <Th>Mode</Th>
                  <Th>Purpose</Th>
                  <Th right>KM</Th>
                  <Th right>TA</Th>
                  <Th right>DA</Th>
                  <Th right>Total</Th>
                </tr>
              </thead>
              <tbody>
                {myJourneys.map(j => {
                  const Icon = MODE_ICON[j.mode];
                  const visitCount = j.visitedStoreIds.length + j.visitedRetailerIds.length;
                  return (
                    <Tr key={j.id}>
                      <Td mono muted>{j.date}</Td>
                      <Td>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <MapPin size={9} className="text-gray-400" />
                          {j.from} → {j.to}
                        </p>
                        {visitCount > 0 && (
                          <p className="text-gray-400 mt-0.5 text-[11px]">
                            {visitCount} stop{visitCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Icon size={11} className="text-gray-400" />
                          {j.mode}
                        </span>
                      </Td>
                      <Td muted>{j.purpose}</Td>
                      <Td right mono bold>{j.claimedDistanceKm}</Td>
                      <Td right mono>{fmt(j.taAmount)}</Td>
                      <Td right mono muted>{j.daAmount > 0 ? fmt(j.daAmount) : '—'}</Td>
                      <Td right mono bold>{fmt(j.totalClaim)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-gray-600">Total (visible)</td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-800 tabular-nums">
                    {myJourneys.reduce((s, j) => s + j.claimedDistanceKm, 0)} km
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-800 tabular-nums">
                    {fmt(myJourneys.reduce((s, j) => s + j.taAmount, 0))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-800 tabular-nums">
                    {fmt(myJourneys.reduce((s, j) => s + j.daAmount, 0))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-emerald-700 tabular-nums">
                    {fmt(myJourneys.reduce((s, j) => s + j.totalClaim, 0))}
                  </td>
                </tr>
              </tfoot>
            </TableWrap>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Exported rate helpers for TADASummary ─────────────────────────────────────
export { taRate, daRate, type Journey, TA_RATE, DA_RATE, SEED_JOURNEYS };
