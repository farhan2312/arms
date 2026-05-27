// MOCK DATA — swap for API call: GET /api/b2b/invoices
// Today reference: 2026-05-27
// Ageing buckets computed against this date:
//   Current  : dueDate ≥ 2026-05-27
//   1-30d    : due 2026-04-27 → 2026-05-26
//   31-60d   : due 2026-03-28 → 2026-04-26
//   61-90d   : due 2026-02-26 → 2026-03-27
//   90d+     : due before 2026-02-26

import type { B2BInvoice } from '../types/b2b';

export const mockB2BInvoices: B2BInvoice[] = [
  // ── ret-001 Vidarbha Agro Inputs (outstanding 142 000) ───────────────────
  // 31-60d overdue
  {
    id: 'binv-001',
    invoiceNo: 'BINV-AKL-20260310-001',
    orderId: 'b2b-ord-001',
    dispatchId: 'dsp-ngp-20260314-001',
    retailerId: 'ret-001',
    invoiceDate: '2026-03-10',
    dueDate: '2026-04-09',          // 48 days overdue
    totalAmt: 190500,
    paidAmt: 48500,
    outstandingAmt: 142000,
    status: 'PartiallyPaid',
    createdByUserId: 'usr-010',
    createdAt: '2026-03-10T11:00:00Z',
  },

  // ── ret-002 Nagpur Krishi Kendra (outstanding 385 000) ───────────────────
  // 61-90d overdue invoice
  {
    id: 'binv-002',
    invoiceNo: 'BINV-NGP-20260115-001',
    orderId: 'b2b-ord-placeholder-1',
    dispatchId: 'dsp-ngp-20260118-001',
    retailerId: 'ret-002',
    invoiceDate: '2026-01-15',
    dueDate: '2026-03-01',          // 87 days overdue
    totalAmt: 90000,
    paidAmt: 0,
    outstandingAmt: 90000,
    status: 'Overdue',
    createdByUserId: 'usr-010',
    createdAt: '2026-01-15T09:00:00Z',
  },
  // 1-30d overdue invoice
  {
    id: 'binv-003',
    invoiceNo: 'BINV-NGP-20260402-001',
    orderId: 'b2b-ord-002',
    dispatchId: 'dsp-ngp-20260405-001',
    retailerId: 'ret-002',
    invoiceDate: '2026-04-02',
    dueDate: '2026-05-17',          // 10 days overdue
    totalAmt: 310000,
    paidAmt: 15000,
    outstandingAmt: 295000,
    status: 'PartiallyPaid',
    createdByUserId: 'usr-010',
    createdAt: '2026-04-02T10:00:00Z',
  },

  // ── ret-003 Amravati Seed House (outstanding 68 000) ─────────────────────
  // Current (due 2026-05-31)
  {
    id: 'binv-004',
    invoiceNo: 'BINV-AMR-20260510-001',
    orderId: 'b2b-ord-004',
    dispatchId: 'dsp-ngp-20260512-001',
    retailerId: 'ret-003',
    invoiceDate: '2026-05-10',
    dueDate: '2026-05-31',          // 4 days until due
    totalAmt: 68000,
    paidAmt: 0,
    outstandingAmt: 68000,
    status: 'Unpaid',
    createdByUserId: 'usr-010',
    createdAt: '2026-05-10T10:00:00Z',
  },

  // ── ret-004 Wardha Fertiliser Depot (outstanding 22 000) ─────────────────
  // Current (due 2026-06-05)
  {
    id: 'binv-005',
    invoiceNo: 'BINV-WRD-20260521-001',
    orderId: 'b2b-ord-007',
    dispatchId: 'dsp-ngp-20260523-001',
    retailerId: 'ret-004',
    invoiceDate: '2026-05-21',
    dueDate: '2026-06-05',          // 9 days until due
    totalAmt: 22000,
    paidAmt: 0,
    outstandingAmt: 22000,
    status: 'Unpaid',
    createdByUserId: 'usr-010',
    createdAt: '2026-05-21T15:00:00Z',
  },

  // ── ret-005 Deccan Agri Traders (outstanding 210 000) ────────────────────
  // 61-90d overdue invoice
  {
    id: 'binv-006',
    invoiceNo: 'BINV-HNK-20260218-001',
    orderId: 'b2b-ord-009',
    dispatchId: 'dsp-ngp-20260222-001',
    retailerId: 'ret-005',
    invoiceDate: '2026-02-18',
    dueDate: '2026-03-20',          // 68 days overdue
    totalAmt: 43000,
    paidAmt: 0,
    outstandingAmt: 43000,
    status: 'Overdue',
    createdByUserId: 'usr-010',
    createdAt: '2026-02-18T09:00:00Z',
  },
  // Current invoice (due tomorrow)
  {
    id: 'binv-007',
    invoiceNo: 'BINV-HNK-20260428-001',
    orderId: 'b2b-ord-003',
    dispatchId: 'dsp-ngp-20260502-001',
    retailerId: 'ret-005',
    invoiceDate: '2026-04-28',
    dueDate: '2026-05-28',          // 1 day until due
    totalAmt: 167000,
    paidAmt: 0,
    outstandingAmt: 167000,
    status: 'Unpaid',
    createdByUserId: 'usr-010',
    createdAt: '2026-04-28T11:00:00Z',
  },

  // ── ret-006 Telangana Crop Solutions (outstanding 0 — fully paid) ─────────
  {
    id: 'binv-008',
    invoiceNo: 'BINV-HNK-20260201-001',
    orderId: 'b2b-ord-placeholder-2',
    dispatchId: 'dsp-ngp-20260204-001',
    retailerId: 'ret-006',
    invoiceDate: '2026-02-01',
    dueDate: '2026-03-17',
    totalAmt: 180000,
    paidAmt: 180000,
    outstandingAmt: 0,
    status: 'Paid',
    createdByUserId: 'usr-010',
    createdAt: '2026-02-01T09:00:00Z',
  },

  // ── ret-007 Karimnagar Beej Bhandar (outstanding 95 000) ─────────────────
  // 90d+ overdue
  {
    id: 'binv-009',
    invoiceNo: 'BINV-KRM-20260119-001',
    orderId: 'b2b-ord-placeholder-3',
    dispatchId: 'dsp-ngp-20260122-001',
    retailerId: 'ret-007',
    invoiceDate: '2026-01-19',
    dueDate: '2026-02-09',          // 107 days overdue
    totalAmt: 95000,
    paidAmt: 0,
    outstandingAmt: 95000,
    status: 'Overdue',
    createdByUserId: 'usr-010',
    createdAt: '2026-01-19T09:00:00Z',
  },

  // ── ret-008 Nalgonda Agri Services (outstanding 41 000) ───────────────────
  // 1-30d overdue (7 days)
  {
    id: 'binv-010',
    invoiceNo: 'BINV-NLG-20260505-001',
    orderId: 'b2b-ord-010',
    dispatchId: 'dsp-ngp-20260508-001',
    retailerId: 'ret-008',
    invoiceDate: '2026-05-05',
    dueDate: '2026-05-20',          // 7 days overdue
    totalAmt: 41000,
    paidAmt: 0,
    outstandingAmt: 41000,
    status: 'Overdue',
    createdByUserId: 'usr-010',
    createdAt: '2026-05-05T11:00:00Z',
  },
];

// Bucket summary (verified against retailer outstandingAmt totals):
// Current : 68 000 + 22 000 + 167 000          = 257 000
// 1-30d   : 295 000 + 41 000                    = 336 000
// 31-60d  : 142 000                             = 142 000
// 61-90d  : 90 000 + 43 000                     = 133 000
// 90d+    : 95 000                              =  95 000
// Total outstanding                             = 963 000

/** Quick lookup map — invoice.id → B2BInvoice. */
export const b2bInvoiceById = new Map(mockB2BInvoices.map((i) => [i.id, i]));
