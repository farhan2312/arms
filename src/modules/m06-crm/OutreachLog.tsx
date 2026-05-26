// Outreach Log — log village visits, view timeline, see purchase-conversion stats
// POST /api/outreach/logs when backend ready

import { useState, useMemo } from 'react';
import { Plus, Users, MapPin, CheckCircle2, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { MOCK_USERS } from '../../data/mockUsers';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import type { Farmer } from '../../types/entities';

// ── Shared types (imported by CRMPage and FarmerProfile) ─────────────────────

export interface FarmerOutcome {
  farmerId: string;
  notes: string;
}

export interface OutreachEntry {
  id: string;
  date: string;            // YYYY-MM-DD
  village: string;
  taluka: string;
  conductedByUserId: string;
  farmerOutcomes: FarmerOutcome[];
  createdAt: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_OUTREACH: OutreachEntry[] = [
  {
    id: 'out-001',
    date: '2026-05-10',
    village: 'Shirpur',
    taluka: 'Akola',
    conductedByUserId: 'usr-006',
    farmerOutcomes: [
      { farmerId: 'fmr-001', notes: 'Discussed Bt cotton variety selection for kharif season. Farmer interested in resistance management.' },
      { farmerId: 'fmr-004', notes: 'Recommended pre-sowing fertiliser application. Farmer agreed to trial recommended dose.' },
    ],
    createdAt: '2026-05-10T16:00:00Z',
  },
  {
    id: 'out-002',
    date: '2026-05-15',
    village: 'Wardhi',
    taluka: 'Amravati',
    conductedByUserId: 'usr-006',
    farmerOutcomes: [
      { farmerId: 'fmr-006', notes: 'Promoted soybean + pesticide bundle offer. Farmer plans to visit store this week.' },
      { farmerId: 'fmr-007', notes: 'Crop health check — minor leaf curl observed. Advised micronutrient foliar spray.' },
    ],
    createdAt: '2026-05-15T17:00:00Z',
  },
  {
    id: 'out-003',
    date: '2026-04-28',
    village: 'Kazipet',
    taluka: 'Hanamkonda',
    conductedByUserId: 'usr-007',
    farmerOutcomes: [
      { farmerId: 'fmr-014', notes: 'Paddy harvest planning — reminded about post-harvest soil treatment schedule.' },
      { farmerId: 'fmr-015', notes: 'First visit — introduced loyalty programme and store benefits. Farmer registered.' },
    ],
    createdAt: '2026-04-28T14:30:00Z',
  },
  {
    id: 'out-004',
    date: '2026-05-20',
    village: 'Dighori',
    taluka: 'Nagpur',
    conductedByUserId: 'usr-005',
    farmerOutcomes: [
      { farmerId: 'fmr-009', notes: 'Orange orchard visit — discussed micro-irrigation and drip fertigation.' },
      { farmerId: 'fmr-010', notes: 'Soil health awareness — collected sample for testing. Follow-up scheduled.' },
    ],
    createdAt: '2026-05-20T18:00:00Z',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const FIELD_ROLES = new Set(['BDM', 'FieldAgent', 'B2BSalesExecutive', 'StoreIncharge']);
const FIELD_USERS = MOCK_USERS.filter(u => FIELD_ROLES.has(u.role));
const userById = new Map(MOCK_USERS.map(u => [u.id, u]));

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  farmers: Farmer[];
  outreachLogs: OutreachEntry[];
  onAddLog: (entry: OutreachEntry) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OutreachLog({ farmers, outreachLogs, onAddLog }: Props) {
  // Form state
  const [date, setDate] = useState('2026-05-27');
  const [village, setVillage] = useState('');
  const [taluka, setTaluka] = useState('');
  const [conductedBy, setConductedBy] = useState(FIELD_USERS[0]?.id ?? '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Farmers eligible for this outreach (filter by taluka if provided)
  const eligibleFarmers = useMemo(
    () =>
      taluka.trim()
        ? farmers.filter(f => (f.address.taluka ?? '').toLowerCase().includes(taluka.trim().toLowerCase()))
        : farmers,
    [farmers, taluka],
  );

  function toggleFarmer(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function handleSubmit() {
    if (!date || !village.trim() || !taluka.trim() || selectedIds.length === 0) return;
    const entry: OutreachEntry = {
      id: `out-${Date.now()}`,
      date,
      village: village.trim(),
      taluka: taluka.trim(),
      conductedByUserId: conductedBy,
      farmerOutcomes: selectedIds.map(id => ({ farmerId: id, notes: notes[id] ?? '' })),
      createdAt: new Date().toISOString(),
    };
    onAddLog(entry);
    setDate('2026-05-27');
    setVillage('');
    setTaluka('');
    setSelectedIds([]);
    setNotes({});
    setShowForm(false);
    console.log('// POST /api/outreach/logs', entry);
  }

  // Conversion stats per log
  function conversionCount(log: OutreachEntry): number {
    const cutoff = addDays(log.date, 30);
    return log.farmerOutcomes.filter(({ farmerId }) =>
      mockSaleTransactions.some(
        t => t.farmerId === farmerId && t.invoiceDate >= log.date && t.invoiceDate <= cutoff,
      ),
    ).length;
  }

  const sortedLogs = useMemo(
    () => [...outreachLogs].sort((a, b) => b.date.localeCompare(a.date)),
    [outreachLogs],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Outreach Visits</h2>
          <p className="text-xs text-gray-500 mt-0.5">{outreachLogs.length} visits logged</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={13} />
          Log Visit
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">New Outreach Visit</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Conducted By</label>
              <select value={conductedBy} onChange={e => setConductedBy(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {FIELD_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Village</label>
              <input value={village} onChange={e => setVillage(e.target.value)} placeholder="e.g. Shirpur"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Taluka <span className="text-gray-400 font-normal">(filters farmer list)</span></label>
              <input value={taluka} onChange={e => setTaluka(e.target.value)} placeholder="e.g. Akola"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          {/* Farmer multi-select */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Farmers Contacted
              {taluka.trim() && <span className="text-gray-400 ml-1">· filtered by taluka "{taluka}"</span>}
            </label>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {eligibleFarmers.length === 0 && (
                <p className="px-3 py-3 text-xs text-gray-400">No farmers match this taluka.</p>
              )}
              {eligibleFarmers.map(f => {
                const checked = selectedIds.includes(f.id);
                return (
                  <div key={f.id} className="px-3 py-2.5">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggleFarmer(f.id)}
                        className="mt-0.5 accent-emerald-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{f.name}</p>
                        <p className="text-xs text-gray-400">{f.address.village}, {f.address.taluka}</p>
                        {checked && (
                          <textarea
                            value={notes[f.id] ?? ''}
                            onChange={e => setNotes(prev => ({ ...prev, [f.id]: e.target.value }))}
                            placeholder="Outcome notes for this farmer…"
                            rows={2}
                            className="mt-2 w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                          />
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)}
              className="px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit}
              disabled={!date || !village.trim() || !taluka.trim() || selectedIds.length === 0}
              className="px-4 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
              Save Visit
            </button>
          </div>
        </div>
      )}

      {/* Conversion report */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-blue-600" />
          <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Outreach → Purchase Conversion (30-day window)</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sortedLogs.slice(0, 4).map(log => {
            const total = log.farmerOutcomes.length;
            const converted = conversionCount(log);
            const pct = total > 0 ? Math.round((converted / total) * 100) : 0;
            return (
              <div key={log.id} className="bg-white rounded-lg border border-blue-100 p-3">
                <p className="text-[10px] text-gray-500 truncate">{log.village} · {fmtDate(log.date)}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{pct}%</p>
                <p className="text-[10px] text-gray-400">{converted}/{total} farmers purchased</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline feed */}
      <div className="space-y-3">
        {sortedLogs.map(log => {
          const conductor = userById.get(log.conductedByUserId);
          const isExpanded = expandedIds.has(log.id);
          const converted = conversionCount(log);
          const total = log.farmerOutcomes.length;

          return (
            <div key={log.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setExpandedIds(prev => {
                  const next = new Set(prev);
                  isExpanded ? next.delete(log.id) : next.add(log.id);
                  return next;
                })}
                className="w-full px-5 py-4 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{log.village}, {log.taluka}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDate(log.date)} · {conductor?.name ?? log.conductedByUserId}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <Users size={11} /> {total} farmers
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 size={11} /> {converted} purchased within 30d
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {log.farmerOutcomes.map(({ farmerId, notes: n }) => {
                    const farmer = farmers.find(f => f.id === farmerId);
                    const purchased = mockSaleTransactions.some(
                      t => t.farmerId === farmerId && t.invoiceDate >= log.date && t.invoiceDate <= addDays(log.date, 30),
                    );
                    return (
                      <div key={farmerId} className="px-5 py-3 flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${purchased ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800">{farmer?.name ?? farmerId}</p>
                          {n && <p className="text-xs text-gray-500 mt-0.5">{n}</p>}
                          {purchased && <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Purchased within 30 days</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
