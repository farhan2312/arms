import { useState } from 'react';
import { X, CreditCard, MessageSquare } from 'lucide-react';
import type { B2BInvoice, B2BInvoiceStatus, RetailerAccount } from '../../types/b2b';
import { daysOverdue, ageBucket } from './ReceivablesSummary';
import type { AgeBucket } from './ReceivablesSummary';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ─────────────────────────────────────────────────────────────────

type PayMode = 'NEFT' | 'RTGS' | 'Cheque' | 'UPI';
const PAY_MODES: PayMode[] = ['NEFT', 'RTGS', 'Cheque', 'UPI'];

const STATUS_STYLE: Record<B2BInvoiceStatus, string> = {
  Unpaid:        'bg-gray-100 text-gray-600',
  PartiallyPaid: 'bg-amber-100 text-amber-700',
  Paid:          'bg-emerald-100 text-emerald-700',
  Overdue:       'bg-red-100 text-red-700',
  Disputed:      'bg-orange-100 text-orange-700',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentForm {
  mode: PayMode;
  amount: string;
  reference: string;
  date: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolvedStatus(inv: B2BInvoice): B2BInvoiceStatus {
  if (inv.outstandingAmt <= 0) return 'Paid';
  if (inv.paidAmt > 0) return 'PartiallyPaid';
  if (daysOverdue(inv.dueDate) > 0) return 'Overdue';
  return inv.status === 'Disputed' ? 'Disputed' : 'Unpaid';
}

function bucketLabel(bucket: AgeBucket): string {
  const map: Record<AgeBucket, string> = {
    'all': 'All', 'current': 'Current', '1-30': '1-30d', '31-60': '31-60d', '61-90': '61-90d', '90+': '90d+',
  };
  return map[bucket];
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  invoices: B2BInvoice[];
  retailers: RetailerAccount[];
  activeBucket: AgeBucket;
  onPaymentRecorded: (invoiceId: string, amt: number, mode: PayMode, ref: string, date: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InvoiceList({ invoices, retailers, activeBucket, onPaymentRecorded }: Props) {
  const [statusFilter, setStatusFilter] = useState<B2BInvoiceStatus | 'All'>('All');
  const [payingId, setPayingId]         = useState<string | null>(null);
  const [payForm, setPayForm]           = useState<PaymentForm>({ mode: 'NEFT', amount: '', reference: '', date: '2026-05-27' });

  const retailerById = new Map(retailers.map((r) => [r.id, r]));

  const visibleInvoices = invoices.filter((inv) => {
    const bucketMatch = activeBucket === 'all' || ageBucket(inv.dueDate) === activeBucket;
    const statusMatch = statusFilter === 'All' || resolvedStatus(inv) === statusFilter;
    return bucketMatch && statusMatch;
  });

  const payingInvoice = payingId ? invoices.find((inv) => inv.id === payingId) : null;

  function openPayModal(inv: B2BInvoice) {
    setPayForm({ mode: 'NEFT', amount: String(inv.outstandingAmt), reference: '', date: '2026-05-27' });
    setPayingId(inv.id);
  }

  function confirmPayment() {
    if (!payingInvoice || !payForm.amount || !payForm.reference) return;
    const amt = parseFloat(payForm.amount);
    if (!amt || amt <= 0) return;
    onPaymentRecorded(payingInvoice.id, amt, payForm.mode, payForm.reference, payForm.date);
    console.log('// POST /api/b2b/payments', {
      invoiceId: payingInvoice.id,
      invoiceNo:  payingInvoice.invoiceNo,
      mode:       payForm.mode,
      amount:     amt,
      reference:  payForm.reference,
      date:       payForm.date,
    });
    setPayingId(null);
  }

  function sendReminder(inv: B2BInvoice) {
    const retailer = retailerById.get(inv.retailerId);
    console.log('// WhatsApp/SMS reminder to', retailer?.mobile ?? inv.retailerId,
      'for invoice', inv.invoiceNo, `(₹${inv.outstandingAmt.toLocaleString('en-IN')} overdue)`);
  }

  return (
    <>
      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['All', 'Unpaid', 'PartiallyPaid', 'Overdue', 'Paid', 'Disputed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === s
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'PartiallyPaid' ? 'Partial' : s}
          </button>
        ))}
        {activeBucket !== 'all' && (
          <span className="ml-1 px-2 py-1 text-[11px] font-medium rounded-full bg-amber-100 text-amber-700">
            Bucket: {bucketLabel(activeBucket)}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">{visibleInvoices.length} invoices</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice No.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Retailer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Ref</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Inv. Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visibleInvoices.map((inv) => {
                const retailer  = retailerById.get(inv.retailerId);
                const status    = resolvedStatus(inv);
                const overdueDays = daysOverdue(inv.dueDate);
                const isOverdue = overdueDays > 0 && status !== 'Paid';
                const salesExec = MOCK_USERS.find((u) => u.id === retailer?.salesExecUserId);

                return (
                  <tr key={inv.id} className={`transition-colors hover:bg-gray-50 ${isOverdue && overdueDays > 60 ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-800">{inv.invoiceNo}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-800 leading-snug">{retailer?.firmName ?? inv.retailerId}</p>
                      {salesExec && <p className="text-[11px] text-gray-400 mt-0.5">{salesExec.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{inv.orderId.startsWith('b2b-ord-placeholder') ? '—' : inv.orderId.replace('b2b-ord-', 'B2B-').toUpperCase()}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{inv.invoiceDate}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                        {inv.dueDate}
                      </span>
                      {isOverdue && (
                        <p className="text-[11px] text-red-500 font-medium mt-0.5">{overdueDays}d overdue</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-700">
                      ₹{inv.totalAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-emerald-600">
                      {inv.paidAmt > 0 ? `₹${inv.paidAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold">
                      <span className={inv.outstandingAmt > 0 ? (isOverdue ? 'text-red-600' : 'text-gray-900') : 'text-emerald-600'}>
                        {inv.outstandingAmt > 0
                          ? `₹${inv.outstandingAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                          : 'Nil'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_STYLE[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.outstandingAmt > 0 && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openPayModal(inv)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
                          >
                            <CreditCard size={11} />
                            Record Payment
                          </button>
                          {isOverdue && (
                            <button
                              onClick={() => sendReminder(inv)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Send WhatsApp / SMS reminder"
                            >
                              <MessageSquare size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleInvoices.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                    No invoices match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment Modal ──────────────────────────────────────────────────── */}
      {payingInvoice && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setPayingId(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[440px] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Record Payment</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{payingInvoice.invoiceNo}</p>
              </div>
              <button onClick={() => setPayingId(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Outstanding */}
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <p className="text-xs text-red-700 font-medium">Outstanding Balance</p>
              <p className="text-sm font-bold text-red-700">
                ₹{payingInvoice.outstandingAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="space-y-4">
              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Payment Mode</label>
                <div className="flex gap-2 flex-wrap">
                  {PAY_MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayForm((p) => ({ ...p, mode: m }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        payForm.mode === m
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                  max={payingInvoice.outstandingAmt}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={payForm.reference}
                  onChange={(e) => setPayForm((p) => ({ ...p, reference: e.target.value }))}
                  placeholder={payForm.mode === 'Cheque' ? 'Cheque No.' : 'Transaction ID / UTR'}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={payForm.date}
                  onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => setPayingId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                disabled={!payForm.amount || !payForm.reference}
                className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
