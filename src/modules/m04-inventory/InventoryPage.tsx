// Inventory — tab shell for Stock Ledger, GRN, and Transfer Challan
import { useState } from 'react';
import Tabs from '../../components/ui/Tabs';
import PageHeader from '../../components/ui/PageHeader';
import StockLedger from './StockLedger';
import GRNForm from './GRNForm';
import TransferChallanForm from './TransferChallanForm';
import type { Batch } from '../../types/entities';

type Tab = 'ledger' | 'grn' | 'dtc';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ledger');

  // GRN-added batches flow into the stock ledger within the same session
  const [sessionBatches, setSessionBatches] = useState<Batch[]>([]);

  function handleBatchesAdded(batches: Batch[]) {
    setSessionBatches(prev => [...prev, ...batches]);
    setActiveTab('ledger'); // jump back to ledger after GRN save
  }

  const tabs = [
    { id: 'ledger', label: 'Stock Ledger', badge: sessionBatches.length > 0 ? sessionBatches.length : undefined },
    { id: 'grn',    label: 'GRN' },
    { id: 'dtc',    label: 'Transfer Challan' },
  ];

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Inventory"
        subtitle="Batch-level stock · GRN · Transfer challans"
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as Tab)}
      />

      {/* Tab content */}
      <div>
        {activeTab === 'ledger' && (
          <StockLedger extraBatches={sessionBatches} />
        )}
        {activeTab === 'grn' && (
          <GRNForm onBatchesAdded={handleBatchesAdded} />
        )}
        {activeTab === 'dtc' && (
          <TransferChallanForm />
        )}
      </div>
    </div>
  );
}
