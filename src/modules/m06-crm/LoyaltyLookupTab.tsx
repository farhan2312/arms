// LoyaltyLookupTab — inline wallet lookup for the Farmers CRM tab
// Same logic as FarmerWalletView but without the outer page wrapper / heading

import { useState, useMemo } from 'react';
import { User, Star, Clock, Coins, TrendingUp, AlertCircle, Sprout, Search } from 'lucide-react';
import { mockFarmers } from '../../data/mockFarmers';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { storeById } from '../../data/mockStores';
import type { LoyaltyTier } from '../../types/loyalty';
import { SearchInput } from '../../components/ui/Input';
import Badge, { getTierVariant } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';

// ── Tier config ───────────────────────────────────────────────────────────────

interface TierBand {
  min: number;
  max: number;
  next: LoyaltyTier | null;
}

const TIER_BANDS: Record<LoyaltyTier, TierBand> = {
  Green:    { min: 0,      max: 999,    next: 'Silver'   },
  Silver:   { min: 1_000,  max: 4_999,  next: 'Gold'     },
  Gold:     { min: 5_000,  max: 14_999, next: 'Platinum' },
  Platinum: { min: 15_000, max: Infinity, next: null      },
};

const TIER_STYLE: Record<LoyaltyTier, { badge: string; ring: string; bar: string }> = {
  Green:    { badge: 'bg-green-100 text-green-700',   ring: 'ring-green-300',   bar: '#22c55e' },
  Silver:   { badge: 'bg-slate-100 text-slate-600',   ring: 'ring-slate-300',   bar: '#94a3b8' },
  Gold:     { badge: 'bg-amber-100 text-amber-700',   ring: 'ring-amber-300',   bar: '#f59e0b' },
  Platinum: { badge: 'bg-purple-100 text-purple-700', ring: 'ring-purple-300',  bar: '#a78bfa' },
};

