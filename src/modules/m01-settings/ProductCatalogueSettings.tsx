// ProductCatalogueSettings — B2B tier discounts, category loyalty toggles,
// bonus campaigns, and bulk CSV product import

import { useState, useRef } from 'react';
import { Save, CheckCircle2, Upload, X, ToggleLeft, ToggleRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type B2BTier = 'Standard' | 'Silver' | 'Gold' | 'Preferred';

interface TierDiscount {
  tier: B2BTier;
  discountPct: number;
}

interface CategoryToggle {
  category: string;
  loyaltyEligible: boolean;
}

interface BonusCampaign {
  id: string;
  name: string;
  category: string;
  bonusPct: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_TIER_DISCOUNTS: TierDiscount[] = [
  { tier: 'Standard',  discountPct: 0 },
  { tier: 'Silver',    discountPct: 2 },
  { tier: 'Gold',      discountPct: 4 },
  { tier: 'Preferred', discountPct: 6 },
];

const SEED_CATEGORIES: CategoryToggle[] = [
  { category: 'Seeds',           loyaltyEligible: true  },
  { category: 'Fertilisers',     loyaltyEligible: false },
  { category: 'Crop Nutrition',  loyaltyEligible: true  },
  { category: 'Crop Protection', loyaltyEligible: true  },
];

const SEED_CAMPAIGNS: BonusCampaign[] = [
  { id: 'pc-001', name: 'Kharif Seed Push', category: 'Seeds',           bonusPct: 10, startDate: '2026-06-01', endDate: '2026-06-30', isActive: true  },
  { id: 'pc-002', name: 'Micro-nutrient Drive', category: 'Crop Nutrition', bonusPct: 5,  startDate: '2026-05-15', endDate: '2026-05-31', isActive: true  },
  { id: 'pc-003', name: 'Pesticide Clear-out',  category: 'Crop Protection', bonusPct: 8, startDate: '2026-04-01', endDate: '2026-04-30', isActive: false },
];

const TODAY = '2026-05-27';

const TIER_STYLE: Record<B2BTier, string> = {
  Standard:  'bg-gray-100 text-gray-600',
  Silver:    'bg-slate-100 text-slate-700',
  Gold:      'bg-amber-100 text-amber-700',
  Preferred: 'bg-blue-100 text-blue-700',
};

// ── CSV types ─────────────────────────────────────────────────────────────────

interface CsvRow {
  sku: string;
  name: string;
  category: string;
  unitPrice: string;
  unitsPerPkg: string;
  hsn: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProductCatalogueSettings() {
  // B2B tier discounts
  const [tiers, setTiers]         = useState<TierDiscount[]>(SEED_TIER_DISCOUNTS);
  const [tierSaved, setTierSaved] = useState(false);

  // Category toggles
  const [categories, setCategories] = useState<CategoryToggle[]>(SEED_CATEGORIES);
  const [catSaved,   setCatSaved]   = useState(false);

  // Bonus campaigns
  const [campaigns, setCampaigns] = useState<BonusCampaign[]>(SEED_CAMPAIGNS);

  // CSV import
  const [csvRows,       setCsvRows]       = useState<CsvRow[]>([]);
  const [csvError,      setCsvError]      = useState('');
  const [csvFileName,   setCsvFileName]   = useState('');
  const [csvImported,   setCsvImported]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Tier handlers ──────────────────────────────────────────────────────────

  function handleTierChange(tier: B2BTier, raw: string) {
    const val = Math.min(100, Math.max(0, parseFloat(raw) || 0));
    setTiers(prev => prev.map(t => t.tier === tier ? { ...t, discountPct: val } : t));
    setTierSaved(false);
  }

  function saveTiers() {
    console.log('// PUT /api/b2b/tier-discounts', tiers);
    setTierSaved(true);
    setTimeout(() => setTierSaved(false), 3000);
  }

  // ── Category handlers ──────────────────────────────────────────────────────

  function toggleCategory(category: string) {
    setCategories(prev => prev.map(c =>
      c.category === category ? { ...c, loyaltyEligible: !c.loyaltyEligible } : c,
    ));
    setCatSaved(false);
  }

  function saveCategories() {
    console.log('// PUT /api/catalogue/loyalty-eligibility', categories);
    setCatSaved(true);
    setTimeout(() => setCatSaved(false), 3000);
  }

  // ── Campaign handlers ──────────────────────────────────────────────────────

  function toggleCampaign(id: string) {
    setCampaigns(prev => prev.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c,
    ));
    console.log('// PATCH /api/catalogue/campaigns/' + id);
  }

  // ── CSV handlers ───────────────────────────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError('');
    setCsvRows([]);
    setCsvImported(false);
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) { setCsvError('Could not read file.'); return; }

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { setCsvError('CSV must have a header row and at least one data row.'); return; }

      const rows: CsvRow[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 6) { setCsvError(`Row ${i}: expected 6 columns (SKU, Name, Category, UnitPrice, UnitsPerPkg, HSN).`); return; }
        rows.push({
          sku:        cols[0],
          name:       cols[1],
          category:   cols[2],
          unitPrice:  cols[3],
          unitsPerPkg: cols[4],
          hsn:        cols[5],
        });
      }
      setCsvRows(rows);
    };
    reader.readAsText(file);

    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function handleImportConfirm() {
    console.log('// POST /api/catalogue/bulk-import — rows:', csvRows.length);
    setCsvImported(true);
    setCsvRows([]);
    setCsvFileName('');
  }

  function clearCsv() {
    setCsvRows([]);
    setCsvFileName('');
    setCsvError('');
    setCsvImported(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── B2B Tier Discounts ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">B2B Tier Discounts</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Default discount % applied to B2B invoice per retailer tier</p>
          </div>
          <button
            onClick={saveTiers}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              tierSaved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {tierSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {tierSaved ? 'Saved!' : 'Save'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-400">
                <th className="text-left px-5 py-3 font-medium">Tier</th>
                <th className="text-left px-5 py-3 font-medium">Discount %</th>
                <th className="text-left px-5 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tiers.map(row => (
                <tr key={row.tier} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_STYLE[row.tier]}`}>
                      {row.tier}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={row.discountPct}
                        onChange={e => handleTierChange(row.tier, e.target.value)}
                        className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {row.tier === 'Standard'  && 'No discount — invoice at list price'}
                    {row.tier === 'Silver'    && 'Small volume discount for Silver retailers'}
                    {row.tier === 'Gold'      && 'Mid-tier discount for high-volume partners'}
                    {row.tier === 'Preferred' && 'Premium discount for top-tier key accounts'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Category Loyalty Toggles ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Loyalty Points — Category Eligibility</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Control which product categories earn loyalty points at POS</p>
          </div>
          <button
            onClick={saveCategories}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              catSaved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {catSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {catSaved ? 'Saved!' : 'Save'}
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {categories.map(cat => (
            <div key={cat.category} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{cat.category}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {cat.loyaltyEligible ? 'Purchases earn loyalty points' : 'No loyalty points accrued'}
                </p>
              </div>
              <button
                onClick={() => toggleCategory(cat.category)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  cat.loyaltyEligible ? 'text-emerald-700' : 'text-gray-400'
                }`}
              >
                {cat.loyaltyEligible
                  ? <ToggleRight size={28} className="text-emerald-600" />
                  : <ToggleLeft size={28} className="text-gray-300" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bonus Campaigns ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Bonus Purchase Campaigns</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">Category-level purchase incentive campaigns — activate or pause</p>
        </div>

        <div className="divide-y divide-gray-50">
          {campaigns.map(c => {
            const isActive  = c.isActive && c.startDate <= TODAY && c.endDate >= TODAY;
            const isUpcoming = c.isActive && c.startDate > TODAY;
            const isExpired = c.endDate < TODAY;
            return (
              <div key={c.id} className={`px-5 py-4 flex items-center gap-4 ${!c.isActive ? 'opacity-50' : ''}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isActive ? 'bg-emerald-500' : isUpcoming ? 'bg-blue-400' : 'bg-gray-300'
                }`} />
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5">
                  <div>
                    <p className="text-[10px] text-gray-400">Campaign</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">{c.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Category / Bonus</p>
                    <p className="text-xs text-gray-700">{c.category} · +{c.bonusPct}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Period</p>
                    <p className="text-xs text-gray-700">{c.startDate} → {c.endDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Status</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive  ? 'bg-emerald-100 text-emerald-700' :
                      isUpcoming ? 'bg-blue-100 text-blue-700' :
                      isExpired ? 'bg-gray-100 text-gray-500' :
                                  'bg-gray-100 text-gray-500'
                    }`}>
                      {!c.isActive ? 'Paused' : isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Expired'}
                    </span>
                  </div>
                </div>
                {!isExpired && (
                  <button
                    onClick={() => toggleCampaign(c.id)}
                    className="flex-shrink-0"
                    title={c.isActive ? 'Pause campaign' : 'Activate campaign'}
                  >
                    {c.isActive
                      ? <ToggleRight size={24} className="text-emerald-600" />
                      : <ToggleLeft size={24} className="text-gray-300" />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bulk CSV Import ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Bulk Import Products</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            CSV columns (in order): <span className="font-mono">SKU, Name, Category, UnitPrice, UnitsPerPkg, HSN</span>
          </p>
        </div>

        <div className="px-5 py-5 space-y-4">
          {csvImported && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 size={16} />
              <span className="font-semibold">Import successful</span>
              <button onClick={clearCsv} className="ml-auto text-emerald-500 hover:text-emerald-700 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Upload area */}
          {!csvImported && (
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl px-6 py-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                {csvFileName ? csvFileName : 'Click to select a CSV file'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">or drag and drop — max 5 preview rows shown</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {csvError && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <X size={12} /> {csvError}
            </p>
          )}

          {/* 5-row preview */}
          {csvRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Preview (first {csvRows.length} rows)</p>
                <button onClick={clearCsv} className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                  <X size={11} /> Clear
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400">
                      <th className="text-left px-3 py-2 font-medium">SKU</th>
                      <th className="text-left px-3 py-2 font-medium">Name</th>
                      <th className="text-left px-3 py-2 font-medium">Category</th>
                      <th className="text-left px-3 py-2 font-medium">Unit Price</th>
                      <th className="text-left px-3 py-2 font-medium">Units/Pkg</th>
                      <th className="text-left px-3 py-2 font-medium">HSN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {csvRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-3 py-2 font-mono text-gray-600">{row.sku}</td>
                        <td className="px-3 py-2 text-gray-800">{row.name}</td>
                        <td className="px-3 py-2 text-gray-500">{row.category}</td>
                        <td className="px-3 py-2 text-gray-700">₹{row.unitPrice}</td>
                        <td className="px-3 py-2 text-gray-500">{row.unitsPerPkg}</td>
                        <td className="px-3 py-2 font-mono text-gray-500">{row.hsn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImportConfirm}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Upload size={14} />
                Confirm Import
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
