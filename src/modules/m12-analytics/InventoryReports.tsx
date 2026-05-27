import { useState, useMemo } from 'react';
import { Download, FileText, Mail, AlertTriangle } from 'lucide-react';
import { mockBatches } from '../../data/mockBatches';
import { mockProducts } from '../../data/mockProducts';
import { mockStores } from '../../data/mockStores';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Input';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = '2026-05-27';
const MS_PER_DAY = 86_400_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - new Date(TODAY).getTime()) / MS_PER_DAY);
}

const productById = new Map(mockProducts.map((p) => [p.id, p]));
const storeById   = new Map(mockStores.map((s) => [s.id, s]));

// Build units-sold per batchId from sale transactions
const unitsSoldByBatch: Record<string, number> = {};
for (const txn of mockSaleTransactions) {
  for (const line of txn.lines) {
    unitsSoldByBatch[line.batchId] = (unitsSoldByBatch[line.batchId] ?? 0) + line.qty;
  }
}

// ── Sub-tab ───────────────────────────────────────────────────────────────────

type SubTab = 'ledger' | 'cogs' | 'expiry' | 'movement';

// ── Export bar (shared) ───────────────────────────────────────────────────────

function ExportBar({ reportName }: { reportName: string }) {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <Button variant="secondary" size="sm" iconLeft={Download}
        onClick={() => console.log(`// GET /api/reports/${reportName}/csv`)}>
        CSV
      </Button>
      <Button variant="secondary" size="sm" iconLeft={FileText}
        onClick={() => console.log(`// GET /api/reports/${reportName}/pdf`)}>
        PDF
      </Button>
      <Button variant="secondary" size="sm" iconLeft={Mail}
        onClick={() => console.log('// POST /api/reports/schedule', { report: reportName })}>
        Schedule Email
      </Button>
    </div>
  );
}

// ── Stock Ledger ─────────────────────────────────────────────────────────────

