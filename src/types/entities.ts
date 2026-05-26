/**
 * entities.ts
 * Core domain entities: Store, Warehouse, Product, Batch, Farmer,
 * SaleTransaction, SaleLine — the backbone of the ARMS data model.
 */

// ---------------------------------------------------------------------------
// Shared value objects
// ---------------------------------------------------------------------------

/**
 * Reusable postal address, embedded inside Store, Warehouse, Farmer, etc.
 * All sub-fields are plain strings; no geocoding here.
 */
export interface Address {
  line1: string;
  line2?: string;
  /** For rural addresses — village / mohalla name. */
  village?: string;
  taluka?: string;
  district: string;
  state: string;
  pincode: string;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * A physical agri-input retail outlet.
 * Each store is linked to exactly one servicing warehouse.
 */
export interface Store {
  /** UUID primary key. */
  id: string;

  /**
   * Human-readable store code, unique across the network.
   * Convention: `{DISTRICT_CODE}-{SEQ}`, e.g. `AKL-001`.
   */
  code: string;

  /** Full store name including location tag, e.g. "Bharat Agri Store – Akola". */
  name: string;

  /** Zone or region code for grouping stores in reports. */
  zoneCode: string;

  /** Physical address of the store. */
  address: Address;

  /** GST Identification Number (15-char alphanumeric). */
  gstIn: string;

  phone: string;
  email?: string;

  /** ID of the warehouse that supplies this store. */
  warehouseId: string;

  /** BDM responsible for farmer development in this store's territory. */
  bdmUserId: string;

  /** User ID of the StoreIncharge assigned to this store. */
  managerUserId: string;

  isActive: boolean;

  /** ISO 8601 timestamp. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Warehouse
// ---------------------------------------------------------------------------

/**
 * A central or regional warehouse from which stores are replenished.
 */
export interface Warehouse {
  /** UUID primary key. */
  id: string;

  /** Unique warehouse code, e.g. `NGP-WH`. */
  code: string;

  name: string;

  address: Address;

  /** User ID of the WarehouseManager in charge. */
  managerUserId: string;

  /** Storage capacity in metric tonnes. */
  capacityMT: number;

  isActive: boolean;

  /** ISO 8601 timestamp. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

/**
 * High-level product category for UI filtering and tax determination.
 */
export type ProductCategory =
  | 'Fertiliser'
  | 'Pesticide'
  | 'Seed'
  | 'Micronutrient'
  | 'Equipment'
  | 'AgrochemicalAdjuvant'
  | 'AnimalHealth'
  | 'Other';

/**
 * Standard units of measure used across all agri-input SKUs.
 */
export type ProductUnit =
  | 'Kg'
  | 'G'
  | 'L'
  | 'ML'
  | 'Packet'
  | 'Bag'
  | 'Piece'
  | 'Box'
  | 'Bottle'
  | 'Can'
  | 'Set';

/**
 * GST tax slab percentages applicable to agri inputs in India.
 */
export type TaxSlabPct = 0 | 5 | 12 | 18 | 28;

/**
 * A product / SKU in the catalogue.
 * Pricing (MRP) lives here; batch-level purchase price lives in `Batch`.
 */
export interface Product {
  /** UUID primary key. */
  id: string;

  /**
   * Stock Keeping Unit — unique identifier used on invoices and inventory.
   * Convention: `{CATEGORY_CODE}-{BRAND_CODE}-{SEQ}`, e.g. `FRT-DAP-50`.
   */
  sku: string;

  /** Marketing name as printed on packaging. */
  name: string;

  brand: string;
  manufacturer: string;

  category: ProductCategory;

  /** Optional finer grouping within category, e.g. "Herbicide" under Pesticide. */
  subCategory?: string;

  /**
   * Harmonised System of Nomenclature code for GST filing.
   * 6–8 digit string, e.g. "3105".
   */
  hsnCode: string;

  /** Primary unit of sale. */
  unit: ProductUnit;

