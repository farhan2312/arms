import { useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import type { CreditNote, CreditNoteStatus } from './types';
import { useAuth } from '../../context/AuthContext';
import type { RetailerAccount } from '../../types/b2b';

// ── Constants ─────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  VolumeDiscount: 'Volume Discount',
  QualityClaim:   'Quality Claim',
  Returns:        'Returns',
  Scheme:         'Scheme',
  DamagedGoods:   'Damaged Goods',
  WrongProduct:   'Wrong Product',
};

// COGS & sell price reference for margin impact
// Keyed by linkedBatchId
const BATCH_ECONOMICS: Record<string, { productName: string; originalCogs: number; qty: number; b2cPrice: number }> = {
  'bat-012': { productName: 'Urea (Neem Coated) 45 Kg',      originalCogs: 218, qty: 280, b2cPrice: 266 },
  'bat-011': { productName: 'Urea (Neem Coated) 45 Kg',      originalCogs: 220, qty: 500, b2cPrice: 266 },
  'bat-013': { productName: 'DAP (Di-Ammonium Phosphate) 50 Kg', originalCogs: 1180, qty: 400, b2cPrice: 1400 },
  'bat-031': { productName: 'Imidacloprid 70% WS',            originalCogs: 380, qty: 200, b2cPrice: 450 },
  'bat-035': { productName: 'Glyphosate 41% SL',              originalCogs: 228, qty: 160, b2cPrice: 290 },
  'bat-033': { productName: 'Chlorpyrifos 20% EC',            originalCogs: 295, qty: 180, b2cPrice: 360 },
  'bat-037': { productName: 'Mancozeb 75% WP',                originalCogs: 138, qty: 250, b2cPrice: 175 },
  'bat-039': { productName: 'Acephate 75% SP',                originalCogs: 198, qty: 220, b2cPrice: 248 },
};

