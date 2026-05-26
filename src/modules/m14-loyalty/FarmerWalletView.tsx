// Farmer Wallet View — used by StoreIncharge on POS lookup
// swap for API: GET /api/loyalty/wallet?mobile=<number>

import { useState, useMemo } from 'react';
import { Search, User, Star, Clock, Coins, TrendingUp, AlertCircle, Sprout } from 'lucide-react';
import { mockFarmers } from '../../data/mockFarmers';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { storeById } from '../../data/mockStores';
import type { LoyaltyTier } from '../../types/loyalty';

// ── Tier config ───────────────────────────────────────────────────────────────

interface TierBand {
  min: number;
  max: number;
  next: LoyaltyTier | null;
  nextLabel: string;
}

const TIER_BANDS: Record<LoyaltyTier, TierBand> = {
  Green:    { min: 0,     max: 999,   next: 'Silver',   nextLabel: 'Silver'   },
  Silver:   { min: 1000,  max: 4999,  next: 'Gold',     nextLabel: 'Gold'     },
  Gold:     { min: 5000,  max: 14999, next: 'Platinum', nextLabel: 'Platinum' },
  Platinum: { min: 15000, max: Infinity, next: null,    nextLabel: 'Top tier' },
};

const TIER_STYLE: Record<LoyaltyTier, { badge: string; ring: string; bar: string }> = {
  Green:    { badge: 'bg-green-100 text-green-700',   ring: 'ring-green-300',   bar: '#22c55e' },
  Silver:   { badge: 'bg-slate-100 text-slate-600',   ring: 'ring-slate-300',   bar: '#94a3b8' },
  Gold:     { badge: 'bg-amber-100 text-amber-700',   ring: 'ring-amber-300',   bar: '#f59e0b' },
  Platinum: { badge: 'bg-purple-100 text-purple-700', ring: 'ring-purple-300',  bar: '#a78bfa' },
};

