/**
 * b2b.ts
 * B2B channel types: retailer accounts, bulk orders, dispatch, and invoicing.
 */

import type { Address } from './entities';

// ---------------------------------------------------------------------------
// Status unions
// ---------------------------------------------------------------------------

/**
 * Full order lifecycle for a B2B order.
 *
 * Draft → Submitted → UnderReview → Approved → Allocated → Dispatched → Delivered → Invoiced
 *
 * - `Draft`       – Order being built by the sales exec; not yet visible to ops.
 * - `Submitted`   – Sales exec has locked the order and sent it for review.
 * - `UnderReview` – Ops / BDM is checking credit limit, stock availability, pricing.
 * - `Approved`    – Order confirmed; awaiting warehouse stock allocation.
 * - `Allocated`   – Specific batches reserved in the warehouse.
 * - `Dispatched`  – Vehicle left warehouse; DTC / lorry receipt generated.
 * - `Delivered`   – POD received; goods accepted by retailer.
 * - `Invoiced`    – Tax invoice raised; payment terms clock started.
 */
export type B2BOrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'Allocated'
  | 'Dispatched'
  | 'Delivered'
  | 'Invoiced';

/**
 * Payment collection terms for a B2B order.
 */
export type B2BPaymentTerms = 'Advance' | 'Credit' | 'BNPL';

/**
 * Invoice settlement states.
 */
export type B2BInvoiceStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Disputed';

/**
 * Commercial tier classification of a retailer account.
 * Drives pricing slabs and credit limits.
 */
export type RetailerTier = 'Standard' | 'Silver' | 'Gold' | 'Preferred';

// ---------------------------------------------------------------------------
// RetailerAccount
// ---------------------------------------------------------------------------

/**
 * A registered B2B buyer — typically an agri-input dealer, cooperative,
 * or institutional buyer placing bulk orders.
 */
export interface RetailerAccount {
  /** UUID primary key. */
  id: string;

  /** Registered firm / company name. */
  firmName: string;

  /** Owner or primary contact person. */
  ownerName: string;

  /** Primary mobile number for OTP-based login. */
  mobile: string;

  email?: string;

  /** 15-digit GST Identification Number. */
  gstIn: string;

  /** PAN card number (10 chars) for TDS applicability checks. */
  pan?: string;

  /** Registered business address. */
  address: Address;

  /** Commercial tier that controls pricing and credit. */
  tier: RetailerTier;

  /** Maximum outstanding credit this account is allowed to carry (INR). */
  creditLimitAmt: number;

  /** Current unpaid invoice total across all outstanding invoices (INR). */
  outstandingAmt: number;

  /** Payment due period in calendar days from invoice date. */
  creditDays: number;

  /** BDM responsible for this account's relationship. */
  bdmUserId: string;

  /** B2BSalesExecutive who handles day-to-day order management. */
  salesExecUserId?: string;

  isActive: boolean;

  /** ISO 8601 date this account was onboarded. */
  onboardedAt: string;

  /** ISO 8601 timestamp of last profile update. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// B2BOrderLine
// ---------------------------------------------------------------------------

/**
 * A single SKU line within a B2B order.
 * requestedQty is set at order creation; allocatedQty is filled by the warehouse
 * when the order moves to Allocated status.
 */
export interface B2BOrderLine {
  /** UUID primary key. */
  id: string;

  /** Parent order. */
  orderId: string;

  productId: string;

  /** Denormalised for display without product lookup. */
  sku: string;
  productName: string;

  /** Quantity requested by the retailer. */
  requestedQty: number;

  /**
   * Quantity confirmed available and allocated in the warehouse.
   * May be less than requestedQty due to stock constraints.
   * Set when order moves to `Allocated`.
   */
  allocatedQty: number;

  unit: string;

  /** Agreed unit price for this retailer / tier. */
  unitPrice: number;

  /** Trade discount percentage applied to this line. */
  lineDiscountPct: number;

  /** Computed rupee discount: unitPrice × allocatedQty × (lineDiscountPct / 100). */
  lineDiscountAmt: number;

  /** Applicable GST percentage. */
  taxPct: number;

  /** Computed GST amount on the taxable (post-discount) value. */
  taxAmt: number;

  /** Net line total: (unitPrice × allocatedQty) − lineDiscountAmt + taxAmt. */
  lineTotal: number;
}

// ---------------------------------------------------------------------------
// B2BOrder
// ---------------------------------------------------------------------------

/**
 * A bulk purchase order raised by a retailer account.
 * Progresses through the B2BOrderStatus lifecycle from Draft to Invoiced.
 */
export interface B2BOrder {
  /** UUID primary key. */
  id: string;

