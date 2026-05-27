import { useState } from 'react';
import { X, CreditCard, MessageSquare } from 'lucide-react';
import type { B2BInvoice, B2BInvoiceStatus, RetailerAccount } from '../../types/b2b';
import { daysOverdue, ageBucket } from './ReceivablesSummary';
import type { AgeBucket } from './ReceivablesSummary';
import { MOCK_USERS } from '../../data/mockUsers';
import Button from '../../components/ui/Button';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';

// ── Constants ─────────────────────────────────────────────────────────────────

type PayMode = 'NEFT' | 'RTGS' | 'Cheque' | 'UPI';
const PAY_MODES: PayMode[] = ['NEFT', 'RTGS', 'Cheque', 'UPI'];

const STATUS_BADGE: Record<B2BInvoiceStatus, BadgeVariant> = {
  Unpaid:        'gray',
  PartiallyPaid: 'amber',
  Paid:          'green',
  Overdue:       'red',
  Disputed:      'orange',
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
          <Badge variant="amber">Bucket: {bucketLabel(activeBucket)}</Badge>
        )}
        <span className="ml-auto text-xs text-gray-400">{visibleInvoices.length} invoices</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <TableWrap>
          <thead>
            <tr>
              <Th>Invoice No.</Th>
              <Th>Retailer</Th>
              <Th>Order Ref</Th>
              <Th>Inv. Date</Th>
              <Th>Due Date</Th>
              <Th right>Amount</Th>
              <Th right>Paid</Th>
              <Th right>Outstanding</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {visibleInvoices.map((inv) => {
              const retailer    = retailerById.get(inv.retailerId);
              const status      = resolvedStatus(inv);
              const overdueDays = daysOverdue(inv.dueDate);
              const isOverdue   = overdueDays > 0 && status !== 'Paid';
              const salesExec   = MOCK_USERS.find((u) => u.id === retailer?.salesExecUserId);

              return (
                <Tr key={inv.id} className={isOverdue && overdueDays > 60 ? 'bg-red-50/40' : ''}>
                  <Td mono bold>{inv.invoiceNo}</Td>
                  <Td>
                    <p className="text-xs font-medium text-gray-800 leading-snug">{retailer?.firmName ?? inv.retailerId}</p>
                    {salesExec && <p className="text-[11px] text-gray-400 mt-0.5">{salesExec.name}</p>}
                  </Td>
                  <Td mono muted>
                    {inv.orderId.startsWith('b2b-ord-placeholder') ? '—' : inv.orderId.replace('b2b-ord-', 'B2B-').toUpperCase()}
                  </Td>
                  <Td muted>{inv.invoiceDate}</Td>
                  <Td>
                    <span className={isOverdue ? 'text-red-600 font-semibold text-xs' : 'text-gray-500 text-xs'}>
                      {inv.dueDate}
                    </span>
                    {isOverdue && (
                      <p className="text-[11px] text-red-500 font-medium mt-0.5">{overdueDays}d overdue</p>
                    )}
                  </Td>
                  <Td right muted>
                    ₹{inv.totalAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Td>
                  <Td right>
                    <span className="text-emerald-600 text-xs">
                      {inv.paidAmt > 0 ? `₹${inv.paidAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                    </span>
                  </Td>
                  <Td right bold>
                    <span className={`text-xs ${inv.outstandingAmt > 0 ? (isOverdue ? 'text-red-600' : 'text-gray-900') : 'text-emerald-600'}`}>
                      {inv.outstandingAmt > 0
                        ? `₹${inv.outstandingAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                        : 'Nil'}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={STATUS_BADGE[status]}>{status}</Badge>
                  </Td>
                  <Td>
                    {inv.outstandingAmt > 0 && (
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeft={CreditCard}
                          onClick={() => openPayModal(inv)}
                        >
                          Record Payment
                        </Button>
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
                  </Td>
                </Tr>
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
        </TableWrap>
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
              <button
                onClick={() => setPayingId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
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
              <Button variant="secondary" onClick={() => setPayingId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmPayment}
                disabled={!payForm.amount || !payForm.reference}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
