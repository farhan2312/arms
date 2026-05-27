// Loyalty Programme Dashboard — BDM / Finance / Admin
// Tabs: Overview | Wallet Lookup | At-Risk Farmers | Tier Management
// swap data fetches for: GET /api/loyalty/kpis, /top-farmers, /at-risk

import { useMemo, useState } from 'react';
import {
  Users, TrendingUp, Award, AlertTriangle,
  Bell, Coins, ChevronRight, RefreshCw,
} from 'lucide-react';
import { mockLoyaltyWallets, walletByFarmerId } from '../../data/mockLoyaltyWallets';
import { farmerById } from '../../data/mockFarmers';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import type { LoyaltyTier } from '../../types/loyalty';
import TierManagementPanel from './TierManagementPanel';
import LoyaltyLookupTab from '../m06-crm/LoyaltyLookupTab';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import { Card, CardHeader } from '../../components/ui/Card';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY           = '2026-05-27';
const TODAY_MS        = new Date(TODAY).getTime();
const ACTIVE_CUTOFF_MS = TODAY_MS - 90 * 86_400_000;
const AT_RISK_CUTOFF  = new Date(TODAY_MS - 45 * 86_400_000).toISOString().slice(0, 10);

const TIER_ORDER: LoyaltyTier[] = ['Green', 'Silver', 'Gold', 'Platinum'];

