// MOCK DATA — swap for API call: GET /api/b2b/orders
import type { B2BOrder, B2BOrderLine } from '../types/b2b';

// ── Shared order lines helpers ───────────────────────────────────────────────

const line = (
  id: string,
  orderId: string,
  productId: string,
  sku: string,
  productName: string,
  requestedQty: number,
  allocatedQty: number,
  unit: string,
  unitPrice: number,
  lineDiscountPct: number,
  taxPct: number,
): B2BOrderLine => {
  const lineDiscountAmt = parseFloat((unitPrice * allocatedQty * lineDiscountPct / 100).toFixed(2));
  const taxableBase = unitPrice * allocatedQty - lineDiscountAmt;
  const taxAmt = parseFloat((taxableBase * taxPct / 100).toFixed(2));
  const lineTotal = parseFloat((taxableBase + taxAmt).toFixed(2));
  return { id, orderId, productId, sku, productName, requestedQty, allocatedQty, unit, unitPrice, lineDiscountPct, lineDiscountAmt, taxPct, taxAmt, lineTotal };
};

// ── Orders ───────────────────────────────────────────────────────────────────

export const mockB2BOrders: B2BOrder[] = [
  // 1 — Invoiced (fully complete)
  (() => {
    const id = 'b2b-ord-001';
    const lines: B2BOrderLine[] = [
      line('b2bl-001a', id, 'prd-007', 'FRT-DAP-007', 'DAP (Di-Ammonium Phosphate) 50 Kg', 100, 100, 'Bag', 1350, 5, 5),
      line('b2bl-001b', id, 'prd-006', 'FRT-UREA-006', 'Urea (Neem Coated) 45 Kg', 200, 200, 'Bag', 266, 0, 5),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.allocatedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-VID-20260310-001',
      retailerId: 'ret-001',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Invoiced',
      paymentTerms: 'Credit',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-03-18',
      deliveryAddress: 'Shop 12, Market Yard Road, Akola – 444001',
      approvedByUserId: 'usr-008',
      approvedAt: '2026-03-12T10:00:00Z',
      createdAt: '2026-03-10T09:00:00Z',
      updatedAt: '2026-03-22T14:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 2 — Delivered
  (() => {
    const id = 'b2b-ord-002';
    const lines: B2BOrderLine[] = [
      line('b2bl-002a', id, 'prd-001', 'SED-BTC-001', 'BT Cotton Seed', 50, 50, 'Packet', 820, 3, 0),
      line('b2bl-002b', id, 'prd-016', 'PST-IMD-016', 'Imidacloprid 70% WS', 100, 100, 'Packet', 400, 2, 18),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.allocatedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-VID-20260402-002',
      retailerId: 'ret-002',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Delivered',
      paymentTerms: 'Credit',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-04-10',
      deliveryAddress: 'Agri Complex, Itwari Road, Nagpur – 440002',
      approvedByUserId: 'usr-008',
      approvedAt: '2026-04-03T11:00:00Z',
      createdAt: '2026-04-02T09:00:00Z',
      updatedAt: '2026-04-15T10:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 3 — Dispatched
  (() => {
    const id = 'b2b-ord-003';
    const lines: B2BOrderLine[] = [
      line('b2bl-003a', id, 'prd-008', 'FRT-MOP-008', 'MOP (Muriate of Potash) 50 Kg', 60, 60, 'Bag', 1100, 4, 5),
      line('b2bl-003b', id, 'prd-010', 'FRT-NPK-010', 'NPK 19-19-19 Water Soluble 25 Kg', 40, 40, 'Bag', 1400, 3, 5),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.allocatedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-VID-20260428-003',
      retailerId: 'ret-005',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Dispatched',
      paymentTerms: 'Advance',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-05-05',
      deliveryAddress: 'APMC Yard, Subedari, Hanamkonda – 506001',
      approvedByUserId: 'usr-008',
      approvedAt: '2026-04-29T10:00:00Z',
      createdAt: '2026-04-28T09:00:00Z',
      updatedAt: '2026-05-03T16:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 4 — Allocated
  (() => {
    const id = 'b2b-ord-004';
    const lines: B2BOrderLine[] = [
      line('b2bl-004a', id, 'prd-002', 'SED-SYB-002', 'Soybean Seed JS-335', 30, 28, 'Bag', 2400, 5, 0),
      line('b2bl-004b', id, 'prd-011', 'NUT-ZNS-011', 'Zinc Sulphate 33% Monohydrate', 200, 200, 'Kg', 78, 2, 12),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.requestedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-VID-20260510-004',
      retailerId: 'ret-003',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Allocated',
      paymentTerms: 'Credit',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-05-18',
      deliveryAddress: 'Plot 6, Shivaji Nagar, Market Road, Amravati – 444601',
      approvedByUserId: 'usr-008',
      approvedAt: '2026-05-11T09:00:00Z',
      createdAt: '2026-05-10T10:00:00Z',
      updatedAt: '2026-05-13T11:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 5 — Approved
  (() => {
    const id = 'b2b-ord-005';
    const lines: B2BOrderLine[] = [
      line('b2bl-005a', id, 'prd-017', 'PST-CHL-017', 'Chlorpyrifos 20% EC', 80, 80, 'L', 320, 3, 18),
      line('b2bl-005b', id, 'prd-019', 'PST-MNC-019', 'Mancozeb 75% WP', 120, 120, 'Packet', 155, 2, 18),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.requestedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-TRL-20260515-005',
      retailerId: 'ret-006',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Approved',
      paymentTerms: 'Credit',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-05-22',
      deliveryAddress: 'Shop 3, Kishanpura Market, Hanamkonda – 506002',
      approvedByUserId: 'usr-008',
      approvedAt: '2026-05-16T10:00:00Z',
      createdAt: '2026-05-15T14:00:00Z',
      updatedAt: '2026-05-16T10:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 6 — UnderReview
  (() => {
    const id = 'b2b-ord-006';
    const lines: B2BOrderLine[] = [
      line('b2bl-006a', id, 'prd-004', 'SED-HMZ-004', 'Hybrid Maize Seed DKC-9108', 40, 40, 'Bag', 960, 4, 0),
      line('b2bl-006b', id, 'prd-012', 'NUT-BOR-012', 'Boron 20% Granular', 100, 100, 'Kg', 178, 0, 12),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.requestedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-TRL-20260519-006',
      retailerId: 'ret-007',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'UnderReview',
      paymentTerms: 'Credit',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-05-28',
      deliveryAddress: 'Plot 18, Manakondur Road, Karimnagar – 505001',
      createdAt: '2026-05-19T11:00:00Z',
      updatedAt: '2026-05-19T11:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 7 — Submitted
  (() => {
    const id = 'b2b-ord-007';
    const lines: B2BOrderLine[] = [
      line('b2bl-007a', id, 'prd-009', 'FRT-SSP-009', 'SSP (Single Super Phosphate) 50 Kg', 80, 80, 'Bag', 380, 0, 5),
      line('b2bl-007b', id, 'prd-020', 'PST-ACE-020', 'Acephate 75% SP', 60, 60, 'Packet', 220, 2, 18),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.requestedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-VID-20260521-007',
      retailerId: 'ret-004',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Submitted',
      paymentTerms: 'Advance',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-05-30',
      deliveryAddress: 'Gandhi Chowk, Hinganghat Road, Wardha – 442001',
      createdAt: '2026-05-21T15:00:00Z',
      updatedAt: '2026-05-21T15:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 8 — Draft
  (() => {
    const id = 'b2b-ord-008';
    const lines: B2BOrderLine[] = [
      line('b2bl-008a', id, 'prd-003', 'SED-WHT-003', 'Wheat Seed GW-322', 50, 50, 'Bag', 1050, 3, 0),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.requestedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-VID-20260524-008',
      retailerId: 'ret-001',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Draft',
      paymentTerms: 'Credit',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      deliveryAddress: 'Shop 12, Market Yard Road, Akola – 444001',
      createdAt: '2026-05-24T10:00:00Z',
      updatedAt: '2026-05-24T10:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 9 — Invoiced (older, Telangana zone)
  (() => {
    const id = 'b2b-ord-009';
    const lines: B2BOrderLine[] = [
      line('b2bl-009a', id, 'prd-014', 'NUT-HMC-014', 'Humic Acid 98% Granular', 50, 50, 'Kg', 285, 5, 12),
      line('b2bl-009b', id, 'prd-015', 'NUT-SEA-015', 'Seaweed Extract Liquid', 30, 30, 'L', 400, 5, 12),
      line('b2bl-009c', id, 'prd-018', 'PST-GLY-018', 'Glyphosate 41% SL', 50, 50, 'L', 260, 3, 18),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.allocatedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-TRL-20260218-009',
      retailerId: 'ret-005',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Invoiced',
      paymentTerms: 'Credit',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-02-25',
      deliveryAddress: 'APMC Yard, Subedari, Hanamkonda – 506001',
      approvedByUserId: 'usr-008',
      approvedAt: '2026-02-19T10:00:00Z',
      createdAt: '2026-02-18T09:00:00Z',
      updatedAt: '2026-03-05T12:00:00Z',
    } satisfies B2BOrder;
  })(),

  // 10 — Delivered (Nalgonda retailer)
  (() => {
    const id = 'b2b-ord-010';
    const lines: B2BOrderLine[] = [
      line('b2bl-010a', id, 'prd-005', 'SED-SFF-005', 'Sunflower Seed KBSH-44', 60, 60, 'Packet', 390, 2, 0),
      line('b2bl-010b', id, 'prd-013', 'NUT-FRS-013', 'Ferrous Sulphate 19% Heptahydrate', 150, 150, 'Kg', 44, 0, 12),
    ];
    const subtotalAmt = lines.reduce((s, l) => s + l.unitPrice * l.allocatedQty, 0);
    const discountAmt = lines.reduce((s, l) => s + l.lineDiscountAmt, 0);
    const taxAmt = lines.reduce((s, l) => s + l.taxAmt, 0);
    return {
      id,
      orderNo: 'B2B-TRL-20260505-010',
      retailerId: 'ret-008',
      salesExecUserId: 'usr-007',
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: 'Delivered',
      paymentTerms: 'BNPL',
      lines,
      subtotalAmt,
      discountAmt,
      taxAmt,
      totalAmt: parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2)),
      dispatchByDate: '2026-05-12',
      deliveryAddress: 'Market Road, Devarakonda, Nalgonda – 508248',
      approvedByUserId: 'usr-008',
      approvedAt: '2026-05-06T09:00:00Z',
      createdAt: '2026-05-05T11:00:00Z',
      updatedAt: '2026-05-16T14:00:00Z',
    } satisfies B2BOrder;
  })(),
];

/** Quick lookup map — order.id → B2BOrder. */
export const b2bOrderById = new Map(mockB2BOrders.map((o) => [o.id, o]));
