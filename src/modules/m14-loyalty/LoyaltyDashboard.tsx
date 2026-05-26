// Loyalty Programme Dashboard — Ops Head / BDM / Admin
// swap data fetches for: GET /api/loyalty/kpis, /api/loyalty/top-farmers, /api/loyalty/at-risk

import { useMemo, useState } from 'react';
import {
  Users, TrendingUp, Award, AlertTriangle,
  Bell, Coins, ChevronRight, RefreshCw,
} from 'lucide-react';
import { mockLoyaltyWallets, walletByFarmerId } from '../../data/mockLoyaltyWallets';
import { farmerById } from '../../data/mockFarmers';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import type { LoyaltyTier } from '../../types/loyalty';

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY       = '2026-05-26';
const TODAY_MS    = new Date(TODAY).getTime();
const ACTIVE_CUTOFF_MS   = TODAY_MS - 90 * 86_400_000; // 90 days back
const AT_RISK_CUTOFF     = new Date(TODAY_MS - 45 * 86_400_000).toISOString().slice(0, 10); // 45 days back

const TIER_ORDER: LoyaltyTier[] = ['Green', 'Silver', 'Gold', 'Platinum'];

const TIER_STYLE: Record<LoyaltyTier, { bg: string; text: string; bar: string; ring: string }> = {
  Green:    { bg: 'bg-green-100',  text: 'text-green-700',  bar: '#22c55e', ring: 'ring-green-300'  },
  Silver:   { bg: 'bg-slate-100',  text: 'text-slate-600',  bar: '#94a3b8', ring: 'ring-slate-300'  },
  Gold:     { bg: 'bg-amber-100',  text: 'text-amber-700',  bar: '#f59e0b', ring: 'ring-amber-300'  },
  Platinum: { bg: 'bg-purple-100', text: 'text-purple-700', bar: '#a78bfa', ring: 'ring-purple-300' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}
function fmtRs(n: number) {
  return `₹${fmt(n)}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LoyaltyDashboard() {
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalEnrolled = mockLoyaltyWallets.length;

    // Active = farmer appeared in a sale transaction in the last 90 days
    const activeIds = new Set(
      mockSaleTransactions
        .filter(t => new Date(t.createdAt).getTime() >= ACTIVE_CUTOFF_MS)
        .map(t => t.farmerId),
    );

    const pointsIssued   = mockSaleTransactions.reduce((s, t) => s + t.loyaltyPointsEarned, 0);
    const pointsRedeemed = mockSaleTransactions.reduce((s, t) => s + t.loyaltyPointsRedeemed, 0);
    const redemptionRate = pointsIssued > 0 ? (pointsRedeemed / pointsIssued) * 100 : 0;

    return {
      totalEnrolled,
      activeCount: activeIds.size,
      pointsIssued,
      pointsRedeemed,
      redemptionRate,
    };
  }, []);

  // ── Tier distribution ────────────────────────────────────────────────────────
  const tierCounts = useMemo(() => {
    const counts: Partial<Record<LoyaltyTier, number>> = {};
    for (const w of mockLoyaltyWallets) {
      counts[w.tier] = (counts[w.tier] ?? 0) + 1;
    }
    return counts;
  }, []);

  // ── Top 10 by lifetime spend (computed from sale transactions) ───────────────
  const top10 = useMemo(() => {
    const spend: Record<string, number> = {};
    for (const t of mockSaleTransactions) {
      spend[t.farmerId] = (spend[t.farmerId] ?? 0) + t.totalAmt;
    }
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

  // ── At-risk: Gold/Platinum with no purchase in 45+ days ─────────────────────
  const atRisk = useMemo(() => {
    const lastPurchase: Record<string, string> = {};
    for (const t of mockSaleTransactions) {
      if (!lastPurchase[t.farmerId] || t.invoiceDate > lastPurchase[t.farmerId]) {
        lastPurchase[t.farmerId] = t.invoiceDate;
      }
    }
    return mockLoyaltyWallets
      .filter(w => w.tier === 'Gold' || w.tier === 'Platinum')
      .filter(w => {
        const lp = lastPurchase[w.farmerId];
        return !lp || lp < AT_RISK_CUTOFF;
      })
      .map(w => {
        const lp = lastPurchase[w.farmerId];
        const daysSince = lp
          ? Math.round((TODAY_MS - new Date(lp).getTime()) / 86_400_000)
          : null;
        return { wallet: w, farmer: farmerById.get(w.farmerId), lastPurchase: lp ?? null, daysSince };
      });
  }, []);

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Loyalty Programme</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {mockLoyaltyWallets.length} wallets across {Object.keys(tierCounts).length} tiers · as of {TODAY}
        </p>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard
          icon={<Users size={18} className="text-blue-600" />}
          bg="bg-blue-50"
          label="Total Enrolled"
          value={fmt(kpis.totalEnrolled)}
          sub="farmers registered"
        />
        <KpiCard
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="Active (90 days)"
          value={fmt(kpis.activeCount)}
          sub={`${fmt((kpis.activeCount / kpis.totalEnrolled) * 100, 0)}% of enrolled`}
        />
        <KpiCard
          icon={<Coins size={18} className="text-amber-600" />}
          bg="bg-amber-50"
          label="Points Issued"
          value={fmt(kpis.pointsIssued)}
          sub="lifetime total"
        />
        <KpiCard
          icon={<Award size={18} className="text-purple-600" />}
          bg="bg-purple-50"
          label="Points Redeemed"
          value={fmt(kpis.pointsRedeemed)}
          sub="lifetime total"
        />
        <KpiCard
          icon={<RefreshCw size={18} className="text-rose-600" />}
          bg="bg-rose-50"
          label="Redemption Rate"
          value={`${fmt(kpis.redemptionRate, 1)}%`}
          sub="redeemed / issued"
        />
      </div>

      {/* ── Tier distribution ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Tier Distribution</h2>
        <div className="space-y-3">
          {TIER_ORDER.map(tier => {
            const count = tierCounts[tier] ?? 0;
            const pct   = kpis.totalEnrolled > 0 ? (count / kpis.totalEnrolled) * 100 : 0;
            const style = TIER_STYLE[tier];
            return (
              <div key={tier} className="flex items-center gap-3">
                <span className={`w-16 text-xs font-semibold ${style.text} text-right`}>{tier}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: style.bar }}
                  />
                </div>
                <span className="w-14 text-xs text-gray-600 text-right tabular-nums">
                  {count} <span className="text-gray-400">({fmt(pct, 0)}%)</span>
                </span>
              </div>
            );
          })}
        </div>
        {/* Stacked visual */}
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
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ── Top 10 farmers by lifetime spend ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Top 10 Farmers by Spend</h2>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Lifetime</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-50 text-gray-400">
                <th className="text-left px-4 py-2.5 font-medium w-6">#</th>
                <th className="text-left px-4 py-2.5 font-medium">Farmer</th>
                <th className="text-center px-4 py-2.5 font-medium">Tier</th>
                <th className="text-right px-4 py-2.5 font-medium">Spend</th>
                <th className="text-right px-4 py-2.5 font-medium">Pts Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {top10.map(({ rank, farmer, wallet, totalSpend }) => {
                const tier = wallet?.tier ?? 'Green';
                const style = TIER_STYLE[tier];
                return (
                  <tr key={rank} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-400 font-mono font-medium">{rank}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-gray-800 leading-snug">
                        {farmer?.name ?? 'Unknown'}
                      </p>
                      <p className="text-[10px] text-gray-400">{farmer?.address.district}</p>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                        {tier}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900 tabular-nums">
                      {fmtRs(totalSpend)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 tabular-nums">
                      {fmt(wallet?.currentPoints ?? 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── At-risk panel ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-800">At-Risk Farmers</h2>
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">Gold / Platinum · 45+ days</span>
          </div>

          {atRisk.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Award size={18} className="text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">All clear!</p>
              <p className="text-xs text-gray-400 mt-1">
                All Gold &amp; Platinum farmers have purchased within the last 45 days.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {atRisk.map(({ wallet, farmer, lastPurchase, daysSince }) => {
                const isFlagged = flagged.has(wallet.id);
                const style = TIER_STYLE[wallet.tier];
                return (
                  <div key={wallet.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {farmer?.name ?? wallet.farmerId}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                          {wallet.tier}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {farmer?.address.district} ·{' '}
                        {lastPurchase
                          ? `Last purchase ${daysSince}d ago (${lastPurchase})`
                          : 'No purchase on record'}
                      </p>
                    </div>
                    <button
                      onClick={() => setFlagged(prev => {
                        const next = new Set(prev);
                        if (isFlagged) next.delete(wallet.id); else next.add(wallet.id);
                        return next;
                      })}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                        isFlagged
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <Bell size={11} />
                      {isFlagged ? 'Flagged' : 'Flag for Outreach'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {atRisk.length > 0 && flagged.size > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-amber-50 flex items-center gap-2">
              <ChevronRight size={12} className="text-amber-600" />
              <p className="text-[11px] text-amber-700">
                {flagged.size} farmer{flagged.size !== 1 ? 's' : ''} flagged for field outreach.
                {/* POST /api/loyalty/outreach-flags on save */}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  sub: string;
}

function KpiCard({ icon, bg, label, value, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5 tabular-nums">{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
