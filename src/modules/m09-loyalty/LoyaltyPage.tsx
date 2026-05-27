import { useState } from 'react';
import { Star, Users, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Badge, { statusVariant } from '../../components/ui/Badge';
import KpiCard from '../../components/ui/KpiCard';
import { SearchInput } from '../../components/ui/Input';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
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

const LOYALTY_TABS = [
  { id: 'leaderboard',   label: 'Leaderboard' },
  { id: 'transactions',  label: 'Recent Events' },
];

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

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Total Active Points"
          value={totalPoints.toLocaleString('en-IN')}
          icon={Star}
          iconBg="#fef9c3"
          iconColor="#ca8a04"
        />
        <KpiCard
          label="Points Redeemed MTD"
          value={totalRedeemed.toLocaleString('en-IN')}
          icon={TrendingUp}
          iconBg="#dbeafe"
          iconColor="#1d4ed8"
        />
        <KpiCard
          label="Enrolled Farmers"
          value={mockLoyaltyWallets.length}
          icon={Users}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <Tabs
          tabs={LOYALTY_TABS}
          activeTab={tab}
          onTabChange={(id) => setTab(id as 'leaderboard' | 'transactions')}
        />
      </div>

      {/* Search */}
      <div className="mb-5" style={{ maxWidth: '320px' }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={tab === 'leaderboard' ? 'Search farmers...' : 'Search events...'}
        />
      </div>

      {tab === 'leaderboard' ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Farmer</Th>
              <Th>Location</Th>
              <Th>Tier</Th>
              <Th>Crops</Th>
              <Th right>Points</Th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboard.map(({ farmer, wallet }, idx) => (
              <Tr key={farmer.id} className={idx < 3 ? 'bg-amber-50/40' : ''}>
                <Td>
                  {idx === 0 ? (
                    <span className="text-lg">🥇</span>
                  ) : idx === 1 ? (
                    <span className="text-lg">🥈</span>
                  ) : idx === 2 ? (
                    <span className="text-lg">🥉</span>
                  ) : (
                    <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                  )}
                </Td>
                <Td>
                  <p className="font-medium text-gray-800 text-xs">{farmer.name}</p>
                  <p className="text-gray-400 text-[11px]">{farmer.mobile}</p>
                </Td>
                <Td muted>
                  {farmer.address.village ? `${farmer.address.village}, ` : ''}{farmer.address.district}
                </Td>
                <Td>
                  {wallet && <Badge label={wallet.tier} variant={TIER_COLORS[wallet.tier] ?? 'gray'} />}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {farmer.cropTypes.slice(0, 2).map((c) => (
                      <span key={c} className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{c}</span>
                    ))}
                  </div>
                </Td>
                <Td right>
                  <span className="flex items-center justify-end gap-1 font-bold text-emerald-700 text-sm">
                    <Star size={12} className="fill-emerald-500 text-emerald-500" />
                    {wallet?.currentPoints.toLocaleString('en-IN') ?? '—'}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Farmer</Th>
              <Th>Type</Th>
              <Th right>Points</Th>
              <Th>Invoice Ref.</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <Tr key={event.id}>
                <Td bold>{event.farmerName}</Td>
                <Td>
                  <Badge label={event.type} variant={statusVariant(event.type)} />
                </Td>
                <Td right>
                  <span className={`text-sm font-bold ${event.type === 'Earn' || event.type === 'Bonus' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {event.type === 'Earn' || event.type === 'Bonus' ? '+' : '-'}{event.points}
                  </span>
                </Td>
                <Td mono muted>{event.ref}</Td>
                <Td muted>
                  {new Date(event.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
