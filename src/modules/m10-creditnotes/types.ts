// Credit Note domain types
// Used by CreditNoteList, CreditNoteForm, CreditNoteDetail, CreditNotes

export type CreditNoteType   = 'Supplier' | 'B2BCustomer';
export type CreditNoteStatus = 'Draft' | 'PendingApproval' | 'Posted' | 'Rejected';
export type SupplierReason   = 'VolumeDiscount' | 'QualityClaim' | 'Returns' | 'Scheme';
export type B2BReason        = 'DamagedGoods' | 'WrongProduct' | 'VolumeDiscount' | 'Returns';

export interface CreditNote {
  id: string;
  /** Human-readable CN number, e.g. CN-SUP-20260315-001 or CN-B2B-20260405-001 */
  cnNo: string;
  type: CreditNoteType;
  date: string;           // YYYY-MM-DD

  // ── Supplier CN fields ───────────────────────────────────────────────
  supplierId?: string;
  supplierName?: string;
  linkedGrnId?: string;
  linkedBatchId?: string;
  supplierReason?: SupplierReason;

  // ── B2B Customer CN fields ──────────────────────────────────────────
  retailerId?: string;
  retailerName?: string;
  linkedInvoiceId?: string;
  linkedInvoiceNo?: string;
  b2bReason?: B2BReason;

  // ── Financials ──────────────────────────────────────────────────────
  amount: number;         // base amount (pre-GST)
  gstAmt: number;
  netAmt: number;         // amount + gstAmt

  status: CreditNoteStatus;
  remarks?: string;

  // ── Approval ─────────────────────────────────────────────────────────
  approvedByUserId?: string;
  approvedAt?: string;
  rejectedReason?: string;

  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}
