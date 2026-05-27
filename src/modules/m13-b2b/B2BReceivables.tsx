import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import { useToast } from '../../hooks/useToast';
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

export default function B2BReceivables() {
  const [invoices, setInvoices]             = useState<B2BInvoice[]>(mockB2BInvoices);
  const [retailers, setRetailers]           = useState<RetailerAccount[]>(mockRetailers);
  const [activeBucket, setActiveBucket]     = useState<AgeBucket>('all');
  const [activeTab, setActiveTab]           = useState<MainTab>('ageing');
  const [selectedRetailerId, setSelectedRetailerId] = useState<string | null>(null);
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);
  const toast = useToast();

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
    toast.success(`Payment of ₹${amt.toLocaleString('en-IN')} via ${mode} recorded (Ref: ${ref})`);
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
          <Tabs
            tabs={[
              { id: 'ageing',   label: 'Ageing by Retailer' },
              { id: 'invoices', label: 'Invoices' },
            ]}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as MainTab)}
          />

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
    </div>
  );
}
