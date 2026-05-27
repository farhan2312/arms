// CouponsPage — orchestrator: Campaigns | Issue Coupons | Redemption Report

import { useState } from 'react';
import { Ticket, Send, BarChart2 } from 'lucide-react';
import { mockCampaigns, mockIssuedCoupons } from '../../data/mockCouponCampaigns';
import type { CouponCampaign, IssuedCoupon } from '../../data/mockCouponCampaigns';
import CampaignList from './CampaignList';
import CampaignForm from './CampaignForm';
import CouponIssuance from './CouponIssuance';
import CouponRedemptionReport from './CouponRedemptionReport';

type CouponsTab = 'campaigns' | 'issuance' | 'report';

const TABS = [
  { key: 'campaigns' as CouponsTab, label: 'Campaigns',         icon: Ticket },
  { key: 'issuance'  as CouponsTab, label: 'Issue Coupons',     icon: Send },
  { key: 'report'    as CouponsTab, label: 'Redemption Report', icon: BarChart2 },
];

export default function CouponsPage() {
  const [campaigns, setCampaigns]         = useState<CouponCampaign[]>(mockCampaigns);
  const [issuedCoupons, setIssuedCoupons] = useState<IssuedCoupon[]>(mockIssuedCoupons);
  const [tab, setTab]                     = useState<CouponsTab>('campaigns');
  const [showCampaignForm, setShowCampaignForm] = useState(false);

  function handleSaveCampaign(campaign: CouponCampaign) {
    setCampaigns(prev => [campaign, ...prev]);
    setShowCampaignForm(false);
  }

  function handleIssueCoupons(newCoupons: IssuedCoupon[]) {
    setIssuedCoupons(prev => [...newCoupons, ...prev]);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Coupons & Campaigns</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage coupon campaigns, issue coupons to farmers, and track redemptions
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'campaigns' && (
        <CampaignList
          campaigns={campaigns}
          issuedCoupons={issuedCoupons}
          onCreateCampaign={() => setShowCampaignForm(true)}
        />
      )}

      {tab === 'issuance' && (
        <CouponIssuance
          campaigns={campaigns}
          issuedCoupons={issuedCoupons}
          onIssueCoupons={handleIssueCoupons}
        />
      )}

      {tab === 'report' && (
        <CouponRedemptionReport
          campaigns={campaigns}
          issuedCoupons={issuedCoupons}
        />
      )}

      {/* Campaign form slide-over */}
      {showCampaignForm && (
        <CampaignForm
          campaignCount={campaigns.length}
          onSave={handleSaveCampaign}
          onClose={() => setShowCampaignForm(false)}
        />
      )}
    </div>
  );
}
