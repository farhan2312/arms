// ProcurementPage — orchestrator for the procurement module
// Tabs: Raise PR | Approval Queue (badge) | Purchase Orders

import { useState } from 'react';
import { ClipboardList, CheckSquare, FileText } from 'lucide-react';
import PurchaseRequisitionForm from './PurchaseRequisitionForm';
import PRApprovalQueue from './PRApprovalQueue';
import PurchaseOrderForm from './PurchaseOrderForm';
import POList from './POList';
import type { PurchaseRequisition, PurchaseOrder } from './types';

// ── Seed PRs ──────────────────────────────────────────────────────────────────

const SEED_PRS: PurchaseRequisition[] = [
  {
    id: 'pr-seed-001',
    prNo: 'PR-AKL-001-20260525',
    date: '2026-05-25',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    raisedByUserId: 'usr-003',
    urgency: 'Normal',
    notes: 'Pre-kharif season cotton seed replenishment. Expected surge in walk-in demand next 2 weeks.',
    lines: [
      {
        productId: 'prd-001',
        productName: 'BT Cotton Seed',
        unit: 'Packet',
        currentStock: 28,
        avgDailySales: 3.5,
        suggestedQty: 21,
        requestedQty: 30,
        estimatedUnitPrice: 820,
      },
      {
        productId: 'prd-006',
        productName: 'Urea (Neem Coated) 45 Kg',
        unit: 'Bag',
        currentStock: 18,
        avgDailySales: 4.2,
        suggestedQty: 41,
        requestedQty: 50,
        estimatedUnitPrice: 266,
      },
    ],
    totalEstimatedValue: 30 * 820 + 50 * 266,   // 24600 + 13300 = 37900
    status: 'Pending Approval',
    createdAt: '2026-05-25T10:30:00Z',
  },
  {
    id: 'pr-seed-002',
    prNo: 'PR-NGP-001-20260522',
    date: '2026-05-22',
    storeId: 'str-ngp-003',
    storeName: 'Bharat Agri Store – Nagpur',
    raisedByUserId: 'usr-012',
    urgency: 'Urgent',
    notes: 'DAP stock critically low — 2 days cover remaining. High B2B demand from dealer network.',
    lines: [
      {
        productId: 'prd-007',
        productName: 'DAP (Di-Ammonium Phosphate) 50 Kg',
        unit: 'Bag',
        currentStock: 12,
        avgDailySales: 8.5,
        suggestedQty: 107,
        requestedQty: 100,
        estimatedUnitPrice: 1350,
      },
      {
        productId: 'prd-010',
        productName: 'NPK 19-19-19 Water Soluble 25 Kg',
        unit: 'Bag',
        currentStock: 5,
        avgDailySales: 2.1,
        suggestedQty: 24,
        requestedQty: 30,
        estimatedUnitPrice: 1400,
      },
    ],
    totalEstimatedValue: 100 * 1350 + 30 * 1400,  // 135000 + 42000 = 177000
    status: 'Approved, Pending PO',
    approvedByUserId: 'usr-005',
    approvedAt: '2026-05-22T14:00:00Z',
    createdAt: '2026-05-22T09:00:00Z',
  },
  {
    id: 'pr-seed-003',
    prNo: 'PR-AMR-001-20260520',
    date: '2026-05-20',
    storeId: 'str-amr-002',
    storeName: 'Bharat Agri Store – Amravati',
    raisedByUserId: 'usr-011',
    urgency: 'Normal',
    notes: '',
    lines: [
      {
        productId: 'prd-018',
        productName: 'Glyphosate 41% SL',
        unit: 'L',
        currentStock: 20,
        avgDailySales: 1.8,
        suggestedQty: 5,
        requestedQty: 50,
        estimatedUnitPrice: 260,
      },
    ],
    totalEstimatedValue: 50 * 260,   // 13000
    status: 'Rejected',
    approverComments: 'Requested qty (50 L) far exceeds 14-day demand (25 L). Resubmit with justified quantity.',
    createdAt: '2026-05-20T11:00:00Z',
  },
  {
    id: 'pr-seed-004',
    prNo: 'PR-WRD-001-20260524',
    date: '2026-05-24',
    storeId: 'str-wrd-004',
    storeName: 'Bharat Agri Store – Wardha',
    raisedByUserId: 'usr-013',
    urgency: 'Normal',
    notes: 'Pre-monsoon pesticide stocking.',
    lines: [
      {
        productId: 'prd-019',
        productName: 'Mancozeb 75% WP',
        unit: 'Packet',
        currentStock: 15,
        avgDailySales: 2.0,
        suggestedQty: 13,
        requestedQty: 30,
        estimatedUnitPrice: 155,
      },
      {
        productId: 'prd-020',
        productName: 'Acephate 75% SP',
        unit: 'Packet',
        currentStock: 10,
        avgDailySales: 1.5,
        suggestedQty: 11,
        requestedQty: 20,
        estimatedUnitPrice: 220,
      },
    ],
    totalEstimatedValue: 30 * 155 + 20 * 220,   // 4650 + 4400 = 9050
    status: 'Revision Requested',
    approverComments: 'Split into two separate PRs — one per product category (fungicide vs. insecticide). Helps with supplier routing.',
    createdAt: '2026-05-24T08:30:00Z',
  },
];

