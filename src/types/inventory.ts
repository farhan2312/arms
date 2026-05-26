/**
 * inventory.ts
 * Procurement and stock-movement types: GRN, GRNLine, DigitalTransferChallan,
 * PurchaseOrder, PurchaseRequisition.
 */

// ---------------------------------------------------------------------------
// Purchase Requisition (PR)
// ---------------------------------------------------------------------------

/**
 * Lifecycle of an internal stock replenishment request.
 *
 * Draft → Submitted → Approved → Converted (into PO) | Rejected
 */
export type PRStatus = 'Draft' | 'Submitted' | 'Approved' | 'Converted' | 'Rejected';

/**
 * A single product line within a purchase requisition.
 */
export interface PRLine {
  /** UUID primary key. */
  id: string;

  /** Parent PR. */
  prId: string;

  productId: string;

  /** Denormalised for display. */
  sku: string;
  productName: string;

  /** Quantity requested for replenishment. */
  requestedQty: number;

  unit: string;

  /** Optional note explaining why this quantity is needed. */
  remarks?: string;
}

/**
 * An internal request raised by a StoreIncharge or WarehouseManager
 * to procure stock. Requires OperationsHead approval before conversion to a PO.
 */
export interface PurchaseRequisition {
  /** UUID primary key. */
  id: string;

  /**
   * Human-readable PR number.
   * Convention: `PR-{STORE_OR_WH_CODE}-{YYYYMMDD}-{SEQ}`.
   */
  prNo: string;

  /**
   * Requesting entity — exactly one of storeId or warehouseId must be set.
   */
  storeId?: string;
  warehouseId?: string;

  /** User who raised the PR (StoreIncharge or WarehouseManager). */
  requestedByUserId: string;

  /** User who approved or rejected the PR. */
  approvedByUserId?: string;

  lines: PRLine[];

  status: PRStatus;

  /** ISO 8601 date by which stock is needed. */
  requiredByDate?: string;

  remarks?: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Purchase Order (PO)
// ---------------------------------------------------------------------------

/**
 * Lifecycle of a purchase order sent to a supplier.
 *
 * Draft → Sent → Acknowledged → PartiallyReceived → FullyReceived | Cancelled
 */
export type POStatus =
  | 'Draft'
  | 'Sent'
  | 'Acknowledged'
  | 'PartiallyReceived'
  | 'FullyReceived'
  | 'Cancelled';

/**
 * A single product line within a purchase order.
 */
export interface POLine {
  /** UUID primary key. */
  id: string;

  /** Parent PO. */
  poId: string;

  productId: string;

  /** Denormalised for display and supplier communication. */
  sku: string;
  productName: string;

  /** Quantity ordered from the supplier. */
  orderedQty: number;

  /**
   * Cumulative quantity received via GRNs linked to this PO line.
   * Updated each time a GRN is created.
   */
  receivedQty: number;

  unit: string;

  /** Negotiated purchase price per unit (excluding GST). */
  negotiatedPricePerUnit: number;

  /** orderedQty × negotiatedPricePerUnit. */
  lineTotal: number;
}

/**
 * A formal purchase order issued to a supplier.
 * Linked to a PurchaseRequisition when created via the approval flow.
 */
export interface PurchaseOrder {
  /** UUID primary key. */
  id: string;

  /**
   * Human-readable PO number.
   * Convention: `PO-{WH_OR_STORE_CODE}-{YYYYMMDD}-{SEQ}`.
   */
  poNo: string;

  /**
   * Supplier this PO is addressed to.
   * A full Supplier entity may be added in a future module; use name + id for now.
   */
  supplierId: string;
  supplierName: string;

  /** The PR that triggered this PO, if created via the approval workflow. */
  prId?: string;

  /** Receiving location — exactly one of warehouseId or storeId. */
  warehouseId?: string;
  storeId?: string;

  lines: POLine[];

  /** Sum of all line totals before tax. */
  subtotalAmt: number;

  /** Total GST on all lines. */
  taxAmt: number;

  /** subtotalAmt + taxAmt. */
  totalAmt: number;

  status: POStatus;

  /** ISO 8601 date supplier is expected to deliver. */
  expectedDeliveryDate: string;

  /** Payment terms string, e.g. "Net 30", "Advance 50%". */
  paymentTerms: string;

  /** User (OperationsHead / Admin) who created this PO. */
  createdByUserId: string;

  /** User who authorised this PO for dispatch. */
  approvedByUserId?: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// GRN — Goods Receipt Note
// ---------------------------------------------------------------------------

/**
 * A single product line in a GRN, capturing batch-level details.
 * Drives batch creation and receivedQty update on the linked PO line.
 */
export interface GRNLine {
  /** UUID primary key. */
  id: string;

  /** Parent GRN. */
  grnId: string;

  /**
   * Corresponding PO line, if this GRN is against a PO.
   * Null for walk-in / spot purchases.
   */
  poLineId?: string;