const STATUS_STYLE: Record<CreditNoteStatus, { label: string; cls: string }> = {
  Draft:            { label: 'Draft',            cls: 'bg-gray-100 text-gray-600' },
  PendingApproval:  { label: 'Pending Approval', cls: 'bg-amber-100 text-amber-700' },
  Posted:           { label: 'Posted',           cls: 'bg-emerald-100 text-emerald-700' },
  Rejected:         { label: 'Rejected',         cls: 'bg-red-100 text-red-700' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtExact(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function marginPct(cogs: number, sell: number): number {
  if (sell <= 0) return 0;
  return ((sell - cogs) / sell) * 100;
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-sm text-gray-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  note: CreditNote;
  retailers: RetailerAccount[];
  onBack: () => void;
  onApprove: (cnId: string) => void;
  onReject:  (cnId: string, reason: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreditNoteDetail({ note, retailers, onBack, onApprove, onReject }: Props) {
  const { hasRole } = useAuth();
  const canApprove  = hasRole(['Finance', 'OperationsHead', 'Admin', 'SuperAdmin']);

  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError]   = useState('');

  const sb     = STATUS_STYLE[note.status];
  const reason = note.supplierReason ?? note.b2bReason;
  const party  = note.supplierName   ?? note.retailerName ?? '—';
  const linkedRef = note.linkedGrnId ?? note.linkedInvoiceNo ?? '—';

  const retailer = note.retailerId ? retailers.find((r) => r.id === note.retailerId) : null;

  // ── Margin impact (Supplier CNs) ───────────────────────────────────────────

  function renderSupplierImpact() {
    const eco = note.linkedBatchId ? BATCH_ECONOMICS[note.linkedBatchId] : null;
    if (!eco) return null;

    const oldCogs    = eco.originalCogs;
    const newCogs    = oldCogs - note.amount / eco.qty;
    const oldMargin  = marginPct(oldCogs, eco.b2cPrice);
    const newMargin  = marginPct(newCogs, eco.b2cPrice);
    const marginDelta = newMargin - oldMargin;

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-800">Supplier COGS Impact</h3>
        </div>

        <div className="text-xs text-gray-500">
          Batch: <span className="font-semibold text-gray-700">{note.linkedGrnId ?? note.linkedBatchId}</span>
          {' '}— {eco.productName}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Before */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Before CN</p>
            <p className="text-[11px] text-gray-500">COGS / unit</p>
            <p className="text-sm font-semibold text-gray-800">{fmtExact(oldCogs)}</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Sell price</p>
            <p className="text-sm font-semibold text-gray-800">{fmt(eco.b2cPrice)}</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Gross margin</p>
            <p className="text-sm font-semibold text-gray-800">{pct(oldMargin)}</p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-emerald-600 text-lg font-bold">→</div>
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                −{fmt(note.amount)}
              </p>
              <p className="text-[10px] text-gray-400">on {eco.qty} units</p>
            </div>
          </div>

          {/* After */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-[10px] text-emerald-700 uppercase tracking-wide font-semibold mb-1.5">After CN</p>
            <p className="text-[11px] text-gray-500">COGS / unit</p>
            <p className="text-sm font-semibold text-emerald-700">{fmtExact(newCogs)}</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Sell price</p>
            <p className="text-sm font-semibold text-gray-800">{fmt(eco.b2cPrice)}</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Gross margin</p>
            <p className="text-sm font-semibold text-emerald-700">
              {pct(newMargin)}
              <span className="ml-1 text-[10px] font-medium text-emerald-600">
                (+{pct(marginDelta)})
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Outstanding impact (B2B CNs) ───────────────────────────────────────────

  function renderB2BImpact() {
    if (!retailer) return null;
    const before = retailer.outstandingAmt;
    const after  = Math.max(0, before - note.netAmt);
    const delta  = before - after;

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-600" />
          <h3 className="text-sm font-semibold text-gray-800">Receivable Impact — {retailer.firmName}</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Before */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Before CN</p>
            <p className="text-[11px] text-gray-500">Outstanding</p>
            <p className="text-sm font-semibold text-gray-800">{fmt(before)}</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Credit limit</p>
            <p className="text-sm font-semibold text-gray-800">{fmt(retailer.creditLimitAmt)}</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Utilisation</p>
            <p className="text-sm font-semibold text-gray-800">
              {pct((before / retailer.creditLimitAmt) * 100)}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-emerald-600 text-lg font-bold">→</div>
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                −{fmt(delta)}
              </p>
              <p className="text-[10px] text-gray-400">net reduction</p>
            </div>
          </div>

          {/* After */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-[10px] text-emerald-700 uppercase tracking-wide font-semibold mb-1.5">After CN</p>
            <p className="text-[11px] text-gray-500">Outstanding</p>
            <p className="text-sm font-semibold text-emerald-700">{fmt(after)}</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Credit limit</p>
            <p className="text-sm font-semibold text-gray-800">{fmt(retailer.creditLimitAmt)}</p>
            <p className="text-[11px] text-gray-500 mt-1.5">Utilisation</p>
            <p className="text-sm font-semibold text-emerald-700">
              {pct((after / retailer.creditLimitAmt) * 100)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Reject handler ─────────────────────────────────────────────────────────

  function handleReject() {
    if (!rejectReason.trim()) {
      setRejectError('Rejection reason is required');
      return;
    }
    onReject(note.id, rejectReason.trim());
    setShowReject(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 font-mono">{note.cnNo}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${sb.cls}`}>
              {sb.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            {note.type === 'B2BCustomer' ? 'B2B Customer Credit Note' : 'Supplier Credit Note'}
          </p>
        </div>

        {/* Approval actions */}
        {note.status === 'PendingApproval' && canApprove && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReject(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <XCircle size={13} />
              Reject
            </button>
            <button
              onClick={() => onApprove(note.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 size={13} />
              Approve & Post
            </button>
          </div>
        )}
      </div>

      {/* Rejection reason banner */}
      {note.status === 'Rejected' && note.rejectedReason && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700">Rejected</p>
            <p className="text-xs text-red-600 mt-0.5">{note.rejectedReason}</p>
          </div>
        </div>
      )}

      {/* Reject modal overlay */}
      {showReject && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowReject(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-white rounded-2xl shadow-2xl z-50 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Reject Credit Note</h3>
            <p className="text-sm text-gray-500">{note.cnNo} — {party}</p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
                placeholder="Explain why this credit note is being rejected…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              {rejectError && <p className="text-xs text-red-500 mt-1">{rejectError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReject(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </>
      )}

      {/* Core detail card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-3 gap-x-8 gap-y-5">
        <Field label="Party"          value={party} />
        <Field label="Type"           value={note.type === 'B2BCustomer' ? 'B2B Customer' : 'Supplier'} />
        <Field label="CN Date"        value={note.date} />
        <Field label="Reason"         value={reason ? (REASON_LABELS[reason] ?? reason) : '—'} />
        <Field label="Linked Ref"     value={linkedRef} mono />
        {note.linkedBatchId && <Field label="Batch" value={note.linkedBatchId} mono />}
      </div>

      {/* Financials */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Financials</h3>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Base Amount</p>
            <p className="text-xl font-bold text-gray-800 mt-0.5">{fmt(note.amount)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">GST</p>
            <p className="text-xl font-bold text-gray-500 mt-0.5">{fmt(note.gstAmt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Net Amount</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{fmt(note.netAmt)}</p>
          </div>
        </div>
      </div>

      {/* Remarks */}
      {note.remarks && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Remarks</p>
          <p className="text-sm text-gray-700 leading-relaxed">{note.remarks}</p>
        </div>
      )}

      {/* Impact panel */}
      {note.type === 'Supplier'    && renderSupplierImpact()}
      {note.type === 'B2BCustomer' && renderB2BImpact()}

      {/* Audit trail */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Audit</h3>
        <div className="grid grid-cols-2 gap-5 text-xs">
          <div>
            <p className="text-gray-400">Created</p>
            <p className="text-gray-700 mt-0.5">{new Date(note.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-gray-400">Last Updated</p>
            <p className="text-gray-700 mt-0.5">{new Date(note.updatedAt).toLocaleString('en-IN')}</p>
          </div>
          {note.approvedAt && (
            <div>
              <p className="text-gray-400">Approved At</p>
              <p className="text-emerald-700 font-medium mt-0.5">
                {new Date(note.approvedAt).toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
