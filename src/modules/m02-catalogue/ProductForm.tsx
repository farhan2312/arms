// ProductForm — slide-over for adding or editing a Product SKU
// All numeric inputs stored as strings during edit to avoid NaN / 0 flicker

import { useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import type { Product, ProductCategory, ProductUnit, TaxSlabPct } from '../../types/entities';

// ── Constants ─────────────────────────────────────────────────────────────────

const FORM_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'Seed',         label: 'Seed'            },
  { value: 'Fertiliser',   label: 'Fertiliser'      },
  { value: 'Micronutrient', label: 'Crop Nutrition'  },
  { value: 'Pesticide',    label: 'Crop Protection' },
];

const UNITS: ProductUnit[] = ['Kg', 'G', 'L', 'ML', 'Packet', 'Bag', 'Piece', 'Box', 'Bottle', 'Can', 'Set'];
const GST_SLABS: TaxSlabPct[] = [0, 5, 12, 18, 28];

// ── Form state ────────────────────────────────────────────────────────────────

interface CropMapping { crop: string; growthStage: string; }

interface FormState {
  // Core
  name: string; sku: string; brand: string; manufacturer: string;
  category: ProductCategory; subCategory: string;
  packSize: string; unit: ProductUnit; hsnCode: string; taxSlabPct: string;
  // Pricing
  mrp: string; b2cPrice: string;
  b2bPriceStandard: string; b2bPriceSilver: string; b2bPriceGold: string; b2bPricePlatinum: string;
  // Toggles
  isSubsidised: boolean; loyaltyEligible: boolean; isActive: boolean;
  isRegulated: boolean; regulatoryNo: string; reorderLevel: string;
  // Seed agronomics
  seedVariety: string; seedDaysToMaturity: string; seedSowingSeason: string; seedGeo: string;
  // Fertiliser agronomics
  fertN: string; fertP: string; fertK: string; fertS: string; fertDosage: string;
  // Crop Protection agronomics
  pestActiveIngredient: string; pestFormulation: string; pestTargetPest: string;
  pestPHI: string; pestReEntry: string;
  // Crop Nutrition agronomics
  nutComposition: string; nutApplicationMethod: string;
  // Crop mappings
  cropMappings: CropMapping[];
}

const BLANK: FormState = {
  name: '', sku: '', brand: '', manufacturer: '',
  category: 'Seed', subCategory: '',
  packSize: '', unit: 'Kg', hsnCode: '', taxSlabPct: '0',
  mrp: '', b2cPrice: '',
  b2bPriceStandard: '', b2bPriceSilver: '', b2bPriceGold: '', b2bPricePlatinum: '',
  isSubsidised: false, loyaltyEligible: true, isActive: true,
  isRegulated: false, regulatoryNo: '', reorderLevel: '20',
  seedVariety: '', seedDaysToMaturity: '', seedSowingSeason: '', seedGeo: '',
  fertN: '', fertP: '', fertK: '', fertS: '', fertDosage: '',
  pestActiveIngredient: '', pestFormulation: '', pestTargetPest: '', pestPHI: '', pestReEntry: '',
  nutComposition: '', nutApplicationMethod: '',
  cropMappings: [],
};

