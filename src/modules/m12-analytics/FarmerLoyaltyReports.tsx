import { useState, useMemo } from 'react';
import { Download, FileText, Mail } from 'lucide-react';
import { mockFarmers } from '../../data/mockFarmers';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockLoyaltyWallets } from '../../data/mockLoyaltyWallets';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { getTierVariant } from '../../components/ui/Badge';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

type LoyaltyTier = 'Green' | 'Silver' | 'Gold' | 'Platinum';

const walletByFarmerId = new Map(mockLoyaltyWallets.map((w) => [w.farmerId, w]));

// Build per-farmer spend totals and visit counts from sale transactions
interface FarmerStats {
  farmerId: string;
  totalSpend: number;
  totalVisits: number;
  lastPurchaseDate: string;
}

const farmerStats: FarmerStats[] = (() => {
  const map: Record<string, FarmerStats> = {};
  for (const txn of mockSaleTransactions) {
    if (!map[txn.farmerId]) {
      map[txn.farmerId] = { farmerId: txn.farmerId, totalSpend: 0, totalVisits: 0, lastPurchaseDate: '' };
    }
    map[txn.farmerId].totalSpend     += txn.totalAmt;
    map[txn.farmerId].totalVisits    += 1;
    if (!map[txn.farmerId].lastPurchaseDate || txn.invoiceDate > map[txn.farmerId].lastPurchaseDate) {
      map[txn.farmerId].lastPurchaseDate = txn.invoiceDate;
    }
  }
  return Object.values(map);
})();

const farmerStatsById = new Map(farmerStats.map((s) => [s.farmerId, s]));

// ── Export bar (shared) ───────────────────────────────────────────────────────

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

// ── Farmer Lifetime Value ─────────────────────────────────────────────────────

type LTVSort = 'spend' | 'visits' | 'basket' | 'points';

