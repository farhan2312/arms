// LoyaltyProgrammeConfig — wraps TierManagementPanel + adds policy controls

import { useState } from 'react';
import { Save, Info, CheckCircle2 } from 'lucide-react';
import TierManagementPanel from '../m14-loyalty/TierManagementPanel';

const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full';

export default function LoyaltyProgrammeConfig() {
  const [expiryMonths,    setExpiryMonths]    = useState(24);
  const [maxRedemptionPct, setMaxRedemptionPct] = useState(20);
  const [minThreshold,    setMinThreshold]    = useState(100);
  const [ureaDAPEligible, setUreaDAPEligible] = useState(false);
  const [saved,           setSaved]           = useState(false);
  const [showTooltip,     setShowTooltip]     = useState(false);

  function handleSave() {
    console.log('// POST /api/loyalty/policy', {
      expiryMonths,
      maxRedemptionPct,
      minThreshold,
      ureaDAPEligible,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Tier config (imported component) */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <TierManagementPanel />
      </div>

      {/* Policy settings */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Programme Policies</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Redemption limits, expiry, and eligibility rules</p>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              saved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save Policies'}
          </button>
        </div>

        <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Point Expiry */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Point Expiry Period
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={60}
                value={expiryMonths}
                onChange={e => setExpiryMonths(parseInt(e.target.value) || 1)}
                className={`${inputCls} w-24`}
              />
              <span className="text-sm text-gray-500">months</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Points older than this period will expire automatically.
            </p>
          </div>

          {/* Max Redemption % */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Max Redemption per Transaction
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={maxRedemptionPct}
                onChange={e => setMaxRedemptionPct(parseInt(e.target.value) || 1)}
                className={`${inputCls} w-24`}
              />
              <span className="text-sm text-gray-500">% of invoice value</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Cap on how much of a bill can be paid via loyalty points.
            </p>
          </div>

          {/* Min Threshold */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Minimum Redemption Threshold
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={minThreshold}
                onChange={e => setMinThreshold(parseInt(e.target.value) || 1)}
                className={`${inputCls} w-28`}
              />
              <span className="text-sm text-gray-500">points</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Farmers must have at least this many points before they can redeem.
            </p>
          </div>

          {/* Urea / DAP Eligibility */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Urea / DAP Loyalty Eligible
              <span className="relative ml-1 inline-block">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Info size={12} />
                </button>
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-xl z-10 leading-relaxed">
                    <strong>Regulatory caution:</strong> GoI-subsidised fertilisers (Urea, DAP) are
                    subject to MRP controls. Awarding loyalty points may be interpreted as a
                    de-facto discount below MRP. Consult your compliance team before enabling.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setUreaDAPEligible(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  ureaDAPEligible ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    ureaDAPEligible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${ureaDAPEligible ? 'text-emerald-700' : 'text-gray-400'}`}>
                {ureaDAPEligible ? 'Enabled' : 'Disabled (recommended)'}
              </span>
            </div>

            {ureaDAPEligible && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                <Info size={12} className="flex-shrink-0 mt-0.5" />
                <span>Urea/DAP sales will now earn loyalty points. Ensure this is reviewed by your Compliance Officer.</span>
              </div>
            )}

            <p className="text-[11px] text-gray-400 mt-1">
              When OFF, subsidised fertiliser purchases are excluded from point accrual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
