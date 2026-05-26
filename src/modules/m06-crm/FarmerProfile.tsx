// FarmerProfile — full detail view with 4 tabs
import { useState, useMemo } from 'react';
import { ArrowLeft, Phone, MapPin, Sprout, Flag, CheckCircle2, AlertCircle } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';
import { mockStores } from '../../data/mockStores';
import { MOCK_USERS } from '../../data/mockUsers';
import type { Farmer } from '../../types/entities';
import type { OutreachEntry } from './OutreachLog';

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = '2026-05-26';
const SIXTY_DAY_CUTOFF = '2026-07-25';

const TIER_BADGE: Record<string, BadgeVariant> = {
  Green: 'green', Silver: 'gray', Gold: 'yellow', Platinum: 'orange',
};

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

  const TABS: { id: Tab; label: string }[] = [
    { id: 'purchases', label: `Purchases (${farmerTxns.length})` },
    { id: 'wallet',    label: 'Loyalty Wallet' },
    { id: 'outreach',  label: `Outreach (${farmerOutreach.length})` },
    { id: 'coupons',   label: 'Active Coupons' },
  ];

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={15} /> Back to Farmers
      </button>

      {/* Flag banner */}
      {isFlagged && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
          This farmer has been flagged for outreach follow-up.
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl flex-shrink-0">
              {farmer.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{farmer.name}</h2>
                {wallet && <Badge label={wallet.tier} variant={TIER_BADGE[wallet.tier] ?? 'gray'} />}
                <Badge
                  label={farmer.kycStatus}
                  variant={farmer.kycStatus === 'Verified' ? 'green' : farmer.kycStatus === 'Rejected' ? 'red' : 'yellow'}
                />
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

              {wallet && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{wallet.currentPoints.toLocaleString('en-IN')} pts</span>
                  <span className="text-xs text-gray-400">balance</span>
                  <span className="text-sm font-bold text-gray-700">{wallet.lifetimePoints.toLocaleString('en-IN')} pts</span>
                  <span className="text-xs text-gray-400">lifetime</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onToggleFlag}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex-shrink-0 ${
              isFlagged
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Flag size={14} />
            {isFlagged ? 'Remove Flag' : 'Flag for Outreach'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Purchase History */}
      {tab === 'purchases' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {farmerTxns.length === 0 ? (
            <p className="p-6 text-sm text-gray-400 text-center">No purchase history for this farmer.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Date', 'Invoice', 'Store', 'Products', 'Value', 'Pts Earned', 'Payment'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {farmerTxns.map(t => {
                    const store = storeById.get(t.storeId);
                    const products = t.lines.map(l => l.productName).join(', ');
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDate(t.invoiceDate)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.invoiceNo}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{store?.code ?? t.storeId}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-48 truncate" title={products}>{products}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">₹{t.totalAmt.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-emerald-600 font-medium text-center">{t.loyaltyPointsEarned > 0 ? `+${t.loyaltyPointsEarned}` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.paymentMode}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Loyalty Wallet */}
      {tab === 'wallet' && (
        <div className="space-y-4">
          {!wallet ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">No loyalty wallet found.</div>
          ) : (
            <>
              {/* Expiry alert */}
              {hasExpiringPoints && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                  <span><strong>{wallet.nearestExpiryPoints?.toLocaleString('en-IN')} points</strong> expiring on {wallet.nearestExpiryDate} — within 60 days</span>
                </div>
              )}

              {/* Balance card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Current Balance</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{wallet.currentPoints.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Lifetime: {wallet.lifetimePoints.toLocaleString('en-IN')} pts</p>
                  </div>
                  <Badge label={wallet.tier} variant={TIER_BADGE[wallet.tier] ?? 'gray'} />
                </div>

                {/* Progress bar */}
                {wallet.tier !== 'Platinum' && (
                  <div>
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
                  <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
                    <CheckCircle2 size={13} /> Top tier — Platinum member
                  </div>
                )}
              </div>

              {/* Event log */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Transaction History</h3>
                </div>
                {walletEvents.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400">No loyalty events recorded.</p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {walletEvents.map((ev, i) => (
                      <li key={i} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${
                            ev.type === 'Earn' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {ev.type}
                          </span>
                          <span className="text-xs text-gray-500">{ev.invoiceNo}</span>
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
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Outreach History */}
      {tab === 'outreach' && (
        <div className="space-y-3">
          {farmerOutreach.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
              No outreach visits recorded for this farmer.
            </div>
          ) : (
            farmerOutreach.map(log => {
              const conductor = userById.get(log.conductedByUserId);
              const outcome = log.farmerOutcomes.find(o => o.farmerId === farmer.id);
              return (
                <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{log.village}, {log.taluka}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {fmtDate(log.date)} · Conducted by {conductor?.name ?? log.conductedByUserId}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">{fmtDate(log.date)}</span>
                  </div>
                  {outcome?.notes && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">{outcome.notes}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Active Coupons */}
      {tab === 'coupons' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={22} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No active coupons</p>
          <p className="text-xs text-gray-400">
            Coupons assigned to mobile{' '}
            <span className="font-mono">{farmer.mobile}</span> will appear here once the coupon module is connected.
          </p>
        </div>
      )}

      <p className="text-[10px] text-gray-300 text-right">
        Registered {fmtDate(farmer.registeredAt)} · ID {farmer.id} · Last activity {wallet ? wallet.lastActivityAt.slice(0, 10) : TODAY}
      </p>
    </div>
  );
}
