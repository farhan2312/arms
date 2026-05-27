// CampaignList — table of all coupon campaigns with inline per-coupon detail

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, CheckCircle2, Clock, XCircle, Tag } from 'lucide-react';
import type { CouponCampaign, IssuedCoupon } from '../../data/mockCouponCampaigns';
import type { LoyaltyTier } from '../../types/loyalty';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';

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

const STATUS_VARIANT: Record<CampaignStatus, BadgeVariant> = {
  Active:   'green',
  Upcoming: 'blue',
  Expired:  'gray',
};

const TIER_VARIANT: Record<LoyaltyTier, BadgeVariant> = {
  Green:    'green',
  Silver:   'gray',
  Gold:     'amber',
  Platinum: 'purple',
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      <span className="inline-flex items-center gap-1">
        {status === 'Active'   && <CheckCircle2 size={10} />}
        {status === 'Upcoming' && <Clock size={10} />}
        {status === 'Expired'  && <XCircle size={10} />}
        {status}
      </span>
    </Badge>
  );
}

function TierBadge({ tier }: { tier: LoyaltyTier }) {
  return <Badge variant={TIER_VARIANT[tier]}>{tier}</Badge>;
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
        <Button variant="primary" iconLeft={Plus} onClick={onCreateCampaign}>
          Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState icon={Tag} title="No campaigns yet." subtitle="Create one to get started." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              {['Campaign', 'Valid Dates', 'Discount', 'Min. Purchase', 'Coverage', 'Issued', 'Redeemed', 'Rate', 'Status', ''].map(h => (
                <Th key={h}>{h}</Th>
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
                  <Tr
                    key={campaign.id}
                    onClick={() => toggle(campaign.id)}
                  >
                    <Td>
                      <p className="text-xs font-semibold text-gray-800 truncate max-w-[200px]">{campaign.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">{campaign.description}</p>
                    </Td>
                    <Td muted>
                      {fmtDate(campaign.startDate)}<br />
                      <span className="text-gray-400">to</span> {fmtDate(campaign.endDate)}
                    </Td>
                    <Td bold>{formatDiscount(campaign)}</Td>
                    <Td muted>₹{fmtAmt(campaign.minPurchaseValue)}</Td>
                    <Td muted>
                      {campaign.applicableProductIds.length > 0
                        ? `${campaign.applicableProductIds.length} products`
                        : 'All products'}
                      {campaign.applicableStoreIds.length > 0 && (
                        <span className="block text-[10px] text-gray-400">
                          {campaign.applicableStoreIds.length} stores
                        </span>
                      )}
                    </Td>
                    <Td mono bold>{issued}</Td>
                    <Td mono bold>{redeemed}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-700 text-xs">{rate}%</span>
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={status} />
                    </Td>
                    <Td muted>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Td>
                  </Tr>

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
          </tbody>
        </TableWrap>
      )}
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
        <TableWrap>
          <thead>
            <tr>
              <Th>Code</Th>
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
            {coupons.map(coupon => (
              <Tr key={coupon.id}>
                <Td mono>{coupon.code}</Td>
                <Td>
                  <p className="font-medium text-gray-700">{coupon.farmerName}</p>
                  <p className="text-[10px] text-gray-400">{coupon.farmerMobile}</p>
                </Td>
                <Td><TierBadge tier={coupon.farmerTier} /></Td>
                <Td muted>{fmtDT(coupon.issuedAt)}</Td>
                <Td muted>
                  {coupon.redeemedAt ? fmtDT(coupon.redeemedAt) : <span className="text-gray-300">—</span>}
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
                  {coupon.discountApplied != null
                    ? <span className="text-emerald-700">₹{fmtAmt(coupon.discountApplied)}</span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td>
                  <Badge variant={coupon.redeemedAt ? 'green' : 'amber'}>
                    {coupon.redeemedAt ? 'Redeemed' : 'Pending'}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
