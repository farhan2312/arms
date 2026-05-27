// FarmerList — searchable, filterable table with CRM-specific columns
import { useState, useMemo } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import Badge, { getTierVariant, getStatusVariant } from '../../components/ui/Badge';
import { SearchInput, Select } from '../../components/ui/Input';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';
import type { Farmer } from '../../types/entities';
import type { OutreachEntry } from './OutreachLog';

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
        <div style={{ flex: 1, minWidth: '208px' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, mobile, village, district…"
          />
        </div>

        <div style={{ width: '140px' }}>
          <Select value={tierFilter} onChange={setTierFilter}>
            {['All', 'Green', 'Silver', 'Gold', 'Platinum'].map(t => (
              <option key={t} value={t}>{t === 'All' ? 'All Tiers' : t}</option>
            ))}
          </Select>
        </div>

        <div style={{ width: '160px' }}>
          <Select value={districtFilter} onChange={setDistrictFilter}>
            {allDistricts.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>
            ))}
          </Select>
        </div>

        <div style={{ width: '160px' }}>
          <Select value={cropFilter} onChange={setCropFilter}>
            {allCrops.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Crops' : c}</option>
            ))}
          </Select>
        </div>

        <button
          onClick={() => setAtRiskOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            atRiskOnly
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
          }`}
          style={{ height: '34px' }}
        >
          <AlertTriangle size={13} />
          At Risk
          {atRiskCount > 0 && (
            <span className="ml-0.5 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
              {atRiskCount}
            </span>
          )}
        </button>

        <Button variant="primary" iconLeft={Plus} onClick={onAdd}>
          Add Farmer
        </Button>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500 mb-3">
        {filtered.length} of {farmers.length} farmers
        {atRiskOnly && <span className="ml-2 text-red-600 font-medium">· At-risk filter active</span>}
      </p>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <TableWrap>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Mobile</Th>
              <Th>Village</Th>
              <Th>District</Th>
              <Th>Crops</Th>
              <Th>Land (ac)</Th>
              <Th>KYC</Th>
              <Th>Tier</Th>
              <Th>Last Purchase</Th>
              <Th>Last Outreach</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    icon={AlertTriangle}
                    iconColor="#94a3b8"
                    title="No farmers match the current filters"
                    subtitle="Try adjusting your search or filter criteria."
                    action={() => { setSearch(''); setTierFilter('All'); setDistrictFilter('All'); setCropFilter('All'); setAtRiskOnly(false); }}
                    actionLabel="Clear filters"
                  />
                </td>
              </tr>
            ) : (
              filtered.map(f => {
                const wallet = walletByFarmerId.get(f.id);
                const lastPurchase = lastPurchaseMap.get(f.id);
                const lastOutreach = lastOutreachMap.get(f.id);
                const isAtRisk = !lastPurchase || lastPurchase < AT_RISK_CUTOFF;

                return (
                  <Tr
                    key={f.id}
                    onClick={() => onSelect(f.id)}
                    className={isAtRisk ? 'bg-red-50/40' : ''}
                  >
                    <Td>
                      <div className="flex items-center gap-2">
                        {isAtRisk && <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />}
                        <span className="font-medium text-gray-900 whitespace-nowrap">{f.name}</span>
                      </div>
                    </Td>
                    <Td mono muted>{f.mobile}</Td>
                    <Td muted>{f.address.village ?? '—'}</Td>
                    <Td muted>{f.address.district}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {f.cropTypes.slice(0, 2).map(c => (
                          <span key={c} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                            {c}
                          </span>
                        ))}
                        {f.cropTypes.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{f.cropTypes.length - 2}</span>
                        )}
                      </div>
                    </Td>
                    <Td right>{f.landAcres}</Td>
                    <Td>
                      <Badge variant={getStatusVariant(f.kycStatus)}>{f.kycStatus}</Badge>
                    </Td>
                    <Td>
                      {wallet ? (
                        <Badge variant={getTierVariant(wallet.tier)}>{wallet.tier}</Badge>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                      )}
                    </Td>
                    <Td>
                      <span className={isAtRisk && lastPurchase ? 'text-red-500 font-medium text-xs' : 'text-xs text-gray-600'}>
                        {fmtDate(lastPurchase)}
                      </span>
                    </Td>
                    <Td muted>{fmtDate(lastOutreach)}</Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}
