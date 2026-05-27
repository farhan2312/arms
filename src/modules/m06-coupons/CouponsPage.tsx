// CouponsPage — orchestrator: Campaigns | Issue Coupons | Redemption Report

import { useState } from 'react';
import { mockCampaigns, mockIssuedCoupons } from '../../data/mockCouponCampaigns';
import type { CouponCampaign, IssuedCoupon } from '../../data/mockCouponCampaigns';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import CampaignList from './CampaignList';
import CampaignForm from './CampaignForm';
import CouponIssuance from './CouponIssuance';
import CouponRedemptionReport from './CouponRedemptionReport';

type CouponsTab = 'campaigns' | 'issuance' | 'report';

const TABS = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'issuance',  label: 'Issue Coupons' },
  { id: 'report',    label: 'Redemption Report' },
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
      <PageHeader
        title="Coupons & Campaigns"
        subtitle="Manage coupon campaigns, issue coupons to farmers, and track redemptions"
      />

      <Tabs
        tabs={TABS}
        activeTab={tab}
        onTabChange={(id) => setTab(id as CouponsTab)}
      />

      <div className="mt-6">
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
      </div>

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
