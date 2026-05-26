// MOCK DATA — swap for API call: GET /api/loyalty/wallets
// Tier thresholds (lifetimePoints): Green 0–999 | Silver 1000–4999 | Gold 5000–14999 | Platinum 15000+
import type { LoyaltyWallet } from '../types/loyalty';

export const mockLoyaltyWallets: LoyaltyWallet[] = [
  // fmr-001 — Platinum
  {
    id: 'wal-001',
    farmerId: 'fmr-001',
    currentPoints: 16840,
    lifetimePoints: 18200,
    tier: 'Platinum',
    pointsToNextTier: 0,
    nearestExpiryDate: '2026-12-31',
    nearestExpiryPoints: 1200,
    lastActivityAt: '2026-05-18T14:30:00Z',
    updatedAt: '2026-05-18T14:30:00Z',
  },
  // fmr-002 — Gold
  {
    id: 'wal-002',
    farmerId: 'fmr-002',
    currentPoints: 7020,
    lifetimePoints: 7200,
    tier: 'Gold',
    pointsToNextTier: 7800,
    nearestExpiryDate: '2026-12-31',
    nearestExpiryPoints: 400,
    lastActivityAt: '2026-05-10T11:00:00Z',
    updatedAt: '2026-05-10T11:00:00Z',
  },
  // fmr-003 — Silver
  {
    id: 'wal-003',
    farmerId: 'fmr-003',
    currentPoints: 2350,
    lifetimePoints: 2400,
    tier: 'Silver',
    pointsToNextTier: 2600,
    lastActivityAt: '2026-04-28T09:00:00Z',
    updatedAt: '2026-04-28T09:00:00Z',
  },
  // fmr-004 — Green
  {
    id: 'wal-004',
    farmerId: 'fmr-004',
    currentPoints: 650,
    lifetimePoints: 650,
    tier: 'Green',
    pointsToNextTier: 350,
    lastActivityAt: '2026-03-22T10:00:00Z',
    updatedAt: '2026-03-22T10:00:00Z',
  },
  // fmr-005 — Silver
  {
    id: 'wal-005',
    farmerId: 'fmr-005',
    currentPoints: 1760,
    lifetimePoints: 1800,
    tier: 'Silver',
    pointsToNextTier: 3200,
    lastActivityAt: '2026-05-20T15:00:00Z',
    updatedAt: '2026-05-20T15:00:00Z',
  },
  // fmr-006 — Gold
  {
    id: 'wal-006',
    farmerId: 'fmr-006',
    currentPoints: 8320,
    lifetimePoints: 8500,
    tier: 'Gold',
    pointsToNextTier: 6500,
    nearestExpiryDate: '2026-09-30',
    nearestExpiryPoints: 600,
    lastActivityAt: '2026-05-15T13:00:00Z',
    updatedAt: '2026-05-15T13:00:00Z',
  },
  // fmr-007 — Silver
  {
    id: 'wal-007',
    farmerId: 'fmr-007',
    currentPoints: 3050,
    lifetimePoints: 3100,
    tier: 'Silver',
    pointsToNextTier: 1900,
    lastActivityAt: '2026-05-02T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z',
  },
  // fmr-008 — Green
  {
    id: 'wal-008',
    farmerId: 'fmr-008',
    currentPoints: 820,
    lifetimePoints: 820,
    tier: 'Green',
    pointsToNextTier: 180,
    lastActivityAt: '2026-02-14T09:00:00Z',
    updatedAt: '2026-02-14T09:00:00Z',
  },
  // fmr-009 — Platinum
  {
    id: 'wal-009',
    farmerId: 'fmr-009',
    currentPoints: 21400,
    lifetimePoints: 22000,
    tier: 'Platinum',
    pointsToNextTier: 0,
    nearestExpiryDate: '2026-12-31',
    nearestExpiryPoints: 2000,
    lastActivityAt: '2026-05-22T16:00:00Z',
    updatedAt: '2026-05-22T16:00:00Z',
  },
  // fmr-010 — Gold
  {
    id: 'wal-010',
    farmerId: 'fmr-010',
    currentPoints: 6650,
    lifetimePoints: 6800,
    tier: 'Gold',
    pointsToNextTier: 8200,
    lastActivityAt: '2026-05-12T11:00:00Z',
    updatedAt: '2026-05-12T11:00:00Z',
  },
  // fmr-011 — Silver
  {
    id: 'wal-011',
    farmerId: 'fmr-011',
    currentPoints: 1480,
    lifetimePoints: 1500,
    tier: 'Silver',
    pointsToNextTier: 3500,
    lastActivityAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-04-10T09:00:00Z',
  },
  // fmr-012 — Green
  {
    id: 'wal-012',
    farmerId: 'fmr-012',
    currentPoints: 300,
    lifetimePoints: 300,
    tier: 'Green',
    pointsToNextTier: 700,
    lastActivityAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  // fmr-013 — Silver
  {
    id: 'wal-013',
    farmerId: 'fmr-013',
    currentPoints: 4100,
    lifetimePoints: 4200,
    tier: 'Silver',
    pointsToNextTier: 800,
    nearestExpiryDate: '2026-10-31',
    nearestExpiryPoints: 300,
    lastActivityAt: '2026-05-08T14:00:00Z',
    updatedAt: '2026-05-08T14:00:00Z',
  },
  // fmr-014 — Gold
  {
    id: 'wal-014',
    farmerId: 'fmr-014',
    currentPoints: 8900,
    lifetimePoints: 9100,
    tier: 'Gold',
    pointsToNextTier: 5900,
    lastActivityAt: '2026-05-19T12:00:00Z',
    updatedAt: '2026-05-19T12:00:00Z',
  },
  // fmr-015 — Green
  {
    id: 'wal-015',
    farmerId: 'fmr-015',
    currentPoints: 120,
    lifetimePoints: 120,
    tier: 'Green',
    pointsToNextTier: 880,
    lastActivityAt: '2026-03-05T09:00:00Z',
    updatedAt: '2026-03-05T09:00:00Z',
  },
];

/** Quick lookup map — wallet.id → LoyaltyWallet. */
export const walletById = new Map(mockLoyaltyWallets.map((w) => [w.id, w]));

/** Quick lookup map — farmer.id → LoyaltyWallet. */
export const walletByFarmerId = new Map(mockLoyaltyWallets.map((w) => [w.farmerId, w]));
