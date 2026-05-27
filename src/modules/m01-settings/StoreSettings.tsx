// StoreSettings — view and edit store details
// Add Store opens a blank slide-over; Edit populates it

import { useState, useMemo } from 'react';
import { Plus, Pencil, X, Check, MapPin, Phone, Mail } from 'lucide-react';
import type { Store } from '../../types/entities';
import { mockStores } from '../../data/mockStores';
import { MOCK_USERS } from '../../data/mockUsers';

interface StoreFormState {
  name: string;
  code: string;
  zoneCode: string;
  line1: string;
  district: string;
  taluka: string;
  state: string;
  pincode: string;
  gstIn: string;
  phone: string;
  email: string;
  bdmUserId: string;
}

const BLANK_FORM: StoreFormState = {
  name: '',
  code: '',
  zoneCode: '',
  line1: '',
  district: '',
  taluka: '',
  state: '',
  pincode: '',
  gstIn: '',
  phone: '',
  email: '',
  bdmUserId: '',
};

function storeToForm(s: Store): StoreFormState {
  return {
    name: s.name,
    code: s.code,
    zoneCode: s.zoneCode,
    line1: s.address.line1,
    district: s.address.district,
    taluka: s.address.taluka ?? '',
    state: s.address.state,
    pincode: s.address.pincode,
    gstIn: s.gstIn,
    phone: s.phone,
    email: s.email ?? '',
    bdmUserId: s.bdmUserId,
  };
}

const inputCls = (err?: boolean) =>
  `w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    err ? 'border-red-300' : 'border-gray-300'
  }`;

const bdmUsers = MOCK_USERS.filter(u => u.role === 'BDM');

export default function StoreSettings() {
  const [stores, setStores] = useState<Store[]>(mockStores);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StoreFormState>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StoreFormState, string>>>({});

  const userNameById = useMemo(
    () => new Map(MOCK_USERS.map(u => [u.id, u.name])),
    [],
  );

  function openAdd() {
    setEditingId(null);
    setForm(BLANK_FORM);
    setErrors({});
    setShowForm(true);
  }

  function openEdit(store: Store) {
    setEditingId(store.id);
    setForm(storeToForm(store));
    setErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function set<K extends keyof StoreFormState>(field: K, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof StoreFormState, string>> = {};
    if (!form.name.trim())     errs.name = 'Store name is required.';
    if (!form.code.trim())     errs.code = 'Store code is required.';
    if (!form.gstIn.trim())    errs.gstIn = 'GSTIN is required.';
    if (!form.district.trim()) errs.district = 'District is required.';
    if (!form.state.trim())    errs.state = 'State is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;

    if (editingId) {
      setStores(prev => prev.map(s => {
        if (s.id !== editingId) return s;
        return {
          ...s,
          name: form.name.trim(),
          code: form.code.trim(),
          zoneCode: form.zoneCode.trim(),
          address: {
            line1: form.line1.trim(),
            district: form.district.trim(),
            taluka: form.taluka.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
          },
          gstIn: form.gstIn.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          bdmUserId: form.bdmUserId,
        };
      }));
      console.log('// PUT /api/stores/' + editingId, form);
    } else {
      const newStore: Store = {
        id: `str-${Date.now()}`,
        name: form.name.trim(),
        code: form.code.trim(),
        zoneCode: form.zoneCode.trim(),
        address: {
          line1: form.line1.trim(),
          district: form.district.trim(),
          taluka: form.taluka.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
        },
        gstIn: form.gstIn.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        warehouseId: '',
        bdmUserId: form.bdmUserId,
        managerUserId: '',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setStores(prev => [...prev, newStore]);
      console.log('// POST /api/stores', newStore);
    }
    closeForm();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{stores.length} stores</p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} />
          Add Store
        </button>
      </div>

      {/* Store cards */}
      <div className="grid gap-3">
        {stores.map(store => {
          const bdmName = userNameById.get(store.bdmUserId);
          return (
            <div key={store.id} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-start gap-4">
              {/* Code badge */}
              <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-emerald-700">{store.code}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{store.name}</p>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{store.zoneCode}</span>
                  </div>
                  <button
                    onClick={() => openEdit(store)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                    title="Edit store"
                  >
                    <Pencil size={13} />
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                    {store.address.line1}, {store.address.district} – {store.address.pincode}
                  </span>
                  {store.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={11} className="text-gray-400 flex-shrink-0" />
                      {store.phone}
                    </span>
                  )}
                  <span className="text-gray-400 font-mono text-[11px]">GSTIN: {store.gstIn}</span>
                  {store.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={11} className="text-gray-400 flex-shrink-0" />
                      {store.email}
                    </span>
                  )}
                  {bdmName && (
                    <span className="col-span-2 text-gray-400">BDM: <span className="text-gray-600 font-medium">{bdmName}</span></span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closeForm} />
          <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-900">
                {editingId ? 'Edit Store' : 'Add Store'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls(!!errors.name)} placeholder="Bharat Agri Store – City" />
                  {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Store Code <span className="text-red-500">*</span></label>
                  <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className={inputCls(!!errors.code)} placeholder="e.g. AKL-001" />
                  {errors.code && <p className="text-[11px] text-red-500 mt-1">{errors.code}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 1</label>
                <input value={form.line1} onChange={e => set('line1', e.target.value)} className={inputCls()} placeholder="Street / area" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">District <span className="text-red-500">*</span></label>
                  <input value={form.district} onChange={e => set('district', e.target.value)} className={inputCls(!!errors.district)} placeholder="e.g. Akola" />
                  {errors.district && <p className="text-[11px] text-red-500 mt-1">{errors.district}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Taluka</label>
                  <input value={form.taluka} onChange={e => set('taluka', e.target.value)} className={inputCls()} placeholder="e.g. Akola" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                  <input value={form.state} onChange={e => set('state', e.target.value)} className={inputCls(!!errors.state)} placeholder="e.g. Maharashtra" />
                  {errors.state && <p className="text-[11px] text-red-500 mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                  <input value={form.pincode} onChange={e => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} className={inputCls()} placeholder="444001" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Zone Code</label>
                <input value={form.zoneCode} onChange={e => set('zoneCode', e.target.value.toUpperCase())} className={inputCls()} placeholder="e.g. MH-VID" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN <span className="text-red-500">*</span></label>
                <input value={form.gstIn} onChange={e => set('gstIn', e.target.value.toUpperCase())} className={`${inputCls(!!errors.gstIn)} font-mono`} placeholder="27AABCB1234A1Z5" />
                {errors.gstIn && <p className="text-[11px] text-red-500 mt-1">{errors.gstIn}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls()} placeholder="+91 724 248 0001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls()} placeholder="store@bharatagri.in" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned BDM</label>
                <select value={form.bdmUserId} onChange={e => set('bdmUserId', e.target.value)} className={inputCls()}>
                  <option value="">— None —</option>
                  {bdmUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Check size={15} />
                {editingId ? 'Save Changes' : 'Create Store'}
              </button>
              <button
                onClick={closeForm}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