const EVENT_STYLE = {
  Earn:   { bg: 'bg-emerald-50 text-emerald-700', sign: '+', color: 'text-emerald-600' },
  Redeem: { bg: 'bg-blue-50 text-blue-700',       sign: '-', color: 'text-red-500'     },
  Bonus:  { bg: 'bg-amber-50 text-amber-700',     sign: '+', color: 'text-emerald-600' },
  Expire: { bg: 'bg-red-50 text-red-600',         sign: '-', color: 'text-red-500'     },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY_MS = new Date('2026-05-27').getTime();
const EXPIRY_WINDOW_MS = 60 * 86_400_000;

function normaliseMobile(m: string) {
  return m.replace(/\D/g, '').slice(-10);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoyaltyLookupTab() {
  const [query, setQuery] = useState('');

  const farmer = useMemo(() => {
    const q = normaliseMobile(query);
    if (q.length < 10) return null;
    return mockFarmers.find(f => normaliseMobile(f.mobile) === q) ?? null;
  }, [query]);

  const wallet = farmer ? (walletByFarmerId.get(farmer.id) ?? null) : null;

  const tierProgress = useMemo(() => {
    if (!wallet) return null;
    const band = TIER_BANDS[wallet.tier];
    if (!band.next) return { pct: 100, needed: 0, nextTier: null as LoyaltyTier | null };
    const bandSpan = band.max - band.min + 1;
    const inBand   = Math.min(wallet.lifetimePoints - band.min, bandSpan);
    const pct      = Math.max(0, Math.min(100, (inBand / bandSpan) * 100));
    const needed   = Math.max(0, band.max + 1 - wallet.lifetimePoints);
    return { pct, needed, nextTier: band.next };
  }, [wallet]);

  const expiringPoints = useMemo(() => {
    if (!wallet?.nearestExpiryDate) return null;
    const expiryMs = new Date(wallet.nearestExpiryDate).getTime();
    if (expiryMs - TODAY_MS <= EXPIRY_WINDOW_MS) {
      const daysLeft = Math.round((expiryMs - TODAY_MS) / 86_400_000);
      return { points: wallet.nearestExpiryPoints ?? 0, daysLeft, date: wallet.nearestExpiryDate };
    }
    return null;
  }, [wallet]);

  const history = useMemo(() => {
    if (!farmer) return [];
    return mockSaleTransactions
      .filter(t => t.farmerId === farmer.id)
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))
      .flatMap(t => {
        const storeName = storeById.get(t.storeId)?.name ?? t.storeId;
        const rows: { date: string; type: 'Earn' | 'Redeem' | 'Bonus' | 'Expire'; points: number; invoiceRef: string; store: string }[] = [];
        if (t.loyaltyPointsEarned  > 0) rows.push({ date: t.invoiceDate, type: 'Earn',   points: t.loyaltyPointsEarned,    invoiceRef: t.invoiceNo, store: storeName });
        if (t.loyaltyPointsRedeemed > 0) rows.push({ date: t.invoiceDate, type: 'Redeem', points: t.loyaltyPointsRedeemed, invoiceRef: t.invoiceNo, store: storeName });
        return rows;
      });
  }, [farmer]);

  const style = wallet ? TIER_STYLE[wallet.tier] : null;
  const normalised = normaliseMobile(query);

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Search input */}
      <div className="relative">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Enter farmer's mobile number (+91 or 10-digit)"
        />
        {normalised.length >= 10 && !farmer && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <span className="text-xs text-red-500 font-medium">Not found</span>
          </div>
        )}
      </div>

      {/* Not found message */}
      {normalised.length >= 10 && !farmer && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle size={15} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            No farmer registered with this number. They may be unregistered or may have used a different mobile at enrolment.
          </p>
        </div>
      )}

      {/* Wallet card */}
      {farmer && wallet && style && tierProgress && (
        <div className="space-y-4">
          {/* Profile strip */}
          <div className={`bg-white rounded-2xl border-2 ring-2 ${style.ring} p-5`}>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                <User size={26} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900">{farmer.name}</h3>
                  <Badge variant={getTierVariant(wallet.tier)}>{wallet.tier}</Badge>
                  {farmer.kycStatus === 'Verified' && (
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">KYC ✓</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{farmer.mobile}</p>
                <p className="text-[11px] text-gray-400">
                  {farmer.address.village && `${farmer.address.village}, `}{farmer.address.district}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Balance</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none mt-0.5">
                  {wallet.currentPoints.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-gray-500">points</p>
                <p className="text-[10px] text-emerald-600 mt-1 font-semibold">
                  = ₹{(wallet.currentPoints / 10).toLocaleString('en-IN', { maximumFractionDigits: 0 })} redeemable
                </p>
              </div>
            </div>

            {/* Tier progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{wallet.tier}</span>
                {tierProgress.nextTier
                  ? <span>{tierProgress.needed.toLocaleString('en-IN')} pts to {tierProgress.nextTier}</span>
                  : <span className="text-purple-600 font-semibold">Top Tier</span>
                }
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${tierProgress.pct}%`, backgroundColor: TIER_STYLE[wallet.tier].bar }}
                />
              </div>
              <p className="text-[9px] text-gray-400 mt-0.5">
                Lifetime pts: {wallet.lifetimePoints.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Expiry alert */}
          {expiringPoints && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock size={14} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <span className="font-semibold">{expiringPoints.points.toLocaleString('en-IN')} points</span> expire
                on {expiringPoints.date} ({expiringPoints.daysLeft} days). Redeem at POS to avoid loss.
              </p>
            </div>
          )}

          {/* Stat chips */}
          <div className="grid grid-cols-3 gap-3">
            <Card padding="12px">
              <div className="text-center">
                <Coins size={14} className="text-emerald-500 mx-auto mb-1" />
                <p className="text-[10px] text-gray-400">Lifetime Earned</p>
                <p className="text-sm font-bold text-gray-800">{wallet.lifetimePoints.toLocaleString('en-IN')}</p>
              </div>
            </Card>
            <Card padding="12px">
              <div className="text-center">
                <Star size={14} className="text-amber-500 mx-auto mb-1" />
                <p className="text-[10px] text-gray-400">Current Balance</p>
                <p className="text-sm font-bold text-gray-800">{wallet.currentPoints.toLocaleString('en-IN')}</p>
              </div>
            </Card>
            <Card padding="12px">
              <div className="text-center">
                <TrendingUp size={14} className="text-blue-500 mx-auto mb-1" />
                <p className="text-[10px] text-gray-400">To Next Tier</p>
                <p className="text-sm font-bold text-gray-800">
                  {wallet.tier === 'Platinum' ? '—' : wallet.pointsToNextTier.toLocaleString('en-IN')}
                </p>
              </div>
            </Card>
          </div>

          {/* Transaction history */}
          <Card padding="0">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Transaction History</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{history.length} events</p>
            </div>
            {history.length === 0 ? (
              <div className="py-10 text-center">
                <Sprout size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No loyalty transactions yet</p>
              </div>
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th right>Points</Th>
                    <Th>Invoice Ref</Th>
                    <Th>Store</Th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => {
                    const s = EVENT_STYLE[row.type];
                    return (
                      <Tr key={i}>
                        <Td muted>{row.date}</Td>
                        <Td>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg}`}>
                            {row.type}
                          </span>
                        </Td>
                        <Td right>
                          <span className={`font-semibold tabular-nums ${s.color}`}>
                            {s.sign}{row.points.toLocaleString('en-IN')}
                          </span>
                        </Td>
                        <Td mono>{row.invoiceRef}</Td>
                        <Td>
                          <span className="max-w-[180px] truncate block text-gray-600">{row.store}</span>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            )}
          </Card>
        </div>
      )}

      {/* Empty state — no query yet */}
      {query.length < 3 && (
        <EmptyState
          icon={Search}
          title="Enter a 10-digit mobile number"
          subtitle="to look up a farmer's loyalty wallet"
        />
      )}
    </div>
  );
}
