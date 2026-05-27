// CouponIssuance — individual and bulk coupon issuance

import { useState, useMemo } from 'react';
import { Send, Upload, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { mockFarmers } from '../../data/mockFarmers';
import { mockLoyaltyWallets } from '../../data/mockLoyaltyWallets';
import type { CouponCampaign, IssuedCoupon } from '../../data/mockCouponCampaigns';
import type { LoyaltyTier } from '../../types/loyalty';

const TODAY = '2026-05-27';

// Build farmerId → tier lookup
const TIER_MAP = new Map<string, LoyaltyTier>(
  mockLoyaltyWallets.map(w => [w.farmerId, w.tier as LoyaltyTier]),
);

function getCampaignStatus(c: CouponCampaign) {
  if (c.endDate < TODAY) return 'Expired';
  if (c.startDate > TODAY) return 'Upcoming';
  return 'Active';
}

function generateCode(campaign: CouponCampaign, mobile: string): string {
  const prefix = campaign.name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  const last4 = mobile.replace(/\D/g, '').slice(-4);
  return `${prefix}-${rand}-${last4}`;
}

// Normalise +91 94220 11001 → +919422011001
function normaliseMobile(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+91${digits}`;
}

type IssueMode = 'individual' | 'bulk';

type BulkResult = {
  mobile: string;
  status: 'ok' | 'not_found' | 'already_issued';
  code?: string;
};

interface Props {
  campaigns: CouponCampaign[];
  issuedCoupons: IssuedCoupon[];
  onIssueCoupons: (coupons: IssuedCoupon[]) => void;
}

export default function CouponIssuance({ campaigns, issuedCoupons, onIssueCoupons }: Props) {
  const [mode, setMode] = useState<IssueMode>('individual');

  // ── Individual state ──────────────────────────────────────────────────────
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedFarmerId, setSelectedFarmerId]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Bulk state ────────────────────────────────────────────────────────────
  const [bulkCampaignId, setBulkCampaignId] = useState('');
  const [csvText, setCsvText]               = useState('');
  const [bulkResults, setBulkResults]       = useState<BulkResult[]>([]);

  const activeCampaigns = campaigns.filter(c => getCampaignStatus(c) === 'Active');

  // Set of "campaignId:farmerId" keys for already-issued lookups
  const alreadyIssuedSet = useMemo(
    () => new Set(issuedCoupons.map(c => `${c.campaignId}:${c.farmerId}`)),
    [issuedCoupons],
  );

  // Mobile → farmer map (normalised)
  const mobileToFarmer = useMemo(
    () => new Map(mockFarmers.map(f => [normaliseMobile(f.mobile), f])),
    [],
  );

  // ── Individual issue ──────────────────────────────────────────────────────
  function handleIndividualIssue() {
    const campaign = campaigns.find(c => c.id === selectedCampaignId);
    const farmer   = mockFarmers.find(f => f.id === selectedFarmerId);
    if (!campaign || !farmer) return;

    const coupon: IssuedCoupon = {
      id:            `icpn-${Date.now()}`,
      code:          generateCode(campaign, farmer.mobile),
      campaignId:    campaign.id,
      campaignName:  campaign.name,
      farmerId:      farmer.id,
      farmerName:    farmer.name,
      farmerMobile:  farmer.mobile,
      farmerTier:    TIER_MAP.get(farmer.id) ?? 'Green',
      issuedAt:      new Date().toISOString(),
    };
    console.log('// POST /api/coupons/issue', coupon);
    onIssueCoupons([coupon]);
    setSuccessMsg(`Coupon ${coupon.code} issued to ${farmer.name}`);
    setSelectedFarmerId('');
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  // ── Bulk issue ────────────────────────────────────────────────────────────
  function handleBulkIssue() {
    const campaign = campaigns.find(c => c.id === bulkCampaignId);
    if (!campaign) return;

    const mobiles = csvText
      .split(/[\n,;]/)
      .map(s => s.trim())
      .filter(Boolean);

    const results: BulkResult[] = [];
    const newCoupons: IssuedCoupon[] = [];

    for (const raw of mobiles) {
      const farmer = mobileToFarmer.get(normaliseMobile(raw));

      if (!farmer) {
        results.push({ mobile: raw, status: 'not_found' });
        continue;
      }

      if (alreadyIssuedSet.has(`${campaign.id}:${farmer.id}`)) {
        results.push({ mobile: raw, status: 'already_issued' });
        continue;
      }

      const coupon: IssuedCoupon = {
        id:           `icpn-${Date.now()}-${farmer.id}`,
        code:         generateCode(campaign, farmer.mobile),
        campaignId:   campaign.id,
        campaignName: campaign.name,
        farmerId:     farmer.id,
        farmerName:   farmer.name,
        farmerMobile: farmer.mobile,
        farmerTier:   TIER_MAP.get(farmer.id) ?? 'Green',
        issuedAt:     new Date().toISOString(),
      };
      newCoupons.push(coupon);
      results.push({ mobile: raw, status: 'ok', code: coupon.code });
    }

    console.log(`// POST /api/coupons/bulk-issue — ${newCoupons.length} issued`);
    if (newCoupons.length > 0) onIssueCoupons(newCoupons);
    setBulkResults(results);
  }

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const selectedFarmer   = mockFarmers.find(f => f.id === selectedFarmerId);
  const alreadyIssued    =
    selectedCampaignId && selectedFarmerId
      ? alreadyIssuedSet.has(`${selectedCampaignId}:${selectedFarmerId}`)
      : false;

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['individual', 'bulk'] as IssueMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setSuccessMsg(''); setBulkResults([]); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'individual' ? <UserPlus size={14} /> : <Upload size={14} />}
            {m === 'individual' ? 'Individual' : 'Bulk CSV'}
          </button>
        ))}
      </div>

      {/* ── Individual ────────────────────────────────────────────────────── */}
      {mode === 'individual' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Issue Coupon to Farmer</h3>

          <div className="space-y-4">
            {/* Campaign select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campaign <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCampaignId}
                onChange={e => { setSelectedCampaignId(e.target.value); setSuccessMsg(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select active campaign…</option>
                {activeCampaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {activeCampaigns.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">No active campaigns available.</p>
              )}
            </div>

            {/* Campaign preview */}
            {selectedCampaign && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-xs">
                <p className="font-semibold text-emerald-800">{selectedCampaign.name}</p>
                <p className="text-emerald-600 mt-0.5">
                  {selectedCampaign.discountType === 'Flat'
                    ? `₹${selectedCampaign.discountValue} flat discount`
                    : selectedCampaign.discountType === 'Percentage'
                    ? `${selectedCampaign.discountValue}% off`
                    : 'Free Product'}
                  {' · '}
                  Min purchase ₹{selectedCampaign.minPurchaseValue.toLocaleString('en-IN')}
                </p>
              </div>
            )}

            {/* Farmer select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Farmer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedFarmerId}
                onChange={e => { setSelectedFarmerId(e.target.value); setSuccessMsg(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select farmer…</option>
                {mockFarmers.filter(f => f.isActive).map(f => (
                  <option key={f.id} value={f.id}>{f.name} — {f.mobile}</option>
                ))}
              </select>
            </div>

            {/* Farmer info / already-issued warning */}
            {selectedFarmer && selectedCampaignId && (
              alreadyIssued ? (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {selectedFarmer.name} already has a coupon for this campaign.
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="font-medium">{selectedFarmer.name}</span>
                  <span className="text-gray-300">·</span>
                  <span>{TIER_MAP.get(selectedFarmer.id) ?? 'Green'} tier</span>
                  <span className="text-gray-300">·</span>
                  <span>{selectedFarmer.mobile}</span>
                </div>
              )
            )}

            {/* Success banner */}
            {successMsg && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 size={14} className="flex-shrink-0" />
                {successMsg}
              </div>
            )}

            <button
              onClick={handleIndividualIssue}
              disabled={!selectedCampaignId || !selectedFarmerId || alreadyIssued}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} /> Issue Coupon
            </button>
          </div>
        </div>
      )}

      {/* ── Bulk ──────────────────────────────────────────────────────────── */}
      {mode === 'bulk' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Bulk Coupon Issuance</h3>

          <div className="space-y-4">
            {/* Campaign select */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campaign <span className="text-red-500">*</span>
              </label>
              <select
                value={bulkCampaignId}
                onChange={e => { setBulkCampaignId(e.target.value); setBulkResults([]); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select active campaign…</option>
                {activeCampaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* CSV textarea */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Farmer Mobile Numbers
                <span className="ml-1 text-gray-400 font-normal">— one per line, or comma-separated</span>
              </label>
              <textarea
                value={csvText}
                onChange={e => { setCsvText(e.target.value); setBulkResults([]); }}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder={'+91 94220 11001\n+91 94220 11002\n9876543210'}
              />
            </div>

            <button
              onClick={handleBulkIssue}
              disabled={!bulkCampaignId || !csvText.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload size={14} /> Process & Issue
            </button>

            {/* Bulk results */}
            {bulkResults.length > 0 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-5 text-xs">
                  <span className="text-emerald-600 font-semibold">
                    ✓ {bulkResults.filter(r => r.status === 'ok').length} issued
                  </span>
                  <span className="text-amber-600 font-semibold">
                    ⚠ {bulkResults.filter(r => r.status === 'already_issued').length} already issued
                  </span>
                  <span className="text-red-500 font-semibold">
                    ✕ {bulkResults.filter(r => r.status === 'not_found').length} not found
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-wide bg-white">
                      <th className="px-4 py-2 text-left font-semibold">Mobile</th>
                      <th className="px-4 py-2 text-left font-semibold">Result</th>
                      <th className="px-4 py-2 text-left font-semibold">Coupon Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bulkResults.map((r, i) => (
                      <tr key={i} className="bg-white">
                        <td className="px-4 py-2 font-mono text-gray-700">{r.mobile}</td>
                        <td className="px-4 py-2">
                          {r.status === 'ok'             && <span className="text-emerald-600 font-semibold">Issued</span>}
                          {r.status === 'already_issued' && <span className="text-amber-600">Already issued</span>}
                          {r.status === 'not_found'      && <span className="text-red-500">Farmer not found</span>}
                        </td>
                        <td className="px-4 py-2 font-mono text-gray-600">{r.code ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