  productId: string;

  /** Denormalised for display. */
  sku: string;
  productName: string;

  /** Qty on the supplier's delivery challan. */
  orderedQty: number;

  /** Qty physically counted and accepted into stock. */
  receivedQty: number;

  /**
   * Qty rejected due to damage, expiry, or quality failure.
   * rejectedQty + receivedQty should equal orderedQty.
   */
  rejectedQty: number;

  unit: string;

  /** Manufacturer's printed batch / lot number on packaging. */
  batchNo: string;

  /** Manufacturing date (YYYY-MM-DD). */
  mfgDate: string;

  /** Expiry / best-before date (YYYY-MM-DD). */
  expiryDate: string;

  /** Landed cost per accepted unit (excluding tax), used for margin tracking. */
  purchasePricePerUnit: number;

  /** purchasePricePerUnit × receivedQty. */
  lineTotal: number;

  /** Reason for rejection (required when rejectedQty > 0). */
  rejectionReason?: string;
}

/**
 * A Goods Receipt Note records physical goods arriving at a warehouse or store.
 * Creates or updates Batch records for every GRNLine accepted.
 */
export interface GRN {
  /** UUID primary key. */
  id: string;

  /**
   * Human-readable GRN number.
   * Convention: `GRN-{WH_OR_STORE_CODE}-{YYYYMMDD}-{SEQ}`.
   */
  grnNo: string;

  /**
   * Purchase order being fulfilled.
   * Null for ad-hoc / spot purchases without a formal PO.
   */
  poId?: string;

  supplierId?: string;
  supplierName: string;

  /** Supplier's own invoice / delivery challan reference number. */
  supplierInvoiceNo: string;

  /** ISO 8601 date on the supplier's invoice. */
  supplierInvoiceDate: string;

  /**
   * Receiving location — exactly one of warehouseId or storeId must be set.
   */
  warehouseId?: string;
  storeId?: string;

  lines: GRNLine[];

  /** Total value of accepted goods (sum of GRNLine lineTotals). */
  totalAmt: number;

  /** User who physically received and recorded the GRN. */
  receivedByUserId: string;

  /** User (WarehouseManager / OperationsHead) who verified quality and counts. */
  verifiedByUserId?: string;

  /** ISO 8601 timestamp when goods were received. */
  receivedAt: string;

  remarks?: string;
}

// ---------------------------------------------------------------------------
// Digital Transfer Challan (DTC)
// ---------------------------------------------------------------------------

/**
 * Lifecycle of an inter-location stock transfer.
 *
 * Draft → InTransit → PartiallyReceived → FullyReceived | Cancelled
 */
export type DTCStatus =
  | 'Draft'
  | 'InTransit'
  | 'PartiallyReceived'
  | 'FullyReceived'
  | 'Cancelled';

/**
 * A single batch-level line within a Digital Transfer Challan.
 */
export interface DTCLine {
  /** UUID primary key. */
  id: string;

  /** Parent DTC. */
  dtcId: string;

  productId: string;

  /**
   * Specific batch being transferred.
   * Allows the receiving location to inherit expiry and cost data.
   */
  batchId: string;

  /** Denormalised for display. */
  sku: string;
  productName: string;
  batchNo: string;

  /** Quantity dispatched from the source location. */
  transferredQty: number;

  /**
   * Quantity confirmed at the receiving location.
   * May be less than transferredQty if damage occurred in transit.
   */
  receivedQty?: number;

  unit: string;
}

/**
 * A Digital Transfer Challan records authorised stock movement between
 * two internal locations (warehouse ↔ warehouse, warehouse ↔ store, store ↔ store).
 * Deducts inventory from the source and credits it to the destination on receipt.
 */
export interface DigitalTransferChallan {
  /** UUID primary key. */
  id: string;

  /**
   * Human-readable challan number.
   * Convention: `DTC-{FROM_CODE}-{TO_CODE}-{YYYYMMDD}-{SEQ}`.
   */
  dtcNo: string;

  /**
   * Source location — exactly one of fromWarehouseId or fromStoreId must be set.
   */
  fromWarehouseId?: string;
  fromStoreId?: string;

  /**
   * Destination location — exactly one of toWarehouseId or toStoreId must be set.
   */
  toWarehouseId?: string;
  toStoreId?: string;

  lines: DTCLine[];

  /** Sum of transferredQty across all lines (informational). */
  totalQtyUnits: number;

  /** User at the source location who packed and dispatched the stock. */
  dispatchedByUserId: string;

  /** User at the destination location who confirmed receipt. */
  receivedByUserId?: string;

  /** Transport vehicle number (if applicable). */
  vehicleNo?: string;

  status: DTCStatus;

  /** ISO 8601 timestamp when stock left the source location. */
  dispatchedAt: string;

  /** ISO 8601 timestamp when stock was accepted at the destination. */
  receivedAt?: string;

  remarks?: string;
}
