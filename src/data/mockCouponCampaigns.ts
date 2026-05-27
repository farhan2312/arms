// mockCouponCampaigns — seed data for coupon campaigns and issued coupons
// Farmer tiers: fmr-001 Platinum, fmr-002 Gold, fmr-003 Silver, fmr-004 Green,
//               fmr-005 Silver, fmr-006 Gold, fmr-007 Silver, fmr-008 Green,
//               fmr-009 Platinum, fmr-010 Gold, fmr-012 Green, fmr-014 Silver

import type { LoyaltyTier } from '../types/loyalty';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DiscountType = 'Flat' | 'Percentage' | 'FreeProduct';

export interface CouponCampaign {
  id: string;
  name: string;
  description: string;
  startDate: string;              // YYYY-MM-DD
  endDate: string;                // YYYY-MM-DD
  discountType: DiscountType;
  discountValue: number;          // Rs. for Flat; % for Percentage; 0 for FreeProduct
  maxDiscountAmt?: number;        // INR cap for Percentage type
  minPurchaseValue: number;       // minimum basket size
  applicableProductIds: string[]; // [] = all products
  applicableStoreIds: string[];   // [] = all stores
  autoEnrollGoldPlatinum: boolean;
  createdAt: string;
}

export interface IssuedCoupon {
  id: string;
  code: string;                   // format XXXX-YYYY-LAST4MOBILE
  campaignId: string;
  campaignName: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  farmerTier: LoyaltyTier;
  issuedAt: string;               // ISO 8601
  redeemedAt?: string;            // set when redeemed
  storeId?: string;
  storeName?: string;
  invoiceNo?: string;
  invoiceValue?: number;
  discountApplied?: number;
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export const mockCampaigns: CouponCampaign[] = [
  {
    id: 'camp-001',
    name: 'Kharif 2026 Fertiliser Push',
    description: 'Flat discount on key fertilisers to drive kharif season purchases.',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    discountType: 'Flat',
    discountValue: 200,
    minPurchaseValue: 1500,
    applicableProductIds: ['prd-006', 'prd-007', 'prd-008', 'prd-009', 'prd-010'],
    applicableStoreIds: [],
    autoEnrollGoldPlatinum: true,
    createdAt: '2026-04-25T09:00:00Z',
  },
  {
    id: 'camp-002',
    name: 'New Farmer Welcome Offer',
    description: 'Welcome discount for farmers registered in the last 90 days.',
    startDate: '2026-04-01',
    endDate: '2026-07-31',
    discountType: 'Flat',
    discountValue: 300,
    minPurchaseValue: 1000,
    applicableProductIds: [],
    applicableStoreIds: [],
    autoEnrollGoldPlatinum: false,
    createdAt: '2026-03-28T10:00:00Z',
  },
  {
    id: 'camp-003',
    name: 'Gold & Platinum Tier Exclusive',
    description: '10% off for loyal Gold and Platinum tier farmers — any product.',
    startDate: '2026-04-15',
    endDate: '2026-05-31',
    discountType: 'Percentage',
    discountValue: 10,
    maxDiscountAmt: 500,
    minPurchaseValue: 2000,
    applicableProductIds: [],
    applicableStoreIds: [],
    autoEnrollGoldPlatinum: true,
    createdAt: '2026-04-10T11:00:00Z',
  },
  {
    id: 'camp-004',
    name: 'Rabi Season 2025 Seeds Offer',
    description: 'Flat ₹150 off on seed purchases during rabi planting window.',
    startDate: '2025-10-01',
    endDate: '2026-02-28',
    discountType: 'Flat',
    discountValue: 150,
    minPurchaseValue: 800,
    applicableProductIds: ['prd-001', 'prd-002', 'prd-003', 'prd-004', 'prd-005'],
    applicableStoreIds: [],
    autoEnrollGoldPlatinum: false,
    createdAt: '2025-09-25T08:00:00Z',
  },
  {
    id: 'camp-005',
    name: 'Monsoon Special 2026',
    description: '15% off on all products to coincide with kharif sowing — limited period.',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    discountType: 'Percentage',
    discountValue: 15,
    maxDiscountAmt: 400,
    minPurchaseValue: 2000,
    applicableProductIds: [],
    applicableStoreIds: ['str-akl-001', 'str-amr-002', 'str-ngp-003'],
    autoEnrollGoldPlatinum: false,
    createdAt: '2026-05-20T14:00:00Z',
  },
];

// ── Issued Coupons ─────────────────────────────────────────────────────────────

export const mockIssuedCoupons: IssuedCoupon[] = [
  // ── Camp-001: Kharif Fertiliser Push ────────────────────────────────────────
  {
    id: 'icpn-001',
    code: 'KHAR-7342-1001',
    campaignId: 'camp-001',
    campaignName: 'Kharif 2026 Fertiliser Push',
    farmerId: 'fmr-001',
    farmerName: 'Suresh Vitthal Patil',
    farmerMobile: '+91 94220 11001',
    farmerTier: 'Platinum',
    issuedAt: '2026-05-02T08:00:00Z',
    redeemedAt: '2026-05-15T11:30:00Z',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    invoiceNo: 'INV-AKL-20260515-022',
    invoiceValue: 2340,
    discountApplied: 200,
  },
  {
    id: 'icpn-002',
    code: 'KHAR-8821-1002',
    campaignId: 'camp-001',
    campaignName: 'Kharif 2026 Fertiliser Push',
    farmerId: 'fmr-002',
    farmerName: 'Ramesh Narayan Yadav',
    farmerMobile: '+91 94220 11002',
    farmerTier: 'Gold',
    issuedAt: '2026-05-02T08:00:00Z',
  },
  {
    id: 'icpn-003',
    code: 'KHAR-5591-1006',
    campaignId: 'camp-001',
    campaignName: 'Kharif 2026 Fertiliser Push',
    farmerId: 'fmr-006',
    farmerName: 'Dilip Mahadeo Gawande',
    farmerMobile: '+91 94220 11006',
    farmerTier: 'Gold',
    issuedAt: '2026-05-05T09:00:00Z',
    redeemedAt: '2026-05-20T14:00:00Z',
    storeId: 'str-amr-002',
    storeName: 'Bharat Agri Store – Amravati',
    invoiceNo: 'INV-AMR-20260520-011',
    invoiceValue: 3800,
    discountApplied: 200,
  },
  {
    id: 'icpn-004',
    code: 'KHAR-2234-1009',
    campaignId: 'camp-001',
    campaignName: 'Kharif 2026 Fertiliser Push',
    farmerId: 'fmr-009',
    farmerName: 'Moreshwar Vasant Thakare',
    farmerMobile: '+91 94220 11009',
    farmerTier: 'Platinum',
    issuedAt: '2026-05-05T09:00:00Z',
  },

  // ── Camp-002: New Farmer Welcome ─────────────────────────────────────────────
  {
    id: 'icpn-005',
    code: 'WLCM-1123-1004',
    campaignId: 'camp-002',
    campaignName: 'New Farmer Welcome Offer',
    farmerId: 'fmr-004',
    farmerName: 'Savita Arun Wankhede',
    farmerMobile: '+91 94220 11004',
    farmerTier: 'Green',
    issuedAt: '2026-04-20T10:00:00Z',
    redeemedAt: '2026-05-03T10:30:00Z',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    invoiceNo: 'INV-AKL-20260503-009',
    invoiceValue: 1820,
    discountApplied: 300,
  },
  {
    id: 'icpn-006',
    code: 'WLCM-9987-1007',
    campaignId: 'camp-002',
    campaignName: 'New Farmer Welcome Offer',
    farmerId: 'fmr-007',
    farmerName: 'Annapurna Ramrao Bhagat',
    farmerMobile: '+91 94220 11007',
    farmerTier: 'Silver',
    issuedAt: '2026-04-20T10:00:00Z',
  },
  {
    id: 'icpn-007',
    code: 'WLCM-3312-1012',
    campaignId: 'camp-002',
    campaignName: 'New Farmer Welcome Offer',
    farmerId: 'fmr-012',
    farmerName: 'Gopal Janrao Dorle',
    farmerMobile: '+91 94220 11012',
    farmerTier: 'Green',
    issuedAt: '2026-04-22T11:00:00Z',
  },
  {
    id: 'icpn-008',
    code: 'WLCM-7745-1014',
    campaignId: 'camp-002',
    campaignName: 'New Farmer Welcome Offer',
    farmerId: 'fmr-014',
    farmerName: 'Venkateshwar Rao Pillai',
    farmerMobile: '+91 94220 11014',
    farmerTier: 'Silver',
    issuedAt: '2026-04-22T11:00:00Z',
  },

  // ── Camp-003: Gold & Platinum Exclusive ──────────────────────────────────────
  {
    id: 'icpn-009',
    code: 'GOLD-4456-1001',
    campaignId: 'camp-003',
    campaignName: 'Gold & Platinum Tier Exclusive',
    farmerId: 'fmr-001',
    farmerName: 'Suresh Vitthal Patil',
    farmerMobile: '+91 94220 11001',
    farmerTier: 'Platinum',
    issuedAt: '2026-04-20T09:00:00Z',
    redeemedAt: '2026-05-10T12:45:00Z',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    invoiceNo: 'INV-AKL-20260510-016',
    invoiceValue: 4200,
    discountApplied: 420,   // 10% of 4200
  },
  {
    id: 'icpn-010',
    code: 'GOLD-8812-1010',
    campaignId: 'camp-003',
    campaignName: 'Gold & Platinum Tier Exclusive',
    farmerId: 'fmr-010',
    farmerName: 'Lata Suresh Nandankar',
    farmerMobile: '+91 94220 11010',
    farmerTier: 'Gold',
    issuedAt: '2026-04-20T09:00:00Z',
  },

  // ── Camp-004: Rabi Season 2025 (Expired) ─────────────────────────────────────
  {
    id: 'icpn-011',
    code: 'RABI-5534-1005',
    campaignId: 'camp-004',
    campaignName: 'Rabi Season 2025 Seeds Offer',
    farmerId: 'fmr-005',
    farmerName: 'Vitthal Shankar More',
    farmerMobile: '+91 94220 11005',
    farmerTier: 'Silver',
    issuedAt: '2025-10-20T08:00:00Z',
    redeemedAt: '2025-11-10T10:00:00Z',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    invoiceNo: 'INV-AKL-20251110-031',
    invoiceValue: 1620,
    discountApplied: 150,
  },
  {
    id: 'icpn-012',
    code: 'RABI-9921-1008',
    campaignId: 'camp-004',
    campaignName: 'Rabi Season 2025 Seeds Offer',
    farmerId: 'fmr-008',
    farmerName: 'Prakash Tulshiram Ingole',
    farmerMobile: '+91 94220 11008',
    farmerTier: 'Green',
    issuedAt: '2025-10-20T08:00:00Z',
    redeemedAt: '2025-12-05T15:20:00Z',
    storeId: 'str-ngp-003',
    storeName: 'Bharat Agri Store – Nagpur',
    invoiceNo: 'INV-NGP-20251205-044',
    invoiceValue: 2180,
    discountApplied: 150,
  },
];
