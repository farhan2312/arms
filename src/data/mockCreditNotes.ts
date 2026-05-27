// MOCK DATA — swap for API call: GET /api/credit-notes
// 3 Supplier CNs + 3 B2B Customer CNs across all statuses

import type { CreditNote } from '../modules/m10-creditnotes/types';

export const mockCreditNotes: CreditNote[] = [
  // ── Supplier CNs ─────────────────────────────────────────────────────────────

  // Posted — Volume Discount on Urea batch (bat-012, grn-2025-001, sup-001)
  // COGS impact: ₹218 → ₹200.86/bag | Margin: 18.0% → 24.5%
  {
    id: 'cn-001',
    cnNo: 'CN-SUP-20260315-001',
    type: 'Supplier',
    date: '2026-03-15',
    supplierId: 'sup-001',
    supplierName: 'AgriChem Distributors Pvt Ltd',
    linkedGrnId: 'grn-2025-001',
    linkedBatchId: 'bat-012',
    supplierReason: 'VolumeDiscount',
    amount: 4800,
    gstAmt: 240,
    netAmt: 5040,
    status: 'Posted',
    remarks: 'Annual volume discount on Urea purchases exceeding 500 MT',
    approvedByUserId: 'usr-010',
    approvedAt: '2026-03-17T09:00:00Z',
    createdByUserId: 'usr-010',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-17T09:00:00Z',
  },

  // PendingApproval — Quality Claim on Imidacloprid batch (bat-031, grn-2025-016, sup-003)
  // COGS impact: ₹380 → ₹342/pkt | Margin: 15.6% → 24.0%
  {
    id: 'cn-002',
    cnNo: 'CN-SUP-20260401-001',
    type: 'Supplier',
    date: '2026-04-01',
    supplierId: 'sup-003',
    supplierName: 'Bayer CropScience Ltd',
    linkedGrnId: 'grn-2025-016',
    linkedBatchId: 'bat-031',
    supplierReason: 'QualityClaim',
    amount: 7600,
    gstAmt: 1368,
    netAmt: 8968,
    status: 'PendingApproval',
    remarks: 'Sub-standard efficacy reported by 3 store incharges — lab analysis attached',
    createdByUserId: 'usr-010',
    createdAt: '2026-04-01T11:00:00Z',
    updatedAt: '2026-04-01T11:00:00Z',
  },

  // Draft — Scheme credit on Glyphosate batch (bat-035, grn-2025-018, sup-002)
  // COGS impact: ₹228 → ₹208/L | Margin: 21.4% → 28.3%
  {
    id: 'cn-003',
    cnNo: 'CN-SUP-20260510-001',
    type: 'Supplier',
    date: '2026-05-10',
    supplierId: 'sup-002',
    supplierName: 'Syngenta India Limited',
    linkedGrnId: 'grn-2025-018',
    linkedBatchId: 'bat-035',
    supplierReason: 'Scheme',
    amount: 3200,
    gstAmt: 576,
    netAmt: 3776,
    status: 'Draft',
    remarks: 'Kharif push scheme — ₹20/L credit on 160 L purchased',
    createdByUserId: 'usr-010',
    createdAt: '2026-05-10T14:00:00Z',
    updatedAt: '2026-05-10T14:00:00Z',
  },

  // ── B2B Customer CNs ──────────────────────────────────────────────────────────

  // Posted — Volume Discount to Vidarbha Agro (ret-001 / binv-001)
  // Outstanding impact: ₹142,000 → ₹129,400
  {
    id: 'cn-004',
    cnNo: 'CN-B2B-20260405-001',
    type: 'B2BCustomer',
    date: '2026-04-05',
    retailerId: 'ret-001',
    retailerName: 'Vidarbha Agro Inputs Pvt Ltd',
    linkedInvoiceId: 'binv-001',
    linkedInvoiceNo: 'BINV-AKL-20260310-001',
    b2bReason: 'VolumeDiscount',
    amount: 12000,
    gstAmt: 600,
    netAmt: 12600,
    status: 'Posted',
    remarks: 'H1 2026 volume incentive — purchases above ₹15L threshold met',
    approvedByUserId: 'usr-010',
    approvedAt: '2026-04-07T10:00:00Z',
    createdByUserId: 'usr-010',
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-07T10:00:00Z',
  },

  // PendingApproval — Damaged Goods claim from Nagpur Krishi (ret-002 / binv-002)
  // Outstanding impact: ₹90,000 → ₹79,970
  {
    id: 'cn-005',
    cnNo: 'CN-B2B-20260425-001',
    type: 'B2BCustomer',
    date: '2026-04-25',
    retailerId: 'ret-002',
    retailerName: 'Nagpur Krishi Kendra',
    linkedInvoiceId: 'binv-002',
    linkedInvoiceNo: 'BINV-NGP-20260115-001',
    b2bReason: 'DamagedGoods',
    amount: 8500,
    gstAmt: 1530,
    netAmt: 10030,
    status: 'PendingApproval',
    remarks: '15 bags of Urea received with torn packaging — moisture damage confirmed',
    createdByUserId: 'usr-010',
    createdAt: '2026-04-25T10:00:00Z',
    updatedAt: '2026-04-25T10:00:00Z',
  },

  // Draft — Returns from Deccan Agri (ret-005 / binv-006)
  // Outstanding impact: ₹43,000 → ₹37,750
  {
    id: 'cn-006',
    cnNo: 'CN-B2B-20260520-001',
    type: 'B2BCustomer',
    date: '2026-05-20',
    retailerId: 'ret-005',
    retailerName: 'Deccan Agri Traders',
    linkedInvoiceId: 'binv-006',
    linkedInvoiceNo: 'BINV-HNK-20260218-001',
    b2bReason: 'Returns',
    amount: 5000,
    gstAmt: 250,
    netAmt: 5250,
    status: 'Draft',
    remarks: 'Customer returning 10 L Glyphosate — product not suitable for standing crop',
    createdByUserId: 'usr-010',
    createdAt: '2026-05-20T11:00:00Z',
    updatedAt: '2026-05-20T11:00:00Z',
  },
];

export const creditNoteById = new Map(mockCreditNotes.map((cn) => [cn.id, cn]));