function productToForm(p: Product): FormState {
  const m = p.agronomicMeta ?? {};
  return {
    name: p.name, sku: p.sku, brand: p.brand, manufacturer: p.manufacturer,
    category: p.category, subCategory: p.subCategory ?? '',
    packSize: p.packSize, unit: p.unit, hsnCode: p.hsnCode, taxSlabPct: String(p.taxSlabPct),
    mrp: String(p.mrp), b2cPrice: String(p.b2cPrice),
    b2bPriceStandard: String(p.b2bPrice),
    b2bPriceSilver:   String(p.b2bPriceSilver   ?? p.b2bPrice),
    b2bPriceGold:     String(p.b2bPriceGold     ?? p.b2bPrice),
    b2bPricePlatinum: String(p.b2bPricePlatinum ?? p.b2bPrice),
    isSubsidised: p.isSubsidised, loyaltyEligible: p.loyaltyEligible,
    isActive: p.isActive, isRegulated: p.isRegulated, regulatoryNo: p.regulatoryNo ?? '',
    reorderLevel: String(p.reorderLevel),
    seedVariety:    String(m.seedVariety    ?? ''),
    seedDaysToMaturity: String(m.seedDaysToMaturity ?? ''),
    seedSowingSeason:   String(m.seedSowingSeason   ?? ''),
    seedGeo:        String(m.seedGeo        ?? ''),
    fertN: String(m.fertN ?? ''), fertP: String(m.fertP ?? ''),
    fertK: String(m.fertK ?? ''), fertS: String(m.fertS ?? ''),
    fertDosage: String(m.fertDosage ?? ''),
    pestActiveIngredient: String(m.pestActiveIngredient ?? ''),
    pestFormulation:      String(m.pestFormulation      ?? ''),
    pestTargetPest:       String(m.pestTargetPest       ?? ''),
    pestPHI:              String(m.pestPHI              ?? ''),
    pestReEntry:          String(m.pestReEntry          ?? ''),
    nutComposition:       String(m.nutComposition       ?? ''),
    nutApplicationMethod: String(m.nutApplicationMethod ?? ''),
    cropMappings: p.cropMappings ? [...p.cropMappings] : [],
  };
}

