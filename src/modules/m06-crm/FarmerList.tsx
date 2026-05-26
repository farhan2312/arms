// FarmerList — searchable, filterable table with CRM-specific columns
import { useState, useMemo } from 'react';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';
import type { Farmer } from '../../types/entities';
import type { OutreachEntry } from './OutreachLog';

const TIER_BADGE: Record<string, BadgeVariant> = {
  Green: 'green', Silver: 'gray', Gold: 'yellow', Platinum: 'orange',
};

const AT_RISK_CUTOFF = '2026-04-11'; // 45 days before TODAY 2026-05-26

function fmtDate(d: string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

interface Props {
  farmers: Farmer[];
  outreachLogs: OutreachEntry[];
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export default function FarmerList({ farmers, outreachLogs, onSelect, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [cropFilter, setCropFilter] = useState('All');
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  // Precompute last purchase per farmer
  const lastPurchaseMap = useMemo(() => {
    const m = new Map<string, string>();
    mockSaleTransactions.forEach(t => {
      const e = m.get(t.farmerId);
      if (!e || t.invoiceDate > e) m.set(t.farmerId, t.invoiceDate);
    });
    return m;
  }, []);

  // Precompute last outreach per farmer
  const lastOutreachMap = useMemo(() => {
    const m = new Map<string, string>();
    outreachLogs.forEach(log => {
      log.farmerOutcomes.forEach(({ farmerId }) => {
        const e = m.get(farmerId);
        if (!e || log.date > e) m.set(farmerId, log.date);
      });
    });
    return m;
  }, [outreachLogs]);

  const allDistricts = useMemo(() =>
    ['All', ...[...new Set(farmers.map(f => f.address.district))].sort()], [farmers]);
  const allCrops = useMemo(() =>
    ['All', ...[...new Set(farmers.flatMap(f => f.cropTypes))].sort()], [farmers]);

  const filtered = useMemo(() => {
    return farmers.filter(f => {
      const lastPurchase = lastPurchaseMap.get(f.id);
      const wallet = walletByFarmerId.get(f.id);

      if (search) {
        const q = search.toLowerCase();
        const matches =
          f.name.toLowerCase().includes(q) ||
          f.mobile.includes(q) ||
          (f.address.village ?? '').toLowerCase().includes(q) ||
          f.address.district.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (tierFilter !== 'All' && wallet?.tier !== tierFilter) return false;
      if (districtFilter !== 'All' && f.address.district !== districtFilter) return false;
      if (cropFilter !== 'All' && !f.cropTypes.includes(cropFilter)) return false;
      if (atRiskOnly) {
        const isAtRisk = !lastPurchase || lastPurchase < AT_RISK_CUTOFF;
        if (!isAtRisk) return false;
      }
      return true;
    });
  }, [farmers, search, tierFilter, districtFilter, cropFilter, atRiskOnly, lastPurchaseMap]);

  const atRiskCount = useMemo(() =>
    farmers.filter(f => {
      const lp = lastPurchaseMap.get(f.id);
      return !lp || lp < AT_RISK_CUTOFF;
    }).length, [farmers, lastPurchaseMap]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, mobile, village, district…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
          {['All', 'Green', 'Silver', 'Gold', 'Platinum'].map(t => (
            <option key={t} value={t}>{t === 'All' ? 'All Tiers' : t}</option>
          ))}
        </select>

        <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
          {allDistricts.map(d => (
            <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
          ))}
        </select>

        <select value={cropFilter} onChange={e => setCropFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
          {allCrops.map(c => (
            <option key={c} value={c}>{c === 'All' ? 'All Crops' : c}</option>
          ))}
        </select>

        <button
          onClick={() => setAtRiskOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            atRiskOnly
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
          }`}
        >
          <AlertTriangle size={13} />
          At Risk {atRiskCount > 0 && <span className="ml-0.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">{atRiskCount}</span>}
        </button>

        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors ml-auto">
          <Plus size={14} /> Add Farmer
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500 mb-3">
        {filtered.length} of {farmers.length} farmers
        {atRiskOnly && <span className="ml-2 text-red-600 font-medium">· At-risk filter active</span>}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Name', 'Mobile', 'Village', 'District', 'Crops', 'Land (ac)', 'Tier', 'Last Purchase', 'Last Outreach'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(f => {
              const wallet = walletByFarmerId.get(f.id);
              const lastPurchase = lastPurchaseMap.get(f.id);
              const lastOutreach = lastOutreachMap.get(f.id);
              const isAtRisk = !lastPurchase || lastPurchase < AT_RISK_CUTOFF;

              return (
                <tr
                  key={f.id}
                  onClick={() => onSelect(f.id)}
                  className={`cursor-pointer transition-colors ${isAtRisk ? 'bg-red-50/40 hover:bg-red-50' : 'bg-white hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {isAtRisk && <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />}
                      <div>
                        <p className="font-medium text-gray-900 whitespace-nowrap">{f.name}</p>
                        <p className="text-[10px] text-gray-400">{f.kycStatus}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">{f.mobile}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{f.address.village ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{f.address.district}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {f.cropTypes.slice(0, 2).map(c => (
                        <span key={c} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{c}</span>
                      ))}
                      {f.cropTypes.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{f.cropTypes.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">{f.landAcres}</td>
                  <td className="px-4 py-3">
                    {wallet ? (
                      <Badge label={wallet.tier} variant={TIER_BADGE[wallet.tier] ?? 'gray'} />
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-xs ${isAtRisk && lastPurchase ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                    {fmtDate(lastPurchase)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{fmtDate(lastOutreach)}</td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                  No farmers match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
