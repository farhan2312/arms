// FarmerProfile — full detail view with 4 tabs, rendered as a SlideOver panel
import { useState, useMemo } from 'react';
import { Phone, MapPin, Sprout, Flag, CheckCircle2, AlertCircle } from 'lucide-react';
import Badge, { getTierVariant, getStatusVariant } from '../../components/ui/Badge';
import Card, { CardHeader } from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import SlideOver from '../../components/ui/SlideOver';
import Stat from '../../components/ui/Stat';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';
import { mockStores } from '../../data/mockStores';
import { MOCK_USERS } from '../../data/mockUsers';
import type { Farmer } from '../../types/entities';
import type { OutreachEntry } from './OutreachLog';

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = '2026-05-26';
const SIXTY_DAY_CUTOFF = '2026-07-25';

const TIER_BAR: Record<string, string> = {
  Green: 'bg-emerald-500', Silver: 'bg-gray-400', Gold: 'bg-yellow-400', Platinum: 'bg-orange-400',
};

// Lifetime point ranges per tier
const TIER_RANGE: Record<string, [number, number]> = {
  Green: [0, 999], Silver: [1000, 4999], Gold: [5000, 14999], Platinum: [15000, 100000],
};

const storeById = new Map(mockStores.map(s => [s.id, s]));
const userById = new Map(MOCK_USERS.map(u => [u.id, u]));

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  farmer: Farmer;
  preferredLanguage?: string;
  outreachLogs: OutreachEntry[];
  isFlagged: boolean;
  onToggleFlag: () => void;
  onBack: () => void;
}

type Tab = 'purchases' | 'wallet' | 'outreach' | 'coupons';

// ── Component ─────────────────────────────────────────────────────────────────

