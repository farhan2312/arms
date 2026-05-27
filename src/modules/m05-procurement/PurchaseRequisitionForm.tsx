// PurchaseRequisitionForm — raise a new PR for store or warehouse replenishment

import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, Info, Lock, TrendingDown } from 'lucide-react';
import { mockBatches } from '../../data/mockBatches';
import { mockProducts } from '../../data/mockProducts';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import { mockStores } from '../../data/mockStores';
import { useAuth } from '../../context/AuthContext';
import type { PRLine, PRUrgency, PurchaseRequisition } from './types';

const TODAY = '2026-05-27';
const FOURTEEN_DAYS_AGO = '2026-05-13';
const WAREHOUSE_ID = 'wh-ngp-001';
const WAREHOUSE_LABEL = 'Central Warehouse – Nagpur';

// ── Stock & sales helpers ─────────────────────────────────────────────────────

function getStock(productId: string, locationId: string, isWarehouse: boolean): number {
  return mockBatches
    .filter(b =>
      b.productId === productId &&
      (isWarehouse ? b.warehouseId === locationId : b.storeId === locationId),
    )
    .reduce((s, b) => s + b.currentQty, 0);
}

function getAvgDailySales(productId: string, storeId: string): number {
  let totalQty = 0;
  mockSaleTransactions
    .filter(
      t =>
        t.storeId === storeId &&
        t.invoiceDate >= FOURTEEN_DAYS_AGO &&
        t.invoiceDate <= TODAY &&
        t.status !== 'Cancelled',
    )
    .forEach(t =>
      t.lines.filter(l => l.productId === productId).forEach(l => { totalQty += l.qty; }),
    );
  return Math.round((totalQty / 14) * 100) / 100;
}

function getSuggested(avg: number, stock: number): number {
  return Math.max(0, Math.round(avg * 14 - stock));
}

// ── B2B demand signal ─────────────────────────────────────────────────────────

interface DemandSignal {
  productId: string;
  productName: string;
  neededQty: number;
}

function getB2BSignals(locationId: string, productIds: string[]): DemandSignal[] {
  const pending = mockB2BOrders.filter(
    o =>
      o.fulfillmentStoreId === locationId &&
      ['Submitted', 'UnderReview', 'Approved', 'Allocated'].includes(o.status),
  );
  const signals: Record<string, DemandSignal> = {};
  pending.forEach(o =>
    o.lines.forEach(l => {
      if (productIds.includes(l.productId)) {
        const key = l.productId;
        signals[key] = {
          productId: key,
          productName: l.productName,
          neededQty: (signals[key]?.neededQty ?? 0) + l.requestedQty,
        };
      }
    }),
  );
  return Object.values(signals);
}

// ── Local row type ────────────────────────────────────────────────────────────

interface PRRowState {
  id: string;
  productId: string;
  requestedQty: string;
}

