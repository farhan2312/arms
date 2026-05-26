/**
 * fieldforce.ts
 * Field operations types: daily journey plans, meeting logs, and TA/DA claims.
 */

// ---------------------------------------------------------------------------
// FieldJourney
// ---------------------------------------------------------------------------

/**
 * Status of a field agent's daily journey.
 *
 * Planned → InProgress → Completed | Cancelled
 */
export type JourneyStatus = 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';

/**
 * A FieldAgent's planned and executed route for a single working day.
 * Acts as the container for all MeetingLogs on that date and the basis
 * for TA/DA claim verification.
 */
export interface FieldJourney {
  /** UUID primary key. */
  id: string;

  /** Agent who owns this journey. */
  agentUserId: string;

  /** Journey date (YYYY-MM-DD). */
  journeyDate: string;

  status: JourneyStatus;

  /** Number of farmer / retailer visits planned before departure. */
  plannedVisitCount: number;

  /** Number of visits actually logged during the day. */
  actualVisitCount: number;

  /** Odometer reading when the agent left their start point (km). */
  startOdometerKm?: number;

  /** Odometer reading when the agent returned at day-end (km). */
  endOdometerKm?: number;

  /**
   * Computed distance: endOdometerKm − startOdometerKm.
   * Stored explicitly to prevent tampering after submission.
   */
  distanceTravelledKm?: number;

  /** Human-readable label for the starting location, e.g. "Akola Office". */
  startLocationLabel?: string;

  /** Human-readable label for the ending location. */
  endLocationLabel?: string;

  /** GPS coordinates at journey start. */
  startGeoLat?: number;
  startGeoLon?: number;

  /** General notes for the day. */
  remarks?: string;

  /** ISO 8601 timestamp when the agent submitted the journey for manager review. */
  submittedAt?: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// MeetingLog
// ---------------------------------------------------------------------------

/**
 * Purpose of an individual meeting within a FieldJourney.
 */
export type MeetingType =
  | 'FarmerVisit'
  | 'RetailerVisit'
  | 'DemoDay'
  | 'CropAdvisory'
  | 'ComplaintResolution'
  | 'OfficeCall'
  | 'Other';

/**
 * Outcome of a single meeting.
 */
export type MeetingOutcome =
  | 'SaleClosed'
  | 'OrderBooked'
  | 'FollowUpScheduled'
  | 'DemoCompleted'
  | 'NoPotential'
  | 'NeedsMoreInfo';

/**
 * A detailed record of a single meeting conducted during a FieldJourney.
 * The meeting subject may be a Farmer or a RetailerAccount.
 */
export interface MeetingLog {
  /** UUID primary key. */
  id: string;

  /** Parent journey this meeting is part of. */
  journeyId: string;

  /** Agent who conducted the meeting. */
  agentUserId: string;

  /**
   * Whether the meeting was with a farmer or a B2B retailer.
   * Determines how entityId should be resolved.
   */
  entityType: 'Farmer' | 'Retailer';

  /**
   * ID of the Farmer or RetailerAccount record.
   */
  entityId: string;

  /** Denormalised name for display without additional lookups. */
  entityName: string;

  meetingType: MeetingType;

  /** ISO 8601 datetime when the meeting started. */
  startedAt: string;

  /** ISO 8601 datetime when the meeting ended. */
  endedAt: string;

  /** GPS latitude at the meeting location. */
  geoLat?: number;

  /** GPS longitude at the meeting location. */
  geoLon?: number;

  /** Human-readable place name, e.g. "Farmer's field, Shirpur village". */
  locationLabel?: string;

  /** Product IDs discussed or demonstrated. */
  productsDiscussed: string[];

  /** Whether product samples were distributed during this meeting. */
  sampleGiven: boolean;

  /** Whether a field demo / trial plot was conducted. */
  demoGiven: boolean;

  /**
   * Value of order booked during this meeting (INR).
   * Zero if no order was placed.
   */
  orderTakenAmt?: number;

  outcome: MeetingOutcome;

  /** ISO 8601 date for the next planned follow-up. */
  nextActionDate?: string;

  /** Short description of the planned follow-up action. */
  nextActionNote?: string;

  /** General meeting notes. */
  notes?: string;

  /** URLs to field photographs taken during the meeting. */
  photoUrls?: string[];

  /** ISO 8601 timestamp. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// TADAclaim — Travel & Daily Allowance
// ---------------------------------------------------------------------------

/**
 * Lifecycle of a TA/DA reimbursement claim.
 *
 * Draft → Submitted → ApprovedByManager → ApprovedByFinance → Paid | Rejected
 */
export type TADStatus =
  | 'Draft'
  | 'Submitted'
  | 'ApprovedByManager'
  | 'ApprovedByFinance'
  | 'Rejected'
  | 'Paid';

/**
 * A monthly travel and daily allowance reimbursement claim filed by a FieldAgent.
 * Covers all journeys within the claim month and requires dual approval
 * (manager, then finance) before payment.
 */
export interface TADAclaim {
  /** UUID primary key. */
  id: string;

  /** Agent filing this claim. */
  agentUserId: string;

  /** Calendar month of travel (1 = January, 12 = December). */
  month: number;

  /** Calendar year of travel. */
  year: number;

  /**
   * Total claimed reimbursement for fuel, local transport, tolls, etc.
   * in INR.
   */
  travelExpenseAmt: number;

  /**
   * Daily subsistence / per-diem allowance (INR).
   * Typically a fixed amount × number of days on field.
   */
  dailyAllowanceAmt: number;

  /** Accommodation / lodging costs in INR. */
  accommodationAmt: number;

  /** Any other reimbursable expenses in INR. */
  otherExpenseAmt: number;

  /**
   * Total amount claimed: sum of all expense categories.
   */
  totalClaimedAmt: number;

  /**
   * Amount sanctioned after manager and finance review.
   * May be less than totalClaimedAmt if deductions were applied.
   */
  approvedAmt?: number;

  /**
   * FieldJourney IDs that this claim covers.
   * Used to cross-verify odometer readings and visit counts.
   */
  journeyIds: string[];

  /** URLs to scanned bills and receipts. */
  receiptUrls?: string[];

  status: TADStatus;

  /** ISO 8601 timestamp when the agent submitted the claim. */
  submittedAt?: string;

  /** BDM / OperationsHead who approved at the first level. */
  approvedByManagerUserId?: string;

  /** Finance user who approved for payment at the second level. */
  approvedByFinanceUserId?: string;

  /** Notes from approver(s) or reasons for rejection. */
  remarks?: string;

  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}
