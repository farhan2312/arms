/**
 * finance.ts
 * Financial operations types: credit notes and daily store bookkeeping.
 */

// ---------------------------------------------------------------------------
// CreditNote
// ---------------------------------------------------------------------------

/**
 * Whether this credit note is owed to a supplier (Supplier) or
 * raised against a retailer's B2B account (B2B).
 *
 * - `Supplier` – Company returns damaged/excess goods to a vendor; vendor owes a credit.
 * - `B2B`      – Company issues a discount or correction credit to a retailer's account.
 */
export type CreditNoteType = 'Supplier' | 'B2B';

/**
 * Lifecycle of a credit note.
 *
 * Draft → Issued → Settled | Voided
 */
export type CreditNoteStatus = 'Draft' | 'Issued' | 'Settled' | 'Voided';

/**
 * A single product line within a credit note.
 */
export interface CreditNoteLineItem {
  /** UUID primary key. */
  id: string;

  /** Parent credit note. */
  cnId: string;

  productId: string;

  /** Denormalised for display. */
  sku: string;
  productName: string;

  qty: number;
  unit: string;

  /** Per-unit credit amount (excluding tax). */
  unitAmt: number;

  /** Applicable GST percentage. */
  taxPct: number;

  /** Computed GST on (qty × unitAmt). */
  taxAmt: number;

  /** (qty × unitAmt) + taxAmt. */
  lineTotal: number;
}

/**
 * A credit note representing a monetary adjustment — either a supplier credit
 * for returned goods or a B2B retailer credit for pricing corrections, returns,
 * or quality claims.
 */
export interface CreditNote {
  /** UUID primary key. */
  id: string;

  /**
   * Human-readable credit note number.
   * Convention: `CN-{TYPE}-{YYYYMMDD}-{SEQ}`, e.g. `CN-B2B-20240510-001`.
   */
  cnNo: string;

  type: CreditNoteType;

  /**
   * The counterparty.
   * For Supplier CNs: supplierId.
   * For B2B CNs: retailerId.
   */
  partyId: string;

  /** Denormalised party name for display. */
  partyName: string;

  /**
   * The original order or dispatch that this CN is raised against.
   * B2BOrder ID for B2B CNs, or PO ID for Supplier CNs.
   */
  refOrderId?: string;

  /** The invoice number on the original supplier or B2B document. */
  refInvoiceNo?: string;

  /** Business justification: e.g. "Damaged stock on delivery", "Pricing error". */
  reason: string;

  lineItems: CreditNoteLineItem[];

  /** Sum of all line totals before tax. */
  subtotalAmt: number;

  /** Total tax across all lines. */
  taxAmt: number;

  /** subtotalAmt + taxAmt — total credit to be applied. */
  totalAmt: number;

  status: CreditNoteStatus;

  /** Finance user who created this credit note. */
  issuedByUserId: string;

  /** OperationsHead or Admin who authorised it. */
  approvedByUserId?: string;

  /** ISO 8601 date the credit note was formally issued. */
  issueDate: string;

  /** ISO 8601 date the credit was applied against an invoice or refunded. */
  settlementDate?: string;

  remarks?: string;

  /** ISO 8601 timestamp. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// DailyBookkeeping
// ---------------------------------------------------------------------------

/**
 * Reconciliation status of a day's cash position.
 */
export type BookkeepingStatus = 'Open' | 'Reconciled' | 'Disputed';

/**
 * End-of-day cash and collections reconciliation record for a store.
 * Created once per store per calendar day, typically during store closing.
 * Provides the single source of truth for daily cash flow and variance tracking.
 */
export interface DailyBookkeeping {
  /** UUID primary key. */
  id: string;

  /** Store this record belongs to. */
  storeId: string;

  /** Calendar date (YYYY-MM-DD). */
  date: string;

  /**
   * Physical cash in the drawer at the start of the trading day.
   * Equals the previous day's closing physical cash or a fixed float.
   */
  openingCashAmt: number;

  /**
   * Total confirmed POS sale value for the day
   * (sum of SaleTransaction.totalAmt where status = Confirmed).
   */
  totalSalesAmt: number;

  /**
   * Total value of sale returns processed during the day.
   * Subtracted from totalSalesAmt for net sales.
   */
  totalReturnsAmt: number;

  /**
   * Net total collected in cash during the day
   * (cash sales only — excludes credit and BNPL).
   */
  cashCollectionsAmt: number;

  /**
   * Total UPI payments received (settled same day by payment gateway).
   */
  upiCollectionsAmt: number;

  /**
   * Total card (POS machine) payments received.
   */
  cardCollectionsAmt: number;

  /**
   * Total sales billed on credit terms (not yet collected).
   */
  creditSalesAmt: number;

  /**
   * Total sales under Buy-Now-Pay-Later (BNPL) financing.
   */
  bnplSalesAmt: number;

  /**
   * Total of all collection streams.
   * cashCollectionsAmt + upiCollectionsAmt + cardCollectionsAmt.
   */
  totalCollectionsAmt: number;

  /**
   * Cash spent on petty expenses during the day
   * (store supplies, courier, etc.).
   */
  totalExpensesAmt: number;

  /**
   * Expected closing cash balance (computed):
   * openingCashAmt + cashCollectionsAmt − totalExpensesAmt.
   */
  closingCashAmt: number;

  /**
   * Actual physical cash counted at day-end.
   * Entered by the StoreIncharge during EOD reconciliation.
   */
  physicalCashAmt?: number;

  /**
   * Variance between physical and computed:
   * physicalCashAmt − closingCashAmt.
   * Negative = shortage; positive = excess.
   */
  cashVarianceAmt?: number;

  /** Total number of SaleTransactions on this day. */
  transactionCount: number;

  /** StoreIncharge or Finance user who performed the reconciliation. */
  reconciledByUserId?: string;

  /** ISO 8601 timestamp of reconciliation. */
  reconciledAt?: string;

  status: BookkeepingStatus;

  remarks?: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
