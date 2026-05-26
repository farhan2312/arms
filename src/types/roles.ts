/**
 * roles.ts
 * User identity and access-control types.
 * Note: TypeScript `enum` is not used because the project sets `erasableSyntaxOnly: true`.
 * Use `UserRole` as a discriminated string literal type instead.
 */

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

/**
 * Every role a user can hold in the ARMS platform.
 *
 * - `SuperAdmin`          – Anthropic / company-level platform owner.
 * - `Admin`               – Organisation-level admin; full access to all stores.
 * - `StoreIncharge`       – Manages a single retail store (POS, stock, farmers).
 * - `Cashier`             – POS-only operator within a store.
 * - `BDM`                 – Business Development Manager; owns a territory and field team.
 * - `FieldAgent`          – Executes farmer outreach and field journeys.
 * - `B2BSalesExecutive`   – Creates and manages B2B orders for retailer accounts.
 * - `OperationsHead`      – Regional operations oversight; approves PRs, DTC, GRNs.
 * - `WarehouseManager`    – Manages a warehouse; handles GRNs and DTCs.
 * - `Finance`             – Bookkeeping, credit notes, loyalty redemption approvals.
 */
export type UserRole =
  | 'SuperAdmin'
  | 'Admin'
  | 'StoreIncharge'
  | 'Cashier'
  | 'BDM'
  | 'FieldAgent'
  | 'B2BSalesExecutive'
  | 'OperationsHead'
  | 'WarehouseManager'
  | 'Finance';

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

/**
 * A system user. Authentication is handled externally (OTP / SSO);
 * this record holds profile and authorisation data only.
 */
export interface User {
  /** UUID primary key. */
  id: string;

  /** Full display name. */
  name: string;

  /** Primary login identifier; must be a verified Indian mobile number. */
  mobile: string;

  /** Optional work email address. */
  email?: string;

  /** Single role per user; determines sidebar visibility and API permissions. */
  role: UserRole;

  /**
   * Store IDs this user may access.
   * Empty array = no store restriction (used by Admin / SuperAdmin / OperationsHead).
   */
  assignedStoreIds: string[];

  /**
   * Retailer account IDs this user is responsible for.
   * Populated for BDM and B2BSalesExecutive roles.
   */
  assignedRetailerIds: string[];

  /** Employee code for field-force and HR integration. */
  employeeCode?: string;

  /** Whether the user can log in. Set to false instead of deleting. */
  isActive: boolean;

  /** ISO 8601 timestamp of account creation. */
  createdAt: string;

  /** ISO 8601 timestamp of last profile update. */
  updatedAt: string;
}