function formToProduct(f: FormState, id: string): Product {
  const num = (s: string, fallback = 0) => parseFloat(s) || fallback;

  const agronomicMeta: Record<string, string | number> = {};
  if (f.category === 'Seed') {
    if (f.seedVariety)        agronomicMeta.seedVariety        = f.seedVariety;
    if (f.seedDaysToMaturity) agronomicMeta.seedDaysToMaturity = f.seedDaysToMaturity;
    if (f.seedSowingSeason)   agronomicMeta.seedSowingSeason   = f.seedSowingSeason;
    if (f.seedGeo)            agronomicMeta.seedGeo            = f.seedGeo;
  } else if (f.category === 'Fertiliser') {
    if (f.fertN) agronomicMeta.fertN = f.fertN;
    if (f.fertP) agronomicMeta.fertP = f.fertP;
    if (f.fertK) agronomicMeta.fertK = f.fertK;
    if (f.fertS) agronomicMeta.fertS = f.fertS;
    if (f.fertDosage) agronomicMeta.fertDosage = f.fertDosage;
  } else if (f.category === 'Pesticide') {
    if (f.pestActiveIngredient) agronomicMeta.pestActiveIngredient = f.pestActiveIngredient;
    if (f.pestFormulation)      agronomicMeta.pestFormulation      = f.pestFormulation;
    if (f.pestTargetPest)       agronomicMeta.pestTargetPest       = f.pestTargetPest;
    if (f.pestPHI)              agronomicMeta.pestPHI              = f.pestPHI;
    if (f.pestReEntry)          agronomicMeta.pestReEntry          = f.pestReEntry;
  } else if (f.category === 'Micronutrient') {
    if (f.nutComposition)       agronomicMeta.nutComposition       = f.nutComposition;
    if (f.nutApplicationMethod) agronomicMeta.nutApplicationMethod = f.nutApplicationMethod;
  }

  return {
    id,
    sku: f.sku.trim(), name: f.name.trim(), brand: f.brand.trim(),
    manufacturer: f.manufacturer.trim(), category: f.category,
    subCategory: f.subCategory.trim() || undefined,
    hsnCode: f.hsnCode.trim(), unit: f.unit, packSize: f.packSize.trim(),
    mrp: num(f.mrp), taxSlabPct: num(f.taxSlabPct) as TaxSlabPct,
    isRegulated: f.isRegulated, regulatoryNo: f.regulatoryNo.trim() || undefined,
    reorderLevel: num(f.reorderLevel, 20),
    b2cPrice: num(f.b2cPrice),
    b2bPrice: num(f.b2bPriceStandard),
    b2bPriceSilver:   f.b2bPriceSilver   ? num(f.b2bPriceSilver)   : undefined,
    b2bPriceGold:     f.b2bPriceGold     ? num(f.b2bPriceGold)     : undefined,
    b2bPricePlatinum: f.b2bPricePlatinum ? num(f.b2bPricePlatinum) : undefined,
    loyaltyEligible: f.loyaltyEligible, isSubsidised: f.isSubsidised, isActive: f.isActive,
    agronomicMeta: Object.keys(agronomicMeta).length ? agronomicMeta : undefined,
    cropMappings: f.cropMappings.filter(c => c.crop.trim()).length
      ? f.cropMappings.filter(c => c.crop.trim())
      : undefined,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

// ── Shared input style ─────────────────────────────────────────────────────────

const inp = (err?: boolean) =>
  `w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    err ? 'border-red-300' : 'border-gray-200'
  }`;

// ── Toggle component ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHead({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 pb-2 border-t border-gray-100 mt-2 first:border-t-0 first:pt-0">
      {title}
    </p>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  product?: Product;           // undefined = Add mode
  onSave: (p: Product) => void;
  onClose: () => void;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductForm({ product, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() =>
    product ? productToForm(product) : BLANK,
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const isEdit = !!product;

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim())    errs.name    = 'Required';
    if (!form.sku.trim())     errs.sku     = 'Required';
    if (!form.brand.trim())   errs.brand   = 'Required';
    if (!form.packSize.trim()) errs.packSize = 'Required';
    if (!form.hsnCode.trim()) errs.hsnCode = 'Required';
    if (!form.mrp)            errs.mrp     = 'Required';
    if (!form.b2cPrice)       errs.b2cPrice = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const id = product?.id ?? `prd-${Date.now()}`;
    console.log(`// ${isEdit ? 'PUT' : 'POST'} /api/products/${id}`);
    onSave(formToProduct(form, id));
  }

  function addCropMapping() {
    set('cropMappings', [...form.cropMappings, { crop: '', growthStage: '' }]);
  }

  function updateMapping(idx: number, field: keyof CropMapping, value: string) {
    const next = form.cropMappings.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    set('cropMappings', next);
  }

  function removeMapping(idx: number) {
    set('cropMappings', form.cropMappings.filter((_, i) => i !== idx));
  }

  const cat = form.category;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[560px] bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 text-sm">

          {/* ── Product Information ─────────────────────────────────────── */}
          <SectionHead title="Product Information" />

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className={inp(!!errors.name)} placeholder="e.g. DAP 50 Kg" />
              {errors.name && <p className="text-[11px] text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SKU <span className="text-red-500">*</span></label>
              <input value={form.sku} onChange={e => set('sku', e.target.value.toUpperCase())} className={`${inp(!!errors.sku)} font-mono`} placeholder="FRT-DAP-007" />
              {errors.sku && <p className="text-[11px] text-red-500 mt-0.5">{errors.sku}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)} className={inp(!!errors.brand)} placeholder="e.g. IFFCO" />
              {errors.brand && <p className="text-[11px] text-red-500 mt-0.5">{errors.brand}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Manufacturer</label>
              <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} className={inp()} placeholder="Full legal manufacturer name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={e => set('category', e.target.value as ProductCategory)} className={inp()}>
                {FORM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sub-Category</label>
              <input value={form.subCategory} onChange={e => set('subCategory', e.target.value)} className={inp()} placeholder="e.g. Herbicide, Zinc" />
            </div>
          </div>

          {/* ── Packaging & Pricing ─────────────────────────────────────── */}
          <SectionHead title="Packaging & Pricing" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pack Size <span className="text-red-500">*</span></label>
              <input value={form.packSize} onChange={e => set('packSize', e.target.value)} className={inp(!!errors.packSize)} placeholder="e.g. 50 Kg, 1 L" />
              {errors.packSize && <p className="text-[11px] text-red-500 mt-0.5">{errors.packSize}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value as ProductUnit)} className={inp()}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">MRP (₹) <span className="text-red-500">*</span></label>
              <input type="number" min={0} value={form.mrp} onChange={e => set('mrp', e.target.value)} className={inp(!!errors.mrp)} placeholder="0" />
              {errors.mrp && <p className="text-[11px] text-red-500 mt-0.5">{errors.mrp}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">B2C Price (₹) <span className="text-red-500">*</span></label>
              <input type="number" min={0} value={form.b2cPrice} onChange={e => set('b2cPrice', e.target.value)} className={inp(!!errors.b2cPrice)} placeholder="0" />
              {errors.b2cPrice && <p className="text-[11px] text-red-500 mt-0.5">{errors.b2cPrice}</p>}
            </div>
          </div>

          {/* B2B prices */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">B2B Prices (₹)</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'b2bPriceStandard' as const, label: 'Standard' },
                { key: 'b2bPriceSilver'   as const, label: 'Silver'   },
                { key: 'b2bPriceGold'     as const, label: 'Gold'     },
                { key: 'b2bPricePlatinum' as const, label: 'Platinum' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <p className="text-[10px] text-gray-500 mb-1">{label}</p>
                  <input type="number" min={0} value={form[key]} onChange={e => set(key, e.target.value)} className={inp()} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Tax & Compliance ────────────────────────────────────────── */}
          <SectionHead title="Tax & Compliance" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">HSN Code <span className="text-red-500">*</span></label>
              <input value={form.hsnCode} onChange={e => set('hsnCode', e.target.value)} className={`${inp(!!errors.hsnCode)} font-mono`} placeholder="e.g. 3105" />
              {errors.hsnCode && <p className="text-[11px] text-red-500 mt-0.5">{errors.hsnCode}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GST Rate</label>
              <select value={form.taxSlabPct} onChange={e => set('taxSlabPct', e.target.value)} className={inp()}>
                {GST_SLABS.map(s => <option key={s} value={s}>{s}%</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reorder Level</label>
              <input type="number" min={0} value={form.reorderLevel} onChange={e => set('reorderLevel', e.target.value)} className={inp()} />
            </div>
          </div>

          <Toggle
            checked={form.isRegulated}
            onChange={() => set('isRegulated', !form.isRegulated)}
            label="CIB Regulated"
            sub="Requires CIB registration number; licence verification at sale"
          />
          {form.isRegulated && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Regulatory / CIB No.</label>
              <input value={form.regulatoryNo} onChange={e => set('regulatoryNo', e.target.value)} className={inp()} placeholder="CIB/INS/2018/3412" />
            </div>
          )}

          {/* ── Attributes ──────────────────────────────────────────────── */}
          <SectionHead title="Attributes" />

          {cat === 'Fertiliser' && (
            <Toggle
              checked={form.isSubsidised}
              onChange={() => set('isSubsidised', !form.isSubsidised)}
              label="Government Subsidised"
              sub="MRP is GoI-fixed; Aadhaar verification required at sale"
            />
          )}
          <Toggle
            checked={form.loyaltyEligible}
            onChange={() => set('loyaltyEligible', !form.loyaltyEligible)}
            label="Loyalty Points Eligible"
            sub="Farmer earns points on POS purchase of this product"
          />
          <Toggle
            checked={form.isActive}
            onChange={() => set('isActive', !form.isActive)}
            label="Active"
            sub="Inactive products do not appear in POS or B2B order forms"
          />

          {/* ── Agronomic Details ────────────────────────────────────────── */}
          {cat === 'Seed' && (
            <>
              <SectionHead title="Seed Details" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Variety</label>
                  <input value={form.seedVariety} onChange={e => set('seedVariety', e.target.value)} className={inp()} placeholder="e.g. JS-335, GW-322" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Days to Maturity</label>
                  <input value={form.seedDaysToMaturity} onChange={e => set('seedDaysToMaturity', e.target.value)} className={inp()} placeholder="e.g. 90–100" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sowing Season</label>
                  <input value={form.seedSowingSeason} onChange={e => set('seedSowingSeason', e.target.value)} className={inp()} placeholder="e.g. Kharif, Rabi" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Recommended Geography</label>
                  <input value={form.seedGeo} onChange={e => set('seedGeo', e.target.value)} className={inp()} placeholder="e.g. Vidarbha, Telangana" />
                </div>
              </div>
            </>
          )}

          {cat === 'Fertiliser' && (
            <>
              <SectionHead title="Nutrient Profile" />
              <div className="grid grid-cols-4 gap-2">
                {(['fertN', 'fertP', 'fertK', 'fertS'] as const).map((key, i) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{['N%', 'P%', 'K%', 'S%'][i]}</label>
                    <input type="number" min={0} max={100} step={0.1} value={form[key]} onChange={e => set(key, e.target.value)} className={inp()} placeholder="0" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Recommended Dosage</label>
                <input value={form.fertDosage} onChange={e => set('fertDosage', e.target.value)} className={inp()} placeholder="e.g. 50 Kg/acre" />
              </div>
            </>
          )}

          {cat === 'Pesticide' && (
            <>
              <SectionHead title="Crop Protection Details" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Active Ingredient</label>
                  <input value={form.pestActiveIngredient} onChange={e => set('pestActiveIngredient', e.target.value)} className={inp()} placeholder="e.g. Imidacloprid 70%" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Formulation Type</label>
                  <input value={form.pestFormulation} onChange={e => set('pestFormulation', e.target.value)} className={inp()} placeholder="e.g. WP, EC, SL, WS" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Pest</label>
                  <input value={form.pestTargetPest} onChange={e => set('pestTargetPest', e.target.value)} className={inp()} placeholder="e.g. Aphids, Whitefly, Downy Mildew" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">PHI (days)</label>
                  <input type="number" min={0} value={form.pestPHI} onChange={e => set('pestPHI', e.target.value)} className={inp()} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Re-Entry Interval (hrs)</label>
                  <input type="number" min={0} value={form.pestReEntry} onChange={e => set('pestReEntry', e.target.value)} className={inp()} placeholder="0" />
                </div>
              </div>
            </>
          )}

          {cat === 'Micronutrient' && (
            <>
              <SectionHead title="Crop Nutrition Details" />
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nutrient Composition</label>
                  <input value={form.nutComposition} onChange={e => set('nutComposition', e.target.value)} className={inp()} placeholder="e.g. Zinc 33%, Sulphate 14%" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Application Method</label>
                  <input value={form.nutApplicationMethod} onChange={e => set('nutApplicationMethod', e.target.value)} className={inp()} placeholder="e.g. Foliar spray, Soil drench, Basal" />
                </div>
              </div>
            </>
          )}

          {/* ── Crop Mappings ───────────────────────────────────────────── */}
          <SectionHead title="Crop Mappings" />
          <div className="space-y-2">
            {form.cropMappings.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={m.crop}
                  onChange={e => updateMapping(idx, 'crop', e.target.value)}
                  className={`${inp()} flex-1`}
                  placeholder="Crop name"
                />
                <input
                  value={m.growthStage}
                  onChange={e => updateMapping(idx, 'growthStage', e.target.value)}
                  className={`${inp()} flex-1`}
                  placeholder="Growth stage"
                />
                <button
                  type="button"
                  onClick={() => removeMapping(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCropMapping}
              className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
            >
              <Plus size={13} />
              Add Crop Mapping
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Check size={15} />
            {isEdit ? 'Save Changes' : 'Add Product'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