// ── Seed POs ──────────────────────────────────────────────────────────────────

const SEED_POS: PurchaseOrder[] = [
  {
    id: 'po-seed-001',
    poNo: 'PO-NGP-20260523-001',
    date: '2026-05-23',
    storeId: 'str-ngp-003',
    storeName: 'Bharat Agri Store – Nagpur',
    prId: 'pr-seed-002',
    supplierId: 'sup-001',
    supplierName: 'AgriChem Distributors Pvt Ltd',
    lines: [
      {
        id: 'pol-seed-001a',
        productId: 'prd-007',
        productName: 'DAP (Di-Ammonium Phosphate) 50 Kg',
        hsnCode: '3105',
        unit: 'Bag',
        quantity: 100,
        unitRate: 1350,
        gstRatePct: 5,
        catalogueGstPct: 5,
        gstAmt: 6750,
        lineTotal: 141750,
        grnReceivedQty: 95,         // short-shipment — triggers mismatch
        supplierInvoiceQty: 100,
      },
      {
        id: 'pol-seed-001b',
        productId: 'prd-010',
        productName: 'NPK 19-19-19 Water Soluble 25 Kg',
        hsnCode: '3105',
        unit: 'Bag',
        quantity: 30,
        unitRate: 1400,
        gstRatePct: 5,
        catalogueGstPct: 5,
        gstAmt: 2100,
        lineTotal: 44100,
        grnReceivedQty: 30,
        supplierInvoiceQty: 30,
      },
    ],
    subtotalAmt: 177000,
    cgstAmt: 4425,
    sgstAmt: 4425,
    totalAmt: 185850,
    status: 'Partially Received',
    sentAt: '2026-05-23T12:00:00Z',
    createdAt: '2026-05-23T11:45:00Z',
  },
  {
    id: 'po-seed-002',
    poNo: 'PO-AKL-20260521-001',
    date: '2026-05-21',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    supplierId: 'sup-002',
    supplierName: 'Syngenta India Limited',
    lines: [
      {
        id: 'pol-seed-002a',
        productId: 'prd-001',
        productName: 'BT Cotton Seed',
        hsnCode: '1209',
        unit: 'Packet',
        quantity: 50,
        unitRate: 820,
        gstRatePct: 0,
        catalogueGstPct: 0,
        gstAmt: 0,
        lineTotal: 41000,
        grnReceivedQty: 50,
        supplierInvoiceQty: 50,
      },
    ],
    subtotalAmt: 41000,
    cgstAmt: 0,
    sgstAmt: 0,
    totalAmt: 41000,
    status: 'Closed',
    sentAt: '2026-05-21T09:30:00Z',
    createdAt: '2026-05-21T09:00:00Z',
  },
  {
    id: 'po-seed-003',
    poNo: 'PO-WGL-20260525-001',
    date: '2026-05-25',
    storeId: 'str-wgl-005',
    storeName: 'Bharat Agri Store – Warangal',
    supplierId: 'sup-004',
    supplierName: 'UPL Limited — Crop Protection',
    lines: [
      {
        id: 'pol-seed-003a',
        productId: 'prd-017',
        productName: 'Chlorpyrifos 20% EC',
        hsnCode: '3808',
        unit: 'L',
        quantity: 40,
        unitRate: 320,
        gstRatePct: 18,
        catalogueGstPct: 18,
        gstAmt: 2304,
        lineTotal: 15104,
        // No GRN or invoice yet
      },
    ],
    subtotalAmt: 12800,
    cgstAmt: 1152,
    sgstAmt: 1152,
    totalAmt: 15104,
    status: 'Sent',
    sentAt: '2026-05-25T15:00:00Z',
    createdAt: '2026-05-25T14:45:00Z',
  },
];

