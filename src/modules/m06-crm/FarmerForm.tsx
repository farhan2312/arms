// FarmerForm — slide-over panel for Add / Edit farmer
// POST /api/farmers when backend ready

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Farmer } from '../../types/entities';

const ALL_CROPS = ['Cotton', 'Gram', 'Maize', 'Mustard', 'Orange', 'Paddy', 'Soybean', 'Sunflower', 'Tur', 'Vegetables', 'Wheat'];
const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Telugu', 'Kannada', 'Tamil'] as const;
type Language = typeof LANGUAGES[number];

interface Props {
  farmers: Farmer[];
  onSave: (farmer: Farmer, preferredLanguage: string) => void;
  onClose: () => void;
}

function blankForm() {
  return {
    name: '',
    mobile: '',
    village: '',
    taluka: '',
    district: '',
    state: 'Maharashtra',
    landAcres: '',
    cropTypes: [] as string[],
    preferredLanguage: 'Marathi' as Language,
  };
}

export default function FarmerForm({ farmers, onSave, onClose }: Props) {
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
    setError('');
  }

  function toggleCrop(crop: string) {
    setForm(prev => ({
      ...prev,
      cropTypes: prev.cropTypes.includes(crop)
        ? prev.cropTypes.filter(c => c !== crop)
        : [...prev.cropTypes, crop],
    }));
  }

  function handleSave() {
    const mobile = form.mobile.replace(/\D/g, '').slice(-10);
    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (mobile.length !== 10) { setError('Enter a valid 10-digit mobile number.'); return; }
    if (!form.village.trim()) { setError('Village is required.'); return; }
    if (!form.taluka.trim()) { setError('Taluka is required.'); return; }
    if (!form.district.trim()) { setError('District is required.'); return; }
    if (!form.landAcres || isNaN(Number(form.landAcres)) || Number(form.landAcres) <= 0) {
      setError('Enter a valid land holding in acres.'); return;
    }
    if (form.cropTypes.length === 0) { setError('Select at least one crop.'); return; }

    const mobileFormatted = `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    const duplicate = farmers.some(f => f.mobile.replace(/\D/g, '').slice(-10) === mobile);
    if (duplicate) { setError(`Mobile ${mobileFormatted} is already registered.`); return; }

    const now = new Date().toISOString();
    const newFarmer: Farmer = {
      id: `fmr-${Date.now()}`,
      name: form.name.trim(),
      mobile: mobileFormatted,
      kycStatus: 'Pending',
      address: {
        line1: '',
        village: form.village.trim(),
        taluka: form.taluka.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: '',
      },
      landAcres: Number(form.landAcres),
      cropTypes: form.cropTypes,
      loyaltyWalletId: `wal-${Date.now()}`,
      registeredAt: now,
      registeredByStoreId: '',
      registeredByUserId: '',
      isActive: true,
    };

    console.log('// POST /api/farmers', newFarmer);
    console.log('// POST /api/loyalty/wallets { farmerId, tier: "Green", currentPoints: 0 }');
    onSave(newFarmer, form.preferredLanguage);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] max-w-full bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Add Farmer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="As per KYC document"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number *</label>
              <input value={form.mobile} onChange={e => set('mobile', e.target.value)}
                placeholder="10-digit mobile (primary key)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Village *</label>
              <input value={form.village} onChange={e => set('village', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Taluka *</label>
              <input value={form.taluka} onChange={e => set('taluka', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">District *</label>
              <input value={form.district} onChange={e => set('district', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
              <input value={form.state} onChange={e => set('state', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Land Holding (acres) *</label>
              <input type="number" min={0} step={0.5} value={form.landAcres} onChange={e => set('landAcres', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Language</label>
              <select value={form.preferredLanguage} onChange={e => set('preferredLanguage', e.target.value as Language)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Crops */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Crops Grown * <span className="text-gray-400 font-normal">(select all that apply)</span></label>
            <div className="flex flex-wrap gap-2">
              {ALL_CROPS.map(crop => {
                const selected = form.cropTypes.includes(crop);
                return (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => toggleCrop(crop)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {crop}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
            A Green-tier loyalty wallet with 0 points will be automatically created on save.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Register Farmer
          </button>
        </div>
      </div>
    </>
  );
}
