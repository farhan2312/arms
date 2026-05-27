// Tier Management Panel — Admin only
// Editable tier config + bonus campaign creator
// POST /api/loyalty/config and POST /api/loyalty/campaigns when backend ready

import { useState } from 'react';
import { Save, Plus, Trash2, CheckCircle2, Tag } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Card, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';

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

const TIER_BADGE_VARIANT: Record<Tier, 'green' | 'gray' | 'amber' | 'purple'> = {
  Green:    'green',
  Silver:   'gray',
  Gold:     'amber',
  Platinum: 'purple',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRs(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

const inputCls = 'text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

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
      <Card padding="0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Tier Configuration</p>
          </div>
          <Button
            variant={saved ? 'secondary' : 'primary'}
            iconLeft={saved ? CheckCircle2 : Save}
            onClick={handleSave}
            size="sm"
          >
            {saved ? 'Saved!' : 'Save Configuration'}
          </Button>
        </div>

        <TableWrap>
          <thead>
            <tr>
              <Th>Tier</Th>
              <Th>Min Spend (₹)</Th>
              <Th>Max Spend (₹)</Th>
              <Th>
                Earn Rate
                <span className="block text-[9px] font-normal text-gray-400">pts per ₹10 eligible</span>
              </Th>
              <Th>
                Redemption
                <span className="block text-[9px] font-normal text-gray-400">pts per ₹1</span>
              </Th>
              <Th>Effective Range</Th>
            </tr>
          </thead>
          <tbody>
            {tiers.map(row => (
              <Tr key={row.tier}>
                <Td>
                  <Badge variant={TIER_BADGE_VARIANT[row.tier]}>{row.tier}</Badge>
                </Td>

                {/* Min spend */}
                <Td>
                  <input
                    type="number"
                    value={row.minSpend}
                    onChange={e => handleTierChange(row.tier, 'minSpend', e.target.value)}
                    className={`w-28 ${inputCls}`}
                  />
                </Td>

                {/* Max spend */}
                <Td>
                  {row.tier === 'Platinum' ? (
                    <span className="text-gray-400 text-xs italic">Unlimited</span>
                  ) : (
                    <input
                      type="number"
                      value={row.maxSpend ?? ''}
                      onChange={e => handleTierChange(row.tier, 'maxSpend', e.target.value)}
                      className={`w-28 ${inputCls}`}
                    />
                  )}
                </Td>

                {/* Earn rate */}
                <Td>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={row.earnRate}
                    onChange={e => handleTierChange(row.tier, 'earnRate', e.target.value)}
                    className={`w-20 ${inputCls}`}
                  />
                </Td>

                {/* Redemption rate */}
                <Td>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={row.redemptionRate}
                    onChange={e => handleTierChange(row.tier, 'redemptionRate', e.target.value)}
                    className={`w-20 ${inputCls}`}
                  />
                </Td>

                {/* Effective range display */}
                <Td muted>
                  {fmtRs(row.minSpend)} –{' '}
                  {row.maxSpend !== null ? fmtRs(row.maxSpend) : '∞'}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            Earn rate: farmers earn <strong>rate × 1 point per ₹10</strong> of eligible spend.
            Redemption: <strong>10 pts = ₹1</strong> (fixed across tiers unless changed above).
            Changes take effect from the next transaction after saving.
          </p>
        </div>
      </Card>

      {/* ── Bonus campaign creator ───────────────────────────────────────── */}
      <Card padding="0">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Bonus Campaigns</p>
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
              <Select
                value={campCategory}
                onChange={setCampCategory}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
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
                className={`w-full ${inputCls}`}
              />
            </div>

            {/* Start date */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Start Date</label>
              <input
                type="date"
                value={campStart}
                onChange={e => setCampStart(e.target.value)}
                className={`w-full ${inputCls}`}
              />
            </div>

            {/* End date */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">End Date</label>
              <input
                type="date"
                value={campEnd}
                onChange={e => setCampEnd(e.target.value)}
                className={`w-full ${inputCls}`}
              />
            </div>

            {/* Add button */}
            <div className="flex items-end">
              <Button
                variant="primary"
                iconLeft={Plus}
                onClick={handleAddCampaign}
                size="sm"
                className="w-full justify-center"
              >
                Add Campaign
              </Button>
            </div>
          </div>

          {campError && (
            <p className="mt-2 text-xs text-red-600">{campError}</p>
          )}
        </div>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No campaigns yet"
            subtitle="Add one above."
          />
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
                      <Badge variant={isActive ? 'green' : isFuture ? 'blue' : 'gray'}>
                        {isActive ? 'Active' : isFuture ? 'Upcoming' : 'Expired'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    iconLeft={Trash2}
                    onClick={() => handleRemoveCampaign(c.id)}
                    size="sm"
                    title="Remove campaign"
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
