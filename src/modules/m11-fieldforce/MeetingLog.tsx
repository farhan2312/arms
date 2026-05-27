// Meeting Log — Farmer group meetings and retailer visits
// POST /api/field-force/meetings when backend ready

import { useState, useMemo } from 'react';
import {
  Users, MapPin, ClipboardList,
  Calendar, ChevronDown,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { MOCK_USERS } from '../../data/mockUsers';
import { useAuth } from '../../context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type MeetingType = 'Farmer Group Meeting' | 'Retailer Visit' | 'Team Meeting' | 'Campaign Activity' | 'Demonstration';

interface Meeting {
  id: string;
  date: string;
  type: MeetingType;
  locationLabel: string;
  conductedByUserId: string;
  attendeeCount: number;
  outcomeNotes: string;
  submittedAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MEETING_TYPES: MeetingType[] = [
  'Farmer Group Meeting', 'Retailer Visit', 'Team Meeting', 'Campaign Activity', 'Demonstration',
];

// Field-facing users who can log meetings
const FIELD_USERS = MOCK_USERS.filter(u =>
  ['BDM', 'B2BSalesExecutive', 'FieldAgent', 'OperationsHead', 'Admin'].includes(u.role),
);

const TYPE_STYLE: Record<MeetingType, { bg: string; text: string; dot: string }> = {
  'Farmer Group Meeting':  { bg: 'bg-green-100',  text: 'text-green-700',  dot: '#22c55e' },
  'Retailer Visit':        { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: '#3b82f6' },
  'Team Meeting':          { bg: 'bg-purple-100', text: 'text-purple-700', dot: '#a855f7' },
  'Campaign Activity':     { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: '#f59e0b' },
  'Demonstration':         { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: '#14b8a6' },
};

// ── Seed meetings ─────────────────────────────────────────────────────────────

const SEED_MEETINGS: Meeting[] = [
  {
    id: 'mtg-001', date: '2026-05-10', type: 'Farmer Group Meeting',
    locationLabel: 'Shirpur Village, Akola', conductedByUserId: 'usr-005',
    attendeeCount: 42,
    outcomeNotes: 'Demonstrated BT Cotton seed varieties for Kharif 2026. Distributed product comparison sheets. 18 farmers expressed interest in pre-booking.',
    submittedAt: '2026-05-10T17:30:00Z',
  },
  {
    id: 'mtg-002', date: '2026-05-13', type: 'Retailer Visit',
    locationLabel: 'Vidarbha Agro Inputs – Akola', conductedByUserId: 'usr-005',
    attendeeCount: 3,
    outcomeNotes: 'Discussed Q2 order volumes. Retailer requested 20% credit increase — flagged for Finance. Agreed on monthly order cycle.',
    submittedAt: '2026-05-13T14:00:00Z',
  },
  {
    id: 'mtg-003', date: '2026-05-16', type: 'Campaign Activity',
    locationLabel: 'Dighori Gaon, Nagpur', conductedByUserId: 'usr-006',
    attendeeCount: 28,
    outcomeNotes: 'Soil health awareness drive. 28 soil samples collected for testing. Partnership with ICAR Nagpur confirmed for follow-up results.',
    submittedAt: '2026-05-16T16:45:00Z',
  },
  {
    id: 'mtg-004', date: '2026-05-19', type: 'Retailer Visit',
    locationLabel: 'Wardha Krishi Seva Kendra', conductedByUserId: 'usr-005',
    attendeeCount: 2,
    outcomeNotes: 'Reviewed slow-moving Boron stock. Offered display promotion support. Retailer agreed to feature Seaweed Extract in window display.',
    submittedAt: '2026-05-19T12:30:00Z',
  },
  {
    id: 'mtg-005', date: '2026-05-21', type: 'Farmer Group Meeting',
    locationLabel: 'Kazipet, Hanamkonda', conductedByUserId: 'usr-007',
    attendeeCount: 65,
    outcomeNotes: 'Kharif season planning session. Discussed paddy varieties and NPK requirements. 40+ farmers enrolled in loyalty programme on-site.',
    submittedAt: '2026-05-21T18:00:00Z',
  },
  {
    id: 'mtg-006', date: '2026-05-23', type: 'Demonstration',
    locationLabel: 'Kondha Farm, Wardha', conductedByUserId: 'usr-006',
    attendeeCount: 15,
    outcomeNotes: 'Live demonstration of Seaweed Extract foliar spray on cotton crop. Compared with control plots. Follow-up visit scheduled for 14-day assessment.',
    submittedAt: '2026-05-23T15:00:00Z',
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function MeetingLog() {
  const { currentUser } = useAuth();
  const toast = useToast();

  // Form state
  const [date,        setDate]        = useState('2026-05-26');
  const [type,        setType]        = useState<MeetingType>('Farmer Group Meeting');
  const [location,    setLocation]    = useState('');
  const [conductedBy, setConductedBy] = useState(currentUser.id);
  const [attendees,   setAttendees]   = useState<number | ''>('');
  const [notes,       setNotes]       = useState('');
  const [errors,      setErrors]      = useState<string[]>([]);

  const [meetings, setMeetings] = useState<Meeting[]>(SEED_MEETINGS);

  // Feed filters
  const [filterUser,   setFilterUser]   = useState('All');
  const [filterType,   setFilterType]   = useState<MeetingType | 'All'>('All');
  const [filterFrom,   setFilterFrom]   = useState('');
  const [filterTo,     setFilterTo]     = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [showFilters,  setShowFilters]  = useState(false);

  // Filtered meetings
  const filtered = useMemo(() => {
    return meetings
      .filter(m => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !searchQuery || m.locationLabel.toLowerCase().includes(q) || m.outcomeNotes.toLowerCase().includes(q);
        const matchUser = filterUser === 'All' || m.conductedByUserId === filterUser;
        const matchType = filterType === 'All' || m.type === filterType;
        const matchFrom = !filterFrom || m.date >= filterFrom;
        const matchTo   = !filterTo   || m.date <= filterTo;
        return matchSearch && matchUser && matchType && matchFrom && matchTo;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [meetings, searchQuery, filterUser, filterType, filterFrom, filterTo]);

  function validate(): string[] {
    const errs: string[] = [];
    if (!location.trim())     errs.push('Location / village name is required.');
    if (!attendees || attendees <= 0) errs.push('Attendee count must be > 0.');
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    const meeting: Meeting = {
      id:                 `mtg-new-${Date.now()}`,
      date,
      type,
      locationLabel:      location,
      conductedByUserId:  conductedBy,
      attendeeCount:      attendees as number,
      outcomeNotes:       notes,
      submittedAt:        new Date().toISOString(),
    };

    // POST /api/field-force/meetings when backend ready
    console.log('// POST /api/field-force/meetings', meeting);

    setMeetings(prev => [meeting, ...prev]);
    toast.success(`Meeting logged — ${type} at ${location} (${attendees} attendees).`);

    // Reset
    setLocation(''); setAttendees(''); setNotes('');
  }

  const userName = (id: string) => FIELD_USERS.find(u => u.id === id)?.name ?? id;

  // Stats
  const totalAttendees = meetings.reduce((s, m) => s + m.attendeeCount, 0);
  const farmerMeetings = meetings.filter(m => m.type === 'Farmer Group Meeting').length;

  return (
    <div className="space-y-5">

      {/* ── Quick stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Meetings (May)</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{meetings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Farmer Sessions</p>
          <p className="text-2xl font-bold text-green-700 mt-0.5">{farmerMeetings}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Total Attendees</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalAttendees.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* ── Log form ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <ClipboardList size={14} className="text-emerald-600" /> Log a Meeting
        </h3>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
            {errors.map((e, i) => <p key={i} className="text-xs text-red-700">• {e}</p>)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

          {/* Date */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>

          {/* Meeting type */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Type</label>
            <div className="relative">
              <select value={type} onChange={e => setType(e.target.value as MeetingType)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Location / Village <span className="text-red-500">*</span>
            </label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Shirpur Village, Akola"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
          </div>

          {/* Conducted by */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Conducted By</label>
            <div className="relative">
              <select value={conductedBy} onChange={e => setConductedBy(e.target.value)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                {FIELD_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Attendee count */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Attendee Count <span className="text-red-500">*</span>
            </label>
            <input type="number" min={1} value={attendees} onChange={e => setAttendees(parseInt(e.target.value) || '')}
              placeholder="0"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white tabular-nums" />
          </div>
        </div>

        {/* Outcome notes */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Outcome Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Key outcomes, follow-up actions, products discussed…"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-none" />
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSubmit}>
            Save Meeting
          </Button>
        </div>
      </div>

      {/* ── Meeting feed ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Meeting Feed</h3>
            <button onClick={() => setShowFilters(v => !v)}
              className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                showFilters ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              Filters {(filterUser !== 'All' || filterType !== 'All' || filterFrom || filterTo) && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center">!</span>
              )}
            </button>
          </div>

          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search location or outcome notes…"
          />

          {showFilters && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
              {/* User filter */}
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">User</label>
                <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="All">All users</option>
                  {FIELD_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              {/* Type filter */}
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value as MeetingType | 'All')}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="All">All types</option>
                  {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Date from */}
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">From</label>
                <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
              </div>
              {/* Date to */}
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-1">To</label>
                <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
              </div>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <Users size={22} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No meetings match the current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(m => {
              const style = TYPE_STYLE[m.type];
              const conductor = MOCK_USERS.find(u => u.id === m.conductedByUserId);
              return (
                <div key={m.id} className="px-5 py-4 hover:bg-gray-50/40 transition-colors">
                  {/* Meeting header */}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: style.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                          {m.type}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={10} /> {m.date}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Users size={10} /> {m.attendeeCount} attendees
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                        <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                        {m.locationLabel}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Conducted by <span className="font-medium text-gray-700">{userName(m.conductedByUserId)}</span>
                        {conductor && <span className="text-gray-400"> · {conductor.role}</span>}
                      </p>
                      {m.outcomeNotes && (
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{m.outcomeNotes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-400">
          {filtered.length} of {meetings.length} meetings shown
        </div>
      </div>
    </div>
  );
}

export { SEED_MEETINGS };
