/**
 * crm.ts
 * Customer relationship management types: farmer outreach visits,
 * discount coupons, and coupon campaigns.
 */

// ---------------------------------------------------------------------------
// OutreachVisit
// ---------------------------------------------------------------------------

/**
 * Classification of a field visit based on its primary purpose.
 */
export type VisitType =
  | 'FarmerVisit'
  | 'DemoDay'
  | 'CropAdvisory'
  | 'ComplaintResolution'
  | 'FarmerMeeting'
  | 'Other';

/**
 * High-level result of an outreach interaction.
 */
export type VisitOutcome =
  | 'SaleCompleted'
  | 'FollowUpScheduled'
  | 'Neutral'
  | 'NoPotential'
  | 'ComplaintResolved';

/**
 * Crop growth stage at the time of visit — used for advisory context.
 */
export type CropStage =
  | 'LandPreparation'
  | 'Sowing'
  | 'Germination'
  | 'Vegetative'
  | 'Tillering'
  | 'Flowering'
  | 'FruitSet'
  | 'Maturity'
  | 'Harvest'
  | 'PostHarvest';

/**
 * A recorded interaction between a FieldAgent and a farmer,
 * either planned from a FieldJourney or logged ad hoc.
 */
export interface OutreachVisit {
  /** UUID primary key. */
  id: string;

  /** FieldAgent who conducted the visit. */
  agentUserId: string;

  /** Farmer who was visited. */
  farmerId: string;

  /**
   * FieldJourney this visit is part of.
   * Null for unplanned / office-initiated contacts.
   */
  journeyId?: string;

  visitType: VisitType;

  /** ISO 8601 date of the visit. */
  visitDate: string;

  /** ISO 8601 timestamp of check-in at the farmer's location. */
  checkInAt?: string;

  /** ISO 8601 timestamp of departure. */
  checkOutAt?: string;

  /** GPS latitude at check-in time. */
  geoLat?: number;

  /** GPS longitude at check-in time. */
  geoLon?: number;

  /**
   * Approximate crop growth stage at the time of visit.
   * Helps correlate advisory effectiveness with purchase behaviour.
   */
  cropStage?: CropStage;

  /** Free-text crop advisory notes given to the farmer. */
  cropAdvisoryGiven?: string;

  /** Product IDs discussed or demonstrated during the visit. */
  productsDiscussed: string[];

  /** Estimated sale opportunity value in INR, if any. */
  saleOpportunityAmt?: number;

  outcome: VisitOutcome;

  /** ISO 8601 date for the scheduled follow-up, if any. */
  followUpDate?: string;

  /** General field notes. */
  notes?: string;

  /** URLs to field photos taken during the visit. */
  photoUrls?: string[];

  /** ISO 8601 timestamp. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Coupon
// ---------------------------------------------------------------------------

/**
 * Whether the discount is a fixed rupee amount or a percentage of order value.
 */
export type DiscountType = 'Flat' | 'Percentage';

/**
 * An individual discount coupon that can be applied at POS or B2B checkout.
 * Coupons may be part of a CouponCampaign or issued as standalone.
 */
export interface Coupon {
  /** UUID primary key. */
  id: string;

  /**
   * Optional parent campaign.
   * Null for standalone coupons issued directly.
   */
  campaignId?: string;

  /**
   * Alphanumeric redemption code entered by the cashier or farmer.
   * Must be unique across active coupons. Convention: all-uppercase, no spaces.
   */
  code: string;

  /** Short description shown in the UI, e.g. "Kharif 2024 – Fertiliser Offer". */
  description?: string;

  discountType: DiscountType;

  /**
   * Discount value.
   * INR amount if discountType = `Flat`; percentage points if `Percentage`.
   */
  discountValue: number;

  /** Minimum order value (INR) required to apply this coupon. */
  minOrderAmt: number;

  /**
   * Maximum discount in INR for Percentage coupons.
   * Null = no cap.
   */
  maxDiscountAmt?: number;

  /**
   * Product IDs this coupon is valid for.
   * Empty array = all products eligible.
   */
  applicableProductIds: string[];

  /**
   * Product category names this coupon is valid for.
   * Empty array = all categories eligible.
   */
  applicableCategoryNames: string[];

  /** ISO 8601 date from which this coupon can be redeemed. */
  validFrom: string;

  /** ISO 8601 date after which this coupon is no longer valid. */
  validUntil: string;

  /** Total number of times this coupon may be redeemed across all farmers. */
  usageLimit: number;

  /** Maximum redemptions allowed per individual farmer. */
  perFarmerLimit: number;

  /** Current total redemption count. Incremented on each successful use. */
  usedCount: number;

  isActive: boolean;

  /** User who created this coupon. */
  createdByUserId: string;

  /** ISO 8601 timestamp. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// CouponCampaign
// ---------------------------------------------------------------------------

/**
 * The targeting dimension used to decide which farmers receive a campaign.
 */
export type CampaignTargetType =
  | 'All'
  | 'ByLoyaltyTier'
  | 'ByCropType'
  | 'ByDistrict'
  | 'ByProduct'
  | 'ByStore';

/**
 * A marketing campaign that groups one or more coupons under a common
 * budget, schedule, and audience segment.
 */
export interface CouponCampaign {
  /** UUID primary key. */
  id: string;

  /** Campaign display name, e.g. "Kharif 2024 Fertiliser Push". */
  name: string;

  description?: string;

  /** All coupons belonging to this campaign. */
  couponIds: string[];

  /** How the target audience is segmented. */
  targetType: CampaignTargetType;

  /**
   * Loyalty tier names to target (e.g. ["Gold", "Platinum"]).
   * Populated when targetType = `ByLoyaltyTier`.
   */
  targetTiers?: string[];

  /**
   * Crop types to target (e.g. ["Cotton", "Soybean"]).
   * Populated when targetType = `ByCropType`.
   */
  targetCropTypes?: string[];

  /**
   * District names to include in the campaign.
   * Populated when targetType = `ByDistrict`.
   */
  targetDistricts?: string[];

  /**
   * Store IDs to scope the campaign to.
   * Populated when targetType = `ByStore`.
   */
  targetStoreIds?: string[];

  /** ISO 8601 date the campaign becomes active. */
  startDate: string;

  /** ISO 8601 date the campaign ends. */
  endDate: string;

  /** Total marketing budget allocated for this campaign (INR). */
  budgetAmt?: number;

  /** Running total of discount value dispensed so far (INR). */
  actualSpendAmt: number;

  /** User who created this campaign. */
  createdByUserId: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
