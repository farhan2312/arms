import { useState, useMemo } from 'react';
import { Download, FileText, Mail } from 'lucide-react';
import { mockFarmers } from '../../data/mockFarmers';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockLoyaltyWallets } from '../../data/mockLoyaltyWallets';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

type LoyaltyTier = 'Green' | 'Silver' | 'Gold' | 'Platinum';

const TIER_COLOR: Record<LoyaltyTier, string> = {
  Green:    'bg-green-100 text-green-700',
  Silver:   'bg-gray-100 text-gray-600',
  Gold:     'bg-amber-100 text-amber-700',
  Platinum: 'bg-purple-100 text-purple-700',
};

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
          farmer:           f,
          tier:             (wallet?.tier ?? 'Green') as LoyaltyTier,
          totalSpend,
          totalVisits,
          avgBasket,
          lastPurchase:     stats?.lastPurchaseDate ?? '—',
          pointsBalance:    wallet?.currentPoints ?? 0,
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">#</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Farmer</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Mobile</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Tier</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Total Spend</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Visits</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Avg Basket</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Last Purchase</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={r.farmer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-800">{r.farmer.name}</p>
                  <p className="text-gray-400">{r.farmer.address.village}, {r.farmer.address.district}</p>
                </td>
                <td className="px-3 py-2 text-gray-600">{r.farmer.mobile}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${TIER_COLOR[r.tier]}`}>
                    {r.tier}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-semibold text-gray-800">{r.totalSpend > 0 ? fmt(r.totalSpend) : '—'}</td>
                <td className="px-3 py-2 text-right text-gray-700">{r.totalVisits}</td>
                <td className="px-3 py-2 text-right text-gray-600">{r.avgBasket > 0 ? fmt(r.avgBasket) : '—'}</td>
                <td className="px-3 py-2 text-gray-500">{r.lastPurchase}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-semibold ${r.pointsBalance > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {r.pointsBalance.toLocaleString('en-IN')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">Upgrades</p>
          <p className="text-lg font-bold text-emerald-700">{upgrades}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest">Downgrades</p>
          <p className="text-lg font-bold text-red-600">{downgrades}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Farmer</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">From Tier</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">To Tier</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Qualifying Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((m) => (
              <tr key={`${m.farmerId}-${m.date}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-800">{m.farmerName}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${TIER_COLOR[m.from as LoyaltyTier]}`}>
                    {m.from}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${TIER_COLOR[m.to as LoyaltyTier]}`}>
                    {m.to}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">{m.date}</td>
                <td className="px-3 py-2 text-right">
                  {m.qualifyingSpend > 0
                    ? <span className="font-semibold text-gray-800">{fmt(m.qualifyingSpend)}</span>
                    : <span className="text-gray-400">Inactivity</span>
                  }
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-10 text-center text-gray-400">No tier movements in selected period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Outreach ROI ──────────────────────────────────────────────────────────────

// Simulated outreach ROI data (in production: join outreach visits with subsequent purchase events)
const OUTREACH_ROWS = [
  { visitDate: '2026-05-10', village: 'Shirpur, Akola',            agentName: 'Arun Kale',       farmersContacted: 42, purchasedWithin30d: 18, revenueAttributed: 94500  },
  { visitDate: '2026-05-16', village: 'Dighori Gaon, Nagpur',      agentName: 'Santosh Pawar',   farmersContacted: 28, purchasedWithin30d: 11, revenueAttributed: 58200  },
  { visitDate: '2026-05-21', village: 'Kazipet, Hanamkonda',       agentName: 'Nagesh Rao',      farmersContacted: 65, purchasedWithin30d: 32, revenueAttributed: 182000 },
  { visitDate: '2026-04-28', village: 'Patur Road, Akola',         agentName: 'Deepak Salve',    farmersContacted: 35, purchasedWithin30d: 10, revenueAttributed: 42300  },
  { visitDate: '2026-04-20', village: 'Wardhi, Amravati',          agentName: 'Savita Aware',    farmersContacted: 20, purchasedWithin30d: 6,  revenueAttributed: 28800  },
];

function OutreachROI() {
  const [dateFrom, setDateFrom] = useState('2026-04-01');
  const [dateTo,   setDateTo]   = useState('2026-05-27');

  const rows = OUTREACH_ROWS.filter((r) => r.visitDate >= dateFrom && r.visitDate <= dateTo);
  const totalContacted  = rows.reduce((s, r) => s + r.farmersContacted, 0);
  const totalPurchased  = rows.reduce((s, r) => s + r.purchasedWithin30d, 0);
  const totalRevenue    = rows.reduce((s, r) => s + r.revenueAttributed, 0);
  const conversionPct   = totalContacted > 0 ? (totalPurchased / totalContacted) * 100 : 0;

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
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Farmers Contacted</p>
          <p className="text-lg font-bold text-gray-900">{totalContacted}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Purchased (30d)</p>
          <p className="text-lg font-bold text-emerald-700">{totalPurchased}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Conversion Rate</p>
          <p className="text-lg font-bold text-emerald-700">{conversionPct.toFixed(1)}%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Revenue Attributed</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Visit Date</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Village</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Agent</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Contacted</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Purchased (30d)</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Conversion</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => {
              const conv = r.farmersContacted > 0 ? (r.purchasedWithin30d / r.farmersContacted) * 100 : 0;
              return (
                <tr key={`${r.visitDate}-${r.village}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-gray-600">{r.visitDate}</td>
                  <td className="px-3 py-2 text-gray-700">{r.village}</td>
                  <td className="px-3 py-2 text-gray-700">{r.agentName}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{r.farmersContacted}</td>
                  <td className="px-3 py-2 text-right text-emerald-700 font-semibold">{r.purchasedWithin30d}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-semibold ${conv >= 40 ? 'text-emerald-700' : conv >= 25 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {conv.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(r.revenueAttributed)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-400">No outreach data for selected period.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type SubTab = 'ltv' | 'tier' | 'outreach';

export default function FarmerLoyaltyReports() {
  const [sub, setSub] = useState<SubTab>('ltv');

  const SUB_TABS: { id: SubTab; label: string }[] = [
    { id: 'ltv',     label: 'Farmer Lifetime Value' },
    { id: 'tier',    label: 'Tier Movement'         },
    { id: 'outreach', label: 'Outreach ROI'         },
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
