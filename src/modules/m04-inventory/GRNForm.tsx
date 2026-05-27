// GRN Form — Goods Receipt Note
// On save: batch added to local state; toast shown
// POST /api/grn when backend ready

import { useState, useId } from 'react';
import { Plus, Trash2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { mockProducts, productById } from '../../data/mockProducts';
import { mockStores } from '../../data/mockStores';
import { useAuth } from '../../context/AuthContext';
import type { Batch } from '../../types/entities';
import { WAREHOUSES, type Location } from './StockLedger';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GRNLine {
  lineId: string;
  productId: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  mrp: number;
  purchaseRate: number;
  gstPct: number;
}

interface GRNFormProps {
  onBatchesAdded: (batches: Batch[]) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeEmptyLine(lineId: string): GRNLine {
  return { lineId, productId: '', batchNo: '', mfgDate: '', expiryDate: '', quantity: 0, mrp: 0, purchaseRate: 0, gstPct: 0 };
}

function lineValue(line: GRNLine): number {
  const taxableBase = line.purchaseRate * line.quantity;
  const gst         = taxableBase * line.gstPct / 100;
  return parseFloat((taxableBase + gst).toFixed(2));
}

const ALL_LOCATIONS: Location[] = [
  ...mockStores.map(s => ({ id: s.id, name: s.name.replace('Bharat Agri Store – ', ''), type: 'store' as const })),
  ...WAREHOUSES,
];

// ── Main component ────────────────────────────────────────────────────────────

export default function GRNForm({ onBatchesAdded }: GRNFormProps) {
  const uid = useId();
  const { currentStore } = useAuth();
  const toast = useToast();

  // Header fields
  const [supplierName,  setSupplierName]  = useState('');
  const [invoiceNo,     setInvoiceNo]     = useState('');
  const [invoiceDate,   setInvoiceDate]   = useState('2026-05-26');
  const [hasPO,         setHasPO]         = useState(true);
  const [poRef,         setPoRef]         = useState('');
  const [receivingId,   setReceivingId]   = useState<string>(currentStore?.id ?? WAREHOUSES[0]?.id ?? '');

  // Line items
  const [lines, setLines] = useState<GRNLine[]>([makeEmptyLine(`${uid}-0`)]);

  const [errors, setErrors]   = useState<string[]>([]);
  const [grnCounter, setGrnCounter] = useState(1);

  // ── Line helpers ────────────────────────────────────────────────────────────
  function addLine() {
    setLines(prev => [...prev, makeEmptyLine(`${uid}-${prev.length}`)]);
  }

  function removeLine(lineId: string) {
    setLines(prev => prev.filter(l => l.lineId !== lineId));
  }

  function updateLine<K extends keyof GRNLine>(lineId: string, field: K, value: GRNLine[K]) {
    setLines(prev => prev.map(l => {
      if (l.lineId !== lineId) return l;
      const updated = { ...l, [field]: value };
      // Auto-fill MRP and GST when product is selected
      if (field === 'productId' && typeof value === 'string') {
        const p = productById.get(value);
        if (p) {
          updated.mrp    = p.mrp;
          updated.gstPct = p.taxSlabPct;
        }
      }
      return updated;
    }));
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): string[] {
    const errs: string[] = [];
    if (!supplierName.trim()) errs.push('Supplier name is required.');
    if (!invoiceNo.trim())    errs.push('Invoice number is required.');
    if (!invoiceDate)         errs.push('Invoice date is required.');
    if (!receivingId)         errs.push('Select a receiving location.');
    if (lines.length === 0)   errs.push('Add at least one line item.');

    lines.forEach((l, i) => {
      if (!l.productId)      errs.push(`Line ${i + 1}: Select a product.`);
      if (!l.batchNo.trim()) errs.push(`Line ${i + 1}: Batch number is required.`);
      if (!l.expiryDate)     errs.push(`Line ${i + 1}: Expiry date is required.`);
      if (l.quantity <= 0)   errs.push(`Line ${i + 1}: Quantity must be > 0.`);
      if (l.purchaseRate <= 0) errs.push(`Line ${i + 1}: Purchase rate must be > 0.`);
    });
    return errs;
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  function handleSave() {
    setErrors([]);
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }

    const grnId = `grn-${invoiceDate.replace(/-/g, '')}-${String(grnCounter).padStart(3, '0')}`;
    const isWh  = WAREHOUSES.some(w => w.id === receivingId);

    const newBatches: Batch[] = lines.map((l, i) => ({
      id:                   `bat-new-${Date.now()}-${i}`,
      productId:            l.productId,
      grnId,
      batchNo:              l.batchNo,
      mfgDate:              l.mfgDate || invoiceDate,
      expiryDate:           l.expiryDate,
      purchasePricePerUnit: l.purchaseRate,
      currentQty:           l.quantity,
      reservedQty:          0,
      ...(isWh ? { warehouseId: receivingId } : { storeId: receivingId }),
      createdAt:            new Date().toISOString(),
    }));

    // POST /api/grn { supplierName, invoiceNo, invoiceDate, poRef, receivingId, lines } when backend ready
    console.log('// POST /api/grn', { grnId, supplierName, invoiceNo, invoiceDate, poRef: hasPO ? poRef : null, receivingId, lines });

    onBatchesAdded(newBatches);
    setGrnCounter(n => n + 1);
    toast.success(`GRN ${grnId} recorded. ${newBatches.length} batch${newBatches.length !== 1 ? 'es' : ''} added to stock.`);

    // Reset form
    setSupplierName('');
    setInvoiceNo('');
    setPoRef('');
    setHasPO(true);
    setLines([makeEmptyLine(`${uid}-reset-0`)]);
  }

  const totalValue = lines.reduce((s, l) => s + lineValue(l), 0);

  return (
    <div className="space-y-5">

      {/* ── No-PO warning banner ─────────────────────────────────────────── */}
      {!hasPO && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">No PO linked</span> — this GRN will be flagged for Finance review.
            Purchase orders should be raised before goods are received.
          </p>
        </div>
      )}


      {/* ── Validation errors ─────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-red-700">• {e}</p>
          ))}
        </div>
      )}

      {/* ── Header fields ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">GRN Details</h3>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* Supplier */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              placeholder="e.g. Mahyco Seeds Ltd"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Invoice no */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Invoice No. <span className="text-red-500">*</span>
            </label>
            <input
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              placeholder="e.g. MH/2026/5421"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Invoice date */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Receiving location */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Receiving Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={receivingId}
                onChange={e => setReceivingId(e.target.value)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select location…</option>
                <optgroup label="Stores">
                  {mockStores.map(s => <option key={s.id} value={s.id}>{s.name.replace('Bharat Agri Store – ', '')}</option>)}
                </optgroup>
                <optgroup label="Warehouses">
                  {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </optgroup>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* PO reference */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              PO Reference
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={hasPO}
                onChange={e => setHasPO(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-gray-600 mr-2">Has PO?</span>
              {hasPO && (
                <input
                  value={poRef}
                  onChange={e => setPoRef(e.target.value)}
                  placeholder="PO-2026-XXX"
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Line items ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Line Items</h3>
          <button
            onClick={addLine}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            <Plus size={13} /> Add Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                <th className="text-left px-3 py-2.5 min-w-48">Product</th>
                <th className="text-left px-3 py-2.5 min-w-32">Batch No.</th>
                <th className="text-left px-3 py-2.5 min-w-28">Mfg Date</th>
                <th className="text-left px-3 py-2.5 min-w-28">Expiry Date</th>
                <th className="text-right px-3 py-2.5 min-w-20">Qty</th>
                <th className="text-right px-3 py-2.5 min-w-24">MRP (₹)</th>
                <th className="text-right px-3 py-2.5 min-w-24">Purchase (₹)</th>
                <th className="text-right px-3 py-2.5 min-w-16">GST %</th>
                <th className="text-right px-3 py-2.5 min-w-24">Line Value</th>
                <th className="px-3 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lines.map((line, _i) => {
                const product = line.productId ? productById.get(line.productId) : undefined;
                return (
                  <tr key={line.lineId} className="align-top">
                    {/* Product selector */}
                    <td className="px-3 py-2">
                      <select
                        value={line.productId}
                        onChange={e => updateLine(line.lineId, 'productId', e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">Select product…</option>
                        {['Seed', 'Fertiliser', 'Micronutrient', 'Pesticide'].map(cat => (
                          <optgroup key={cat} label={cat}>
                            {mockProducts.filter(p => p.category === cat && p.isActive).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {product && (
                        <p className="text-[9px] text-gray-400 font-mono mt-0.5 px-0.5">{product.sku} · {product.unit}</p>
                      )}
                    </td>

                    {/* Batch no */}
                    <td className="px-3 py-2">
                      <input
                        value={line.batchNo}
                        onChange={e => updateLine(line.lineId, 'batchNo', e.target.value)}
                        placeholder="e.g. MC-BTC-2601"
                        className="w-full font-mono text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </td>

                    {/* Mfg date */}
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={line.mfgDate}
                        onChange={e => updateLine(line.lineId, 'mfgDate', e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </td>

                    {/* Expiry date */}
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={line.expiryDate}
                        onChange={e => updateLine(line.lineId, 'expiryDate', e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </td>

                    {/* Qty */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={line.quantity || ''}
                        onChange={e => updateLine(line.lineId, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full text-right text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white tabular-nums"
                      />
                    </td>

                    {/* MRP */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.mrp || ''}
                        onChange={e => updateLine(line.lineId, 'mrp', parseFloat(e.target.value) || 0)}
                        className="w-full text-right text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white tabular-nums"
                      />
                    </td>

                    {/* Purchase rate */}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.purchaseRate || ''}
                        onChange={e => updateLine(line.lineId, 'purchaseRate', parseFloat(e.target.value) || 0)}
                        className="w-full text-right text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white tabular-nums"
                      />
                    </td>

                    {/* GST % */}
                    <td className="px-3 py-2">
                      <select
                        value={line.gstPct}
                        onChange={e => updateLine(line.lineId, 'gstPct', parseInt(e.target.value))}
                        className="w-full text-right text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        {[0, 5, 12, 18, 28].map(v => <option key={v} value={v}>{v}%</option>)}
                      </select>
                    </td>

                    {/* Line value */}
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-800">
                      {lineValue(line) > 0 ? `₹${lineValue(line).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                    </td>

                    {/* Remove */}
                    <td className="px-3 py-2 text-center">
                      {lines.length > 1 && (
                        <button
                          onClick={() => removeLine(line.lineId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals row */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {lines.length} line{lines.length !== 1 ? 's' : ''}
          </div>
          <div className="text-sm font-bold text-gray-900">
            Total: ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Receiving at: <span className="font-medium text-gray-600">
            {ALL_LOCATIONS.find(l => l.id === receivingId)?.name ?? '—'}
          </span>
        </p>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          Record GRN &amp; Update Stock
        </button>
      </div>
    </div>
  );
}
