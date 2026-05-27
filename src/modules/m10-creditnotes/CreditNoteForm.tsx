import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { CreditNote, CreditNoteType, SupplierReason, B2BReason } from './types';
import { mockRetailers } from '../../data/mockRetailers';
import { mockB2BInvoices } from '../../data/mockB2BInvoices';
import { mockSuppliers } from '../../data/mockSuppliers';

// ── Static data ───────────────────────────────────────────────────────────────

const SUPPLIER_GRNS: Record<string, GrnEntry[]> = {
  'sup-001': [
    { id: 'grn-2025-001', label: 'GRN-2025-001 — Urea 45 Kg × 280 bags (2025-01-15)',
      batchId: 'bat-012', batchNo: 'NFL-URE-2501', productId: 'prd-006',
      productName: 'Urea (Neem Coated) 45 Kg', qty: 280, cogs: 218 },
    { id: 'grn-2025-006', label: 'GRN-2025-006 — Urea 45 Kg × 500 bags (2025-03-10)',
      batchId: 'bat-011', batchNo: 'NFL-URE-2502', productId: 'prd-006',
      productName: 'Urea (Neem Coated) 45 Kg', qty: 500, cogs: 220 },
    { id: 'grn-2025-007', label: 'GRN-2025-007 — DAP 50 Kg × 400 bags (2025-03-20)',
      batchId: 'bat-013', batchNo: 'IFF-DAP-2502', productId: 'prd-007',
      productName: 'DAP (Di-Ammonium Phosphate) 50 Kg', qty: 400, cogs: 1180 },
  ],
  'sup-002': [
    { id: 'grn-2025-018', label: 'GRN-2025-018 — Glyphosate 41%SL × 160 L (2025-03-15)',
      batchId: 'bat-035', batchNo: 'SYN-GLY-2501', productId: 'prd-018',
      productName: 'Glyphosate 41% SL', qty: 160, cogs: 228 },
  ],
  'sup-003': [
    { id: 'grn-2025-016', label: 'GRN-2025-016 — Imidacloprid 70%WS × 200 pkts (2025-03-01)',
      batchId: 'bat-031', batchNo: 'BAY-IMD-2501', productId: 'prd-016',
      productName: 'Imidacloprid 70% WS', qty: 200, cogs: 380 },
  ],
  'sup-004': [
    { id: 'grn-2025-017', label: 'GRN-2025-017 — Chlorpyrifos 20%EC × 180 L (2025-02-08)',
      batchId: 'bat-033', batchNo: 'COR-CHL-2501', productId: 'prd-017',
      productName: 'Chlorpyrifos 20% EC', qty: 180, cogs: 295 },
    { id: 'grn-2025-019', label: 'GRN-2025-019 — Mancozeb 75%WP × 250 pkts (2025-03-05)',
      batchId: 'bat-037', batchNo: 'UPL-MNC-2501', productId: 'prd-019',
      productName: 'Mancozeb 75% WP', qty: 250, cogs: 138 },
  ],
  'sup-005': [
    { id: 'grn-2025-020', label: 'GRN-2025-020 — Acephate 75%SP × 220 pkts (2025-01-25)',
      batchId: 'bat-039', batchNo: 'GHD-ACE-2501', productId: 'prd-020',
      productName: 'Acephate 75% SP', qty: 220, cogs: 198 },
  ],
};

const SUPPLIER_REASONS: { value: SupplierReason; label: string }[] = [
  { value: 'VolumeDiscount', label: 'Volume Discount' },
  { value: 'QualityClaim',   label: 'Quality Claim'   },
  { value: 'Returns',        label: 'Returns'          },
  { value: 'Scheme',         label: 'Scheme'           },
];