export default function FarmerProfile({ farmer, preferredLanguage, outreachLogs, isFlagged, onToggleFlag, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('purchases');

  const wallet = walletByFarmerId.get(farmer.id);

  const farmerTxns = useMemo(() =>
    mockSaleTransactions
      .filter(t => t.farmerId === farmer.id)
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)),
    [farmer.id],
  );

  const farmerOutreach = useMemo(() =>
    outreachLogs
      .filter(log => log.farmerOutcomes.some(o => o.farmerId === farmer.id))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [outreachLogs, farmer.id],
  );

  // Tier progress
  const tierPct = useMemo(() => {
    if (!wallet) return 0;
    if (wallet.tier === 'Platinum') return 100;
    const [min, max] = TIER_RANGE[wallet.tier];
    return Math.min(100, Math.round(((wallet.lifetimePoints - min) / (max - min + 1)) * 100));
  }, [wallet]);

  // Wallet event log derived from transactions
  const walletEvents = useMemo(() => {
    type Event = { date: string; type: 'Earn' | 'Redeem'; points: number; invoiceNo: string; storeId: string };
    const events: Event[] = [];
    farmerTxns.forEach(t => {
      if (t.loyaltyPointsEarned > 0)
        events.push({ date: t.invoiceDate, type: 'Earn', points: t.loyaltyPointsEarned, invoiceNo: t.invoiceNo, storeId: t.storeId });
      if (t.loyaltyPointsRedeemed > 0)
        events.push({ date: t.invoiceDate, type: 'Redeem', points: t.loyaltyPointsRedeemed, invoiceNo: t.invoiceNo, storeId: t.storeId });
    });
    return events.sort((a, b) => b.date.localeCompare(a.date));
  }, [farmerTxns]);

  const hasExpiringPoints = wallet?.nearestExpiryDate && wallet.nearestExpiryDate <= SIXTY_DAY_CUTOFF;

  // Compute stats for Stat row
  const totalSpend = farmerTxns.reduce((sum, t) => sum + t.totalAmt, 0);
  const lastVisit = farmerTxns.length > 0 ? fmtDate(farmerTxns[0].invoiceDate) : '—';

  const PROFILE_TABS = [
    { id: 'purchases', label: `Purchases (${farmerTxns.length})` },
    { id: 'wallet',    label: 'Loyalty Wallet' },
    { id: 'outreach',  label: `Outreach (${farmerOutreach.length})` },
    { id: 'coupons',   label: 'Active Coupons' },
  ];

  const subtitle = [farmer.address.village, farmer.address.district, farmer.address.state]
    .filter(Boolean).join(', ');

  return (
    <SlideOver
      open={true}
      onClose={onBack}
      title={farmer.name}
      subtitle={subtitle}
      width={680}
    >
      <div className="space-y-5">
        {/* Flag banner */}
        {isFlagged && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
            This farmer has been flagged for outreach follow-up.
          </div>
        )}

        {/* Header card */}
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl flex-shrink-0">
                {farmer.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-900">{farmer.name}</h2>
                  {wallet && <Badge variant={getTierVariant(wallet.tier)}>{wallet.tier}</Badge>}
                  <Badge variant={getStatusVariant(farmer.kycStatus)}>{farmer.kycStatus}</Badge>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Phone size={11} /> {farmer.mobile}</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} />
                    {[farmer.address.village, farmer.address.taluka, farmer.address.district, farmer.address.state].filter(Boolean).join(', ')}
                  </span>
                  <span>{farmer.landAcres} acres</span>
                  {preferredLanguage && <span>Language: {preferredLanguage}</span>}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {farmer.cropTypes.map(c => (
                    <span key={c} className="flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                      <Sprout size={9} /> {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant={isFlagged ? 'danger' : 'secondary'}
              iconLeft={Flag}
              onClick={onToggleFlag}
            >
              {isFlagged ? 'Remove Flag' : 'Flag for Outreach'}
            </Button>
          </div>

          {/* Stat row */}
          <div
            className="flex flex-wrap gap-6 mt-5 pt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <Stat label="Total Spend" value={`₹${totalSpend.toLocaleString('en-IN')}`} />
            <Stat label="Visits" value={farmerTxns.length} />
            <Stat label="Points" value={wallet ? wallet.currentPoints.toLocaleString('en-IN') : '—'} />
            <Stat label="Last Visit" value={lastVisit} />
          </div>
        </Card>

        {/* Tabs */}
        <div style={{ marginBottom: '4px' }}>
          <Tabs
            tabs={PROFILE_TABS}
            activeTab={tab}
            onTabChange={(id) => setTab(id as Tab)}
          />
        </div>

        {/* Tab: Purchase History */}
        {tab === 'purchases' && (
          <Card padding="0">
            <CardHeader title="Purchase History" subtitle={`${farmerTxns.length} transactions`} />
            {farmerTxns.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No purchase history for this farmer.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Date</Th>
                      <Th>Invoice</Th>
                      <Th>Store</Th>
                      <Th>Products</Th>
                      <Th right>Value</Th>
                      <Th right>Pts Earned</Th>
                      <Th>Payment</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmerTxns.map(t => {
                      const store = storeById.get(t.storeId);
                      const products = t.lines.map(l => l.productName).join(', ');
                      return (
                        <Tr key={t.id}>
                          <Td>{fmtDate(t.invoiceDate)}</Td>
                          <Td mono muted>{t.invoiceNo}</Td>
                          <Td muted>{store?.code ?? t.storeId}</Td>
                          <Td>
                            <span className="max-w-48 truncate block" title={products}>{products}</span>
                          </Td>
                          <Td right bold>₹{t.totalAmt.toLocaleString('en-IN')}</Td>
                          <Td right>
                            <span className="text-emerald-600 font-medium">
                              {t.loyaltyPointsEarned > 0 ? `+${t.loyaltyPointsEarned}` : '—'}
                            </span>
                          </Td>
                          <Td>
                            <Badge variant="gray">{t.paymentMode}</Badge>
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </TableWrap>
              </div>
            )}
          </Card>
        )}

        {/* Tab: Loyalty Wallet */}
        {tab === 'wallet' && (
          <div className="space-y-4">
            {!wallet ? (
              <Card>
                <p className="text-center text-sm text-gray-400">No loyalty wallet found.</p>
              </Card>
            ) : (
              <>
                {/* Expiry alert */}
                {hasExpiringPoints && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                    <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                    <span>
                      <strong>{wallet.nearestExpiryPoints?.toLocaleString('en-IN')} points</strong> expiring on {wallet.nearestExpiryDate} — within 60 days
                    </span>
                  </div>
                )}

                {/* Balance card */}
                <Card>
                  <CardHeader
                    title="Current Balance"
                    right={<Badge variant={getTierVariant(wallet.tier)}>{wallet.tier}</Badge>}
                  />
                  <p className="text-3xl font-bold text-gray-900">{wallet.currentPoints.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Lifetime: {wallet.lifetimePoints.toLocaleString('en-IN')} pts</p>

                  {/* Progress bar */}
                  {wallet.tier !== 'Platinum' && (
                    <div style={{ marginTop: '20px' }}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{wallet.tier}</span>
                        <span className="text-gray-400">{wallet.pointsToNextTier.toLocaleString('en-IN')} pts to next tier</span>
                        <span>{wallet.tier === 'Gold' ? 'Platinum' : wallet.tier === 'Silver' ? 'Gold' : 'Silver'}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${TIER_BAR[wallet.tier]}`}
                          style={{ width: `${tierPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 text-right">{tierPct}% of the way to next tier</p>
                    </div>
                  )}
                  {wallet.tier === 'Platinum' && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 font-medium mt-3">
                      <CheckCircle2 size={13} /> Top tier — Platinum member
                    </div>
                  )}
                </Card>

                {/* Event log */}
                <Card padding="0">
                  <div style={{ padding: '20px 20px 0' }}>
                    <CardHeader title="Transaction History" />
                  </div>
                  {walletEvents.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-400">No loyalty events recorded.</p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {walletEvents.map((ev, i) => (
                        <li key={i} className="flex items-center justify-between px-5 py-3">
                          <div>
                            <Badge variant={ev.type === 'Earn' ? 'green' : 'blue'}>{ev.type}</Badge>
                            <span className="text-xs text-gray-500 ml-2">{ev.invoiceNo}</span>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${ev.type === 'Earn' ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {ev.type === 'Earn' ? '+' : '−'}{ev.points} pts
                            </p>
                            <p className="text-[10px] text-gray-400">{fmtDate(ev.date)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )}
          </div>
        )}

        {/* Tab: Outreach History */}
        {tab === 'outreach' && (
          <div className="space-y-3">
            {farmerOutreach.length === 0 ? (
              <Card>
                <p className="text-center text-sm text-gray-400">No outreach visits recorded for this farmer.</p>
              </Card>
            ) : (
              farmerOutreach.map(log => {
                const conductor = userById.get(log.conductedByUserId);
                const outcome = log.farmerOutcomes.find(o => o.farmerId === farmer.id);
                return (
                  <Card key={log.id}>
                    <CardHeader
                      title={`${log.village}, ${log.taluka}`}
                      subtitle={`${fmtDate(log.date)} · Conducted by ${conductor?.name ?? log.conductedByUserId}`}
                    />
                    {outcome?.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{outcome.notes}</p>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Active Coupons */}
        {tab === 'coupons' && (
          <Card>
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No active coupons</p>
              <p className="text-xs text-gray-400">
                Coupons assigned to mobile{' '}
                <span className="font-mono">{farmer.mobile}</span> will appear here once the coupon module is connected.
              </p>
            </div>
          </Card>
        )}

        <p className="text-[10px] text-gray-300 text-right">
          Registered {fmtDate(farmer.registeredAt)} · ID {farmer.id} · Last activity {wallet ? wallet.lastActivityAt.slice(0, 10) : TODAY}
        </p>
      </div>
    </SlideOver>
  );
}
