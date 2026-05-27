import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Store } from '../../types/entities';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ─────────────────────────────────────────────────────────────────

const BDM_USERS = MOCK_USERS.filter((u) => u.role === 'BDM' || u.role === 'OperationsHead');

const ZONE_OPTIONS = [
  { value: 'MH-VID', label: 'MH-VID — Maharashtra Vidarbha' },
  { value: 'TS-TRL', label: 'TS-TRL — Telangana Tribal'     },
  { value: 'MH-MRT', label: 'MH-MRT — Maharashtra Marathwada' },
  { value: 'KA-NTH', label: 'KA-NTH — Karnataka North'      },
];

const STATES = [
  'Andhra Pradesh', 'Chhattisgarh', 'Goa', 'Gujarat', 'Karnataka',
  'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Rajasthan', 'Telangana',
  'Uttar Pradesh', 'West Bengal',
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  code: string;
  line1: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  gstIn: string;
  phone: string;
  email: string;
  bdmUserId: string;
  managerUserId: string;
  zoneCode: string;
  warehouseId: string;
  isActive: boolean;
}

function makeEmpty(): FormState {
  return {
    name: '', code: '', line1: '', village: '', taluka: '', district: '',
    state: 'Maharashtra', pincode: '', gstIn: '', phone: '', email: '',
    bdmUserId: BDM_USERS[0]?.id ?? '',
    managerUserId: '',
    zoneCode: 'MH-VID',
    warehouseId: 'wh-ngp-001',
    isActive: true,
  };
}

function storeToForm(s: Store): FormState {
  return {
    name:         s.name,
    code:         s.code,
    line1:        s.address.line1,
    village:      s.address.village  ?? '',
    taluka:       s.address.taluka   ?? '',
    district:     s.address.district,
    state:        s.address.state,
    pincode:      s.address.pincode,
    gstIn:        s.gstIn,
    phone:        s.phone,
    email:        s.email ?? '',
    bdmUserId:    s.bdmUserId,
    managerUserId: s.managerUserId,
    zoneCode:     s.zoneCode,
    warehouseId:  s.warehouseId,
    isActive:     s.isActive,
  };
}