function buildPRLine(
  productId: string,
  requestedQty: number,
  locationId: string,
  isWarehouse: boolean,
): PRLine | null {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) return null;
  const currentStock = getStock(productId, locationId, isWarehouse);
  const avgDailySales = isWarehouse ? 0 : getAvgDailySales(productId, locationId);
  const suggestedQty = getSuggested(avgDailySales, currentStock);
  return {
    productId,
    productName: product.name,
    unit: product.unit,
    currentStock,
    avgDailySales,
    suggestedQty,
    requestedQty,
    estimatedUnitPrice: product.b2bPrice,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onSubmit: (pr: PurchaseRequisition) => void;
  prCount: number;   // used to generate PR number
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PurchaseRequisitionForm({ onSubmit, prCount }: Props) {
  const { currentUser } = useAuth();
  const isWarehouseManager = currentUser.role === 'WarehouseManager';
  const isStoreIncharge    = currentUser.role === 'StoreIncharge';
  const defaultLocationId  = isWarehouseManager
    ? WAREHOUSE_ID
    : (currentUser.assignedStoreIds[0] ?? mockStores[0].id);

  const [locationId, setLocationId] = useState(defaultLocationId);
  const [urgency, setUrgency]       = useState<PRUrgency>('Normal');
  const [notes, setNotes]           = useState('');
  const [rows, setRows]             = useState<PRRowState[]>([
    { id: `row-${Date.now()}`, productId: '', requestedQty: '' },
  ]);

  const isWarehouse = locationId === WAREHOUSE_ID;
  const locationName = isWarehouse
    ? WAREHOUSE_LABEL
    : mockStores.find(s => s.id === locationId)?.name ?? locationId;

  // Resolve live stats for each row
  const resolvedRows = useMemo(() =>
    rows.map(r => {
      if (!r.productId) return { ...r, line: null };
      const product = mockProducts.find(p => p.id === r.productId);
      if (!product) return { ...r, line: null };
      const currentStock  = getStock(r.productId, locationId, isWarehouse);
      const avgDailySales = isWarehouse ? 0 : getAvgDailySales(r.productId, locationId);
      const suggestedQty  = getSuggested(avgDailySales, currentStock);
      return { ...r, line: { product, currentStock, avgDailySales, suggestedQty } };
    }),
  [rows, locationId, isWarehouse]);

  // B2B demand signals for selected products
  const selectedProductIds = rows.map(r => r.productId).filter(Boolean);
  const b2bSignals = useMemo(
    () => getB2BSignals(locationId, selectedProductIds),
    [locationId, selectedProductIds],
  );

  // Estimated total
  const estimatedTotal = useMemo(() => {
    return resolvedRows.reduce((sum, r) => {
      if (!r.line) return sum;
      const qty = parseFloat(r.requestedQty) || 0;
      return sum + qty * r.line.product.b2bPrice;
    }, 0);
  }, [resolvedRows]);

  // ── Row handlers ────────────────────────────────────────────────────────────

  function addRow() {
    setRows(prev => [...prev, { id: `row-${Date.now()}`, productId: '', requestedQty: '' }]);
  }

  function removeRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  function updateRow(id: string, field: keyof PRRowState, value: string) {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        // When product changes, reset requestedQty
        if (field === 'productId') return { ...r, productId: value, requestedQty: '' };
        return { ...r, [field]: value };
      }),
    );
  }

  // Set requested qty to suggested
  function applySuggested(id: string, qty: number) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, requestedQty: String(qty) } : r));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  function handleSubmit() {
    const lines: PRLine[] = [];
    for (const r of resolvedRows) {
      const qty = parseFloat(r.requestedQty) || 0;
      if (!r.productId || qty <= 0) continue;
      const line = buildPRLine(r.productId, qty, locationId, isWarehouse);
      if (line) lines.push(line);
    }
    if (lines.length === 0) return;

    const storeCode = isWarehouse
      ? 'NGP-WH'
      : (mockStores.find(s => s.id === locationId)?.code ?? 'STR');
    const seq = String(prCount + 1).padStart(3, '0');
    const pr: PurchaseRequisition = {
      id: `pr-${Date.now()}`,
      prNo: `PR-${storeCode}-${TODAY.replace(/-/g, '')}-${seq}`,
      date: TODAY,
      storeId: locationId,
      storeName: locationName,
      raisedByUserId: currentUser.id,
      urgency,
      notes,
      lines,
      totalEstimatedValue: Math.round(
        lines.reduce((s, l) => s + l.requestedQty * l.estimatedUnitPrice, 0),
      ),
      status: 'Pending Approval',
      createdAt: new Date().toISOString(),
    };
    console.log('// POST /api/procurement/purchase-requisitions', pr);
    onSubmit(pr);
    setRows([{ id: `row-${Date.now()}`, productId: '', requestedQty: '' }]);
    setNotes('');
    setUrgency('Normal');
  }

  const canSubmit = resolvedRows.some(r => r.line && parseFloat(r.requestedQty) > 0);

  // Already-selected product IDs (for de-duplication in dropdown)
  const usedProductIds = new Set(rows.map(r => r.productId).filter(Boolean));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Location + Urgency */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Requisition Details</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isWarehouse ? 'Warehouse' : 'Store'}
              {(isStoreIncharge || isWarehouseManager) && (
                <Lock size={10} className="inline ml-1 text-gray-400" />
              )}
            </label>
            {isStoreIncharge || isWarehouseManager ? (
              <div className="border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600">
                {locationName}
              </div>
            ) : (
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <optgroup label="Warehouse">
                  <option value={WAREHOUSE_ID}>{WAREHOUSE_LABEL}</option>
                </optgroup>
                <optgroup label="Stores">
                  {mockStores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Urgency</label>
            <select
              value={urgency}
              onChange={e => setUrgency(e.target.value as PRUrgency)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* B2B demand signals */}
      {b2bSignals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">B2B Demand Signals</span>
          </div>
          {b2bSignals.map(sig => (
            <p key={sig.productId} className="text-xs text-amber-700">
              B2B demand signal: <strong>{sig.neededQty} {mockProducts.find(p => p.id === sig.productId)?.unit}</strong>{' '}
              of <strong>{sig.productName}</strong> needed from pending B2B orders at this location.
            </p>
          ))}
        </div>
      )}

      {/* Product rows */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Products to Order</h3>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Plus size={13} /> Add Product Row
          </button>
        </div>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Product', 'Current Stock', 'Avg Daily Sales', 'Suggested Qty', 'Requested Qty', ''].map(h => (
                  <th key={h} className="pb-2 px-1 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resolvedRows.map(r => (
                <tr key={r.id} className="group">
                  {/* Product selector */}
                  <td className="py-2 px-1 w-64">
                    <select
                      value={r.productId}
                      onChange={e => updateRow(r.id, 'productId', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select product…</option>
                      {mockProducts
                        .filter(p => p.isActive && (!usedProductIds.has(p.id) || p.id === r.productId))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                  </td>
                  {/* Current stock */}
                  <td className="py-2 px-1 text-center text-xs text-gray-600 font-mono">
                    {r.line ? (
                      <span className={r.line.currentStock === 0 ? 'text-red-500 font-semibold' : ''}>
                        {r.line.currentStock} {r.line.product.unit}
                      </span>
                    ) : '—'}
                  </td>
                  {/* Avg daily sales */}
                  <td className="py-2 px-1 text-center text-xs text-gray-600 font-mono">
                    {r.line ? `${r.line.avgDailySales.toFixed(1)}/day` : '—'}
                  </td>
                  {/* Suggested qty */}
                  <td className="py-2 px-1 text-center">
                    {r.line ? (
                      <button
                        onClick={() => applySuggested(r.id, r.line!.suggestedQty)}
                        title="Click to apply"
                        className="text-xs text-emerald-600 font-semibold hover:underline font-mono"
                      >
                        {r.line.suggestedQty}
                      </button>
                    ) : '—'}
                  </td>
                  {/* Requested qty */}
                  <td className="py-2 px-1 w-28">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={r.requestedQty}
                      onChange={e => updateRow(r.id, 'requestedQty', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  {/* Remove */}
                  <td className="py-2 px-1">
                    <button
                      onClick={() => removeRow(r.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Estimated total */}
        {estimatedTotal > 0 && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-3 mt-3">
            <span className="text-xs text-gray-500">Estimated Total Value:</span>
            <span className="text-sm font-bold text-gray-900 font-mono">
              ₹{estimatedTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Justification</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Add context for the approver — seasonal demand, crop advisory push, stock-out risk…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-1.5 text-[10px] text-gray-400 max-w-xs">
          <Info size={11} className="flex-shrink-0 mt-0.5" />
          <span>PR will be routed to BDM for approval. Urgent PRs are flagged for same-day review.</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {urgency === 'Urgent' && <AlertTriangle size={14} />}
          Submit PR
        </button>
      </div>
    </div>
  );
}