const B2B_REASONS: { value: B2BReason; label: string }[] = [
  { value: 'DamagedGoods', label: 'Damaged Goods'   },
  { value: 'WrongProduct', label: 'Wrong Product'   },
  { value: 'VolumeDiscount', label: 'Volume Discount' },
  { value: 'Returns',      label: 'Returns'         },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface GrnEntry {
  id: string;
  label: string;
  batchId: string;
  batchNo: string;
  productId: string;
  productName: string;
  qty: number;
  cogs: number;    // purchase price per unit
}

interface FormState {
  type: CreditNoteType;
  // Supplier fields
  supplierId: string;
  linkedGrnId: string;
  supplierReason: SupplierReason | '';
  // B2B fields
  retailerId: string;
  linkedInvoiceId: string;
  b2bReason: B2BReason | '';
  // Common
  amount: string;
  gstAmt: string;
  remarks: string;
  date: string;
}

function makeEmpty(): FormState {
  return {
    type: 'Supplier',
    supplierId: '',
    linkedGrnId: '',
    supplierReason: '',
    retailerId: '',
    linkedInvoiceId: '',
    b2bReason: '',
    amount: '',
    gstAmt: '',
    remarks: '',
    date: new Date().toISOString().slice(0, 10),
  };
}

function noteToForm(note: CreditNote): FormState {
  return {
    type:           note.type,
    supplierId:     note.supplierId     ?? '',
    linkedGrnId:    note.linkedGrnId    ?? '',
    supplierReason: note.supplierReason ?? '',
    retailerId:     note.retailerId     ?? '',
    linkedInvoiceId: note.linkedInvoiceId ?? '',
    b2bReason:      note.b2bReason      ?? '',
    amount:         String(note.amount),
    gstAmt:         String(note.gstAmt),
    remarks:        note.remarks        ?? '',
    date:           note.date,
  };
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  note?: CreditNote;                           // present = edit mode
  onSave: (draft: Omit<CreditNote, 'id' | 'cnNo' | 'createdByUserId' | 'createdAt' | 'updatedAt'> & { id?: string; cnNo?: string }, submitForApproval: boolean) => void;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreditNoteForm({ note, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(note ? noteToForm(note) : makeEmpty());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Derived: selected GRN entry
  const grns = form.supplierId ? (SUPPLIER_GRNS[form.supplierId] ?? []) : [];
  const selectedGrn = grns.find((g) => g.id === form.linkedGrnId) ?? null;

  // Derived: selected retailer & invoice
  const selectedRetailer = mockRetailers.find((r) => r.id === form.retailerId) ?? null;
  const retailerInvoices = mockB2BInvoices.filter(
    (inv) => inv.retailerId === form.retailerId && inv.outstandingAmt > 0,
  );
  const selectedInvoice = retailerInvoices.find((inv) => inv.id === form.linkedInvoiceId) ?? null;

  // Reset downstream when supplier changes
  useEffect(() => {
    setForm((f) => ({ ...f, linkedGrnId: '' }));
  }, [form.supplierId]);

  // Reset downstream when retailer changes
  useEffect(() => {
    setForm((f) => ({ ...f, linkedInvoiceId: '' }));
  }, [form.retailerId]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  // ── Effect previews ─────────────────────────────────────────────────────────

  function renderSupplierPreview() {
    if (!selectedGrn) return null;
    const amt    = parseFloat(form.amount) || 0;
    if (amt <= 0) return null;
    const oldCogs = selectedGrn.cogs;
    const newCogs = oldCogs - amt / selectedGrn.qty;
    return (
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-blue-500" />
        <span>
          This CN will reduce the COGS of batch{' '}
          <span className="font-semibold">{selectedGrn.batchNo}</span> ({selectedGrn.productName}) from{' '}
          <span className="font-semibold">{fmt(oldCogs)}</span> to{' '}
          <span className="font-semibold">{fmt(Math.round(newCogs * 100) / 100)}</span> per unit,
          reducing procurement cost by {fmt(amt)} across {selectedGrn.qty} units.
        </span>
      </div>
    );
  }

  function renderB2BPreview() {
    if (!selectedRetailer) return null;
    const netAmt = (parseFloat(form.amount) || 0) + (parseFloat(form.gstAmt) || 0);
    if (netAmt <= 0) return null;
    return (
      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-blue-500" />
        <span>
          Upon approval, this CN will reduce the outstanding balance of{' '}
          <span className="font-semibold">{selectedRetailer.firmName}</span> by{' '}
          <span className="font-semibold">{fmt(netAmt)}</span>
          {selectedInvoice ? (
            <>, adjusting invoice <span className="font-semibold">{selectedInvoice.invoiceNo}</span></>
          ) : null}.
        </span>
      </div>
    );
  }

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (form.type === 'Supplier') {
      if (!form.supplierId)     e.supplierId     = 'Select a supplier';
      if (!form.linkedGrnId)    e.linkedGrnId    = 'Select a GRN';
      if (!form.supplierReason) e.supplierReason = 'Select a reason';
    } else {
      if (!form.retailerId)     e.retailerId     = 'Select a retailer';
      if (!form.b2bReason)      e.b2bReason      = 'Select a reason';
    }
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.date)   e.date   = 'Select a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(submitForApproval: boolean) {
    if (!validate()) return;

    const amount  = parseFloat(form.amount)  || 0;
    const gstAmt  = parseFloat(form.gstAmt)  || 0;
    const netAmt  = amount + gstAmt;

    const payload = {
      ...(note?.id  ? { id:   note.id }  : {}),
      ...(note?.cnNo ? { cnNo: note.cnNo } : {}),
      type:   form.type,
      date:   form.date,
      amount,
      gstAmt,
      netAmt,
      status: (submitForApproval ? 'PendingApproval' : 'Draft') as const,
      remarks: form.remarks || undefined,

      // Supplier
      ...(form.type === 'Supplier' ? {
        supplierId:     form.supplierId,
        supplierName:   mockSuppliers.find((s) => s.id === form.supplierId)?.name,
        linkedGrnId:    form.linkedGrnId,
        linkedBatchId:  selectedGrn?.batchId,
        supplierReason: form.supplierReason as SupplierReason,
      } : {}),

      // B2B
      ...(form.type === 'B2BCustomer' ? {
        retailerId:      form.retailerId,
        retailerName:    selectedRetailer?.firmName,
        linkedInvoiceId: form.linkedInvoiceId || undefined,
        linkedInvoiceNo: selectedInvoice?.invoiceNo,
        b2bReason:       form.b2bReason as B2BReason,
      } : {}),
    };

    onSave(payload as Parameters<Props['onSave']>[0], submitForApproval);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isEdit = !!note;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Slide-over */}
      <div className="fixed right-0 top-0 h-full w-[540px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? `Edit Credit Note — ${note!.cnNo}` : 'New Credit Note'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Finance approval required before posting</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Credit Note Type
            </label>
            <div className="flex gap-2">
              {(['Supplier', 'B2BCustomer'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => set('type', t)}
                  disabled={isEdit}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-colors ${
                    form.type === t
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {t === 'B2BCustomer' ? 'B2B Customer' : 'Supplier'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Supplier section ─────────────────────────────────────────── */}
          {form.type === 'Supplier' && (
            <>
              {/* Supplier */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.supplierId}
                  onChange={(e) => set('supplierId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                >
                  <option value="">Select supplier…</option>
                  {mockSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.supplierId && <p className="text-xs text-red-500 mt-1">{errors.supplierId}</p>}
              </div>

              {/* Linked GRN */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Linked GRN <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.linkedGrnId}
                  onChange={(e) => set('linkedGrnId', e.target.value)}
                  disabled={!form.supplierId}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 disabled:opacity-50"
                >
                  <option value="">
                    {form.supplierId ? 'Select GRN…' : 'Select supplier first'}
                  </option>
                  {grns.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
                {errors.linkedGrnId && <p className="text-xs text-red-500 mt-1">{errors.linkedGrnId}</p>}

                {/* Auto-filled batch info */}
                {selectedGrn && (
                  <div className="mt-2 flex items-center gap-4 px-3 py-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Batch</p>
                      <p className="text-xs font-mono font-semibold text-gray-700">{selectedGrn.batchNo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Product</p>
                      <p className="text-xs text-gray-700">{selectedGrn.productName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Qty / COGS</p>
                      <p className="text-xs text-gray-700">
                        {selectedGrn.qty} units @ ₹{selectedGrn.cogs}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUPPLIER_REASONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => set('supplierReason', value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        form.supplierReason === value
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.supplierReason && <p className="text-xs text-red-500 mt-1">{errors.supplierReason}</p>}
              </div>
            </>
          )}

          {/* ── B2B section ──────────────────────────────────────────────── */}
          {form.type === 'B2BCustomer' && (
            <>
              {/* Retailer */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Retailer <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.retailerId}
                  onChange={(e) => set('retailerId', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                >
                  <option value="">Select retailer…</option>
                  {mockRetailers.filter((r) => r.isActive).map((r) => (
                    <option key={r.id} value={r.id}>{r.firmName}</option>
                  ))}
                </select>
                {errors.retailerId && <p className="text-xs text-red-500 mt-1">{errors.retailerId}</p>}
              </div>

              {/* Linked Invoice */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Linked B2B Invoice
                  <span className="ml-1.5 text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <select
                  value={form.linkedInvoiceId}
                  onChange={(e) => set('linkedInvoiceId', e.target.value)}
                  disabled={!form.retailerId}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 disabled:opacity-50"
                >
                  <option value="">
                    {form.retailerId
                      ? retailerInvoices.length > 0 ? 'Select invoice…' : 'No open invoices'
                      : 'Select retailer first'}
                  </option>
                  {retailerInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} — outstanding ₹{inv.outstandingAmt.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>

                {selectedRetailer && (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Outstanding balance:{' '}
                    <span className="font-semibold text-gray-600">
                      ₹{selectedRetailer.outstandingAmt.toLocaleString('en-IN')}
                    </span>
                    {' '}/ Limit:{' '}
                    <span className="font-semibold text-gray-600">
                      ₹{selectedRetailer.creditLimitAmt.toLocaleString('en-IN')}
                    </span>
                  </p>
                )}
              </div>

              {/* B2B Reason */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {B2B_REASONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => set('b2bReason', value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        form.b2bReason === value
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.b2bReason && <p className="text-xs text-red-500 mt-1">{errors.b2bReason}</p>}
              </div>
            </>
          )}

          {/* ── Financials ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                GST Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.gstAmt}
                onChange={(e) => set('gstAmt', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
              />
            </div>
          </div>

          {/* Net amount preview */}
          {(parseFloat(form.amount) > 0 || parseFloat(form.gstAmt) > 0) && (
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs text-emerald-700 font-medium">Net CN Amount</span>
              <span className="text-base font-bold text-emerald-800">
                {fmt((parseFloat(form.amount) || 0) + (parseFloat(form.gstAmt) || 0))}
              </span>
            </div>
          )}

          {/* Effect previews */}
          {form.type === 'Supplier'    && renderSupplierPreview()}
          {form.type === 'B2BCustomer' && renderB2BPreview()}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              CN Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Remarks
            </label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => set('remarks', e.target.value)}
              placeholder="Add supporting context, reference documents, etc."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Submit for Approval
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

