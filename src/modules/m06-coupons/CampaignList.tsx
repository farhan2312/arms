// CampaignList — table of all coupon campaigns with inline per-coupon detail

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { CouponCampaign, IssuedCoupon } from '../../data/mockCouponCampaigns';
import type { LoyaltyTier } from '../../types/loyalty';

const TODAY = '2026-05-27';

type CampaignStatus = 'Active' | 'Upcoming' | 'Expired';

function getCampaignStatus(c: CouponCampaign): CampaignStatus {
  if (c.endDate < TODAY) return 'Expired';
  if (c.startDate > TODAY) return 'Upcoming';
  return 'Active';
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtAmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDiscount(c: CouponCampaign): string {
  if (c.discountType === 'Flat') return `₹${fmtAmt(c.discountValue)} off`;
  if (c.discountType === 'Percentage') {
    const cap = c.maxDiscountAmt ? ` (max ₹${fmtAmt(c.maxDiscountAmt)})` : '';
    return `${c.discountValue}%${cap}`;
  }
  return 'Free Product';
}

const STATUS_STYLE: Record<CampaignStatus, string> = {
  Active:   'bg-emerald-100 text-emerald-700',
  Upcoming: 'bg-blue-100 text-blue-700',
  Expired:  'bg-gray-100 text-gray-500',
};

const TIER_STYLE: Record<LoyaltyTier, string> = {
  Green:    'bg-green-100 text-green-700',
  Silver:   'bg-gray-100 text-gray-600',
  Gold:     'bg-yellow-100 text-yellow-700',
  Platinum: 'bg-purple-100 text-purple-700',
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
      {status === 'Active'   && <CheckCircle2 size={10} />}
      {status === 'Upcoming' && <Clock size={10} />}
      {status === 'Expired'  && <XCircle size={10} />}
      {status}
    </span>
  );
}

function TierBadge({ tier }: { tier: LoyaltyTier }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${TIER_STYLE[tier]}`}>
      {tier}
    </span>
  );
}

interface Props {
  campaigns: CouponCampaign[];
  issuedCoupons: IssuedCoupon[];
  onCreateCampaign: () => void;
}

export default function CampaignList({ campaigns, issuedCoupons, onCreateCampaign }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Coupon Campaigns</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} on record
          </p>
        </div>
        <button
          onClick={onCreateCampaign}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={14} /> Create Campaign
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Campaign', 'Valid Dates', 'Discount', 'Min. Purchase', 'Coverage', 'Issued', 'Redeemed', 'Rate', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map(campaign => {
              const status = getCampaignStatus(campaign);
              const coupons = issuedCoupons.filter(c => c.campaignId === campaign.id);
              const issued = coupons.length;
              const redeemed = coupons.filter(c => c.redeemedAt).length;
              const rate = issued > 0 ? Math.round((redeemed / issued) * 100) : 0;
              const isExpanded = expandedIds.has(campaign.id);

              return (
                <>
                  <tr
                    key={campaign.id}
                    onClick={() => toggle(campaign.id)}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs font-semibold text-gray-800 truncate">{campaign.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{campaign.description}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {fmtDate(campaign.startDate)}<br />
                      <span className="text-gray-400">to</span> {fmtDate(campaign.endDate)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {formatDiscount(campaign)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      ₹{fmtAmt(campaign.minPurchaseValue)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {campaign.applicableProductIds.length > 0
                        ? `${campaign.applicableProductIds.length} products`
                        : 'All products'}
                      {campaign.applicableStoreIds.length > 0 && (
                        <span className="block text-[10px] text-gray-400">
                          {campaign.applicableStoreIds.length} stores
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-800">{issued}</td>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-800">{redeemed}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-700">{rate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${campaign.id}-detail`} className="bg-gray-50 border-b border-gray-200">
                      <td colSpan={10} className="px-6 py-5">
                        <CampaignDetail campaign={campaign} coupons={coupons} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}

            {campaigns.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                  No campaigns yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Campaign Detail ────────────────────────────────────────────────────────────

function CampaignDetail({ campaign, coupons }: { campaign: CouponCampaign; coupons: IssuedCoupon[] }) {
  function fmtDT(iso: string) {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  const totalDiscount = coupons.reduce((sum, c) => sum + (c.discountApplied ?? 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 text-xs">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Discount</p>
          <p className="text-gray-800 font-semibold mt-1 text-sm">{formatDiscount(campaign)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Min Purchase</p>
          <p className="text-gray-800 font-semibold mt-1 text-sm">₹{fmtAmt(campaign.minPurchaseValue)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Auto-enroll Gold+</p>
          <p className={`font-semibold mt-1 text-sm ${campaign.autoEnrollGoldPlatinum ? 'text-emerald-600' : 'text-gray-500'}`}>
            {campaign.autoEnrollGoldPlatinum ? 'Yes' : 'No'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Total Discount Given</p>
          <p className="text-gray-800 font-semibold mt-1 text-sm">₹{fmtAmt(totalDiscount)}</p>
        </div>
      </div>

      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Issued Coupons ({coupons.length})
      </h4>

      {coupons.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">No coupons issued for this campaign yet.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-wide">
              <th className="pb-2 text-left font-semibold">Code</th>
              <th className="pb-2 text-left font-semibold">Farmer</th>
              <th className="pb-2 text-left font-semibold">Tier</th>
              <th className="pb-2 text-left font-semibold">Issued</th>
              <th className="pb-2 text-left font-semibold">Redeemed At</th>
              <th className="pb-2 text-left font-semibold">Store</th>
              <th className="pb-2 text-right font-semibold">Invoice</th>
              <th className="pb-2 text-right font-semibold">Discount</th>
              <th className="pb-2 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map(coupon => (
              <tr key={coupon.id} className="bg-white">
                <td className="py-2 font-mono text-gray-700 whitespace-nowrap">{coupon.code}</td>
                <td className="py-2 text-gray-700">
                  <p className="font-medium">{coupon.farmerName}</p>
                  <p className="text-[10px] text-gray-400">{coupon.farmerMobile}</p>
                </td>
                <td className="py-2"><TierBadge tier={coupon.farmerTier} /></td>
                <td className="py-2 text-gray-500 whitespace-nowrap">{fmtDT(coupon.issuedAt)}</td>
                <td className="py-2 text-gray-500 whitespace-nowrap">
                  {coupon.redeemedAt ? fmtDT(coupon.redeemedAt) : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2 text-gray-500 max-w-[140px] truncate">
                  {coupon.storeName
                    ? coupon.storeName.replace('Bharat Agri Store – ', '')
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2 text-right font-mono text-gray-700">
                  {coupon.invoiceValue != null
                    ? `₹${fmtAmt(coupon.invoiceValue)}`
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2 text-right font-mono font-semibold text-emerald-700">
                  {coupon.discountApplied != null
                    ? `₹${fmtAmt(coupon.discountApplied)}`
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2 text-center">
                  {coupon.redeemedAt ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Redeemed
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
