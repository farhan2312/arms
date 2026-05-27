import { useState, useMemo } from 'react';
import { Plus, Pencil } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SearchInput, Select } from '../../components/ui/Input';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import type { RetailerAccount, RetailerTier } from '../../types/b2b';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<RetailerTier, 'gray' | 'blue' | 'yellow' | 'purple'> = {
  Standard: 'gray',
  Silver:   'blue',
  Gold:     'yellow',
  Preferred:'purple',
};

const SALES_EXECS = MOCK_USERS.filter((u) => u.role === 'B2BSalesExecutive');

/** Retailers whose oldest unpaid invoice is past due — hardcoded from data analysis. */
const OVERDUE_IDS = new Set(['ret-001', 'ret-002', 'ret-005', 'ret-008']);

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function creditTermLabel(days: number) {
  if (days === 0) return 'Advance';
  return `${days}-Day`;
}

function availableCreditColor(pct: number): string {
  if (pct > 50) return 'text-emerald-600 font-semibold';
  if (pct >= 25) return 'text-amber-600 font-semibold';
  return 'text-red-600 font-semibold';
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  retailers: RetailerAccount[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (r: RetailerAccount) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RetailerList({ retailers, onSelect, onAdd, onEdit }: Props) {
  const [search, setSearch]           = useState('');
  const [tierFilter, setTierFilter]   = useState<RetailerTier | 'All'>('All');
  const [distFilter, setDistFilter]   = useState('All');
  const [execFilter, setExecFilter]   = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const districts = useMemo(
    () => ['All', ...Array.from(new Set(retailers.map((r) => r.address.district))).sort()],
    [retailers],
  );

  const filtered = useMemo(() => {
    return retailers.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.firmName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.gstIn.toLowerCase().includes(q);
      const matchTier   = tierFilter === 'All' || r.tier === tierFilter;
      const matchDist   = distFilter === 'All' || r.address.district === distFilter;
      const matchExec   = execFilter === 'All' || r.salesExecUserId === execFilter;
      const matchOverdue = !overdueOnly || OVERDUE_IDS.has(r.id);
      return matchSearch && matchTier && matchDist && matchExec && matchOverdue;
    });
  }, [retailers, search, tierFilter, distFilter, execFilter, overdueOnly]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-60">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search firm name, owner, GST, mobile…"
          />
        </div>
        <Button variant="primary" iconLeft={Plus} size="sm" onClick={onAdd}>
          Add Retailer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Tier pills */}
        {(['All', 'Standard', 'Silver', 'Gold', 'Preferred'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              tierFilter === t
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* District */}
        <div style={{ width: '160px' }}>
          <Select value={distFilter} onChange={setDistFilter}>
            {districts.map((d) => <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>)}
          </Select>
        </div>

        {/* Sales Exec */}
        <div style={{ width: '180px' }}>
          <Select value={execFilter} onChange={setExecFilter}>
            <option value="All">All Sales Execs</option>
            {SALES_EXECS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>

        {/* Overdue toggle */}
        <button
          onClick={() => setOverdueOnly((v) => !v)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            overdueOnly
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Overdue Only
        </button>

        <span className="ml-auto text-xs text-gray-400">{filtered.length} accounts</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <TableWrap>
          <thead>
            <tr>
              <Th>Business</Th>
              <Th>Owner</Th>
              <Th>Mobile</Th>
              <Th>District</Th>
              <Th>Tier</Th>
              <Th right>Credit Limit</Th>
              <Th right>Outstanding</Th>
              <Th right>Available</Th>
              <Th>Terms</Th>
              <Th>Sales Exec</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const available = r.creditLimitAmt - r.outstandingAmt;
              const availPct  = r.creditLimitAmt > 0 ? (available / r.creditLimitAmt) * 100 : 100;
              const exec      = r.salesExecUserId ? MOCK_USERS.find((u) => u.id === r.salesExecUserId) : undefined;
              const isOverdue = OVERDUE_IDS.has(r.id);

              return (
                <Tr
                  key={r.id}
                  className={isOverdue ? 'bg-red-50/40' : ''}
                  onClick={() => onSelect(r.id)}
                >
                  <Td>
                    <p className="font-medium text-xs leading-snug" style={{ color: 'var(--text-primary)' }}>{r.firmName}</p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.gstIn}</p>
                  </Td>
                  <Td muted>{r.ownerName}</Td>
                  <Td mono muted>{r.mobile}</Td>
                  <Td muted>{r.address.district}</Td>
                  <Td>
                    <Badge label={r.tier} variant={TIER_BADGE[r.tier]} />
                  </Td>
                  <Td right muted>{fmt(r.creditLimitAmt)}</Td>
                  <Td right>
                    <span className={r.outstandingAmt > 0 && isOverdue ? 'text-red-600 font-semibold' : ''} style={{ color: r.outstandingAmt > 0 && isOverdue ? undefined : 'var(--text-primary)' }}>
                      {fmt(r.outstandingAmt)}
                    </span>
                  </Td>
                  <Td right>
                    <span className={availableCreditColor(availPct)}>{fmt(Math.max(0, available))}</span>
                  </Td>
                  <Td muted>{creditTermLabel(r.creditDays)}</Td>
                  <Td muted>{exec?.name ?? '—'}</Td>
                  <Td>
                    {isOverdue
                      ? <Badge label="Overdue" variant="red" />
                      : r.isActive
                        ? <Badge label="Active" variant="green" />
                        : <Badge label="Inactive" variant="gray" />
                    }
                  </Td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit(r)}
                      className="text-gray-300 hover:text-emerald-600 transition-colors"
                      title="Edit retailer"
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                </Tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-400">
                  No retailer accounts match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}
