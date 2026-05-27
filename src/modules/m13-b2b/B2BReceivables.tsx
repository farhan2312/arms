import { useState } from 'react';
import { BarChart3, FileText, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { mockB2BInvoices } from '../../data/mockB2BInvoices';
import { mockRetailers } from '../../data/mockRetailers';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import type { B2BInvoice, RetailerAccount } from '../../types/b2b';
import ReceivablesSummary from './ReceivablesSummary';
import type { AgeBucket } from './ReceivablesSummary';
import ReceivablesTable from './ReceivablesTable';
import InvoiceList from './InvoiceList';
import OverdueAlerts from './OverdueAlerts';
import RetailerProfile from './RetailerProfile';

type MainTab = 'ageing' | 'invoices';

const TABS: { id: MainTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'ageing',   label: 'Ageing by Retailer', icon: BarChart3  },
  { id: 'invoices', label: 'Invoices',            icon: FileText   },
];

export default function B2BReceivables() {
  const [invoices, setInvoices]             = useState<B2BInvoice[]>(mockB2BInvoices);
  const [retailers, setRetailers]           = useState<RetailerAccount[]>(mockRetailers);
  const [activeBucket, setActiveBucket]     = useState<AgeBucket>('all');
  const [activeTab, setActiveTab]           = useState<MainTab>('ageing');
  const [selectedRetailerId, setSelectedRetailerId] = useState<string | null>(null);
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);
  const [toast, setToast]                   = useState<string | null>(null);

  // ── RetailerProfile view ────────────────────────────────────────────────────
  if (selectedRetailerId) {
    const retailer = retailers.find((r) => r.id === selectedRetailerId);
    if (retailer) {
      return (
        <div className="p-6">
          <RetailerProfile
            retailer={retailer}
            orders={mockB2BOrders}
            onBack={() => setSelectedRetailerId(null)}
            onUpdate={(updated) => {
              setRetailers((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              setSelectedRetailerId(updated.id);
            }}
          />
        </div>
      );
    }
  }

  // ── Payment handler ─────────────────────────────────────────────────────────
  function handlePaymentRecorded(
    invoiceId: string,
    amt: number,
    mode: string,
    ref: string,
    _date: string,
  ) {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const newPaid        = inv.paidAmt + amt;
        const newOutstanding = Math.max(0, inv.outstandingAmt - amt);
        const newStatus      = newOutstanding <= 0
          ? 'Paid'
          : newPaid > 0
            ? 'PartiallyPaid'
            : inv.status;
        return { ...inv, paidAmt: newPaid, outstandingAmt: newOutstanding, status: newStatus };
      }),
    );
    showToast(`Payment of ₹${amt.toLocaleString('en-IN')} via ${mode} recorded (Ref: ${ref})`);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="B2B Receivables"
        subtitle="Invoice ageing, outstanding balances and payment collection"
      />

      {/* KPI cards */}
      <ReceivablesSummary
        invoices={invoices}
        activeBucket={activeBucket}
        onBucketClick={(b) => setActiveBucket(b === activeBucket ? 'all' : b)}
      />

      {/* Main content + alerts panel */}
      <div className="flex gap-5 items-start">
        {/* ── Left: tabs + table ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'ageing' && (
            <ReceivablesTable
              invoices={invoices}
              retailers={retailers}
              activeBucket={activeBucket}
              onSelectRetailer={setSelectedRetailerId}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceList
              invoices={invoices}
              retailers={retailers}
              activeBucket={activeBucket}
              onPaymentRecorded={handlePaymentRecorded}
            />
          )}
        </div>

        {/* ── Right: overdue alerts panel ────────────────────────────────── */}
        <OverdueAlerts
          invoices={invoices}
          retailers={retailers}
          collapsed={alertsCollapsed}
          onToggle={() => setAlertsCollapsed((v) => !v)}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl z-[100] max-w-sm">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
