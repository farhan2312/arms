// Stock Ledger — product-level view with expandable batch rows
// swap for API: GET /api/inventory/stock?locationId=<id>

import { useState, useMemo } from 'react';
import {
  ChevronDown, ChevronRight, AlertTriangle, Package,
  TrendingDown, Filter, Search,
} from 'lucide-react';
import { mockStores } from '../../data/mockStores';
import { mockBatches } from '../../data/mockBatches';
import { productById } from '../../data/mockProducts';
import { useAuth } from '../../context/AuthContext';
import type { Batch } from '../../types/entities';

// ── Location registry (stores + warehouses referenced in batches) ─────────────

interface Location {
  id: string;
  name: string;
  type: 'store' | 'warehouse';
}

const WAREHOUSE_NAMES: Record<string, string> = {
  'wh-ngp-001': 'Nagpur Central Warehouse',
  'wh-hyd-001': 'Hyderabad Regional Warehouse',
};

const warehouseIds = [...new Set(mockBatches.map(b => b.warehouseId).filter(Boolean))] as string[];
const WAREHOUSES: Location[] = warehouseIds.map(id => ({ id, name: WAREHOUSE_NAMES[id] ?? id, type: 'warehouse' }));
const STORE_LOCATIONS: Location[] = mockStores.map(s => ({ id: s.id, name: s.name, type: 'store' }));
const ALL_LOCATIONS: Location[] = [...STORE_LOCATIONS, ...WAREHOUSES];

const CATEGORIES = ['All', 'Seed', 'Fertiliser', 'Micronutrient', 'Pesticide'];
const TODAY = '2026-05-26';
const NEAR_EXPIRY_DATE = '2026-06-25'; // 30 days from TODAY

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(date: string): number {
  return Math.round((new Date(date).getTime() - new Date(TODAY).getTime()) / 86_400_000);
}

function getBatchesAt(locationId: string, extraBatches: Batch[] = []): Batch[] {
  const all = [...mockBatches, ...extraBatches];
  if (locationId === 'all') return all;
  const isWh = WAREHOUSES.some(w => w.id === locationId);
  return isWh
    ? all.filter(b => b.warehouseId === locationId)
    : all.filter(b => b.storeId === locationId);
}

// ── Main component ────────────────────────────────────────────────────────────

interface StockLedgerProps {
  /** Extra batches added via GRN in the same session. */
  extraBatches?: Batch[];
}

