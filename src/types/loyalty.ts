/**
 * loyalty.ts
 * Farmer loyalty programme — wallets, tiers, and event ledger.
 */

// ---------------------------------------------------------------------------
// Tier
// ---------------------------------------------------------------------------

/**
 * Loyalty tier earned by a farmer based on lifetime purchase points.
 * Tier thresholds (example — configurable by Admin):
 *  - Green    : 0 – 999 lifetime points
 *  - Silver   : 1 000 – 4 999
 *  - Gold     : 5 000 – 14 999
 *  - Platinum : 15 000+
 */
export type LoyaltyTier = 'Green' | 'Silver' | 'Gold' | 'Platinum';

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

/**
 * Each farmer owns exactly one loyalty wallet.
 * Current balance and tier are maintained here; full history is in LoyaltyEvent.
 */
export interface LoyaltyWallet {
  /** UUID primary key. */
  id: string;

  /** The farmer who owns this wallet. */
  farmerId: string;

  /**
   * Spendable points balance.
   * Decremented on redemption; may differ from lifetimePoints due to expirations.
   */
  currentPoints: number;

  /**
   * Cumulative points ever earned (never decremented).
   * Used to determine the farmer's tier and track programme engagement.
   */
  lifetimePoints: number;

  /** Current tier derived from lifetimePoints. */
  tier: LoyaltyTier;

  /**
   * Incremental points needed to move to the next tier.
   * Zero for Platinum (highest tier).
   */
  pointsToNextTier: number;

  /**
   * ISO 8601 date of the nearest upcoming points expiry batch.
   * Null if no points are scheduled to expire.
   */
  nearestExpiryDate?: string;

  /**
   * Points that will expire on nearestExpiryDate.
   */
  nearestExpiryPoints?: number;

  /** ISO 8601 timestamp of the most recent transaction that touched this wallet. */
  lastActivityAt: string;

  /** ISO 8601 timestamp of the last update to this record. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// LoyaltyEvent
// ---------------------------------------------------------------------------

/**
 * The type of movement recorded in the loyalty ledger.
 *
 * - `Earn`    – Points credited from a POS or B2B purchase.
 * - `Redeem`  – Points burned to offset an invoice amount.
 * - `Expire`  – Points cancelled because they were not redeemed before expiry.
 * - `Bonus`   – Discretionary points granted (campaign, referral, correction).
 * - `Reverse` – Clawback of previously earned points on a sale return.
 */
export type LoyaltyEventType = 'Earn' | 'Redeem' | 'Expire' | 'Bonus' | 'Reverse';

/**
 * The source entity that triggered a loyalty event.
 */
export type LoyaltyRefType = 'SaleTransaction' | 'B2BOrder' | 'Manual' | 'System';

/**
 * An immutable ledger entry recording a single change to a farmer's loyalty wallet.
 * The wallet's currentPoints is always the algebraic sum of all events.
 */
export interface LoyaltyEvent {
  /** UUID primary key. */
  id: string;

  /** Wallet this event belongs to. */
  walletId: string;

  /** Farmer (denormalised for query convenience). */
  farmerId: string;

  type: LoyaltyEventType;

  /**
   * Absolute point value of this event.
   * Always positive; direction is inferred from `type`
   * (Earn/Bonus = credit, Redeem/Expire/Reverse = debit).
   */
  points: number;

  /**
   * Wallet currentPoints after applying this event.
   * Stored for audit and running-balance display.
   */
  balanceAfter: number;

  /**
   * Monetary equivalent of redeemed points (INR).
   * Populated only for `Redeem` events.
   */
  redemptionAmt?: number;

  /** What kind of entity caused this event. */
  refType?: LoyaltyRefType;

  /** ID of the SaleTransaction, B2BOrder, or campaign that triggered this event. */
  refId?: string;

  /**
   * ISO 8601 date when the earned points will expire if unused.
   * Populated only for `Earn` and `Bonus` events.
   */
  expiresAt?: string;

  /** User who initiated this event (cashier, finance user, or system for expiry jobs). */
  createdByUserId: string;

  /** ISO 8601 timestamp. */
  createdAt: string;

  /** Human-readable note for audit trail display. */
  remarks?: string;
}