// Auto-suggest store code from district name + sequence
function suggestCode(district: string, existingCodes: string[]): string {
  if (!district.trim()) return '';
  const prefix = district.trim().slice(0, 3).toUpperCase();
  for (let i = 1; i <= 99; i++) {
    const candidate = `${prefix}-${String(i).padStart(3, '0')}`;
    if (!existingCodes.includes(candidate)) return candidate;
  }
  return `${prefix}-001`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  store?: Store;
  existingCodes: string[];
  onSave: (store: Store) => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoreForm({ store, existingCodes, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(store ? storeToForm(store) : makeEmpty());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const isEdit = !!store;

  // Auto-suggest store code when district changes (new form only)
  useEffect(() => {
    if (!isEdit && form.district && !form.code) {
      setForm((f) => ({ ...f, code: suggestCode(f.district, existingCodes) }));
    }
  }, [form.district, isEdit, existingCodes, form.code]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim())     e.name     = 'Store name is required';
    if (!form.code.trim())     e.code     = 'Store code is required';
    if (!form.line1.trim())    e.line1    = 'Address line is required';
    if (!form.district.trim()) e.district = 'District is required';
    if (!form.pincode.match(/^\d{6}$/)) e.pincode = 'Enter a valid 6-digit PIN';
    if (!form.gstIn.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/))
      e.gstIn = 'Invalid GSTIN format';
    if (!form.phone.trim())    e.phone    = 'Phone is required';
    if (!form.bdmUserId)       e.bdmUserId = 'Assign a BDM';
    if (!form.zoneCode)        e.zoneCode  = 'Select a zone';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const now = new Date().toISOString();
    const saved: Store = {
      id:          store?.id ?? `str-${form.code.toLowerCase().replace('-', '-')}`,
      code:        form.code.trim().toUpperCase(),
      name:        form.name.trim(),
      zoneCode:    form.zoneCode,
      address: {
        line1:    form.line1.trim(),
        village:  form.village.trim() || undefined,
        taluka:   form.taluka.trim()  || undefined,
        district: form.district.trim(),
        state:    form.state,
        pincode:  form.pincode.trim(),
      },
      gstIn:        form.gstIn.trim().toUpperCase(),
      phone:        form.phone.trim(),
      email:        form.email.trim() || undefined,
      warehouseId:  form.warehouseId,
      bdmUserId:    form.bdmUserId,
      managerUserId: form.managerUserId || 'usr-003',
      isActive:     form.isActive,
      createdAt:    store?.createdAt ?? now,
    };
    onSave(saved);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function Field({
    label, required, error, children,
  }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? `Edit Store — ${store!.code}` : 'Add New Store'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">All changes saved locally until API is connected</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Identity */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Store Identity</p>
            <div className="space-y-3">
              <Field label="Store Name" required error={errors.name}>
                <input value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="Bharat Agri Store – Pune" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Store Code" required error={errors.code}>
                  <input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())}
                    placeholder="PUN-001" className={inputCls} />
                </Field>
                <Field label="Zone / Region" required error={errors.zoneCode}>
                  <select value={form.zoneCode} onChange={(e) => set('zoneCode', e.target.value)} className={inputCls}>
                    {ZONE_OPTIONS.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Address</p>
            <div className="space-y-3">
              <Field label="Address Line 1" required error={errors.line1}>
                <input value={form.line1} onChange={(e) => set('line1', e.target.value)}
                  placeholder="14, Krishi Bhavan Road, APMC Yard Area" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Village / Town">
                  <input value={form.village} onChange={(e) => set('village', e.target.value)}
                    placeholder="Shirpur" className={inputCls} />
                </Field>
                <Field label="Taluka">
                  <input value={form.taluka} onChange={(e) => set('taluka', e.target.value)}
                    placeholder="Akola" className={inputCls} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="District" required error={errors.district}>
                  <input value={form.district} onChange={(e) => set('district', e.target.value)}
                    placeholder="Akola" className={inputCls} />
                </Field>
                <Field label="PIN Code" required error={errors.pincode}>
                  <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)}
                    placeholder="444001" maxLength={6} className={inputCls} />
                </Field>
              </div>
              <Field label="State" required>
                <select value={form.state} onChange={(e) => set('state', e.target.value)} className={inputCls}>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Compliance */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Compliance</p>
            <Field label="GSTIN" required error={errors.gstIn}>
              <input value={form.gstIn} onChange={(e) => set('gstIn', e.target.value.toUpperCase())}
                placeholder="27AABCB1234A1Z5" maxLength={15} className={`${inputCls} font-mono`} />
            </Field>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" required error={errors.phone}>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                  placeholder="+91 724 248 0001" className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="store@bharatagri.in" className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assignment</p>
            <div className="space-y-3">
              <Field label="Assigned BDM" required error={errors.bdmUserId}>
                <select value={form.bdmUserId} onChange={(e) => set('bdmUserId', e.target.value)} className={inputCls}>
                  {BDM_USERS.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </Field>
              <Field label="Fulfilment Warehouse">
                <select value={form.warehouseId} onChange={(e) => set('warehouseId', e.target.value)} className={inputCls}>
                  <option value="wh-ngp-001">Nagpur Central Warehouse</option>
                  <option value="wh-hyd-001">Hyderabad Regional Warehouse</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-800">Active Store</p>
              <p className="text-xs text-gray-400 mt-0.5">Inactive stores are hidden from POS and field views</p>
            </div>
            <button
              onClick={() => set('isActive', !form.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            {isEdit ? 'Save Changes' : 'Add Store'}
          </button>
        </div>
      </div>
    </>
  );
}
