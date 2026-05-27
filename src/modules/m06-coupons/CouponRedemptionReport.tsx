// CouponRedemptionReport — filters, KPI summary, and full coupon ledger

import { useState, useMemo } from 'react';
import { Download, Ticket, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import type { CouponCampaign, IssuedCoupon } from '../../data/mockCouponCampaigns';
import type { LoyaltyTier } from '../../types/loyalty';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import Badge, { getTierVariant, getStatusVariant } from '../../components/ui/Badge';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';


const ALL_TIERS: LoyaltyTier[] = ['Green', 'Silver', 'Gold', 'Platinum'];

function fmtAmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  campaigns: CouponCampaign[];
  issuedCoupons: IssuedCoupon[];
}

export default function CouponRedemptionReport({ campaigns, issuedCoupons }: Props) {
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterTier, setFilterTier]             = useState<LoyaltyTier | ''>('');
  const [filterStore, setFilterStore]           = useState('');
  const [filterFrom, setFilterFrom]             = useState('');
  const [filterTo, setFilterTo]                 = useState('');

  // Collect unique stores from issued coupons
  const allStores = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const c of issuedCoupons) {
      if (c.storeId && !seen.has(c.storeId)) {
        seen.add(c.storeId);
        list.push({ id: c.storeId, name: c.storeName ?? c.storeId });
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [issuedCoupons]);

  const filtered = useMemo(() => {
    return issuedCoupons.filter(c => {
      if (filterCampaignId && c.campaignId !== filterCampaignId) return false;
      if (filterTier && c.farmerTier !== filterTier)             return false;
      if (filterStore && c.storeId !== filterStore)             return false;
      if (filterFrom && c.issuedAt.slice(0, 10) < filterFrom)  return false;
      if (filterTo   && c.issuedAt.slice(0, 10) > filterTo)    return false;
      return true;
    });
  }, [issuedCoupons, filterCampaignId, filterTier, filterStore, filterFrom, filterTo]);

  const redeemed       = filtered.filter(c => c.redeemedAt);
  const totalDiscount  = redeemed.reduce((sum, c) => sum + (c.discountApplied ?? 0), 0);
  const redemptionRate = filtered.length > 0 ? Math.round((redeemed.length / filtered.length) * 100) : 0;

  const hasFilters = filterCampaignId || filterTier || filterStore || filterFrom || filterTo;

  function clearFilters() {
    setFilterCampaignId('');
    setFilterTier('');
    setFilterStore('');
    setFilterFrom('');
    setFilterTo('');
  }

  function exportCSV() {
    const header = 'Code,Campaign,Farmer,Mobile,Tier,Issued At,Redeemed At,Store,Invoice Value,Discount Applied';
    const rows = filtered.map(c =>
      [
        c.code,
        c.campaignName,
        c.farmerName,
        c.farmerMobile,
        c.farmerTier,
        c.issuedAt,
        c.redeemedAt ?? '',
        c.storeName ?? '',
        c.invoiceValue ?? '',
        c.discountApplied ?? '',
      ]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [header, ...rows].join('\n');
    console.log('// CSV export — download triggered\n', csv.slice(0, 200));
  }

  const kpis = [
    {
      label: 'Total Issued',
      value: String(filtered.length),
      icon: <Ticket size={16} className="text-blue-500" />,
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Redeemed',
      value: String(redeemed.length),
      icon: <CheckCircle2 size={16} className="text-emerald-500" />,
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Pending',
      value: String(filtered.length - redeemed.length),
      icon: <Clock size={16} className="text-amber-500" />,
      bg: 'bg-amber-50 border-amber-200',
    },
    {
      label: 'Redemption Rate',
      value: `${redemptionRate}%`,
      icon: <TrendingUp size={16} className="text-purple-500" />,
      bg: 'bg-purple-50 border-purple-200',
    },
  ];

  const dateCls = 'border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

  return (
    <div className="space-y-6">
      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <Card>
        <p className="text-xs font-semibold text-gray-700 mb-3">Filters</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Campaign */}
          <Select
            value={filterCampaignId}
            onChange={setFilterCampaignId}
          >
            <option value="">All campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          {/* Tier */}
          <Select
            value={filterTier}
            onChange={v => setFilterTier(v as LoyaltyTier | '')}
          >
            <option value="">All tiers</option>
            {ALL_TIERS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>

          {/* Store */}
          <Select
            value={filterStore}
            onChange={setFilterStore}
          >
            <option value="">All stores</option>
            {allStores.map(s => (
              <option key={s.id} value={s.id}>
                {s.name.replace('Bharat Agri Store – ', '')}
              </option>
            ))}
          </Select>

          {/* Date from */}
          <input
            type="date"
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            className={dateCls}
            title="Issued from"
          />

          {/* Date to */}
          <input
            type="date"
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            className={dateCls}
            title="Issued to"
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Clear all filters
          </button>
        )}
      </Card>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className={`rounded-xl border ${kpi.bg} px-5 py-4 flex items-center gap-4`}
          >
            <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
              {kpi.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5 font-mono">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Discount Banner + Export ───────────────────────────────────────── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-600 font-semibold">Total Discount Given (redeemed coupons)</p>
          <p className="text-2xl font-bold text-emerald-800 mt-0.5 font-mono">₹{fmtAmt(totalDiscount)}</p>
        </div>
        <Button variant="secondary" iconLeft={Download} onClick={exportCSV} size="sm">
          Export CSV
        </Button>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <TableWrap>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th>Campaign</Th>
            <Th>Farmer</Th>
            <Th>Tier</Th>
            <Th>Issued</Th>
            <Th>Redeemed At</Th>
            <Th>Store</Th>
            <Th right>Invoice</Th>
            <Th right>Discount</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(coupon => (
            <Tr key={coupon.id}>
              <Td mono>{coupon.code}</Td>
              <Td>
                <span className="max-w-[160px] truncate block">{coupon.campaignName}</span>
              </Td>
              <Td>
                <p className="font-medium text-gray-800 text-xs">{coupon.farmerName}</p>
                <p className="text-[10px] text-gray-400">{coupon.farmerMobile}</p>
              </Td>
              <Td>
                <Badge variant={getTierVariant(coupon.farmerTier)}>{coupon.farmerTier}</Badge>
              </Td>
              <Td muted>{fmtDate(coupon.issuedAt.slice(0, 10))}</Td>
              <Td muted>
                {coupon.redeemedAt
                  ? fmtDT(coupon.redeemedAt)
                  : <span className="text-gray-300">—</span>}
              </Td>
              <Td muted>
                {coupon.storeName
                  ? coupon.storeName.replace('Bharat Agri Store – ', '')
                  : <span className="text-gray-300">—</span>}
              </Td>
              <Td right mono>
                {coupon.invoiceValue != null
                  ? `₹${fmtAmt(coupon.invoiceValue)}`
                  : <span className="text-gray-300">—</span>}
              </Td>
              <Td right mono bold>
                <span className="text-emerald-700">
                  {coupon.discountApplied != null
                    ? `₹${fmtAmt(coupon.discountApplied)}`
                    : <span className="text-gray-300">—</span>}
                </span>
              </Td>
              <Td>
                <Badge variant={getStatusVariant(coupon.redeemedAt ? 'Redeemed' : 'Pending')}>
                  {coupon.redeemedAt ? 'Redeemed' : 'Pending'}
                </Badge>
              </Td>
            </Tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                No coupons match the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