function StockLedger() {
  const [storeId, setStoreId] = useState('All');

  const rows = useMemo(() => {
    // Group batches by productId, filtered by store/warehouse
    const map = new Map<string, { product: typeof mockProducts[0]; batches: typeof mockBatches }>();
    for (const b of mockBatches) {
      const loc = b.storeId ?? b.warehouseId ?? '';
      if (storeId !== 'All' && loc !== storeId) continue;
      if (!map.has(b.productId)) {
        const product = productById.get(b.productId);
        if (!product) continue;
        map.set(b.productId, { product, batches: [] });
      }
      map.get(b.productId)!.batches.push(b);
    }
    return [...map.values()].sort((a, b) => a.product.name.localeCompare(b.product.name));
  }, [storeId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div style={{ width: '200px' }}>
          <Select value={storeId} onChange={setStoreId}>
            <option value="All">All Locations</option>
            {mockStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="wh-ngp-001">Warehouse – Nagpur</option>
            <option value="wh-hyd-001">Warehouse – Hyderabad</option>
          </Select>
        </div>
        <ExportBar reportName="stock-ledger" />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Batch No</Th>
            <Th>Location</Th>
            <Th right>Current Qty</Th>
            <Th right>Reserved</Th>
            <Th right>Available</Th>
            <Th right>COGS / Unit</Th>
            <Th right>Stock Value</Th>
            <Th>Expiry</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ product, batches }) => (
            batches.map((b, bi) => {
              const loc = b.storeId
                ? (storeById.get(b.storeId)?.name ?? b.storeId)
                : b.warehouseId === 'wh-ngp-001' ? 'Warehouse – Nagpur' : 'Warehouse – Hyderabad';
              const available  = b.currentQty - b.reservedQty;
              const stockValue = b.currentQty * b.purchasePricePerUnit;
              const daysLeft   = daysUntil(b.expiryDate);
              const isExpiring = daysLeft <= 60;
              return (
                <Tr key={b.id} className={isExpiring ? 'bg-amber-50/50' : ''}>
                  {bi === 0 && (
                    <td
                      className="px-4 py-3 font-medium text-gray-800"
                      rowSpan={batches.length}
                      style={{ fontSize: '13px', borderBottom: '1px solid #f8fafc' }}
                    >
                      <p>{product.name}</p>
                      <p className="text-gray-400 font-normal text-xs">{product.sku}</p>
                    </td>
                  )}
                  <Td mono>{b.batchNo}</Td>
                  <Td muted><span className="max-w-[140px] truncate block">{loc}</span></Td>
                  <Td right>{b.currentQty}</Td>
                  <Td right muted>{b.reservedQty}</Td>
                  <Td right bold>{available}</Td>
                  <Td right>{fmt(b.purchasePricePerUnit)}</Td>
                  <Td right bold>{fmt(stockValue)}</Td>
                  <Td>
                    <span className={`text-[11px] font-medium ${isExpiring ? 'text-amber-600' : 'text-gray-500'}`}>
                      {b.expiryDate}
                      {isExpiring && <span className="ml-1">({daysLeft}d)</span>}
                    </span>
                  </Td>
                </Tr>
              );
            })
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">No stock data for selected location.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── COGS Report ───────────────────────────────────────────────────────────────

function COGSReport() {
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo,   setDateTo]   = useState('2026-05-27');

  const rows = useMemo(() => {
    // Gather sale lines for date range, group by batchId
    const batchSales: Record<string, { unitsSold: number; saleValue: number }> = {};
    for (const txn of mockSaleTransactions) {
      if (txn.invoiceDate < dateFrom || txn.invoiceDate > dateTo) continue;
      for (const line of txn.lines) {
        if (!batchSales[line.batchId]) batchSales[line.batchId] = { unitsSold: 0, saleValue: 0 };
        batchSales[line.batchId].unitsSold  += line.qty;
        batchSales[line.batchId].saleValue  += line.lineTotal;
      }
    }

    return Object.entries(batchSales).map(([batchId, { unitsSold, saleValue }]) => {
      const batch   = mockBatches.find((b) => b.id === batchId);
      const product = batch ? productById.get(batch.productId) : null;
      const cogs    = (batch?.purchasePricePerUnit ?? 0) * unitsSold;
      const margin  = saleValue > 0 ? ((saleValue - cogs) / saleValue) * 100 : 0;
      return { batchId, batchNo: batch?.batchNo ?? batchId, productName: product?.name ?? '—', unitsSold, cogs, saleValue, margin, purchaseRate: batch?.purchasePricePerUnit ?? 0 };
    }).sort((a, b) => b.saleValue - a.saleValue);
  }, [dateFrom, dateTo]);

  const totalCogs  = rows.reduce((s, r) => s + r.cogs, 0);
  const totalSale  = rows.reduce((s, r) => s + r.saleValue, 0);
  const avgMargin  = totalSale > 0 ? ((totalSale - totalCogs) / totalSale) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <ExportBar reportName="cogs" />
      </div>

      <div className="flex gap-3">
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total COGS</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalCogs)}</p>
        </Card>
        <Card padding="12px 16px">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Total Sale Value</p>
          <p className="text-lg font-bold text-gray-900">{fmt(totalSale)}</p>
        </Card>
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
          }}
        >
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">Avg Gross Margin</p>
          <p className="text-lg font-bold text-emerald-700">{avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Batch</Th>
            <Th right>Units Sold</Th>
            <Th right>Purchase Rate</Th>
            <Th right>COGS</Th>
            <Th right>Sale Value</Th>
            <Th right>Gross Margin</Th>
            <Th right>Margin %</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.batchId}>
              <Td>{r.productName}</Td>
              <Td mono>{r.batchNo}</Td>
              <Td right>{r.unitsSold}</Td>
              <Td right>{fmt(r.purchaseRate)}</Td>
              <Td right>{fmt(r.cogs)}</Td>
              <Td right bold>{fmt(r.saleValue)}</Td>
              <Td right><span className="text-emerald-700">{fmt(r.saleValue - r.cogs)}</span></Td>
              <Td right>
                <span className={`font-semibold ${r.margin >= 20 ? 'text-emerald-700' : r.margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                  {r.margin.toFixed(1)}%
                </span>
              </Td>
            </Tr>
          ))}
          <tr className="bg-gray-50 font-semibold border-t border-gray-200">
            <td colSpan={4} className="px-4 py-2.5 text-xs text-gray-600">Total</td>
            <td className="px-4 py-2.5 text-right text-xs text-gray-800">{fmt(totalCogs)}</td>
            <td className="px-4 py-2.5 text-right text-xs text-gray-800">{fmt(totalSale)}</td>
            <td className="px-4 py-2.5 text-right text-xs text-emerald-700">{fmt(totalSale - totalCogs)}</td>
            <td className="px-4 py-2.5 text-right text-xs text-emerald-700">{avgMargin.toFixed(1)}%</td>
          </tr>
          {rows.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">No sales data for selected period.</td></tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Near Expiry Report ────────────────────────────────────────────────────────

type ExpirySortKey = 'days' | 'product' | 'qty' | 'value';

function NearExpiryReport() {
  const [sortBy,    setSortBy]    = useState<ExpirySortKey>('days');
  const [threshold, setThreshold] = useState(60);

  const rows = useMemo(() => {
    return mockBatches
      .map((b) => {
        const d       = daysUntil(b.expiryDate);
        const product = productById.get(b.productId);
        const loc     = b.storeId
          ? (storeById.get(b.storeId)?.name ?? b.storeId)
          : b.warehouseId === 'wh-ngp-001' ? 'Warehouse – Nagpur' : 'Warehouse – Hyderabad';
        return { batch: b, product, daysLeft: d, loc, value: b.currentQty * b.purchasePricePerUnit };
      })
      .filter((r) => r.daysLeft >= 0 && r.daysLeft <= threshold)
      .sort((a, b) => {
        if (sortBy === 'days')    return a.daysLeft - b.daysLeft;
        if (sortBy === 'product') return (a.product?.name ?? '').localeCompare(b.product?.name ?? '');
        if (sortBy === 'qty')     return b.batch.currentQty - a.batch.currentQty;
        return b.value - a.value;
      });
  }, [sortBy, threshold]);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  function urgencyVariant(days: number): 'red' | 'amber' {
    return days <= 30 ? 'red' : 'amber';
  }

  function SortBtn({ id, label }: { id: ExpirySortKey; label: string }) {
    return (
      <button onClick={() => setSortBy(id)}
        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
          sortBy === id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}>{label}</button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <AlertTriangle size={13} className="text-amber-500" />
          Expiring within
          <div style={{ width: '120px' }}>
            <Select value={String(threshold)} onChange={(v) => setThreshold(Number(v))}>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </Select>
          </div>
        </div>
        <div className="flex gap-1">
          <SortBtn id="days"    label="Days ↑" />
          <SortBtn id="product" label="Product" />
          <SortBtn id="qty"     label="Qty ↓" />
          <SortBtn id="value"   label="Value ↓" />
        </div>
        <ExportBar reportName="near-expiry" />
      </div>

      {rows.length > 0 && (
        <div className="flex gap-3">
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
            }}
          >
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest">Batches at Risk</p>
            <p className="text-lg font-bold text-amber-700">{rows.length}</p>
          </div>
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
            }}
          >
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest">Value at Risk</p>
            <p className="text-lg font-bold text-amber-700">{fmt(totalValue)}</p>
          </div>
        </div>
      )}

      <TableWrap>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Batch No</Th>
            <Th>Location</Th>
            <Th right>Qty</Th>
            <Th right>Stock Value</Th>
            <Th>Expiry Date</Th>
            <Th right>Days Left</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ batch, product, daysLeft, loc, value }) => (
            <Tr key={batch.id}>
              <Td>{product?.name ?? '—'}</Td>
              <Td mono>{batch.batchNo}</Td>
              <Td muted><span className="max-w-[140px] truncate block">{loc}</span></Td>
              <Td right>{batch.currentQty}</Td>
              <Td right>{fmt(value)}</Td>
              <Td muted>{batch.expiryDate}</Td>
              <Td right>
                <Badge label={`${daysLeft}d`} variant={urgencyVariant(daysLeft)} />
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                No batches expiring within {threshold} days.
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}

// ── Stock Movement Report ─────────────────────────────────────────────────────

// GRN receipts are inferred from batch creation dates (mock only)
const MOCK_GRNS = [
  { grnId: 'grn-2025-001', productName: 'Urea (Neem Coated) 45 Kg', date: '2025-01-15', qty: 280,  type: 'GRN Received' },
  { grnId: 'grn-2025-006', productName: 'Urea (Neem Coated) 45 Kg', date: '2025-03-10', qty: 500,  type: 'GRN Received' },
  { grnId: 'grn-2025-007', productName: 'DAP 50 Kg',                date: '2025-03-20', qty: 400,  type: 'GRN Received' },
  { grnId: 'grn-2025-016', productName: 'Imidacloprid 70% WS',      date: '2025-03-01', qty: 200,  type: 'GRN Received' },
  { grnId: 'grn-2025-018', productName: 'Glyphosate 41% SL',        date: '2025-03-15', qty: 160,  type: 'GRN Received' },
];

const MOCK_ADJUSTMENTS = [
  { ref: 'ADJ-2026-001', productName: 'BT Cotton Seed',       date: '2026-04-10', qty: -8,   type: 'Damage Write-off' },
  { ref: 'ADJ-2026-002', productName: 'Soybean Seed JS-335',  date: '2026-04-20', qty: +20,  type: 'Transfer In' },
  { ref: 'ADJ-2026-003', productName: 'Mancozeb 75% WP',      date: '2026-05-05', qty: -5,   type: 'Audit Adjustment' },
];

function StockMovement() {
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo,   setDateTo]   = useState('2026-05-27');

  const salesMovement = useMemo(() => {
    const map: Record<string, { productName: string; unitsSold: number; saleValue: number }> = {};
    for (const txn of mockSaleTransactions) {
      if (txn.invoiceDate < dateFrom || txn.invoiceDate > dateTo) continue;
      for (const line of txn.lines) {
        const key = line.productName;
        if (!map[key]) map[key] = { productName: key, unitsSold: 0, saleValue: 0 };
        map[key].unitsSold += line.qty;
        map[key].saleValue += line.lineTotal;
      }
    }
    return Object.values(map).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [dateFrom, dateTo]);

  const filteredGrns = MOCK_GRNS.filter((g) => g.date >= dateFrom && g.date <= dateTo);
  const filteredAdj  = MOCK_ADJUSTMENTS.filter((a) => a.date >= dateFrom && a.date <= dateTo);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <ExportBar reportName="stock-movement" />
      </div>

      {/* GRNs received */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">GRNs Received ({filteredGrns.length})</h3>
        <TableWrap>
          <thead>
            <tr>
              <Th>GRN</Th>
              <Th>Product</Th>
              <Th>Date</Th>
              <Th right>Qty Received</Th>
              <Th>Type</Th>
            </tr>
          </thead>
          <tbody>
            {filteredGrns.map((g) => (
              <Tr key={g.grnId}>
                <Td mono>{g.grnId}</Td>
                <Td>{g.productName}</Td>
                <Td muted>{g.date}</Td>
                <Td right><span className="font-semibold text-emerald-700">+{g.qty}</span></Td>
                <Td><Badge label={g.type} variant="green" /></Td>
              </Tr>
            ))}
            {filteredGrns.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">No GRNs in period.</td></tr>}
          </tbody>
        </TableWrap>
      </div>

      {/* Sales deductions */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sales Deductions (top products)</h3>
        <TableWrap>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th right>Units Sold</Th>
              <Th right>Sale Value</Th>
              <Th>Type</Th>
            </tr>
          </thead>
          <tbody>
            {salesMovement.map((r) => (
              <Tr key={r.productName}>
                <Td>{r.productName}</Td>
                <Td right><span className="font-semibold text-red-600">−{r.unitsSold}</span></Td>
                <Td right>{fmt(r.saleValue)}</Td>
                <Td><Badge label="B2C Sale" variant="blue" /></Td>
              </Tr>
            ))}
            {salesMovement.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No sales in period.</td></tr>}
          </tbody>
        </TableWrap>
      </div>

      {/* Adjustments */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Adjustments & Transfers ({filteredAdj.length})</h3>
        <TableWrap>
          <thead>
            <tr>
              <Th>Ref</Th>
              <Th>Product</Th>
              <Th>Date</Th>
              <Th right>Qty</Th>
              <Th>Type</Th>
            </tr>
          </thead>
          <tbody>
            {filteredAdj.map((a) => (
              <Tr key={a.ref}>
                <Td mono>{a.ref}</Td>
                <Td>{a.productName}</Td>
                <Td muted>{a.date}</Td>
                <Td right>
                  <span className={`font-semibold ${a.qty > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {a.qty > 0 ? `+${a.qty}` : String(a.qty)}
                  </span>
                </Td>
                <Td><Badge label={a.type} variant="purple" /></Td>
              </Tr>
            ))}
            {filteredAdj.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">No adjustments in period.</td></tr>}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function InventoryReports() {
  const [sub, setSub] = useState<SubTab>('ledger');

  const SUB_TABS: { id: SubTab; label: string }[] = [
    { id: 'ledger',   label: 'Stock Ledger'   },
    { id: 'cogs',     label: 'COGS Report'    },
    { id: 'expiry',   label: 'Near Expiry'    },
    { id: 'movement', label: 'Stock Movement' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {SUB_TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setSub(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              sub === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}</button>
        ))}
      </div>

      {sub === 'ledger'   && <StockLedger />}
      {sub === 'cogs'     && <COGSReport />}
      {sub === 'expiry'   && <NearExpiryReport />}
      {sub === 'movement' && <StockMovement />}
    </div>
  );
}