const TIER_STYLE: Record<LoyaltyTier, { bg: string; text: string; bar: string }> = {
  Green:    { bg: 'bg-green-100',  text: 'text-green-700',  bar: '#22c55e' },
  Silver:   { bg: 'bg-slate-100',  text: 'text-slate-600',  bar: '#94a3b8' },
  Gold:     { bg: 'bg-amber-100',  text: 'text-amber-700',  bar: '#f59e0b' },
  Platinum: { bg: 'bg-purple-100', text: 'text-purple-700', bar: '#a78bfa' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}
function fmtRs(n: number) { return `₹${fmt(n)}`; }

// ── Tab definition ────────────────────────────────────────────────────────────

type LoyaltyTab = 'overview' | 'wallet' | 'at-risk' | 'tiers';

// ── Main component ────────────────────────────────────────────────────────────

export default function LoyaltyDashboard() {
  const [tab,     setTab]     = useState<LoyaltyTab>('overview');
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalEnrolled = mockLoyaltyWallets.length;
    const activeIds = new Set(
      mockSaleTransactions
        .filter(t => new Date(t.createdAt).getTime() >= ACTIVE_CUTOFF_MS)
        .map(t => t.farmerId),
    );
    const pointsIssued   = mockSaleTransactions.reduce((s, t) => s + t.loyaltyPointsEarned, 0);
    const pointsRedeemed = mockSaleTransactions.reduce((s, t) => s + t.loyaltyPointsRedeemed, 0);
    const redemptionRate = pointsIssued > 0 ? (pointsRedeemed / pointsIssued) * 100 : 0;
    return { totalEnrolled, activeCount: activeIds.size, pointsIssued, pointsRedeemed, redemptionRate };
  }, []);

  // ── Tier distribution ──────────────────────────────────────────────────────
  const tierCounts = useMemo(() => {
    const counts: Partial<Record<LoyaltyTier, number>> = {};
    for (const w of mockLoyaltyWallets) counts[w.tier] = (counts[w.tier] ?? 0) + 1;
    return counts;
  }, []);

  // ── Top 10 by lifetime spend ───────────────────────────────────────────────
  const top10 = useMemo(() => {
    const spend: Record<string, number> = {};
    for (const t of mockSaleTransactions) spend[t.farmerId] = (spend[t.farmerId] ?? 0) + t.totalAmt;
    return Object.entries(spend)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([farmerId, totalSpend], rank) => ({
        rank: rank + 1,
        farmer: farmerById.get(farmerId),
        wallet: walletByFarmerId.get(farmerId),
        totalSpend,
      }));
  }, []);

  // ── At-risk: Gold/Platinum with no purchase in 45+ days ───────────────────
  const atRisk = useMemo(() => {
    const lastPurchase: Record<string, string> = {};
    for (const t of mockSaleTransactions) {
      if (!lastPurchase[t.farmerId] || t.invoiceDate > lastPurchase[t.farmerId]) {
        lastPurchase[t.farmerId] = t.invoiceDate;
      }
    }
    return mockLoyaltyWallets
      .filter(w => w.tier === 'Gold' || w.tier === 'Platinum')
      .filter(w => { const lp = lastPurchase[w.farmerId]; return !lp || lp < AT_RISK_CUTOFF; })
      .map(w => {
        const lp = lastPurchase[w.farmerId];
        const daysSince = lp ? Math.round((TODAY_MS - new Date(lp).getTime()) / 86_400_000) : null;
        return { wallet: w, farmer: farmerById.get(w.farmerId), lastPurchase: lp ?? null, daysSince };
      });
  }, []);

  function toggleFlag(walletId: string) {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(walletId) ? next.delete(walletId) : next.add(walletId);
      return next;
    });
  }

  const loyaltyTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'wallet',   label: 'Wallet Lookup' },
    { id: 'at-risk',  label: 'At-Risk Farmers', badge: atRisk.length > 0 ? atRisk.length : undefined },
    { id: 'tiers',    label: 'Tier Management' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Page header */}
      <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
        <PageHeader
          title="Loyalty Programme"
          subtitle={`${mockLoyaltyWallets.length} wallets · ${Object.keys(tierCounts).length} tiers · as of ${TODAY}`}
        />
        <Tabs
          tabs={loyaltyTabs}
          activeTab={tab}
          onTabChange={(id) => setTab(id as LoyaltyTab)}
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-page)' }}>

        {/* ── Overview ────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="p-6 space-y-6">

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard icon={<Users size={18} className="text-blue-600" />}       bg="bg-blue-50"   label="Total Enrolled"   value={fmt(kpis.totalEnrolled)}                              sub="farmers registered" />
              <StatCard icon={<TrendingUp size={18} className="text-emerald-600" />} bg="bg-emerald-50" label="Active (90 days)"  value={fmt(kpis.activeCount)}                              sub={`${fmt((kpis.activeCount / kpis.totalEnrolled) * 100, 0)}% of enrolled`} />
              <StatCard icon={<Coins size={18} className="text-amber-600" />}       bg="bg-amber-50"  label="Points Issued"    value={fmt(kpis.pointsIssued)}                              sub="lifetime total" />
              <StatCard icon={<Award size={18} className="text-purple-600" />}      bg="bg-purple-50" label="Points Redeemed"  value={fmt(kpis.pointsRedeemed)}                            sub="lifetime total" />
              <StatCard icon={<RefreshCw size={18} className="text-rose-600" />}    bg="bg-rose-50"   label="Redemption Rate" value={`${fmt(kpis.redemptionRate, 1)}%`}                   sub="redeemed / issued" />
            </div>

            {/* Tier distribution */}
            <Card padding="20px">
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Tier Distribution</h2>
              <div className="space-y-3">
                {TIER_ORDER.map(tier => {
                  const count = tierCounts[tier] ?? 0;
                  const pct   = kpis.totalEnrolled > 0 ? (count / kpis.totalEnrolled) * 100 : 0;
                  const style = TIER_STYLE[tier];
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <span className={`w-16 text-xs font-semibold ${style.text} text-right`}>{tier}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: style.bar }} />
                      </div>
                      <span className="w-14 text-xs text-gray-600 text-right tabular-nums">
                        {count} <span className="text-gray-400">({fmt(pct, 0)}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 h-4 rounded-full overflow-hidden flex">
                {TIER_ORDER.map(tier => {
                  const count = tierCounts[tier] ?? 0;
                  const pct   = kpis.totalEnrolled > 0 ? (count / kpis.totalEnrolled) * 100 : 0;
                  return pct > 0 ? (
                    <div key={tier} title={`${tier}: ${count}`} style={{ width: `${pct}%`, backgroundColor: TIER_STYLE[tier].bar }} />
                  ) : null;
                })}
              </div>
              <div className="mt-2 flex gap-4 flex-wrap">
                {TIER_ORDER.map(tier => (
                  <div key={tier} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_STYLE[tier].bar }} />
                    <span className="text-[11px] text-gray-500">{tier} ({tierCounts[tier] ?? 0})</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top 10 farmers */}
            <div>
              <CardHeader
                title="Top 10 Farmers by Spend"
                right={<span className="text-[10px] text-gray-400 uppercase tracking-widest">Lifetime</span>}
              />
              <TableWrap>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Farmer</Th>
                    <Th>Tier</Th>
                    <Th right>Spend</Th>
                    <Th right>Pts Balance</Th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map(({ rank, farmer, wallet, totalSpend }) => {
                    const tier = wallet?.tier ?? 'Green';
                    const style = TIER_STYLE[tier];
                    return (
                      <Tr key={rank}>
                        <Td mono muted>{rank}</Td>
                        <Td>
                          <p className="font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{farmer?.name ?? 'Unknown'}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{farmer?.address.district}</p>
                        </Td>
                        <Td>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>{tier}</span>
                        </Td>
                        <Td right bold>{fmtRs(totalSpend)}</Td>
                        <Td right muted>{fmt(wallet?.currentPoints ?? 0)}</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            </div>

            {/* At-risk callout — nudge to switch tab */}
            {atRisk.length > 0 && (
              <button
                onClick={() => setTab('at-risk')}
                className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 text-left hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 flex-1">
                  <span className="font-semibold">{atRisk.length} Gold / Platinum farmer{atRisk.length !== 1 ? 's' : ''}</span>{' '}
                  with no purchase in 45+ days. {flagged.size > 0 && `${flagged.size} already flagged.`}
                </p>
                <ChevronRight size={14} className="text-amber-500 flex-shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* ── Wallet Lookup ───────────────────────────────────────────────── */}
        {tab === 'wallet' && (
          <div className="p-6">
            <LoyaltyLookupTab />
          </div>
        )}

        {/* ── At-Risk Farmers ─────────────────────────────────────────────── */}
        {tab === 'at-risk' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <AlertTriangle size={15} className="text-amber-500" />
                  At-Risk Farmers
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Gold &amp; Platinum farmers with no purchase in 45+ days · {atRisk.length} found
                </p>
              </div>
              {flagged.size > 0 && (
                <button
                  onClick={() => console.log('// POST /api/loyalty/outreach-flags', [...flagged])}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Bell size={14} />
                  Send {flagged.size} Flag{flagged.size !== 1 ? 's' : ''} to Field Team
                </button>
              )}
            </div>

            {atRisk.length === 0 ? (
              <EmptyState
                icon={Award}
                iconColor="#22c55e"
                title="All clear!"
                subtitle="All Gold & Platinum farmers have purchased within the last 45 days."
              />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Farmer</Th>
                    <Th>Tier</Th>
                    <Th>District</Th>
                    <Th>Last Purchase</Th>
                    <Th right>Days Inactive</Th>
                    <Th right>Points Balance</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map(({ wallet, farmer, lastPurchase, daysSince }) => {
                    const isFlagged = flagged.has(wallet.id);
                    const style = TIER_STYLE[wallet.tier];
                    return (
                      <Tr key={wallet.id} className={isFlagged ? 'bg-amber-50/50' : ''}>
                        <Td>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{farmer?.name ?? wallet.farmerId}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{farmer?.mobile}</p>
                        </Td>
                        <Td>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                            {wallet.tier}
                          </span>
                        </Td>
                        <Td muted>{farmer?.address.district ?? '—'}</Td>
                        <Td muted>
                          {lastPurchase ?? <span className="italic text-gray-300">Never</span>}
                        </Td>
                        <Td right>
                          <span className={`font-semibold tabular-nums ${
                            (daysSince ?? 999) >= 90 ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {daysSince !== null ? `${daysSince}d` : '—'}
                          </span>
                        </Td>
                        <Td right muted>
                          {wallet.currentPoints.toLocaleString('en-IN')}
                        </Td>
                        <Td right>
                          <button
                            onClick={() => toggleFlag(wallet.id)}
                            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                              isFlagged
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Bell size={11} />
                            {isFlagged ? 'Flagged' : 'Flag for Outreach'}
                          </button>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            )}

            {flagged.size > 0 && atRisk.length > 0 && (
              <div className="px-5 py-3 border border-amber-100 rounded-xl bg-amber-50 flex items-center gap-2">
                <ChevronRight size={12} className="text-amber-600" />
                <p className="text-[11px] text-amber-700">
                  {flagged.size} farmer{flagged.size !== 1 ? 's' : ''} flagged — click "Send Flags to Field Team" to dispatch outreach requests.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tier Management ─────────────────────────────────────────────── */}
        {tab === 'tiers' && (
          <div className="p-6">
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <TierManagementPanel />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── StatCard sub-component ────────────────────────────────────────────────────

interface StatCardProps { icon: React.ReactNode; bg: string; label: string; value: string; sub: string; }

function StatCard({ icon, bg, label, value, sub }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
      }}
    >
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="text-xl font-bold mt-0.5 tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  );
}