// ── Tab definition ────────────────────────────────────────────────────────────

type ProcTab = 'raise' | 'approval' | 'po';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProcurementPage() {
  const [prs, setPRs]     = useState<PurchaseRequisition[]>(SEED_PRS);
  const [pos, setPOs]     = useState<PurchaseOrder[]>(SEED_POS);
  const [tab, setTab]     = useState<ProcTab>('raise');
  const [showPOForm, setShowPOForm] = useState(false);
  const [sourcePRId, setSourcePRId] = useState<string | undefined>();

  const pendingCount = prs.filter(pr => pr.status === 'Pending Approval').length;
  const approvedPRs  = prs.filter(pr => pr.status === 'Approved, Pending PO');

  function handleNewPR(pr: PurchaseRequisition) {
    setPRs(prev => [pr, ...prev]);
  }

  function handleUpdatePR(id: string, update: Partial<PurchaseRequisition>) {
    setPRs(prev => prev.map(pr => pr.id === id ? { ...pr, ...update } : pr));
  }

  function handleCreatePOFromPR(pr: PurchaseRequisition) {
    setSourcePRId(pr.id);
    setShowPOForm(true);
    setTab('po');
  }

  function handleSavePO(po: PurchaseOrder) {
    setPOs(prev => [po, ...prev]);
    // Mark source PR as PO Created
    if (po.prId) {
      handleUpdatePR(po.prId, { status: 'PO Created' });
    }
    setShowPOForm(false);
    setSourcePRId(undefined);
  }

  const TABS = [
    { key: 'raise'    as ProcTab, label: 'Raise PR',         icon: FileText },
    { key: 'approval' as ProcTab, label: 'Approval Queue',   icon: CheckSquare, badge: pendingCount },
    { key: 'po'       as ProcTab, label: 'Purchase Orders',  icon: ClipboardList },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Procurement</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Purchase requisitions, approvals, and purchase orders
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => { setTab(key); if (key !== 'po') setShowPOForm(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
            {badge != null && badge > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'raise' && (
        <PurchaseRequisitionForm
          onSubmit={handleNewPR}
          prCount={prs.length}
        />
      )}

      {tab === 'approval' && (
        <PRApprovalQueue
          prs={prs}
          onUpdatePR={handleUpdatePR}
          onCreatePO={handleCreatePOFromPR}
        />
      )}

      {tab === 'po' && (
        showPOForm ? (
          <PurchaseOrderForm
            approvedPRs={approvedPRs}
            initialPRId={sourcePRId}
            poCount={pos.length}
            onSave={handleSavePO}
            onCancel={() => { setShowPOForm(false); setSourcePRId(undefined); }}
          />
        ) : (
          <POList
            pos={pos}
            onNewPO={() => setShowPOForm(true)}
          />
        )
      )}
    </div>
  );
}
