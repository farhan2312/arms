// MOCK DATA — swap for API call: GET /api/sales/transactions
// GST is computed on a tax-exclusive base: unitSellingPrice is pre-tax.
// For intra-state sales IGST = 0; only CGST + SGST apply.
// Loyalty: 1 point per ₹10 spent (loyaltyEligible products only).
import type { SaleTransaction, SaleLine, ProductUnit } from '../types/entities';

// ── Helper: build a SaleLine ────────────────────────────────────────────────
function mkLine(
  id: string,
  transactionId: string,
  productId: string,
  batchId: string,
  sku: string,
  productName: string,
  qty: number,
  unit: ProductUnit,
  mrp: number,
  unitSellingPrice: number,
  taxSlabPct: number,
  lineDiscountAmt = 0,
  couponDiscountAmt = 0,
): SaleLine {
  const gross = unitSellingPrice * qty;
  const taxableAmt = parseFloat((gross - lineDiscountAmt - couponDiscountAmt).toFixed(2));
  const halfRate = taxSlabPct / 2 / 100;
  const cgstAmt = parseFloat((taxableAmt * halfRate).toFixed(2));
  const sgstAmt = cgstAmt;
  const lineTotal = parseFloat((taxableAmt + cgstAmt + sgstAmt).toFixed(2));
  return { id, transactionId, productId, batchId, sku, productName, qty, unit, mrp, unitSellingPrice, lineDiscountAmt, couponDiscountAmt, taxableAmt, cgstAmt, sgstAmt, igstAmt: 0, lineTotal };
}

// ── Helper: build a SaleTransaction from lines ───────────────────────────────
function mkTxn(
  id: string,
  invoiceNo: string,
  invoiceDate: string,
  storeId: string,
  farmerId: string,
  cashierUserId: string,
  paymentMode: SaleTransaction['paymentMode'],
  lines: SaleLine[],
  loyaltyPointsEarned: number,
  loyaltyPointsRedeemed = 0,
  loyaltyRedemptionAmt = 0,
  roundOff = 0,
  paymentRef?: string,
  couponId?: string,
): SaleTransaction {
  const subtotalAmt = parseFloat(lines.reduce((s, l) => s + l.unitSellingPrice * l.qty, 0).toFixed(2));
  const lineDiscountAmt = parseFloat(lines.reduce((s, l) => s + l.lineDiscountAmt, 0).toFixed(2));
  const couponDiscountAmt = parseFloat(lines.reduce((s, l) => s + l.couponDiscountAmt, 0).toFixed(2));
  const totalTaxAmt = parseFloat(lines.reduce((s, l) => s + l.cgstAmt + l.sgstAmt, 0).toFixed(2));
  const lineTotal = parseFloat(lines.reduce((s, l) => s + l.lineTotal, 0).toFixed(2));
  const totalAmt = parseFloat((lineTotal - loyaltyRedemptionAmt + roundOff).toFixed(2));
  const now = `${invoiceDate}T10:00:00Z`;
  return {
    id, invoiceNo, invoiceDate, storeId, farmerId, cashierUserId,
    couponId,
    lines,
    subtotalAmt,
    lineDiscountAmt,
    couponDiscountAmt,
    totalTaxAmt,
    roundOff,
    totalAmt,
    paymentMode,
    paymentRef,
    loyaltyPointsEarned,
    loyaltyPointsRedeemed,
    loyaltyRedemptionAmt,
    status: 'Confirmed',
    createdAt: now,
    updatedAt: now,
  };
}

// ── Transactions ─────────────────────────────────────────────────────────────