export default function StockLedger({ extraBatches = [] }: StockLedgerProps) {
  const { currentStore } = useAuth();

  const defaultLocation = currentStore?.id ?? WAREHOUSES[0]?.id ?? 'all';
  const [locationId,       setLocationId]       = useState<string>(defaultLocation);
  const [categoryFilter,   setCategoryFilter]   = useState('All');
  const [search,           setSearch]           = useState('');
  const [nearExpiryOnly,   setNearExpiryOnly]   = useState(false);
  const [lowStockOnly,     setLowStockOnly]     = useState(false);
  const [threshold,        setThreshold]        = useState(20);
  const [expandedIds,      setExpandedIds]      = useState<Set<string>>(new Set());

  const toggleExpand = (productId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId); else next.add(productId);
      return next;
    });
  };

  // ── Aggregate per-product rows at the selected location ──────────────────
  const rows = useMemo(() => {
    const locationBatches = getBatchesAt(locationId, extraBatches);

    // Group batches by productId
    const grouped = new Map<string, Batch[]>();
    for (const b of locationBatches) {
      const arr = grouped.get(b.productId) ?? [];
      arr.push(b);
      grouped.set(b.productId, arr);
    }

    return Array.from(grouped.entries())
      .map(([productId, batches]) => {
        const product = productById.get(productId);
        const sortedByExpiry = [...batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
        const totalAvail  = batches.reduce((s, b) => s + (b.currentQty - b.reservedQty), 0);
        const totalReserved = batches.reduce((s, b) => s + b.reservedQty, 0);
        const oldestExpiry = sortedByExpiry[0]?.expiryDate ?? '';
        const nearExpiryCount = batches.filter(b => b.expiryDate <= NEAR_EXPIRY_DATE).length;
        const isLowStock   = totalAvail <= threshold;
        return { productId, product, batches: sortedByExpiry, totalAvail, totalReserved, oldestExpiry, nearExpiryCount, hasNearExpiry: nearExpiryCount > 0, isLowStock };
      })
      .filter(row => {
        if (!row.product) return false;
        const q = search.toLowerCase();
        const matchSearch = !search || row.product.name.toLowerCase().includes(q) || row.product.sku.toLowerCase().includes(q);
        const matchCat    = categoryFilter === 'All' || row.product.category === categoryFilter;
        const matchNE     = !nearExpiryOnly || row.hasNearExpiry;
        const matchLS     = !lowStockOnly   || row.isLowStock;
        return matchSearch && matchCat && matchNE && matchLS;
      })
      .sort((a, b) => (a.product?.name ?? '').localeCompare(b.product?.name ?? ''));
  }, [locationId, extraBatches, categoryFilter, search, nearExpiryOnly, lowStockOnly, threshold]);

  const nearExpiryTotal = rows.filter(r => r.hasNearExpiry).length;
  const lowStockTotal   = rows.filter(r => r.isLowStock).length;

  return (
    <div className="space-y-4">

      {/* ── Controls row ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Location selector */}
        <select
          value={locationId}
          onChange={e => setLocationId(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Locations</option>
          <optgroup label="Stores">
            {STORE_LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name.replace('Bharat Agri Store – ', '')}</option>)}
          </optgroup>
          <optgroup label="Warehouses">
            {WAREHOUSES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </optgroup>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product or SKU…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Toggle filters */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setNearExpiryOnly(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              nearExpiryOnly
                ? 'bg-orange-100 text-orange-700 border-orange-300'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle size={12} />
            Near Expiry {nearExpiryTotal > 0 && <span className="bg-orange-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center">{nearExpiryTotal}</span>}
          </button>

          <button
            onClick={() => setLowStockOnly(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              lowStockOnly
                ? 'bg-red-100 text-red-700 border-red-300'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <TrendingDown size={12} />
            Low Stock {lowStockTotal > 0 && <span className="bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center">{lowStockTotal}</span>}
          </button>

          {lowStockOnly && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Filter size={11} />
              <span>Threshold:</span>
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={e => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Summary strip ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="font-medium text-gray-700">{rows.length} products</span>
        {nearExpiryTotal > 0 && (
          <span className="text-orange-600 font-medium flex items-center gap-1">
            <AlertTriangle size={11} /> {nearExpiryTotal} near expiry (&lt;30 days)
          </span>
        )}
        {lowStockTotal > 0 && (
          <span className="text-red-600 font-medium flex items-center gap-1">
            <TrendingDown size={11} /> {lowStockTotal} below threshold ({threshold})
          </span>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr_1.2fr_0.5fr] px-4 py-3 border-b border-gray-100 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          <span>Product</span>
          <span>Category</span>
          <span className="text-right">Available</span>
          <span className="text-right">Reserved</span>
          <span>Batches</span>
          <span>Oldest Expiry</span>
          <span></span>
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No stock matches the current filters.</p>
          </div>
        ) : (
          <div>
            {rows.map(row => {
              if (!row.product) return null;
              const isExpanded = expandedIds.has(row.productId);
              const days = row.oldestExpiry ? daysUntil(row.oldestExpiry) : null;

              return (
                <div key={row.productId} className="border-b border-gray-50 last:border-0">
                  {/* Product row */}
                  <div
                    className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr_1.2fr_0.5fr] px-4 py-3 items-center hover:bg-gray-50/70 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(row.productId)}
                  >
                    {/* Product name */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-gray-800 truncate">{row.product.name}</p>
                        {row.isLowStock && (
                          <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1 py-0.5 rounded flex-shrink-0">Low</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{row.product.sku}</p>
                    </div>

                    {/* Category */}
                    <p className="text-xs text-gray-600">{row.product.category}</p>

                    {/* Available */}
                    <p className={`text-right text-xs font-bold tabular-nums ${row.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                      {row.totalAvail} <span className="font-normal text-gray-400">{row.product.unit}</span>
                    </p>

                    {/* Reserved */}
                    <p className="text-right text-xs tabular-nums text-gray-500">
                      {row.totalReserved > 0 ? <span className="text-amber-600 font-medium">{row.totalReserved}</span> : '—'}
                    </p>

                    {/* Batch count + near-expiry */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{row.batches.length} batch{row.batches.length !== 1 ? 'es' : ''}</span>
                      {row.hasNearExpiry && (
                        <span title={`${row.nearExpiryCount} batch(es) near expiry`}>
                          <AlertTriangle size={12} className="text-orange-500" />
                        </span>
                      )}
                    </div>

                    {/* Oldest expiry */}
                    <div>
                      {row.oldestExpiry ? (
                        <span className={`text-xs font-medium ${days !== null && days <= 30 ? 'text-orange-600' : 'text-gray-600'}`}>
                          {row.oldestExpiry}
                          {days !== null && days <= 30 && (
                            <span className="ml-1 text-[10px] text-orange-500 font-normal">({days}d)</span>
                          )}
                        </span>
                      ) : '—'}
                    </div>

                    {/* Expand icon */}
                    <div className="flex justify-end">
                      {isExpanded
                        ? <ChevronDown size={14} className="text-gray-400" />
                        : <ChevronRight size={14} className="text-gray-400" />
                      }
                    </div>
                  </div>

                  {/* Expanded batch rows */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 px-4 py-2">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-200">
                            <th className="text-left py-1.5 pr-3 font-medium">Batch No.</th>
                            <th className="text-right pr-3 font-medium">Avail.</th>
                            <th className="text-right pr-3 font-medium">Reserved</th>
                            <th className="text-left pr-3 font-medium">Mfg Date</th>
                            <th className="text-left pr-3 font-medium">Expiry</th>
                            <th className="text-left pr-3 font-medium">Location</th>
                            <th className="text-right font-medium">Purchase ₹</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {row.batches.map(b => {
                            const bDays = daysUntil(b.expiryDate);
                            const bNE   = b.expiryDate <= NEAR_EXPIRY_DATE;
                            const loc   = b.storeId
                              ? mockStores.find(s => s.id === b.storeId)?.code ?? b.storeId
                              : WAREHOUSE_NAMES[b.warehouseId ?? ''] ?? b.warehouseId ?? '—';
                            return (
                              <tr key={b.id} className="hover:bg-gray-100/60 transition-colors">
                                <td className="py-1.5 pr-3 font-mono font-medium text-gray-700">{b.batchNo}</td>
                                <td className="pr-3 text-right font-semibold text-gray-800 tabular-nums">{b.currentQty - b.reservedQty}</td>
                                <td className="pr-3 text-right tabular-nums text-gray-500">
                                  {b.reservedQty > 0 ? <span className="text-amber-600">{b.reservedQty}</span> : '—'}
                                </td>
                                <td className="pr-3 text-gray-600 tabular-nums">{b.mfgDate}</td>
                                <td className="pr-3">
                                  <span className={bNE ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                                    {b.expiryDate}
                                    {bNE && <span className="ml-1 text-orange-400">({bDays}d)</span>}
                                  </span>
                                </td>
                                <td className="pr-3 text-gray-500 font-mono">{loc}</td>
                                <td className="text-right text-gray-700 tabular-nums">₹{b.purchasePricePerUnit.toLocaleString('en-IN')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-400">
          {rows.length} products · {rows.reduce((s, r) => s + r.batches.length, 0)} batches ·{' '}
          {ALL_LOCATIONS.find(l => l.id === locationId)?.name ?? 'All Locations'}
        </div>
      </div>
    </div>
  );
}

export { ALL_LOCATIONS, STORE_LOCATIONS, WAREHOUSES, WAREHOUSE_NAMES };
export type { Location };
