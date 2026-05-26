// Tier Management Panel — Admin only
// Editable tier config + bonus campaign creator
// POST /api/loyalty/config and POST /api/loyalty/campaigns when backend ready

import { useState } from 'react';
import { Save, Plus, Trash2, CheckCircle2, Tag } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tier = 'Green' | 'Silver' | 'Gold' | 'Platinum';

interface TierRow {
  tier: Tier;
  minSpend: number;
  maxSpend: number | null;       // null = unlimited (Platinum)
  earnRate: number;              // pts per ₹10 eligible spend
  redemptionRate: number;        // pts per ₹1 redeemed (10 = 10 pts = ₹1)
}

interface Campaign {
  id: string;
  category: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

// ── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_TIERS: TierRow[] = [
  { tier: 'Green',    minSpend: 0,      maxSpend: 9_999,    earnRate: 1,   redemptionRate: 10 },
  { tier: 'Silver',   minSpend: 10_000, maxSpend: 49_999,   earnRate: 1.5, redemptionRate: 10 },
  { tier: 'Gold',     minSpend: 50_000, maxSpend: 1_49_999, earnRate: 2,   redemptionRate: 10 },
  { tier: 'Platinum', minSpend: 1_50_000, maxSpend: null,   earnRate: 3,   redemptionRate: 10 },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'camp-001', category: 'Seed',        multiplier: 2, startDate: '2026-06-01', endDate: '2026-06-30', createdAt: '2026-05-20T10:00:00Z' },
  { id: 'camp-002', category: 'Fertiliser',  multiplier: 1.5, startDate: '2026-05-15', endDate: '2026-05-31', createdAt: '2026-05-12T09:00:00Z' },
];

const CATEGORIES = ['Seed', 'Fertiliser', 'Micronutrient', 'Pesticide'];

