// Shared types for the procurement module
// Imported by PurchaseRequisitionForm, PRApprovalQueue, PurchaseOrderForm, POList, ProcurementPage

// ── Purchase Requisition ──────────────────────────────────────────────────────

export type PRStatus =
  | 'Pending Approval'
  | 'Approved, Pending PO'
  | 'Rejected'
  | 'Revision Requested'
  | 'PO Created';

export type PRUrgency = 'Normal' | 'Urgent';

export interface PRLine {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  avgDailySales: number;    // calculated from last 14 days of mockSaleTransactions
  suggestedQty: number;     // 14-day cover − currentStock, min 0
  requestedQty: number;
  estimatedUnitPrice: number;  // product.b2bPrice
}

export interface PurchaseRequisition {
  id: string;
  prNo: string;             // e.g. "PR-AKL-20260527-001"
  date: string;             // YYYY-MM-DD
  storeId: string;          // fulfillment store or warehouse ID
  storeName: string;
  raisedByUserId: string;
  urgency: PRUrgency;
  notes: string;
  lines: PRLine[];
  totalEstimatedValue: number;  // sum(requestedQty × estimatedUnitPrice)
  status: PRStatus;
  approverComments?: string;    // rejection reason or revision notes
  approvedByUserId?: string;
  approvedAt?: string;
  createdAt: string;
}

// ── Purchase Order ────────────────────────────────────────────────────────────

export type POStatus = 'Draft' | 'Sent' | 'Partially Received' | 'Closed';

export interface POLine {
  id: string;
  productId: string;
  productName: string;
  hsnCode: string;
  unit: string;
  quantity: number;
  unitRate: number;
  gstRatePct: number;          // rate used on this PO line (user-entered)
  catalogueGstPct: number;     // product.taxSlabPct — used for mismatch validation
  gstAmt: number;
  lineTotal: number;
  // 3-way match fields (populated on seed data)
  grnReceivedQty?: number;
  supplierInvoiceQty?: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;             // e.g. "PO-AKL-20260527-001"
  date: string;             // YYYY-MM-DD
  storeId: string;
  storeName: string;
  prId?: string;            // source PR (if created from approved PR)
  supplierId: string;
  supplierName: string;
  lines: POLine[];
  subtotalAmt: number;      // sum(qty × unitRate) before GST
  cgstAmt: number;
  sgstAmt: number;
  totalAmt: number;
  status: POStatus;
  sentAt?: string;
  createdAt: string;
}
