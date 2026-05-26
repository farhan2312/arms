import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import { mockFarmers, farmerById } from '../../data/mockFarmers';
import { mockLoyaltyWallets, walletByFarmerId } from '../../data/mockLoyaltyWallets';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import type { LoyaltyEventType } from '../../types/loyalty';

// Derive recent loyalty events from sale transactions (Earn events only for display)
const recentEvents = mockSaleTransactions
  .filter((t) => t.loyaltyPointsEarned > 0 || t.loyaltyPointsRedeemed > 0)
  .slice(0, 12)
  .flatMap((t) => {
    const farmer = farmerById.get(t.farmerId);
    const events: { id: string; farmerId: string; farmerName: string; type: LoyaltyEventType; points: number; ref: string; createdAt: string }[] = [];
    if (t.loyaltyPointsEarned > 0) {
      events.push({ id: `${t.id}-earn`, farmerId: t.farmerId, farmerName: farmer?.name ?? t.farmerId, type: 'Earn', points: t.loyaltyPointsEarned, ref: t.invoiceNo, createdAt: t.createdAt });
    }
    if (t.loyaltyPointsRedeemed > 0) {
      events.push({ id: `${t.id}-redeem`, farmerId: t.farmerId, farmerName: farmer?.name ?? t.farmerId, type: 'Redeem', points: t.loyaltyPointsRedeemed, ref: t.invoiceNo, createdAt: t.createdAt });
    }
    return events;
  });

// Leaderboard: sorted by currentPoints descending
const leaderboard = mockFarmers
  .map((f) => ({ farmer: f, wallet: walletByFarmerId.get(f.id) }))
  .filter((r) => r.wallet !== undefined)
  .sort((a, b) => (b.wallet!.currentPoints) - (a.wallet!.currentPoints));

const TIER_COLORS: Record<string, 'green' | 'gray' | 'yellow' | 'orange'> = {
  Green: 'green',
  Silver: 'gray',
  Gold: 'yellow',
  Platinum: 'orange',
};

export default function LoyaltyPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'leaderboard' | 'transactions'>('leaderboard');

  const totalPoints = mockLoyaltyWallets.reduce((s, w) => s + w.currentPoints, 0);
  const totalRedeemed = mockSaleTransactions.reduce((s, t) => s + t.loyaltyPointsRedeemed, 0);

  const filteredLeaderboard = leaderboard.filter((r) =>
    r.farmer.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredEvents = recentEvents.filter((e) =>
    e.farmerName.toLowerCase().includes(search.toLowerCase()) ||
    e.ref.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Loyalty Programme"
        subtitle="Farmer reward points — earning, redemption and leaderboard"
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Active Points</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {totalPoints.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Points Redeemed MTD</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalRedeemed.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Enrolled Farmers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockLoyaltyWallets.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['leaderboard', 'transactions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'leaderboard' ? 'Leaderboard' : 'Recent Events'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === 'leaderboard' ? 'Search farmers...' : 'Search events...'}
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>

      {tab === 'leaderboard' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide w-12">#</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Farmer</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Location</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Tier</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Crops</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLeaderboard.map(({ farmer, wallet }, idx) => (
                <tr key={farmer.id} className={`hover:bg-gray-50 transition-colors ${idx < 3 ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-5 py-3.5">
                    {idx === 0 ? (
                      <span className="text-lg">🥇</span>
                    ) : idx === 1 ? (
                      <span className="text-lg">🥈</span>
                    ) : idx === 2 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-800 text-xs">{farmer.name}</p>
                    <p className="text-gray-400 text-[11px]">{farmer.mobile}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">
                    {farmer.address.village ? `${farmer.address.village}, ` : ''}{farmer.address.district}
                  </td>
                  <td className="px-5 py-3.5">
                    {wallet && <Badge label={wallet.tier} variant={TIER_COLORS[wallet.tier] ?? 'gray'} />}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {farmer.cropTypes.slice(0, 2).map((c) => (
                        <span key={c} className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="flex items-center justify-end gap-1 font-bold text-emerald-700 text-sm">
                      <Star size={12} className="fill-emerald-500 text-emerald-500" />
                      {wallet?.currentPoints.toLocaleString('en-IN') ?? '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Farmer</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Type</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Points</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Invoice Ref.</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-medium text-gray-800">{event.farmerName}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={event.type} variant={statusVariant(event.type)} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-sm font-bold ${event.type === 'Earn' || event.type === 'Bonus' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {event.type === 'Earn' || event.type === 'Bonus' ? '+' : '-'}{event.points}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{event.ref}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {new Date(event.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