  /** Human-readable pack description, e.g. "50 kg", "1 L", "450 g". */
  packSize: string;

  /** Maximum Retail Price in INR (inclusive of all taxes). */
  mrp: number;

  /** Applicable GST slab percentage. */
  taxSlabPct: TaxSlabPct;

  /**
   * True for CIB-regulated or state-regulated pesticides that require
   * licence verification before sale.
   */
  isRegulated: boolean;

  /** CIB (Central Insecticides Board) registration number, if regulated. */
  regulatoryNo?: string;

  /** Minimum stock quantity before a reorder alert is raised. */
  reorderLevel: number;

  /** Standard retail (B2C) selling price per unit. Must be ≤ mrp. */
  b2cPrice: number;

  /** Wholesale / dealer (B2B) price per unit for bulk channel orders. */
  b2bPrice: number;

  /** Whether POS purchases of this product accrue loyalty points for the farmer. */
  loyaltyEligible: boolean;

  /**
   * True for government-subsidised fertilisers (Urea, DAP, SSP, MOP).
   * Affects billing compliance — MRP is government-set and cannot be exceeded.
   */
  isSubsidised: boolean;

  isActive: boolean;

  /** ISO 8601 timestamp. */
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Batch
// ---------------------------------------------------------------------------

/**
 * A traceable lot of a product received from a supplier via a GRN.
 * Stock is always tracked at batch level to enable expiry management and FIFO.
 */
export interface Batch {
  /** UUID primary key. */
  id: string;

  /** The SKU this batch belongs to. */
  productId: string;

  /** GRN that created this batch record. */
  grnId: string;

  /** Manufacturer's printed batch / lot number. */
  batchNo: string;

  /** Manufacturing date (YYYY-MM-DD). */
  mfgDate: string;

  /** Expiry / best-before date (YYYY-MM-DD). */
  expiryDate: string;

  /** Landed cost per unit in INR, excluding tax (for margin reporting). */
  purchasePricePerUnit: number;

  /** Current available quantity in the unit defined on the Product. */
  currentQty: number;

  /**
   * Quantity reserved for confirmed but un-dispatched B2B order lines.
   * Physically still in stock but not available for fresh orders.
   */
  reservedQty: number;

  /**
   * Location where this batch is stored.
   * Exactly one of warehouseId / storeId must be set.
   */
  warehouseId?: string;
  storeId?: string;

  /** ISO 8601 timestamp of when the batch was created in the system. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Farmer
// ---------------------------------------------------------------------------

/**
 * KYC document verification status.
 */
export type KycStatus = 'Pending' | 'Verified' | 'Rejected' | 'Expired';

/**
 * Accepted government-issued identity documents for farmer KYC.
 */
export type KycDocumentType =
  | 'Aadhaar'
  | 'VoterId'
  | 'PAN'
  | 'DrivingLicence'
  | 'Passport';

/**
 * A registered farmer — the primary end-customer in the ARMS ecosystem.
 * Farmers earn loyalty points on every purchase and are linked to a wallet.
 */
export interface Farmer {
  /** UUID primary key. */
  id: string;

  /** Full name as per KYC document. */
  name: string;

  /** Primary mobile number (10-digit Indian). */
  mobile: string;

  /** Last 4 digits of Aadhaar for partial-display compliance. */
  aadhaarLast4?: string;

  kycStatus: KycStatus;
  kycDocumentType?: KycDocumentType;

  /** ISO 8601 timestamp when KYC was last verified. */
  kycVerifiedAt?: string;

  /** Permanent address in the farmer's village. */
  address: Address;

  /** Total land holding in acres. */
  landAcres: number;

  /** Crops currently grown, e.g. ["Cotton", "Soybean"]. */
  cropTypes: string[];

  /** Soil type, e.g. "Black Cotton", "Red Laterite". */
  soilType?: string;

  /** Primary water source, e.g. "Canal", "Borewell", "Rainfed". */
  irrigationSource?: string;

  /** ID of the LoyaltyWallet linked to this farmer. */
  loyaltyWalletId: string;

