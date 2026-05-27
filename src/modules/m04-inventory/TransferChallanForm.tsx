// Digital Transfer Challan (DTC) — intra-network stock movement
// POST /api/dtc when backend ready

import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Clock, AlertTriangle,
  ArrowRight, Package, ChevronDown,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { mockBatches } from '../../data/mockBatches';
import { productById } from '../../data/mockProducts';
import { mockStores } from '../../data/mockStores';
import { useAuth } from '../../context/AuthContext';
import type { Batch } from '../../types/entities';
import { WAREHOUSES, WAREHOUSE_NAMES, type Location } from './StockLedger';

// ── Types ─────────────────────────────────────────────────────────────────────

type DTCStatus = 'Pending' | 'Acknowledged' | 'Partial' | 'Rejected';

interface DTCLine {
  lineId: string;
  productId: string;
  batchId: string;
  quantity: number;
}

interface DTC {
  id: string;
  dtcNo: string;
  sourceId: string;
  sourceType: 'store' | 'warehouse';
  destId: string;
  destType: 'store' | 'warehouse';
  lines: {
    productId: string;
    batchId: string;
    batchNo: string;
    productName: string;
    qty: number;
    unit: string;
  }[];
  status: DTCStatus;
  createdAt: string;
  acknowledgedAt: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE_LOCATIONS: Location[] = mockStores.map(s => ({
  id: s.id,
  name: s.name.replace('Bharat Agri Store – ', ''),
  type: 'store' as const,
}));

const ALL_LOCATIONS: Location[] = [...STORE_LOCATIONS, ...WAREHOUSES];

const STATUS_STYLE: Record<DTCStatus, string> = {
  Pending:      'bg-amber-100 text-amber-700',
  Acknowledged: 'bg-emerald-100 text-emerald-700',
  Partial:      'bg-blue-100 text-blue-700',
  Rejected:     'bg-red-100 text-red-600',
};

const NOW_MS = new Date('2026-05-26T12:00:00Z').getTime();

// ── Seed data — pending DTCs awaiting acknowledgment ──────────────────────────

const SEED_DTCS: DTC[] = [
  {
    id: 'dtc-001',
    dtcNo: 'DTC-2026-001',
    sourceId: 'wh-ngp-001',
    sourceType: 'warehouse',
    destId: 'str-akl-001',
    destType: 'store',
    lines: [
      { productId: 'prd-001', batchId: 'bat-001', batchNo: 'MC-BTC-2501', productName: 'BT Cotton Seed', qty: 50, unit: 'Packet' },
      { productId: 'prd-007', batchId: 'bat-013', batchNo: 'IFF-DAP-2502', productName: 'DAP (Di-Ammonium Phosphate) 50 Kg', qty: 20, unit: 'Bag' },
    ],
    status: 'Pending',
    createdAt: '2026-05-22T09:00:00Z', // 4 days ago — overdue
    acknowledgedAt: null,
  },
  {
    id: 'dtc-002',
    dtcNo: 'DTC-2026-002',
    sourceId: 'wh-ngp-001',
    sourceType: 'warehouse',
    destId: 'str-ngp-003',
    destType: 'store',
    lines: [
      { productId: 'prd-016', batchId: 'bat-031', batchNo: 'BAY-IMD-2501', productName: 'Imidacloprid 70% WS', qty: 30, unit: 'Packet' },
    ],
    status: 'Pending',
    createdAt: '2026-05-25T15:00:00Z', // 21 hours ago — ok
    acknowledgedAt: null,
  },
  {
    id: 'dtc-003',
    dtcNo: 'DTC-2026-003',
    sourceId: 'str-amr-002',
    sourceType: 'store',
    destId: 'str-wrd-004',
    destType: 'store',
    lines: [
      { productId: 'prd-002', batchId: 'bat-004', batchNo: 'NRC-SYB-2402', productName: 'Soybean Seed JS-335', qty: 10, unit: 'Bag' },
    ],
    status: 'Pending',
    createdAt: '2026-05-23T11:00:00Z', // 3 days ago — overdue
    acknowledgedAt: null,
  },
];

// ── Empty line factory ────────────────────────────────────────────────────────

let _lineSeq = 0;
function makeEmptyLine(): DTCLine {
  return { lineId: `dtc-ln-${++_lineSeq}`, productId: '', batchId: '', quantity: 0 };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBatchesAt(locationId: string, sourceType: 'store' | 'warehouse', extraBatches: Batch[] = []): Batch[] {
  const all = [...mockBatches, ...extraBatches];
  return sourceType === 'warehouse'
    ? all.filter(b => b.warehouseId === locationId)
    : all.filter(b => b.storeId === locationId);
}

function locationName(id: string): string {
  const loc = ALL_LOCATIONS.find(l => l.id === id);
  return loc?.name ?? id;
}

function locationType(id: string): 'store' | 'warehouse' {
  return WAREHOUSES.some(w => w.id === id) ? 'warehouse' : 'store';
}

function hoursAgo(iso: string): number {
  return (NOW_MS - new Date(iso).getTime()) / (60 * 60 * 1000);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TransferChallanForm() {
  const { currentStore } = useAuth();
  const toast = useToast();

  const defaultSource = currentStore?.id ?? WAREHOUSES[0]?.id ?? '';
  const [sourceId,  setSourceId]  = useState<string>(defaultSource);
  const [destId,    setDestId]    = useState<string>('');
  const [lines,     setLines]     = useState<DTCLine[]>([makeEmptyLine()]);
  const [remarks,   setRemarks]   = useState('');

  const [pendingDTCs, setPendingDTCs] = useState<DTC[]>(SEED_DTCS);
  const [errors,      setErrors]      = useState<string[]>([]);

  // "In-transit" qty to subtract from source batches for current-session DTCs
  const [inTransit, setInTransit]   = useState<Record<string, number>>({});

  const srcType = locationType(sourceId);

  // Batches available at source (with in-transit deduction)
  const sourceBatches = useMemo(() => {
    return getBatchesAt(sourceId, srcType)
      .map(b => ({ ...b, currentQty: b.currentQty - (inTransit[b.id] ?? 0) }))
      .filter(b => b.currentQty - b.reservedQty > 0)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)); // FIFO
  }, [sourceId, srcType, inTransit]);

  // ── Line helpers ─────────────────────────────────────────────────────────
  function addLine() { setLines(prev => [...prev, makeEmptyLine()]); }

  function removeLine(lineId: string) { setLines(prev => prev.filter(l => l.lineId !== lineId)); }

  function updateLine<K extends keyof DTCLine>(lineId: string, field: K, val: DTCLine[K]) {
    setLines(prev => prev.map(l => {
      if (l.lineId !== lineId) return l;
      const next = { ...l, [field]: val };
      // Auto-select FIFO batch when product is chosen
      if (field === 'productId' && typeof val === 'string') {
        const fifoBatch = sourceBatches.find(b => b.productId === val);
        next.batchId  = fifoBatch?.id ?? '';
        next.quantity = 0;
      }
      return next;
    }));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): string[] {
    const errs: string[] = [];
    if (!sourceId)         errs.push('Select a source location.');
    if (!destId)           errs.push('Select a destination location.');
    if (sourceId === destId) errs.push('Source and destination must differ.');
    if (lines.length === 0) errs.push('Add at least one line.');

    lines.forEach((l, i) => {
      if (!l.productId)  errs.push(`Line ${i + 1}: Select a product.`);
      if (!l.batchId)    errs.push(`Line ${i + 1}: Select a batch.`);
      if (l.quantity <= 0) errs.push(`Line ${i + 1}: Quantity must be > 0.`);
      if (l.batchId) {
        const batch = sourceBatches.find(b => b.id === l.batchId);
        if (batch && l.quantity > batch.currentQty - batch.reservedQty) {
          errs.push(`Line ${i + 1}: Quantity exceeds available stock (${batch.currentQty - batch.reservedQty}).`);
        }
      }
    });
    return errs;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit() {
    setErrors([]);
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }

    const dtcId  = `dtc-new-${Date.now()}`;
    const dtcNo  = `DTC-2026-${String(pendingDTCs.length + 1).padStart(3, '0')}`;
    const now    = new Date().toISOString();

    const dtcLines = lines
      .filter(l => l.productId && l.batchId)
      .map(l => {
        const batch   = sourceBatches.find(b => b.id === l.batchId);
        const product = productById.get(l.productId);
        return {
          productId:   l.productId,
          batchId:     l.batchId,
          batchNo:     batch?.batchNo ?? l.batchId,
          productName: product?.name ?? l.productId,
          qty:         l.quantity,
          unit:        product?.unit ?? '',
        };
      });

    const dtc: DTC = {
      id:          dtcId,
      dtcNo,
      sourceId,
      sourceType:  srcType,
      destId,
      destType:    locationType(destId),
      lines:       dtcLines,
      status:      'Pending',
      createdAt:   now,
      acknowledgedAt: null,
    };

    // POST /api/dtc when backend ready
    console.log('// POST /api/dtc', dtc);

    // Deduct from source (local session state)
    setInTransit(prev => {
      const next = { ...prev };
      for (const l of lines) {
        if (l.batchId) next[l.batchId] = (next[l.batchId] ?? 0) + l.quantity;
      }
      return next;
    });

    setPendingDTCs(prev => [dtc, ...prev]);
    toast.success(`${dtcNo} created. Stock movement pending acknowledgment by ${locationName(destId)}.`);

    // Reset form
    setLines([makeEmptyLine()]);
    setRemarks('');
    setDestId('');
  }

  // ── Acknowledge a DTC (simulated) ─────────────────────────────────────────
  function acknowledge(dtcId: string) {
    setPendingDTCs(prev => prev.map(d =>
      d.id === dtcId
        ? { ...d, status: 'Acknowledged' as DTCStatus, acknowledgedAt: new Date().toISOString() }
        : d,
    ));
  }

  const pendingCount   = pendingDTCs.filter(d => d.status === 'Pending').length;
  const overdueCount   = pendingDTCs.filter(d => d.status === 'Pending' && hoursAgo(d.createdAt) > 48).length;

  return (
    <div className="space-y-5">


      {/* ── Errors ───────────────────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
          {errors.map((e, i) => <p key={i} className="text-xs text-red-700">• {e}</p>)}
        </div>
      )}

      {/* ── New DTC form ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">New Transfer Challan</h3>

        {/* Source / Dest selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Source <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={sourceId}
                onChange={e => { setSourceId(e.target.value); setLines([makeEmptyLine()]); }}
                className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select source…</option>
                <optgroup label="Stores">
                  {STORE_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </optgroup>
                <optgroup label="Warehouses">
                  {WAREHOUSES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </optgroup>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <ArrowRight size={18} className="text-gray-400 flex-shrink-0 mt-5" />

          <div className="flex-1 min-w-48">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Destination <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={destId}
                onChange={e => setDestId(e.target.value)}
                className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Select destination…</option>
                <optgroup label="Stores">
                  {STORE_LOCATIONS.filter(l => l.id !== sourceId).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </optgroup>
                <optgroup label="Warehouses">
                  {WAREHOUSES.filter(l => l.id !== sourceId).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </optgroup>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">Products to Transfer</p>
            <button
              onClick={addLine}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <Plus size={12} /> Add Line
            </button>
          </div>

          <div className="space-y-2">
            {lines.map((line, _i) => {
              // Batches for this product at source (FIFO)
              const productBatches = sourceBatches.filter(b => b.productId === line.productId);
              const selectedBatch  = line.batchId ? sourceBatches.find(b => b.id === line.batchId) : undefined;
              const maxQty         = selectedBatch ? selectedBatch.currentQty - selectedBatch.reservedQty : 0;

              return (
                <div key={line.lineId} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                  {/* Product */}
                  <div className="flex-1 min-w-40">
                    <label className="block text-[9px] text-gray-400 mb-0.5">Product</label>
                    <select
                      value={line.productId}
                      onChange={e => updateLine(line.lineId, 'productId', e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Select product…</option>
                      {[...new Set(sourceBatches.map(b => b.productId))].map(pid => {
                        const p = productById.get(pid);
                        return p ? <option key={pid} value={pid}>{p.name}</option> : null;
                      })}
                    </select>
                  </div>

                  {/* Batch (FIFO-sorted, filtered to source) */}
                  <div className="flex-1 min-w-40">
                    <label className="block text-[9px] text-gray-400 mb-0.5">Batch (FIFO)</label>
                    <select
                      value={line.batchId}
                      onChange={e => updateLine(line.lineId, 'batchId', e.target.value)}
                      disabled={!line.productId}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50"
                    >
                      <option value="">Select batch…</option>
                      {productBatches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.batchNo} · {b.currentQty - b.reservedQty} avail · exp {b.expiryDate}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Qty */}
                  <div className="w-28">
                    <label className="block text-[9px] text-gray-400 mb-0.5">
                      Qty {maxQty > 0 && <span className="text-gray-300">/ {maxQty}</span>}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={line.quantity || ''}
                      onChange={e => updateLine(line.lineId, 'quantity', parseInt(e.target.value) || 0)}
                      disabled={!line.batchId}
                      className="w-full text-right text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:opacity-50 tabular-nums"
                    />
                  </div>

                  {/* Remove */}
                  {lines.length > 1 && (
                    <button
                      onClick={() => removeLine(line.lineId)}
                      className="mt-5 text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Remarks (optional)
          </label>
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={2}
            placeholder="e.g. Replenishment for Kharif season"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Create Transfer Challan
          </button>
        </div>
      </div>

      {/* ── Pending DTCs ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-800">Pending Acknowledgments</h3>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {pendingCount}
              </span>
            )}
            {overdueCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                <AlertTriangle size={9} /> {overdueCount} overdue
              </span>
            )}
          </div>
        </div>

        {pendingDTCs.length === 0 ? (
          <div className="py-10 text-center">
            <Package size={22} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No pending transfer challans.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingDTCs.map(dtc => {
              const hrs      = hoursAgo(dtc.createdAt);
              const overdue  = dtc.status === 'Pending' && hrs > 48;
              const srcName  = dtc.sourceType === 'warehouse'
                ? WAREHOUSE_NAMES[dtc.sourceId] ?? dtc.sourceId
                : mockStores.find(s => s.id === dtc.sourceId)?.name.replace('Bharat Agri Store – ', '') ?? dtc.sourceId;
              const dstName  = dtc.destType === 'warehouse'
                ? WAREHOUSE_NAMES[dtc.destId] ?? dtc.destId
                : mockStores.find(s => s.id === dtc.destId)?.name.replace('Bharat Agri Store – ', '') ?? dtc.destId;

              return (
                <div key={dtc.id} className={`px-5 py-4 ${overdue ? 'bg-red-50/40' : ''}`}>
                  {/* DTC header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-gray-900 font-mono">{dtc.dtcNo}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_STYLE[dtc.status]}`}>
                          {dtc.status}
                        </span>
                        {overdue && (
                          <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                            <AlertTriangle size={9} /> {Math.round(hrs)}h overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                        <span className="font-medium text-gray-700">{srcName}</span>
                        <ArrowRight size={10} className="text-gray-400" />
                        <span className="font-medium text-gray-700">{dstName}</span>
                        <span className="text-gray-300">·</span>
                        <span>{new Date(dtc.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {dtc.status === 'Pending' && (
                      <button
                        onClick={() => acknowledge(dtc.id)}
                        className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      >
                        <CheckCircle2 size={12} />
                        Acknowledge
                      </button>
                    )}
                    {dtc.status === 'Acknowledged' && dtc.acknowledgedAt && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex-shrink-0">
                        Ack. {new Date(dtc.acknowledgedAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                      </span>
                    )}
                  </div>

                  {/* DTC lines */}
                  <div className="mt-2.5 space-y-1">
                    {dtc.lines.map((l, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                        <span className="font-mono text-gray-400 text-[10px]">{l.batchNo}</span>
                        <span className="text-gray-800 font-medium truncate">{l.productName}</span>
                        <span className="text-gray-400">×</span>
                        <span className="font-semibold tabular-nums">{l.qty} {l.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
