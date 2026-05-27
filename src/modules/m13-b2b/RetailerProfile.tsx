import { useState } from 'react';
import { ArrowLeft, Upload, CheckCircle2, AlertTriangle, FileText, ShoppingBag, Shield, User } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import { Select } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { RetailerAccount, B2BOrder, RetailerTier, B2BOrderStatus } from '../../types/b2b';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<RetailerTier, 'gray' | 'blue' | 'yellow' | 'purple'> = {
  Standard: 'gray', Silver: 'blue', Gold: 'yellow', Preferred: 'purple',
};

const ORDER_STATUS_BADGE: Record<B2BOrderStatus, 'gray' | 'blue' | 'amber' | 'green' | 'purple'> = {
  Draft:       'gray',
  Submitted:   'blue',
  UnderReview: 'amber',
  Approved:    'green',
  Allocated:   'blue',
  Dispatched:  'purple',
  Delivered:   'green',
  Invoiced:    'gray',
};

type ProfileTab = 'statement' | 'orders' | 'kyc' | 'contact';

const TABS: { id: ProfileTab; label: string; icon: typeof FileText }[] = [
  { id: 'statement', label: 'Account Statement', icon: FileText   },
  { id: 'orders',    label: 'Orders',            icon: ShoppingBag },
  { id: 'kyc',       label: 'KYC Documents',     icon: Shield     },
  { id: 'contact',   label: 'Contact Info',      icon: User       },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface LedgerEntry {
  id: string;
  date: string;
  type: 'Invoice' | 'Payment' | 'CreditNote';
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface KycDoc { label: string; fileName: string | null; uploadedAt: string | null }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function buildLedger(retailer: RetailerAccount, orders: B2BOrder[]): LedgerEntry[] {
  const relevant = orders
    .filter((o) => o.retailerId === retailer.id && ['Invoiced', 'Delivered', 'Dispatched', 'Allocated', 'Approved'].includes(o.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const entries: LedgerEntry[] = [];
  let balance = 0;
  const totalOutstanding = retailer.outstandingAmt;
  const totalInvoiced    = relevant.reduce((s, o) => s + o.totalAmt, 0);
  const totalPaid        = Math.max(0, totalInvoiced - totalOutstanding);
  let paidRemaining      = totalPaid;

  for (const order of relevant) {
    const isInvoiced = order.status === 'Invoiced' || order.status === 'Delivered';
    if (!isInvoiced) continue;

    balance += order.totalAmt;
    entries.push({
      id:        `inv-${order.id}`,
      date:      order.updatedAt.slice(0, 10),
      type:      'Invoice',
      reference: `INV-${order.orderNo.replace('B2B-', '')}`,
      debit:     order.totalAmt,
      credit:    0,
      balance,
    });

    // Distribute payments proportionally
    if (paidRemaining > 0) {
      const payAmt = Math.min(paidRemaining, order.totalAmt);
      paidRemaining -= payAmt;
      balance -= payAmt;
      entries.push({
        id:        `pay-${order.id}`,
        date:      order.updatedAt.slice(0, 10),
        type:      'Payment',
        reference: `NEFT/UPI-${order.orderNo.slice(-6)}`,
        debit:     0,
        credit:    payAmt,
        balance,
      });
    }
  }

  return entries;
}

function creditTermLabel(days: number) {
  if (days === 0) return 'Advance';
  return `${days}-Day Credit`;
}

const ENTRY_TYPE_BADGE: Record<LedgerEntry['type'], 'gray' | 'green' | 'blue'> = {
  Invoice:    'gray',
  Payment:    'green',
  CreditNote: 'blue',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  retailer: RetailerAccount;
  orders: B2BOrder[];
  onBack: () => void;
  onUpdate: (updated: RetailerAccount) => void;
}

export default function RetailerProfile({ retailer, orders, onBack, onUpdate }: Props) {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [tab, setTab]                       = useState<ProfileTab>('statement');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showCreditEdit, setShowCreditEdit] = useState(false);
  const [newLimit, setNewLimit]             = useState(String(retailer.creditLimitAmt));
  const [creditReason, setCreditReason]     = useState('');
  const [kycDocs, setKycDocs]               = useState<KycDoc[]>([
    { label: 'GST Certificate',               fileName: 'gst_cert.pdf', uploadedAt: '2024-04-15' },
    { label: 'Shop Registration / Trade Lic', fileName: null,           uploadedAt: null },
  ]);

  // Contact edit state
  const exec = retailer.salesExecUserId ? MOCK_USERS.find((u) => u.id === retailer.salesExecUserId) : undefined;
  const [contactForm, setContactForm] = useState({
    ownerName: retailer.ownerName,
    mobile:    retailer.mobile,
    email:     retailer.email ?? '',
    line1:     retailer.address.line1,
    payTerms:  retailer.creditDays,
  });

  const canEditCredit = hasRole(['OperationsHead', 'Finance', 'Admin', 'SuperAdmin']);

  const available    = retailer.creditLimitAmt - retailer.outstandingAmt;
  const availPct     = retailer.creditLimitAmt > 0 ? Math.max(0, (available / retailer.creditLimitAmt) * 100) : 100;
  const retailerOrders = orders.filter((o) => o.retailerId === retailer.id);
  const ledger       = buildLedger(retailer, orders);

  function handleSaveCredit() {
    const val = parseFloat(newLimit);
    if (!val || !creditReason.trim()) return;
    onUpdate({ ...retailer, creditLimitAmt: val, updatedAt: new Date().toISOString() });
    setShowCreditEdit(false);
    setCreditReason('');
    toast.success('Credit limit updated', `New limit: ${fmt(val)}`);
  }

  function handleBlock() {
    onUpdate({ ...retailer, isActive: false, updatedAt: new Date().toISOString() });
    setShowBlockModal(false);
    toast.warning('Account blocked', `${retailer.firmName} has been suspended.`);
    onBack();
  }

  function handleSaveContact() {
    onUpdate({
      ...retailer,
      ownerName:  contactForm.ownerName,
      mobile:     contactForm.mobile,
      email:      contactForm.email || undefined,
      address:    { ...retailer.address, line1: contactForm.line1 },
      creditDays: contactForm.payTerms,
      updatedAt:  new Date().toISOString(),
    });
    toast.success('Contact info saved');
  }

  function uploadKyc(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.files?.[0]?.name ?? null;
    if (!name) return;
    setKycDocs((prev) => prev.map((d, i) => i === idx ? { ...d, fileName: name, uploadedAt: new Date().toISOString().slice(0, 10) } : d));
    toast.success('Document uploaded', name);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back + Header */}
      <div className="mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          Back to Retailer Accounts
        </button>

        <Card padding="24px">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-lg font-bold text-gray-900">{retailer.firmName}</h1>
                <Badge label={retailer.tier} variant={TIER_BADGE[retailer.tier]} />
                {!retailer.isActive && <Badge label="Blocked" variant="red" />}
              </div>
              <p className="text-xs text-gray-500 font-mono">GSTIN: {retailer.gstIn}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {retailer.address.district}, {retailer.address.state} · {creditTermLabel(retailer.creditDays)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canEditCredit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreditEdit(true)}
                >
                  Edit Credit Limit
                </Button>
              )}
              {retailer.isActive && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowBlockModal(true)}
                >
                  Block Account
                </Button>
              )}
            </div>
          </div>

          {/* Credit summary row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Credit Limit</p>
              <p className="text-base font-bold text-gray-800">{fmt(retailer.creditLimitAmt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Outstanding</p>
              <p className={`text-base font-bold ${retailer.outstandingAmt > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {fmt(retailer.outstandingAmt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Available</p>
              <p className={`text-base font-bold ${availPct > 50 ? 'text-emerald-600' : availPct >= 25 ? 'text-amber-600' : 'text-red-600'}`}>
                {fmt(Math.max(0, available))}
              </p>
            </div>
          </div>

          {/* Credit bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${availPct > 50 ? 'bg-emerald-500' : availPct >= 25 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${availPct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{availPct.toFixed(0)}% credit available</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Account Statement ──────────────────────────────────────────────── */}
      {tab === 'statement' && (
        ledger.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-400 text-center">No transactions recorded yet.</p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Reference</Th>
                <Th right>Debit</Th>
                <Th right>Credit</Th>
                <Th right>Balance</Th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <Tr key={e.id} className={e.type === 'Payment' ? 'bg-emerald-50/40' : e.type === 'CreditNote' ? 'bg-blue-50/40' : ''}>
                  <Td muted>{e.date}</Td>
                  <Td>
                    <Badge variant={ENTRY_TYPE_BADGE[e.type]}>{e.type}</Badge>
                  </Td>
                  <Td mono>{e.reference}</Td>
                  <Td right muted>{e.debit > 0 ? fmt(e.debit) : '—'}</Td>
                  <Td right>
                    <span className="text-emerald-600 text-xs">{e.credit > 0 ? fmt(e.credit) : '—'}</span>
                  </Td>
                  <Td right bold>
                    <span className={`text-xs ${e.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {e.balance > 0 ? fmt(e.balance) + ' Dr' : e.balance < 0 ? fmt(e.balance) + ' Cr' : '—'}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )
      )}

      {/* ── Orders ────────────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        retailerOrders.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-400 text-center">No orders found for this retailer.</p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Order No.</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th>Items</Th>
                <Th right>Total</Th>
              </tr>
            </thead>
            <tbody>
              {retailerOrders.map((o) => (
                <Tr key={o.id}>
                  <Td mono bold>
                    <span className="text-emerald-700">{o.orderNo}</span>
                  </Td>
                  <Td muted>{o.createdAt.slice(0, 10)}</Td>
                  <Td>
                    <Badge variant={ORDER_STATUS_BADGE[o.status]}>{o.status}</Badge>
                  </Td>
                  <Td muted>{o.paymentTerms}</Td>
                  <Td muted>{o.lines.length} SKU{o.lines.length !== 1 ? 's' : ''}</Td>
                  <Td right bold>₹{o.totalAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )
      )}

      {/* ── KYC Documents ─────────────────────────────────────────────────── */}
      {tab === 'kyc' && (
        <Card padding="0">
          <div className="divide-y divide-gray-100">
            {kycDocs.map((doc, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.fileName ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  {doc.fileName
                    ? <CheckCircle2 size={18} className="text-emerald-600" />
                    : <AlertTriangle size={18} className="text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                  {doc.fileName
                    ? <p className="text-xs text-gray-400 font-mono mt-0.5">{doc.fileName} · Uploaded {doc.uploadedAt}</p>
                    : <p className="text-xs text-amber-600 mt-0.5">Not uploaded</p>
                  }
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex-shrink-0">
                  <Upload size={12} />
                  {doc.fileName ? 'Replace' : 'Upload'}
                  <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => uploadKyc(idx, e)} />
                </label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Contact Info ──────────────────────────────────────────────────── */}
      {tab === 'contact' && (
        <Card padding="24px" className="max-w-lg">
          <div className="space-y-4">
            {[
              { label: 'Owner Name', key: 'ownerName' as const, type: 'text'  },
              { label: 'Mobile',     key: 'mobile'    as const, type: 'tel'   },
              { label: 'Email',      key: 'email'     as const, type: 'email' },
              { label: 'Address',    key: 'line1'     as const, type: 'text'  },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={type}
                  value={contactForm[key]}
                  onChange={(e) => setContactForm((p) => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
              <Select
                value={String(contactForm.payTerms)}
                onChange={(v) => setContactForm((p) => ({ ...p, payTerms: Number(v) }))}
              >
                {[0, 7, 15, 30, 45].map((d) => (
                  <option key={d} value={d}>{d === 0 ? 'Advance' : `${d}-Day Credit`}</option>
                ))}
              </Select>
            </div>
            {exec && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Assigned Sales Executive</p>
                <p className="text-sm text-gray-800">{exec.name}</p>
              </div>
            )}
            <div className="pt-2">
              <Button variant="primary" onClick={handleSaveContact}>
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Edit Credit Limit Modal ────────────────────────────────────────── */}
      {showCreditEdit && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCreditEdit(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[420px] p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Edit Credit Limit</h3>
            <p className="text-xs text-gray-500 mb-4">Current limit: {fmt(retailer.creditLimitAmt)}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Credit Limit (₹)</label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reason for Change <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Upgraded to Gold tier after 12-month performance review"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <Button variant="secondary" onClick={() => setShowCreditEdit(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveCredit}
                disabled={!newLimit || !creditReason.trim()}
              >
                Update Limit
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Block Account Modal ────────────────────────────────────────────── */}
      {showBlockModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowBlockModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 w-[400px] p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Block Account?</h3>
                <p className="text-xs text-gray-500">This will suspend all orders for {retailer.firmName}.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Blocking this account will prevent any new B2B orders from being placed. Existing active orders will not be affected.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowBlockModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleBlock}>
                Block Account
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