const EVENT_TYPE_STYLE = {
  Earn:   { bg: 'bg-emerald-50 text-emerald-700', sign: '+' },
  Redeem: { bg: 'bg-blue-50 text-blue-700',       sign: '-' },
  Bonus:  { bg: 'bg-amber-50 text-amber-700',     sign: '+' },
  Expire: { bg: 'bg-red-50 text-red-600',         sign: '-' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY_MS = new Date('2026-05-26').getTime();
const EXPIRY_WINDOW_MS = 60 * 86_400_000; // 60 days

function normaliseMobile(m: string) {
  return m.replace(/\D/g, '').slice(-10);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FarmerWalletView() {
  const [query, setQuery] = useState('');

  const farmer = useMemo(() => {
    const q = normaliseMobile(query);
    if (q.length < 10) return null;
    return mockFarmers.find(f => normaliseMobile(f.mobile) === q) ?? null;
  }, [query]);

  const wallet = farmer ? walletByFarmerId.get(farmer.id) ?? null : null;

  // Derived: tier progress
  const tierProgress = useMemo(() => {
    if (!wallet) return null;
    const band = TIER_BANDS[wallet.tier];
    if (!band.next) return { pct: 100, needed: 0, nextTier: null };
    const bandSpan = band.max - band.min + 1;
    const inBand   = Math.min(wallet.lifetimePoints - band.min, bandSpan);
    const pct      = Math.max(0, Math.min(100, (inBand / bandSpan) * 100));
    const needed   = band.max + 1 - wallet.lifetimePoints;
    return { pct, needed: Math.max(0, needed), nextTier: band.next };
  }, [wallet]);

  // Derived: points expiring within 60 days
  const expiringPoints = useMemo(() => {
    if (!wallet?.nearestExpiryDate) return null;
    const expiryMs = new Date(wallet.nearestExpiryDate).getTime();
    if (expiryMs - TODAY_MS <= EXPIRY_WINDOW_MS) {
      const daysLeft = Math.round((expiryMs - TODAY_MS) / 86_400_000);
      return { points: wallet.nearestExpiryPoints ?? 0, daysLeft, date: wallet.nearestExpiryDate };
    }
    return null;
  }, [wallet]);

  // Derived: transaction history from sale transactions
  const history = useMemo(() => {
    if (!farmer) return [];
    const rows: {
      date: string;
      type: 'Earn' | 'Redeem' | 'Bonus' | 'Expire';
      points: number;
      invoiceRef: string;
      store: string;
    }[] = [];

    const txns = mockSaleTransactions
      .filter(t => t.farmerId === farmer.id)
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));

    for (const t of txns) {
      const storeName = storeById.get(t.storeId)?.name ?? t.storeId;
      if (t.loyaltyPointsEarned > 0) {
        rows.push({ date: t.invoiceDate, type: 'Earn', points: t.loyaltyPointsEarned, invoiceRef: t.invoiceNo, store: storeName });
      }
      if (t.loyaltyPointsRedeemed > 0) {
        rows.push({ date: t.invoiceDate, type: 'Redeem', points: t.loyaltyPointsRedeemed, invoiceRef: t.invoiceNo, store: storeName });
      }
    }
    return rows;
  }, [farmer]);

  const style = wallet ? TIER_STYLE[wallet.tier] : null;

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Farmer Wallet Lookup</h1>
        <p className="text-sm text-gray-500 mt-0.5">Enter mobile number to view loyalty wallet</p>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="tel"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="+91 9XXXXXXXXX or 10-digit number"
          className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
        {query.length >= 3 && !farmer && normaliseMobile(query).length >= 10 && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <span className="text-xs text-red-500 font-medium">Not found</span>
          </div>
        )}
      </div>

      {/* ── Not found hint ───────────────────────────────────────────────── */}
      {query.length >= 10 && !farmer && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertCircle size={15} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            No farmer found for this number. The farmer may be unregistered or may have used a different number at enrolment.
          </p>
        </div>
      )}

      {/* ── Wallet card ─────────────────────────────────────────────────── */}
      {farmer && wallet && style && tierProgress && (
        <div className="space-y-4">
          {/* Profile strip */}
          <div className={`bg-white rounded-2xl border-2 ${style.ring} ring-2 p-5`}>
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                <User size={26} className="text-gray-400" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-gray-900">{farmer.name}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {wallet.tier}
                  </span>
                  {farmer.kycStatus === 'Verified' && (
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                      KYC ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{farmer.mobile}</p>
                <p className="text-[11px] text-gray-400">
                  {farmer.address.village && `${farmer.address.village}, `}{farmer.address.district}
                </p>
              </div>

              {/* Points balance */}
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
                {tierProgress.nextTier && (
                  <span>{tierProgress.needed.toLocaleString('en-IN')} pts to {tierProgress.nextTier}</span>
                )}
                {!tierProgress.nextTier && (
                  <span className="text-purple-600 font-semibold">Top Tier</span>
                )}
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${tierProgress.pct}%`, backgroundColor: TIER_STYLE[wallet.tier].bar }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>Lifetime pts: {wallet.lifetimePoints.toLocaleString('en-IN')}</span>
                {tierProgress.nextTier && (
                  <span>{TIER_BANDS[wallet.tier].max.toLocaleString('en-IN')} pts needed for {tierProgress.nextTier}</span>
                )}
              </div>
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
            <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 text-center">
              <Coins size={14} className="text-emerald-500 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">Lifetime Earned</p>
              <p className="text-sm font-bold text-gray-800">{wallet.lifetimePoints.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 text-center">
              <Star size={14} className="text-amber-500 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">Current Balance</p>
              <p className="text-sm font-bold text-gray-800">{wallet.currentPoints.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 text-center">
              <TrendingUp size={14} className="text-blue-500 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">To Next Tier</p>
              <p className="text-sm font-bold text-gray-800">
                {wallet.tier === 'Platinum' ? '—' : wallet.pointsToNextTier.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-50 text-gray-400">
                        <th className="text-left px-4 py-2.5 font-medium">Date</th>
                        <th className="text-left px-4 py-2.5 font-medium">Type</th>
                        <th className="text-right px-4 py-2.5 font-medium">Points</th>
                        <th className="text-left px-4 py-2.5 font-medium">Invoice Ref</th>
                        <th className="text-left px-4 py-2.5 font-medium">Store</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.map((row, i) => {
                        const s = EVENT_TYPE_STYLE[row.type];
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-600 tabular-nums">{row.date}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg}`}>
                                {row.type}
                              </span>
                            </td>
                            <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${
                              row.type === 'Earn' || row.type === 'Bonus' ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              {s.sign}{row.points.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px]">{row.invoiceRef}</td>
                            <td className="px-4 py-2.5 text-gray-600 max-w-[180px] truncate">{row.store}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!farmer && query.length < 10 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">Enter a 10-digit mobile number</p>
          <p className="text-xs text-gray-400 mt-1">to look up a farmer's loyalty wallet</p>
        </div>
      )}
    </div>
  );
}