const TIER_STYLE: Record<Tier, string> = {
  Green:    'bg-green-100 text-green-700',
  Silver:   'bg-slate-100 text-slate-600',
  Gold:     'bg-amber-100 text-amber-700',
  Platinum: 'bg-purple-100 text-purple-700',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRs(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TierManagementPanel() {
  const [tiers, setTiers] = useState<TierRow[]>(INITIAL_TIERS);
  const [saved, setSaved] = useState(false);

  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);

  // Campaign form
  const [campCategory,   setCampCategory]   = useState('Seed');
  const [campMultiplier, setCampMultiplier] = useState(2);
  const [campStart,      setCampStart]      = useState('');
  const [campEnd,        setCampEnd]        = useState('');
  const [campError,      setCampError]      = useState('');

  function handleTierChange<K extends keyof TierRow>(
    tier: Tier,
    field: K,
    raw: string,
  ) {
    setTiers(prev => prev.map(r => {
      if (r.tier !== tier) return r;
      if (field === 'maxSpend') {
        const val = raw === '' ? null : parseFloat(raw);
        return { ...r, maxSpend: val };
      }
      return { ...r, [field]: parseFloat(raw) || 0 };
    }));
    setSaved(false);
  }

  function handleSave() {
    // POST /api/loyalty/config when backend ready
    console.log('// POST /api/loyalty/config', tiers);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleAddCampaign() {
    setCampError('');
    if (!campStart || !campEnd) { setCampError('Please set both start and end dates.'); return; }
    if (campEnd < campStart)    { setCampError('End date must be after start date.'); return; }
    if (campMultiplier <= 1)    { setCampError('Multiplier must be greater than 1.'); return; }
    const campaign: Campaign = {
      id: `camp-${Date.now()}`,
      category:   campCategory,
      multiplier: campMultiplier,
      startDate:  campStart,
      endDate:    campEnd,
      createdAt:  new Date().toISOString(),
    };
    // POST /api/loyalty/campaigns when backend ready
    console.log('// POST /api/loyalty/campaigns', campaign);
    setCampaigns(prev => [campaign, ...prev]);
    setCampStart('');
    setCampEnd('');
    setCampMultiplier(2);
  }

  function handleRemoveCampaign(id: string) {
    // DELETE /api/loyalty/campaigns/:id when backend ready
    console.log('// DELETE /api/loyalty/campaigns/', id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Loyalty Tier Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure tier thresholds, earn rates, and bonus campaigns</p>
      </div>

      {/* ── Tier configuration table ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Tier Configuration</h2>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              saved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Tier</th>
                <th className="text-left px-4 py-3 font-medium">Min Spend (₹)</th>
                <th className="text-left px-4 py-3 font-medium">Max Spend (₹)</th>
                <th className="text-left px-4 py-3 font-medium">
                  Earn Rate
                  <span className="block text-[9px] font-normal text-gray-400">pts per ₹10 eligible</span>
                </th>
                <th className="text-left px-4 py-3 font-medium">
                  Redemption
                  <span className="block text-[9px] font-normal text-gray-400">pts per ₹1</span>
                </th>
                <th className="text-left px-4 py-3 font-medium">Effective Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tiers.map(row => (
                <tr key={row.tier} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${TIER_STYLE[row.tier]}`}>
                      {row.tier}
                    </span>
                  </td>

                  {/* Min spend */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.minSpend}
                      onChange={e => handleTierChange(row.tier, 'minSpend', e.target.value)}
                      className="w-28 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </td>

                  {/* Max spend */}
                  <td className="px-4 py-3">
                    {row.tier === 'Platinum' ? (
                      <span className="text-gray-400 text-xs italic">Unlimited</span>
                    ) : (
                      <input
                        type="number"
                        value={row.maxSpend ?? ''}
                        onChange={e => handleTierChange(row.tier, 'maxSpend', e.target.value)}
                        className="w-28 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    )}
                  </td>

                  {/* Earn rate */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={row.earnRate}
                      onChange={e => handleTierChange(row.tier, 'earnRate', e.target.value)}
                      className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </td>

                  {/* Redemption rate */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={row.redemptionRate}
                      onChange={e => handleTierChange(row.tier, 'redemptionRate', e.target.value)}
                      className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </td>

                  {/* Effective range display */}
                  <td className="px-4 py-3 text-gray-500">
                    {fmtRs(row.minSpend)} –{' '}
                    {row.maxSpend !== null ? fmtRs(row.maxSpend) : '∞'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            Earn rate: farmers earn <strong>rate × 1 point per ₹10</strong> of eligible spend.
            Redemption: <strong>10 pts = ₹1</strong> (fixed across tiers unless changed above).
            Changes take effect from the next transaction after saving.
          </p>
        </div>
      </div>

      {/* ── Bonus campaign creator ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Bonus Campaigns</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Apply a points multiplier to a product category for a date range
          </p>
        </div>

        {/* Creator form */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {/* Category */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Category</label>
              <select
                value={campCategory}
                onChange={e => setCampCategory(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Multiplier */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Multiplier</label>
              <input
                type="number"
                step="0.5"
                min="1.5"
                max="10"
                value={campMultiplier}
                onChange={e => setCampMultiplier(parseFloat(e.target.value))}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Start date */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Start Date</label>
              <input
                type="date"
                value={campStart}
                onChange={e => setCampStart(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* End date */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">End Date</label>
              <input
                type="date"
                value={campEnd}
                onChange={e => setCampEnd(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Add button */}
            <div className="flex items-end">
              <button
                onClick={handleAddCampaign}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus size={13} />
                Add Campaign
              </button>
            </div>
          </div>

          {campError && (
            <p className="mt-2 text-xs text-red-600">{campError}</p>
          )}
        </div>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <div className="py-10 text-center">
            <Tag size={20} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No campaigns yet. Add one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {campaigns.map(c => {
              const now = '2026-05-26';
              const isActive  = c.startDate <= now && c.endDate >= now;
              const isFuture  = c.startDate > now;
              const isExpired = c.endDate < now;
              return (
                <div key={c.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-emerald-500' : isFuture ? 'bg-blue-400' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
                    <div>
                      <p className="text-[10px] text-gray-400">Category</p>
                      <p className="text-xs font-semibold text-gray-800">{c.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Multiplier</p>
                      <p className="text-xs font-semibold text-emerald-700">{c.multiplier}×</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Period</p>
                      <p className="text-xs text-gray-700">{c.startDate} → {c.endDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Status</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive  ? 'bg-emerald-100 text-emerald-700' :
                        isFuture  ? 'bg-blue-100 text-blue-700'      :
                        isExpired ? 'bg-gray-100 text-gray-500'      : ''
                      }`}>
                        {isActive ? 'Active' : isFuture ? 'Upcoming' : 'Expired'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCampaign(c.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Remove campaign"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
