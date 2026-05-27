import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import type { RetailerAccount, RetailerTier } from '../../types/b2b';
import { MOCK_USERS } from '../../data/mockUsers';

const TIERS: RetailerTier[] = ['Standard', 'Silver', 'Gold', 'Preferred'];
const PAYMENT_TERMS = [
  { label: 'Advance',   days: 0  },
  { label: '7-Day',     days: 7  },
  { label: '15-Day',    days: 15 },
  { label: '30-Day',    days: 30 },
  { label: '45-Day',    days: 45 },
];
const SALES_EXECS = MOCK_USERS.filter((u) => u.role === 'B2BSalesExecutive');
const BDM_USERS   = MOCK_USERS.filter((u) => u.role === 'BDM');

interface KycFile { name: string; fileName: string | null }

interface FormState {
  firmName: string;
  ownerName: string;
  mobile: string;
  email: string;
  line1: string;
  district: string;
  state: string;
  pincode: string;
  gstIn: string;
  pan: string;
  businessRegNo: string;
  tier: RetailerTier;
  creditLimitAmt: string;
  creditDays: number;
  bdmUserId: string;
  salesExecUserId: string;
  isActive: boolean;
  kycGst: string | null;
  kycShopReg: string | null;
}

function toForm(r?: RetailerAccount): FormState {
  return {
    firmName:       r?.firmName ?? '',
    ownerName:      r?.ownerName ?? '',
    mobile:         r?.mobile ?? '',
    email:          r?.email ?? '',
    line1:          r?.address.line1 ?? '',
    district:       r?.address.district ?? '',
    state:          r?.address.state ?? '',
    pincode:        r?.address.pincode ?? '',
    gstIn:          r?.gstIn ?? '',
    pan:            r?.pan ?? '',
    businessRegNo:  '',
    tier:           r?.tier ?? 'Standard',
    creditLimitAmt: r ? String(r.creditLimitAmt) : '',
    creditDays:     r?.creditDays ?? 30,
    bdmUserId:      r?.bdmUserId ?? (BDM_USERS[0]?.id ?? ''),
    salesExecUserId: r?.salesExecUserId ?? '',
    isActive:       r?.isActive ?? true,
    kycGst:         null,
    kycShopReg:     null,
  };
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-5 mb-3">{children}</p>;
}

interface Props {
  retailer?: RetailerAccount;
  onSave: (r: RetailerAccount) => void;
  onClose: () => void;
}

export default function RetailerForm({ retailer, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(retailer));

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function pickFile(field: 'kycGst' | 'kycShopReg', e: React.ChangeEvent<HTMLInputElement>) {
    set(field, e.target.files?.[0]?.name ?? null);
  }

  function handleSubmit() {
    if (!form.firmName.trim() || !form.gstIn.trim()) return;
    const now = new Date().toISOString();
    const saved: RetailerAccount = {
      id:             retailer?.id ?? `ret-${Date.now()}`,
      firmName:       form.firmName.trim(),
      ownerName:      form.ownerName.trim(),
      mobile:         form.mobile.trim(),
      email:          form.email.trim() || undefined,
      gstIn:          form.gstIn.trim(),
      pan:            form.pan.trim() || undefined,
      address: {
        line1:    form.line1.trim(),
        district: form.district.trim(),
        state:    form.state.trim(),
        pincode:  form.pincode.trim(),
      },
      tier:            form.tier,
      creditLimitAmt:  parseFloat(form.creditLimitAmt) || 0,
      outstandingAmt:  retailer?.outstandingAmt ?? 0,
      creditDays:      form.creditDays,
      bdmUserId:       form.bdmUserId,
      salesExecUserId: form.salesExecUserId || undefined,
      isActive:        form.isActive,
      onboardedAt:     retailer?.onboardedAt ?? now,
      updatedAt:       now,
    };
    console.log('// POST /api/retailers', saved);
    onSave(saved);
  }

  const canSave = form.firmName.trim() && form.gstIn.trim();

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{retailer ? 'Edit Retailer' : 'Add Retailer Account'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{retailer ? retailer.firmName : 'Onboard a new B2B dealer account'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <SectionHead>Business Info</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Business / Firm Name" required>
                <input value={form.firmName} onChange={(e) => set('firmName', e.target.value)} placeholder="e.g. Vidarbha Agro Inputs Pvt Ltd" className={inputCls} />
              </Field>
            </div>
            <Field label="Owner Name" required>
              <input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="Primary contact" className={inputCls} />
            </Field>
            <Field label="Mobile Number" required>
              <input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="+91 98000 00000" className={inputCls} />
            </Field>
            <div className="col-span-2">
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="dealer@example.com" className={inputCls} />
              </Field>
            </div>
          </div>

          <SectionHead>Address</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Street / Shop Address">
                <input value={form.line1} onChange={(e) => set('line1', e.target.value)} placeholder="Shop No, Road, Area" className={inputCls} />
              </Field>
            </div>
            <Field label="District" required>
              <input value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="e.g. Akola" className={inputCls} />
            </Field>
            <Field label="State" required>
              <input value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Maharashtra" className={inputCls} />
            </Field>
            <Field label="Pincode">
              <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="444001" maxLength={6} className={inputCls} />
            </Field>
          </div>

          <SectionHead>Compliance</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="GSTIN" required>
                <input value={form.gstIn} onChange={(e) => set('gstIn', e.target.value.toUpperCase())} placeholder="27AABCV9012A1Z3" maxLength={15} className={`${inputCls} font-mono`} />
              </Field>
            </div>
            <Field label="PAN">
              <input value={form.pan} onChange={(e) => set('pan', e.target.value.toUpperCase())} placeholder="AABCV9012A" maxLength={10} className={`${inputCls} font-mono`} />
            </Field>
            <Field label="Business Reg. No.">
              <input value={form.businessRegNo} onChange={(e) => set('businessRegNo', e.target.value)} placeholder="CIN / Reg No." className={inputCls} />
            </Field>
          </div>

          <SectionHead>Commercial Terms</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tier">
              <select value={form.tier} onChange={(e) => set('tier', e.target.value as RetailerTier)} className={inputCls}>
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Credit Limit (₹)">
              <input type="number" value={form.creditLimitAmt} onChange={(e) => set('creditLimitAmt', e.target.value)} placeholder="500000" className={inputCls} />
            </Field>
            <Field label="Payment Terms">
              <select value={form.creditDays} onChange={(e) => set('creditDays', Number(e.target.value))} className={inputCls}>
                {PAYMENT_TERMS.map(({ label, days }) => <option key={days} value={days}>{label}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => set('isActive', e.target.value === 'active')} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <SectionHead>Assignment</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assigned BDM">
              <select value={form.bdmUserId} onChange={(e) => set('bdmUserId', e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {BDM_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Assigned Sales Executive">
              <select value={form.salesExecUserId} onChange={(e) => set('salesExecUserId', e.target.value)} className={inputCls}>
                <option value="">— None —</option>
                {SALES_EXECS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          </div>

          <SectionHead>KYC Documents</SectionHead>
          <div className="space-y-3">
            {([
              { key: 'kycGst' as const,     label: 'GST Certificate' },
              { key: 'kycShopReg' as const, label: 'Shop Registration / Trade Licence' },
            ]).map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between gap-3 px-4 py-3 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {form[key] ?? 'No file chosen'}
                  </p>
                </div>
                <Upload size={14} className="text-gray-400 flex-shrink-0" />
                <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => pickFile(key, e)} />
              </label>
            ))}
          </div>
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {retailer ? 'Save Changes' : 'Add Retailer'}
          </button>
        </div>
      </div>
    </>
  );
}