export const mockSaleTransactions: SaleTransaction[] = [
  // ── May 2026 — Akola (AKL-001) ──────────────────────────────────────────
  (() => {
    const id = 'txn-001'; const lines = [
      mkLine('sl-001a', id, 'prd-007', 'bat-013', 'FRT-DAP-007', 'DAP (Di-Ammonium Phosphate) 50 Kg', 5, 'Bag', 1350, 1286, 5),
      mkLine('sl-001b', id, 'prd-006', 'bat-012', 'FRT-UREA-006', 'Urea (Neem Coated) 45 Kg', 10, 'Bag', 266, 253, 5),
    ];
    return mkTxn(id, 'INV-AKL-20260526-001', '2026-05-26', 'str-akl-001', 'fmr-001', 'usr-004', 'UPI', lines, 0, 0, 0, 0, 'UPI8712634509');
  })(),

  (() => {
    const id = 'txn-002'; const lines = [
      mkLine('sl-002a', id, 'prd-001', 'bat-002', 'SED-BTC-001', 'BT Cotton Seed', 3, 'Packet', 930, 900, 0),
      mkLine('sl-002b', id, 'prd-016', 'bat-032', 'PST-IMD-016', 'Imidacloprid 70% WS', 2, 'Packet', 480, 381, 18),
    ];
    return mkTxn(id, 'INV-AKL-20260525-002', '2026-05-25', 'str-akl-001', 'fmr-002', 'usr-004', 'Cash', lines, 342);
  })(),

  (() => {
    const id = 'txn-003'; const lines = [
      mkLine('sl-003a', id, 'prd-011', 'bat-022', 'NUT-ZNS-011', 'Zinc Sulphate 33% Monohydrate', 10, 'Kg', 95, 79, 12),
      mkLine('sl-003b', id, 'prd-014', 'bat-027', 'NUT-HMC-014', 'Humic Acid 98% Granular', 5, 'Kg', 350, 286, 12),
    ];
    return mkTxn(id, 'INV-AKL-20260524-003', '2026-05-24', 'str-akl-001', 'fmr-003', 'usr-004', 'UPI', lines, 223, 0, 0, 0, 'UPI9900341288');
  })(),

  (() => {
    const id = 'txn-004'; const lines = [
      mkLine('sl-004a', id, 'prd-008', 'bat-015', 'FRT-MOP-008', 'MOP (Muriate of Potash) 50 Kg', 4, 'Bag', 1250, 1133, 5),
    ];
    return mkTxn(id, 'INV-AKL-20260523-004', '2026-05-23', 'str-akl-001', 'fmr-005', 'usr-003', 'Card', lines, 0, 0, 0, 0.13, 'CARD990012');
  })(),

  (() => {
    const id = 'txn-005'; const lines = [
      mkLine('sl-005a', id, 'prd-019', 'bat-037', 'PST-MNC-019', 'Mancozeb 75% WP', 6, 'Packet', 185, 148, 18),
      mkLine('sl-005b', id, 'prd-020', 'bat-039', 'PST-ACE-020', 'Acephate 75% SP', 4, 'Packet', 265, 212, 18),
    ];
    return mkTxn(id, 'INV-AKL-20260522-005', '2026-05-22', 'str-akl-001', 'fmr-001', 'usr-004', 'UPI', lines, 0, 1000, 100, 0, 'UPI7810234900');
  })(),

  (() => {
    const id = 'txn-006'; const lines = [
      mkLine('sl-006a', id, 'prd-004', 'bat-007', 'SED-HMZ-004', 'Hybrid Maize Seed DKC-9108', 2, 'Bag', 1100, 1050, 0),
    ];
    return mkTxn(id, 'INV-AKL-20260521-006', '2026-05-21', 'str-akl-001', 'fmr-004', 'usr-004', 'Cash', lines, 210);
  })(),

  (() => {
    const id = 'txn-007'; const lines = [
      mkLine('sl-007a', id, 'prd-015', 'bat-029', 'NUT-SEA-015', 'Seaweed Extract Liquid', 3, 'L', 480, 402, 12),
      mkLine('sl-007b', id, 'prd-013', 'bat-025', 'NUT-FRS-013', 'Ferrous Sulphate 19% Heptahydrate', 5, 'Kg', 55, 45, 12),
    ];
    return mkTxn(id, 'INV-AKL-20260520-007', '2026-05-20', 'str-akl-001', 'fmr-002', 'usr-004', 'UPI', lines, 146, 0, 0, 0, 'UPI3341287900');
  })(),

  // ── May 2026 — Amravati (AMR-002) ───────────────────────────────────────
  (() => {
    const id = 'txn-008'; const lines = [
      mkLine('sl-008a', id, 'prd-007', 'bat-013', 'FRT-DAP-007', 'DAP (Di-Ammonium Phosphate) 50 Kg', 8, 'Bag', 1350, 1286, 5),
      mkLine('sl-008b', id, 'prd-009', 'bat-017', 'FRT-SSP-009', 'SSP (Single Super Phosphate) 50 Kg', 5, 'Bag', 380, 362, 5),
    ];
    return mkTxn(id, 'INV-AMR-20260526-001', '2026-05-26', 'str-amr-002', 'fmr-006', 'usr-011', 'Cash', lines, 0);
  })(),

  (() => {
    const id = 'txn-009'; const lines = [
      mkLine('sl-009a', id, 'prd-017', 'bat-034', 'PST-CHL-017', 'Chlorpyrifos 20% EC', 3, 'L', 380, 305, 18),
      mkLine('sl-009b', id, 'prd-018', 'bat-036', 'PST-GLY-018', 'Glyphosate 41% SL', 2, 'L', 310, 246, 18),
    ];
    return mkTxn(id, 'INV-AMR-20260524-002', '2026-05-24', 'str-amr-002', 'fmr-007', 'usr-011', 'UPI', lines, 0, 0, 0, 0, 'UPI4422109878');
  })(),

  (() => {
    const id = 'txn-010'; const lines = [
      mkLine('sl-010a', id, 'prd-001', 'bat-001', 'SED-BTC-001', 'BT Cotton Seed', 5, 'Packet', 930, 900, 0),
      mkLine('sl-010b', id, 'prd-012', 'bat-023', 'NUT-BOR-012', 'Boron 20% Granular', 8, 'Kg', 220, 179, 12),
    ];
    return mkTxn(id, 'INV-AMR-20260523-003', '2026-05-23', 'str-amr-002', 'fmr-008', 'usr-011', 'Credit', lines, 594, 0, 0, 0, 'CRD-AMR-2026-001');
  })(),

  (() => {
    const id = 'txn-011'; const lines = [
      mkLine('sl-011a', id, 'prd-002', 'bat-004', 'SED-SYB-002', 'Soybean Seed JS-335', 2, 'Bag', 2700, 2600, 0),
      mkLine('sl-011b', id, 'prd-011', 'bat-022', 'NUT-ZNS-011', 'Zinc Sulphate 33% Monohydrate', 5, 'Kg', 95, 79, 12),
    ];
    return mkTxn(id, 'INV-AMR-20260521-004', '2026-05-21', 'str-amr-002', 'fmr-006', 'usr-011', 'UPI', lines, 555, 0, 0, 0, 'UPI9980034566');
  })(),

  (() => {
    const id = 'txn-012'; const lines = [
      mkLine('sl-012a', id, 'prd-010', 'bat-019', 'FRT-NPK-010', 'NPK 19-19-19 Water Soluble 25 Kg', 3, 'Bag', 1600, 1448, 5),
    ];
    return mkTxn(id, 'INV-AMR-20260519-005', '2026-05-19', 'str-amr-002', 'fmr-007', 'usr-011', 'Cash', lines, 0);
  })(),

  // ── May 2026 — Nagpur (NGP-003) ─────────────────────────────────────────
  (() => {
    const id = 'txn-013'; const lines = [
      mkLine('sl-013a', id, 'prd-007', 'bat-013', 'FRT-DAP-007', 'DAP (Di-Ammonium Phosphate) 50 Kg', 10, 'Bag', 1350, 1286, 5),
      mkLine('sl-013b', id, 'prd-006', 'bat-012', 'FRT-UREA-006', 'Urea (Neem Coated) 45 Kg', 15, 'Bag', 266, 253, 5),
      mkLine('sl-013c', id, 'prd-009', 'bat-018', 'FRT-SSP-009', 'SSP (Single Super Phosphate) 50 Kg', 8, 'Bag', 380, 362, 5),
    ];
    return mkTxn(id, 'INV-NGP-20260525-001', '2026-05-25', 'str-ngp-003', 'fmr-009', 'usr-012', 'UPI', lines, 0, 2000, 200, 0, 'UPI1122334455');
  })(),

  (() => {
    const id = 'txn-014'; const lines = [
      mkLine('sl-014a', id, 'prd-016', 'bat-031', 'PST-IMD-016', 'Imidacloprid 70% WS', 5, 'Packet', 480, 381, 18),
      mkLine('sl-014b', id, 'prd-019', 'bat-038', 'PST-MNC-019', 'Mancozeb 75% WP', 10, 'Packet', 185, 148, 18),
    ];
    return mkTxn(id, 'INV-NGP-20260524-002', '2026-05-24', 'str-ngp-003', 'fmr-010', 'usr-012', 'Cash', lines, 0);
  })(),

  (() => {
    const id = 'txn-015'; const lines = [
      mkLine('sl-015a', id, 'prd-004', 'bat-008', 'SED-HMZ-004', 'Hybrid Maize Seed DKC-9108', 3, 'Bag', 1100, 1050, 0),
      mkLine('sl-015b', id, 'prd-015', 'bat-029', 'NUT-SEA-015', 'Seaweed Extract Liquid', 2, 'L', 480, 402, 12),
    ];
    return mkTxn(id, 'INV-NGP-20260522-003', '2026-05-22', 'str-ngp-003', 'fmr-011', 'usr-012', 'Card', lines, 399, 0, 0, 0, 'CARD223344');
  })(),

  (() => {
    const id = 'txn-016'; const lines = [
      mkLine('sl-016a', id, 'prd-002', 'bat-003', 'SED-SYB-002', 'Soybean Seed JS-335', 3, 'Bag', 2700, 2600, 0),
    ];
    return mkTxn(id, 'INV-NGP-20260520-004', '2026-05-20', 'str-ngp-003', 'fmr-009', 'usr-012', 'UPI', lines, 780, 0, 0, 0, 'UPI5544332211');
  })(),

  (() => {
    const id = 'txn-017'; const lines = [
      mkLine('sl-017a', id, 'prd-013', 'bat-026', 'NUT-FRS-013', 'Ferrous Sulphate 19% Heptahydrate', 20, 'Kg', 55, 45, 12),
      mkLine('sl-017b', id, 'prd-012', 'bat-023', 'NUT-BOR-012', 'Boron 20% Granular', 5, 'Kg', 220, 179, 12),
    ];
    return mkTxn(id, 'INV-NGP-20260518-005', '2026-05-18', 'str-ngp-003', 'fmr-010', 'usr-012', 'Cash', lines, 199);
  })(),

  (() => {
    const id = 'txn-018'; const lines = [
      mkLine('sl-018a', id, 'prd-020', 'bat-039', 'PST-ACE-020', 'Acephate 75% SP', 4, 'Packet', 265, 212, 18),
      mkLine('sl-018b', id, 'prd-017', 'bat-033', 'PST-CHL-017', 'Chlorpyrifos 20% EC', 3, 'L', 380, 305, 18),
    ];
    return mkTxn(id, 'INV-NGP-20260515-006', '2026-05-15', 'str-ngp-003', 'fmr-011', 'usr-012', 'UPI', lines, 0, 0, 0, 0, 'UPI9988776655');
  })(),

  // ── May 2026 — Wardha (WRD-004) ─────────────────────────────────────────
  (() => {
    const id = 'txn-019'; const lines = [
      mkLine('sl-019a', id, 'prd-007', 'bat-014', 'FRT-DAP-007', 'DAP (Di-Ammonium Phosphate) 50 Kg', 6, 'Bag', 1350, 1286, 5),
      mkLine('sl-019b', id, 'prd-008', 'bat-016', 'FRT-MOP-008', 'MOP (Muriate of Potash) 50 Kg', 3, 'Bag', 1250, 1133, 5),
    ];
    return mkTxn(id, 'INV-WRD-20260526-001', '2026-05-26', 'str-wrd-004', 'fmr-012', 'usr-013', 'Cash', lines, 0);
  })(),

  (() => {
    const id = 'txn-020'; const lines = [
      mkLine('sl-020a', id, 'prd-001', 'bat-001', 'SED-BTC-001', 'BT Cotton Seed', 4, 'Packet', 930, 900, 0),
      mkLine('sl-020b', id, 'prd-014', 'bat-028', 'NUT-HMC-014', 'Humic Acid 98% Granular', 3, 'Kg', 350, 286, 12),
    ];
    return mkTxn(id, 'INV-WRD-20260524-002', '2026-05-24', 'str-wrd-004', 'fmr-013', 'usr-013', 'UPI', lines, 424, 0, 0, 0, 'UPI6677889900');
  })(),

  (() => {
    const id = 'txn-021'; const lines = [
      mkLine('sl-021a', id, 'prd-003', 'bat-005', 'SED-WHT-003', 'Wheat Seed GW-322', 2, 'Bag', 1200, 1150, 0),
      mkLine('sl-021b', id, 'prd-015', 'bat-030', 'NUT-SEA-015', 'Seaweed Extract Liquid', 2, 'L', 480, 402, 12),
    ];
    return mkTxn(id, 'INV-WRD-20260521-003', '2026-05-21', 'str-wrd-004', 'fmr-012', 'usr-013', 'Cash', lines, 297);
  })(),

  (() => {
    const id = 'txn-022'; const lines = [
      mkLine('sl-022a', id, 'prd-018', 'bat-035', 'PST-GLY-018', 'Glyphosate 41% SL', 4, 'L', 310, 246, 18),
    ];
    return mkTxn(id, 'INV-WRD-20260519-004', '2026-05-19', 'str-wrd-004', 'fmr-013', 'usr-013', 'UPI', lines, 0, 0, 0, 0, 'UPI1029384756');
  })(),

  // ── May 2026 — Warangal (WGL-005) ───────────────────────────────────────
  (() => {
    const id = 'txn-023'; const lines = [
      mkLine('sl-023a', id, 'prd-010', 'bat-020', 'FRT-NPK-010', 'NPK 19-19-19 Water Soluble 25 Kg', 4, 'Bag', 1600, 1448, 5),
      mkLine('sl-023b', id, 'prd-016', 'bat-031', 'PST-IMD-016', 'Imidacloprid 70% WS', 3, 'Packet', 480, 381, 18),
    ];
    return mkTxn(id, 'INV-WGL-20260526-001', '2026-05-26', 'str-wgl-005', 'fmr-014', 'usr-014', 'UPI', lines, 0, 0, 0, 0, 'UPI5544116688');
  })(),

  (() => {
    const id = 'txn-024'; const lines = [
      mkLine('sl-024a', id, 'prd-005', 'bat-010', 'SED-SFF-005', 'Sunflower Seed KBSH-44', 5, 'Packet', 450, 430, 0),
      mkLine('sl-024b', id, 'prd-012', 'bat-024', 'NUT-BOR-012', 'Boron 20% Granular', 3, 'Kg', 220, 179, 12),
    ];
    return mkTxn(id, 'INV-WGL-20260524-002', '2026-05-24', 'str-wgl-005', 'fmr-015', 'usr-014', 'Cash', lines, 259);
  })(),

  (() => {
    const id = 'txn-025'; const lines = [
      mkLine('sl-025a', id, 'prd-007', 'bat-013', 'FRT-DAP-007', 'DAP (Di-Ammonium Phosphate) 50 Kg', 5, 'Bag', 1350, 1286, 5),
      mkLine('sl-025b', id, 'prd-009', 'bat-017', 'FRT-SSP-009', 'SSP (Single Super Phosphate) 50 Kg', 5, 'Bag', 380, 362, 5),
    ];
    return mkTxn(id, 'INV-WGL-20260522-003', '2026-05-22', 'str-wgl-005', 'fmr-014', 'usr-014', 'BNPL', lines, 0, 0, 0, 0, 'BNPL-WGL-001');
  })(),

  // ── April 2026 — mixed stores ────────────────────────────────────────────
  (() => {
    const id = 'txn-026'; const lines = [
      mkLine('sl-026a', id, 'prd-001', 'bat-001', 'SED-BTC-001', 'BT Cotton Seed', 10, 'Packet', 930, 900, 0),
      mkLine('sl-026b', id, 'prd-011', 'bat-021', 'NUT-ZNS-011', 'Zinc Sulphate 33% Monohydrate', 20, 'Kg', 95, 79, 12),
    ];
    return mkTxn(id, 'INV-AKL-20260430-008', '2026-04-30', 'str-akl-001', 'fmr-001', 'usr-004', 'UPI', lines, 1041, 0, 0, 0, 'UPI2233445566');
  })(),

  (() => {
    const id = 'txn-027'; const lines = [
      mkLine('sl-027a', id, 'prd-002', 'bat-004', 'SED-SYB-002', 'Soybean Seed JS-335', 2, 'Bag', 2700, 2600, 0),
      mkLine('sl-027b', id, 'prd-008', 'bat-016', 'FRT-MOP-008', 'MOP (Muriate of Potash) 50 Kg', 2, 'Bag', 1250, 1133, 5),
    ];
    return mkTxn(id, 'INV-AMR-20260428-006', '2026-04-28', 'str-amr-002', 'fmr-007', 'usr-011', 'Cash', lines, 573);
  })(),

  (() => {
    const id = 'txn-028'; const lines = [
      mkLine('sl-028a', id, 'prd-020', 'bat-040', 'PST-ACE-020', 'Acephate 75% SP', 6, 'Packet', 265, 212, 18),
      mkLine('sl-028b', id, 'prd-019', 'bat-037', 'PST-MNC-019', 'Mancozeb 75% WP', 8, 'Packet', 185, 148, 18),
    ];
    return mkTxn(id, 'INV-WRD-20260425-005', '2026-04-25', 'str-wrd-004', 'fmr-013', 'usr-013', 'UPI', lines, 0, 0, 0, 0, 'UPI8765432101');
  })(),

  (() => {
    const id = 'txn-029'; const lines = [
      mkLine('sl-029a', id, 'prd-005', 'bat-009', 'SED-SFF-005', 'Sunflower Seed KBSH-44', 8, 'Packet', 450, 430, 0),
      mkLine('sl-029b', id, 'prd-015', 'bat-029', 'NUT-SEA-015', 'Seaweed Extract Liquid', 4, 'L', 480, 402, 12),
    ];
    return mkTxn(id, 'INV-WGL-20260420-004', '2026-04-20', 'str-wgl-005', 'fmr-014', 'usr-014', 'Cash', lines, 505);
  })(),

  (() => {
    const id = 'txn-030'; const lines = [
      mkLine('sl-030a', id, 'prd-010', 'bat-019', 'FRT-NPK-010', 'NPK 19-19-19 Water Soluble 25 Kg', 5, 'Bag', 1600, 1448, 5),
      mkLine('sl-030b', id, 'prd-017', 'bat-033', 'PST-CHL-017', 'Chlorpyrifos 20% EC', 4, 'L', 380, 305, 18),
    ];
    return mkTxn(id, 'INV-NGP-20260415-007', '2026-04-15', 'str-ngp-003', 'fmr-009', 'usr-012', 'Card', lines, 849, 0, 0, 0.30, 'CARD556677');
  })(),
];

/** Quick lookup map — transaction.id → SaleTransaction. */
export const saleTransactionById = new Map(mockSaleTransactions.map((t) => [t.id, t]));