  /**
   * Human-readable order number.
   * Convention: `B2B-{REGION}-{YYYYMMDD}-{SEQ}`, e.g. `B2B-VID-20240502-001`.
   */
  orderNo: string;

  /** The retailer placing this order. */
  retailerId: string;

  /** Sales executive who created/owns this order. */
  salesExecUserId: string;

  /** BDM who approved or oversees this order. */
  bdmUserId: string;

  /** Store or warehouse from which this order is fulfilled. */
  fulfillmentStoreId: string;

  status: B2BOrderStatus;

  paymentTerms: B2BPaymentTerms;

  lines: B2BOrderLine[];

  /** Sum of (unitPrice × requestedQty) before discounts. */
  subtotalAmt: number;

  /** Total discount across all lines. */
  discountAmt: number;

  /** Total GST across all lines. */
  taxAmt: number;

  /** Final order value: subtotalAmt − discountAmt + taxAmt. */
  totalAmt: number;

  /** Requested latest date of dispatch. */
  dispatchByDate?: string;

  /** Delivery address (may differ from registered address). */
  deliveryAddress: string;

  remarks?: string;

  /** User who approved this order (BDM or OperationsHead). */
  approvedByUserId?: string;
  approvedAt?: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// B2BDispatch
// ---------------------------------------------------------------------------

/**
 * A single line within a dispatch, mapping an order line to a specific batch.
 */
export interface B2BDispatchLine {
  /** UUID primary key. */
  id: string;

  /** Parent dispatch. */
  dispatchId: string;

  /** Order line being fulfilled. */
  orderLineId: string;

  productId: string;

  /** Specific batch being dispatched (for traceability and FIFO). */
  batchId: string;

  dispatchedQty: number;
  unit: string;
}

/**
 * A physical dispatch event moving goods from warehouse to retailer.
 * A single B2BOrder may be split into multiple dispatches (partial shipments).
 */
export interface B2BDispatch {
  /** UUID primary key. */
  id: string;

  /**
   * Dispatch / challan number.
   * Convention: `DSP-{WAREHOUSE_CODE}-{YYYYMMDD}-{SEQ}`.
   */
  dispatchNo: string;

  /** The order being (partially) fulfilled. */
  orderId: string;

  /** Source warehouse. */
  warehouseId: string;

  lines: B2BDispatchLine[];

  /** Vehicle registration number. */
  vehicleNo: string;

  driverName: string;
  driverMobile: string;

  /** Lorry receipt / transport document number. */
  lrNo?: string;

  /** ISO 8601 timestamp when goods left the warehouse. */
  dispatchedAt: string;

  /** ISO 8601 date expected at the retailer's location. */
  expectedDeliveryDate: string;

  /** ISO 8601 timestamp when Proof of Delivery was received. */
  podReceivedAt?: string;

  /** URL to scanned or photographed POD document. */
  podImageUrl?: string;

  /** User who created this dispatch record. */
  dispatchedByUserId: string;
}

// ---------------------------------------------------------------------------
// B2BInvoice
// ---------------------------------------------------------------------------

/**
 * A tax invoice raised against a B2B dispatch.
 * Drives accounts-receivable and credit-limit utilisation.
 */
export interface B2BInvoice {
  /** UUID primary key. */
  id: string;

  /**
   * Printed invoice number (GST-compliant).
   * Convention: `BINV-{STORE_CODE}-{YYYYMMDD}-{SEQ}`.
   */
  invoiceNo: string;

  /** Source order. */
  orderId: string;

  /** The dispatch that triggered this invoice. */
  dispatchId: string;

  /** Retailer being billed. */
  retailerId: string;

  /** ISO 8601 date of invoice. */
  invoiceDate: string;

  /** ISO 8601 due date based on creditDays from invoice date. */
  dueDate: string;

  /** Total invoiced amount (INR). */
  totalAmt: number;

  /** Amount collected so far against this invoice. */
  paidAmt: number;

  /** totalAmt − paidAmt. Updated on each payment receipt. */
  outstandingAmt: number;

  status: B2BInvoiceStatus;

  /** Finance user who generated this invoice. */
  createdByUserId: string;

  /** ISO 8601 timestamp. */
  createdAt: string;
}