  /** ISO 8601 timestamp when the farmer was first registered. */
  registeredAt: string;

  /** Store where the farmer was onboarded. */
  registeredByStoreId: string;

  /** User (StoreIncharge / FieldAgent) who registered the farmer. */
  registeredByUserId: string;

  isActive: boolean;
}

// ---------------------------------------------------------------------------
// SaleTransaction (POS Invoice)
// ---------------------------------------------------------------------------

/**
 * Payment modes accepted at the POS.
 */
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Credit' | 'BNPL';

/**
 * Lifecycle states of a retail sale invoice.
 */
export type SaleStatus = 'Draft' | 'Confirmed' | 'Returned' | 'Cancelled';

/**
 * A single line item within a SaleTransaction.
 * Captures exact product, batch, pricing and tax breakdown for each SKU sold.
 */
export interface SaleLine {
  /** UUID primary key. */
  id: string;

  /** Parent transaction. */
  transactionId: string;

  productId: string;

  /**
   * Specific batch from which this item was picked.
   * Drives inventory deduction and expiry traceability.
   */
  batchId: string;

  /** Denormalised for invoice rendering without joins. */
  sku: string;
  productName: string;

  qty: number;
  unit: ProductUnit;

  /** MRP as on the product at time of sale. */
  mrp: number;

  /** Actual selling price per unit after product-level discount. */
  unitSellingPrice: number;

  /** Rupee discount applied at the line level (non-coupon). */
  lineDiscountAmt: number;

  /** Rupee share of any coupon discount apportioned to this line. */
  couponDiscountAmt: number;

  /** Amount on which GST is computed (after all discounts). */
  taxableAmt: number;

  /** CGST component (intra-state sales). */
  cgstAmt: number;

  /** SGST component (intra-state sales). */
  sgstAmt: number;

  /** IGST component (inter-state sales — typically 0 at POS). */
  igstAmt: number;

  /** taxableAmt + cgstAmt + sgstAmt + igstAmt, net of discounts. */
  lineTotal: number;
}

/**
 * A completed POS sale event — one invoice per farmer visit.
 * Triggers batch deduction, loyalty point accrual, and bookkeeping entries.
 */
export interface SaleTransaction {
  /** UUID primary key. */
  id: string;

  /**
   * Human-readable invoice number.
   * Convention: `INV-{STORE_CODE}-{YYYYMMDD}-{SEQ}`, e.g. `INV-AKL-20240501-001`.
   */
  invoiceNo: string;

  /** Date of sale (YYYY-MM-DD). */
  invoiceDate: string;

  storeId: string;

  /** Buying farmer. */
  farmerId: string;

  /** Staff member who processed the bill. */
  cashierUserId: string;

  /** Coupon applied to this transaction, if any. */
  couponId?: string;

  lines: SaleLine[];

  /** Sum of (unitSellingPrice × qty) across all lines, before any discount. */
  subtotalAmt: number;

  /** Total manual / product-level discount across all lines. */
  lineDiscountAmt: number;

  /** Discount attributed to the applied coupon. */
  couponDiscountAmt: number;

  /** Total GST (CGST + SGST + IGST) across all lines. */
  totalTaxAmt: number;

  /** Positive or negative rounding adjustment to reach a whole rupee. */
  roundOff: number;

  /** Final amount payable by the farmer. */
  totalAmt: number;

  paymentMode: PaymentMode;

  /** UPI transaction ID, card authorisation code, or credit reference. */
  paymentRef?: string;

  /** Loyalty points credited to the farmer's wallet on this transaction. */
  loyaltyPointsEarned: number;

  /** Loyalty points burned to get a monetary discount on this transaction. */
  loyaltyPointsRedeemed: number;

  /** Monetary value of redeemed loyalty points (in INR). */
  loyaltyRedemptionAmt: number;

  status: SaleStatus;

  /** Set if this transaction is a return referencing an original invoice. */
  returnedTransactionId?: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