function FarmerLTV() {
  const [sortBy, setSortBy] = useState<LTVSort>('spend');

  const rows = useMemo(() => {
    return mockFarmers
      .map((f) => {
        const stats  = farmerStatsById.get(f.id);
        const wallet = walletByFarmerId.get(f.id);
        const totalSpend  = stats?.totalSpend ?? 0;
        const totalVisits = stats?.totalVisits ?? 0;
        const avgBasket   = totalVisits > 0 ? totalSpend / totalVisits : 0;
        return {
          farmer:        f,
          tier:          (wallet?.tier ?? 'Green') as LoyaltyTier,
          totalSpend,
          totalVisits,
          avgBasket,
          lastPurchase:  stats?.lastPurchaseDate ?? '—',
          pointsBalance: wallet?.currentPoints ?? 0,
        };
      })
      .sort((a, b) => {
        if (sortBy === 'spend')  return b.totalSpend  - a.totalSpend;
        if (sortBy === 'visits') return b.totalVisits - a.totalVisits;
        if (sortBy === 'basket') return b.avgBasket   - a.avgBasket;
        return b.pointsBalance - a.pointsBalance;
      });
  }, [sortBy]);

  function SortBtn({ id, label }: { id: LTVSort; label: string }) {
    return (
      <button onClick={() => setSortBy(id)}
        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
          sortBy === id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}>{label}</button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          <SortBtn id="spend"  label="By Spend" />
          <SortBtn id="visits" label="By Visits" />
          <SortBtn id="basket" label="By Avg Basket" />
          <SortBtn id="points" label="By Points" />
        </div>
        <ExportBar reportName="farmer-ltv" />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Farmer</Th>
            <Th>Mobile</Th>
            <Th>Tier</Th>
            <Th right>Total Spend</Th>
            <Th right>Visits</Th>
            <Th right>Avg Basket</Th>
            <Th>Last Purchase</Th>
            <Th right>Points</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <Tr key={r.farmer.id}>
              <Td muted>{i + 1}</Td>
              <Td>
                <p className="font-medium text-gray-800">{r.farmer.name}</p>
                <p className="text-xs text-gray-400">{r.farmer.address.village}, {r.farmer.address.district}</p>
              </Td>
              <Td>{r.farmer.mobile}</Td>
              <Td>
                <Badge label={r.tier} variant={getTierVariant(r.tier)} />
              </Td>
              <Td right bold>{r.totalSpend > 0 ? fmt(r.totalSpend) : '—'}</Td>
              <Td right>{r.totalVisits}</Td>
              <Td right>{r.avgBasket > 0 ? fmt(r.avgBasket) : '—'}</Td>
              <Td muted>{r.lastPurchase}</Td>
              <Td right>
                <span className={`font-semibold ${r.pointsBalance > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {r.pointsBalance.toLocaleString('en-IN')}
                </span>
              </Td>
            </Tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Tier Movement Report ──────────────────────────────────────────────────────

// Simulated tier movement data (in production: derived from wallet audit log)
const TIER_MOVEMENTS = [
  { farmerId: 'fmr-001', farmerName: 'Suresh Vitthal Patil',  from: 'Gold',   to: 'Platinum', date: '2026-03-15', qualifyingSpend: 182000 },
  { farmerId: 'fmr-006', farmerName: 'Dilip Mahadeo Gawande', from: 'Silver', to: 'Gold',     date: '2026-02-10', qualifyingSpend: 98000  },
  { farmerId: 'fmr-009', farmerName: 'Priya Ashok Nimkar',    from: 'Green',  to: 'Silver',   date: '2026-04-22', qualifyingSpend: 44500  },
  { farmerId: 'fmr-007', farmerName: 'Anand Prakash Shende',  from: 'Silver', to: 'Green',    date: '2026-01-05', qualifyingSpend: 0, downgrade: true },
];

function TierMovement() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo,   setDateTo]   = useState('2026-05-27');

  const rows = TIER_MOVEMENTS.filter((m) => m.date >= dateFrom && m.date <= dateTo);
  const upgrades   = rows.filter((m) => !m.downgrade).length;
  const downgrades = rows.filter((m) => m.downgrade).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <ExportBar reportName="tier-movement" />
      </div>

      <div className="flex gap-3">
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
          }}
        >
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">Upgrades</p>
          <p className="text-lg font-bold text-emerald-700">{upgrades}</p>
        </div>
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
          }}
        >
          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">Downgrades</p>
          <p className="text-lg font-bold text-red-600">{downgrades}</p>
        </div>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Farmer</Th>
            <Th>From Tier</Th>
            <Th>To Tier</Th>
            <Th>Date</Th>
            <Th right>Qualifying Spend</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <Tr key={`${m.farmerId}-${m.date}`}>
              <Td bold>{m.farmerName}</Td>
              <Td>
                <Badge label={m.from} variant={getTierVariant(m.from)} />
              </Td>
              <Td>
                <Badge label={m.to} variant={getTierVariant(m.to)} />
              </Td>
              <Td muted>{m.date}</Td>
              <Td right>
                {m.qualifyingSpend > 0
                  ? <span className="font-semibold text-gray-800">{fmt(m.qualifyingSpend)}</span>
                  : <span className="text-gray-400">Inactivity</span>
                }
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No tier movements in selected period.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Outreach ROI ──────────────────────────────────────────────────────────────

// Simulated outreach ROI data (in production: join outreach visits with subsequent purchase events)
const OUTREACH_ROWS = [
  { visitDate: '2026-05-10', village: 'Shirpur, Akola',       agentName: 'Arun Kale',     farmersContacted: 42, purchasedWithin30d: 18, revenueAttributed: 94500  },
  { visitDate: '2026-05-16', village: 'Dighori Gaon, Nagpur', agentName: 'Santosh Pawar', farmersContacted: 28, purchasedWithin30d: 11, revenueAttributed: 58200  },
  { visitDate: '2026-05-21', village: 'Kazipet, Hanamkonda',  agentName: 'Nagesh Rao',    farmersContacted: 65, purchasedWithin30d: 32, revenueAttributed: 182000 },
  { visitDate: '2026-04-28', village: 'Patur Road, Akola',    agentName: 'Deepak Salve',  farmersContacted: 35, purchasedWithin30d: 10, revenueAttributed: 42300  },
  { visitDate: '2026-04-20', village: 'Wardhi, Amravati',     agentName: 'Savita Aware',  farmersContacted: 20, purchasedWithin30d: 6,  revenueAttributed: 28800  },
];

function OutreachROI() {
  const [dateFrom, setDateFrom] = useState('2026-04-01');
  const [dateTo,   setDateTo]   = useState('2026-05-27');

  const rows = OUTREACH_ROWS.filter((r) => r.visitDate >= dateFrom && r.visitDate <= dateTo);
  const totalContacted = rows.reduce((s, r) => s + r.farmersContacted, 0);
  const totalPurchased = rows.reduce((s, r) => s + r.purchasedWithin30d, 0);
  const totalRevenue   = rows.reduce((s, r) => s + r.revenueAttributed, 0);
  const conversionPct  = totalContacted > 0 ? (totalPurchased / totalContacted) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <ExportBar reportName="outreach-roi" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Farmers Contacted</p>
          <p className="text-lg font-bold text-gray-900">{totalContacted}</p>
        </Card>
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Purchased (30d)</p>
          <p className="text-lg font-bold text-emerald-700">{totalPurchased}</p>
        </Card>
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Conversion Rate</p>
          <p className="text-lg font-bold text-emerald-700">{conversionPct.toFixed(1)}%</p>
        </Card>
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Revenue Attributed</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalRevenue)}</p>
        </Card>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Visit Date</Th>
            <Th>Village</Th>
            <Th>Agent</Th>
            <Th right>Contacted</Th>
            <Th right>Purchased (30d)</Th>
            <Th right>Conversion</Th>
            <Th right>Revenue</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const conv = r.farmersContacted > 0 ? (r.purchasedWithin30d / r.farmersContacted) * 100 : 0;
            return (
              <Tr key={`${r.visitDate}-${r.village}`}>
                <Td muted>{r.visitDate}</Td>
                <Td>{r.village}</Td>
                <Td>{r.agentName}</Td>
                <Td right>{r.farmersContacted}</Td>
                <Td right><span className="font-semibold text-emerald-700">{r.purchasedWithin30d}</span></Td>
                <Td right>
                  <span className={`font-semibold ${conv >= 40 ? 'text-emerald-700' : conv >= 25 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {conv.toFixed(1)}%
                  </span>
                </Td>
                <Td right bold>{fmt(r.revenueAttributed)}</Td>
              </Tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No outreach data for selected period.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type SubTab = 'ltv' | 'tier' | 'outreach';

export default function FarmerLoyaltyReports() {
  const [sub, setSub] = useState<SubTab>('ltv');

  const SUB_TABS: { id: SubTab; label: string }[] = [
    { id: 'ltv',      label: 'Farmer Lifetime Value' },
    { id: 'tier',     label: 'Tier Movement'         },
    { id: 'outreach', label: 'Outreach ROI'          },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {SUB_TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setSub(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              sub === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}</button>
        ))}
      </div>

      {sub === 'ltv'      && <FarmerLTV />}
      {sub === 'tier'     && <TierMovement />}
      {sub === 'outreach' && <OutreachROI />}
    </div>
  );
}
