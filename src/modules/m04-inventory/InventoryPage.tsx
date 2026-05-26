// Inventory — tab shell for Stock Ledger, GRN, and Transfer Challan
import { useState } from 'react';
import { PackageSearch, ClipboardList, ArrowLeftRight } from 'lucide-react';
import StockLedger from './StockLedger';
import GRNForm from './GRNForm';
import TransferChallanForm from './TransferChallanForm';
import type { Batch } from '../../types/entities';

type Tab = 'ledger' | 'grn' | 'dtc';

const TABS: { id: Tab; label: string; icon: typeof PackageSearch }[] = [
  { id: 'ledger', label: 'Stock Ledger',      icon: PackageSearch  },
  { id: 'grn',    label: 'GRN',               icon: ClipboardList  },
  { id: 'dtc',    label: 'Transfer Challan',  icon: ArrowLeftRight },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ledger');

  // GRN-added batches flow into the stock ledger within the same session
  const [sessionBatches, setSessionBatches] = useState<Batch[]>([]);

  function handleBatchesAdded(batches: Batch[]) {
    setSessionBatches(prev => [...prev, ...batches]);
    setActiveTab('ledger'); // jump back to ledger after GRN save
  }

  return (
    <div className="p-6 space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Batch-level stock · GRN · Transfer challans
          </p>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {tab.id === 'ledger' && sessionBatches.length > 0 && (
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                  +{sessionBatches.length} new
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
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
  );
}
