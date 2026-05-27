// PurchaseOrderForm — create PO from approved PR or manually
// GST validation: warns if user-entered rate differs from product catalogue rate

import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Send } from 'lucide-react';
import { mockProducts } from '../../data/mockProducts';
import { mockStores } from '../../data/mockStores';
import { mockSuppliers } from '../../data/mockSuppliers';
import { useAuth } from '../../context/AuthContext';
import type { PurchaseRequisition, PurchaseOrder, POLine } from './types';

const TODAY = '2026-05-27';
const WAREHOUSE_ID = 'wh-ngp-001';
const WAREHOUSE_LABEL = 'Central Warehouse – Nagpur';

const GST_OPTIONS = [0, 5, 12, 18, 28];

function fmt(n: number) {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// ── Local form types ──────────────────────────────────────────────────────────

interface LineForm {
  id: string;
  productId: string;
  quantity: string;
  unitRate: string;
  gstRatePct: string;      // user-entered
  catalogueGstPct: number; // from product, for mismatch check
  hsnCode: string;
  unit: string;
}

function blankLine(): LineForm {
  return {
    id: `line-${Date.now()}-${Math.random()}`,
    productId: '',
    quantity: '',
    unitRate: '',
    gstRatePct: '0',
    catalogueGstPct: 0,
    hsnCode: '',
    unit: '',
  };
}

function lineFromPRLine(
  prLine: PurchaseRequisition['lines'][number],
): LineForm {
  const product = mockProducts.find(p => p.id === prLine.productId);
  return {
    id: `line-${Date.now()}-${prLine.productId}`,
    productId: prLine.productId,
    quantity: String(prLine.requestedQty),
    unitRate: String(prLine.estimatedUnitPrice),
    gstRatePct: String(product?.taxSlabPct ?? 0),
    catalogueGstPct: product?.taxSlabPct ?? 0,
    hsnCode: product?.hsnCode ?? '',
    unit: prLine.unit,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  approvedPRs: PurchaseRequisition[];
  initialPRId?: string;
  poCount: number;
  onSave: (po: PurchaseOrder) => void;
  onCancel: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PurchaseOrderForm({ approvedPRs, initialPRId, poCount, onSave, onCancel }: Props) {
  const { currentUser } = useAuth();
  const defaultStoreId = currentUser.assignedStoreIds[0] ?? mockStores[0]?.id ?? '';

  const [selectedPRId, setSelectedPRId] = useState(initialPRId ?? '');
  const [storeId, setStoreId]           = useState(defaultStoreId);
  const [supplierId, setSupplierId]     = useState(mockSuppliers[0].id);
  const [poDate, setPoDate]             = useState(TODAY);
  const [lines, setLines]               = useState<LineForm[]>([blankLine()]);

  // When a PR is selected, populate lines from it
  useEffect(() => {
    if (!selectedPRId) { setLines([blankLine()]); return; }
    const pr = approvedPRs.find(p => p.id === selectedPRId);
    if (!pr) return;
    setStoreId(pr.storeId === WAREHOUSE_ID ? pr.storeId : pr.storeId);
    setLines(pr.lines.map(l => lineFromPRLine(l)));
  }, [selectedPRId, approvedPRs]);

  // ── Line handlers ────────────────────────────────────────────────────────────

  function addLine() {
    setLines(prev => [...prev, blankLine()]);
  }

  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l.id !== id));
  }

  function updateLine(id: string, field: keyof LineForm, value: string) {
    setLines(prev =>
      prev.map(l => {
        if (l.id !== id) return l;
        if (field === 'productId') {
          const product = mockProducts.find(p => p.id === value);
          return {
            ...l,
            productId: value,
            unitRate: product ? String(product.b2bPrice) : '',
            gstRatePct: product ? String(product.taxSlabPct) : '0',
            catalogueGstPct: product?.taxSlabPct ?? 0,
            hsnCode: product?.hsnCode ?? '',
            unit: product?.unit ?? '',
          };
        }
        return { ...l, [field]: value };
      }),
    );
  }

  // ── Computed totals ──────────────────────────────────────────────────────────

  const computed = useMemo(() => {
    let subtotal = 0, totalGst = 0;
    const lineCalcs = lines.map(l => {
      const qty  = parseFloat(l.quantity) || 0;
      const rate = parseFloat(l.unitRate) || 0;
      const gst  = parseFloat(l.gstRatePct) || 0;
      const lineBase = qty * rate;
      const lineGst  = Math.round(lineBase * gst) / 100;
      const lineTotal = lineBase + lineGst;
      const hasMismatch = Number(l.gstRatePct) !== l.catalogueGstPct && l.productId !== '';
      subtotal += lineBase;
      totalGst += lineGst;
      return { lineBase, lineGst, lineTotal, hasMismatch };
    });
    const cgst = Math.round(totalGst / 2);
    const sgst = Math.round(totalGst / 2);
    return { lineCalcs, subtotal, totalGst, cgst, sgst, grandTotal: subtotal + totalGst };
  }, [lines]);

  // ── Submit ───────────────────────────────────────────────────────────────────

  function handleSend() {
    const validLines = lines.filter(l => l.productId && parseFloat(l.quantity) > 0);
    if (validLines.length === 0) return;
    const supplier = mockSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const storeName = storeId === WAREHOUSE_ID
      ? WAREHOUSE_LABEL
      : mockStores.find(s => s.id === storeId)?.name ?? storeId;
    const storeCode = storeId === WAREHOUSE_ID ? 'NGP-WH'
      : mockStores.find(s => s.id === storeId)?.code ?? 'STR';
    const seq = String(poCount + 1).padStart(3, '0');

    const poLines: POLine[] = validLines.map((l, i) => {
      const product = mockProducts.find(p => p.id === l.productId);
      const qty  = parseFloat(l.quantity);
      const rate = parseFloat(l.unitRate) || 0;
      const gst  = parseFloat(l.gstRatePct) || 0;
      const lineBase  = qty * rate;
      const gstAmt    = Math.round(lineBase * gst) / 100;
      return {
        id: `pol-${Date.now()}-${i}`,
        productId: l.productId,
        productName: product?.name ?? l.productId,
        hsnCode: l.hsnCode,
        unit: l.unit || (product?.unit ?? ''),
        quantity: qty,
        unitRate: rate,
        gstRatePct: gst,
        catalogueGstPct: l.catalogueGstPct,
        gstAmt,
        lineTotal: lineBase + gstAmt,
      };
    });

    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNo: `PO-${storeCode}-${poDate.replace(/-/g, '')}-${seq}`,
      date: poDate,
      storeId,
      storeName,
      prId: selectedPRId || undefined,
      supplierId,
      supplierName: supplier.name,
      lines: poLines,
      subtotalAmt: Math.round(computed.subtotal),
      cgstAmt: computed.cgst,
      sgstAmt: computed.sgst,
      totalAmt: Math.round(computed.grandTotal),
      status: 'Sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    console.log('// POST /api/procurement/purchase-orders', po);
    console.log('// WhatsApp/Email dispatch →', supplier.email, supplier.phone);
    onSave(po);
  }

  const usedProductIds = new Set(lines.map(l => l.productId).filter(Boolean));
  const canSend = lines.some(l => l.productId && parseFloat(l.quantity) > 0);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Purchase Order Details</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Source PR (optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Source PR (optional)</label>
            <select
              value={selectedPRId}
              onChange={e => setSelectedPRId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">— Create manually —</option>
              {approvedPRs.map(pr => (
                <option key={pr.id} value={pr.id}>
                  {pr.prNo} · {pr.storeName.replace('Bharat Agri Store – ', '')} · ₹{fmt(pr.totalEstimatedValue)}
                </option>
              ))}
            </select>
          </div>
          {/* PO date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">PO Date</label>
            <input
              type="date"
              value={poDate}
              onChange={e => setPoDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {/* Store/Warehouse */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Deliver To</label>
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <optgroup label="Warehouse">
                <option value={WAREHOUSE_ID}>{WAREHOUSE_LABEL}</option>
              </optgroup>
              <optgroup label="Stores">
                {mockStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>
            </select>
          </div>
          {/* Supplier */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {mockSuppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Supplier detail */}
        {supplierId && (
          <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center gap-4">
            {(() => {
              const s = mockSuppliers.find(x => x.id === supplierId);
              return s ? (
                <>
                  <span>GSTIN: <span className="font-mono text-gray-700">{s.gstin}</span></span>
                  <span>Contact: {s.contact}</span>
                  <span>{s.phone}</span>
                </>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Line Items</h3>
          <button
            onClick={addLine}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus size={13} /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wide">
                {['Product', 'HSN', 'Qty', 'Unit Rate (₹)', 'GST %', 'GST Amt', 'Line Total', ''].map(h => (
                  <th key={h} className="pb-2 px-1 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lines.map((l, i) => {
                const c = computed.lineCalcs[i];
                return (
                  <tr key={l.id} className="group align-top">
                    {/* Product */}
                    <td className="py-2 px-1 w-56">
                      <select
                        value={l.productId}
                        onChange={e => updateLine(l.id, 'productId', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="">Select…</option>
                        {mockProducts
                          .filter(p => p.isActive && (!usedProductIds.has(p.id) || p.id === l.productId))
                          .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    {/* HSN (read-only) */}
                    <td className="py-2 px-1 w-16">
                      <div className="border border-gray-100 rounded-lg px-2 py-1.5 bg-gray-50 font-mono text-gray-500">
                        {l.hsnCode || '—'}
                      </div>
                    </td>
                    {/* Qty */}
                    <td className="py-2 px-1 w-20">
                      <input
                        type="number" min={1} step={1}
                        value={l.quantity}
                        onChange={e => updateLine(l.id, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    {/* Unit Rate */}
                    <td className="py-2 px-1 w-24">
                      <input
                        type="number" min={0} step={0.01}
                        value={l.unitRate}
                        onChange={e => updateLine(l.id, 'unitRate', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    {/* GST % */}
                    <td className="py-2 px-1 w-20">
                      <div>
                        <select
                          value={l.gstRatePct}
                          onChange={e => updateLine(l.id, 'gstRatePct', e.target.value)}
                          className={`w-full border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 ${
                            c?.hasMismatch
                              ? 'border-red-400 bg-red-50 focus:ring-red-400'
                              : 'border-gray-200 focus:ring-emerald-500'
                          }`}
                        >
                          {GST_OPTIONS.map(r => (
                            <option key={r} value={String(r)}>{r}%</option>
                          ))}
                        </select>
                        {c?.hasMismatch && (
                          <div className="flex items-start gap-1 mt-1 text-red-600">
                            <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />
                            <span style={{ fontSize: '9px' }} className="leading-tight">
                              GST rate mismatch — catalogue: {l.catalogueGstPct}%. Verify before sending.
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* GST Amt */}
                    <td className="py-2 px-1 text-right text-gray-600 font-mono whitespace-nowrap">
                      {c && c.lineBase > 0 ? `₹${fmt(c.lineGst)}` : '—'}
                    </td>
                    {/* Line Total */}
                    <td className="py-2 px-1 text-right font-semibold text-gray-800 font-mono whitespace-nowrap">
                      {c && c.lineTotal > 0 ? `₹${fmt(c.lineTotal)}` : '—'}
                    </td>
                    {/* Remove */}
                    <td className="py-2 px-1">
                      <button
                        onClick={() => removeLine(l.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* GST breakup + total */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex justify-end">
            <div className="w-56 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal (excl. GST)</span>
                <span className="font-mono">₹{fmt(computed.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>CGST</span>
                <span className="font-mono">₹{fmt(computed.cgst)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>SGST</span>
                <span className="font-mono">₹{fmt(computed.sgst)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Total</span>
                <span className="font-mono">₹{fmt(computed.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={14} /> Send to Supplier
        </button>
      </div>
    </div>
  );
}
