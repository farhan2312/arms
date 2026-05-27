// Stock Ledger — product-level view with expandable batch rows
// swap for API: GET /api/inventory/stock?locationId=<id>

import { useState, useMemo, Fragment } from 'react';
import {
  ChevronDown, ChevronRight, AlertTriangle,
  Package, TrendingDown, Filter,
} from 'lucide-react';
import { mockStores } from '../../data/mockStores';
import { mockBatches } from '../../data/mockBatches';
import { productById } from '../../data/mockProducts';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import { SearchInput, Select } from '../../components/ui/Input';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';
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
  const [locationId,     setLocationId]     = useState<string>(defaultLocation);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search,         setSearch]         = useState('');
  const [nearExpiryOnly, setNearExpiryOnly] = useState(false);
  const [lowStockOnly,   setLowStockOnly]   = useState(false);
  const [threshold,      setThreshold]      = useState(20);
  const [expandedIds,    setExpandedIds]    = useState<Set<string>>(new Set());

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
        const totalAvail    = batches.reduce((s, b) => s + (b.currentQty - b.reservedQty), 0);
        const totalReserved = batches.reduce((s, b) => s + b.reservedQty, 0);
        const oldestExpiry  = sortedByExpiry[0]?.expiryDate ?? '';
        const nearExpiryCount = batches.filter(b => b.expiryDate <= NEAR_EXPIRY_DATE).length;
        const isLowStock    = totalAvail <= threshold;
        return {
          productId, product, batches: sortedByExpiry,
          totalAvail, totalReserved, oldestExpiry, nearExpiryCount,
          hasNearExpiry: nearExpiryCount > 0, isLowStock,
        };
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

      {/* ── Controls row ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Location selector */}
        <div style={{ width: '220px' }}>
          <Select value={locationId} onChange={setLocationId}>
            <option value="all">All Locations</option>
            <optgroup label="Stores">
              {STORE_LOCATIONS.map(l => (
                <option key={l.id} value={l.id}>{l.name.replace('Bharat Agri Store – ', '')}</option>
              ))}
            </optgroup>
            <optgroup label="Warehouses">
              {WAREHOUSES.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </optgroup>
          </Select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-52">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search product or SKU…"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: categoryFilter === cat ? 'var(--green-500)' : 'var(--bg-card)',
                color: categoryFilter === cat ? '#ffffff' : 'var(--text-secondary)',
                borderColor: categoryFilter === cat ? 'var(--green-500)' : 'var(--border)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Toggle filters */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setNearExpiryOnly(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              backgroundColor: nearExpiryOnly ? '#fff7ed' : 'var(--bg-card)',
              color: nearExpiryOnly ? '#c2410c' : 'var(--text-secondary)',
              borderColor: nearExpiryOnly ? '#fdba74' : 'var(--border)',
            }}
          >
            <AlertTriangle size={12} />
            Near Expiry
            {nearExpiryTotal > 0 && (
              <span style={{
                backgroundColor: '#f97316',
                color: '#fff',
                borderRadius: '9999px',
                width: '16px',
                height: '16px',
                fontSize: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {nearExpiryTotal}
              </span>
            )}
          </button>

          <button
            onClick={() => setLowStockOnly(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              backgroundColor: lowStockOnly ? '#fef2f2' : 'var(--bg-card)',
              color: lowStockOnly ? '#b91c1c' : 'var(--text-secondary)',
              borderColor: lowStockOnly ? '#fca5a5' : 'var(--border)',
            }}
          >
            <TrendingDown size={12} />
            Low Stock
            {lowStockTotal > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                borderRadius: '9999px',
                width: '16px',
                height: '16px',
                fontSize: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {lowStockTotal}
              </span>
            )}
          </button>

          {lowStockOnly && (
            <div className="flex items-center gap-1" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <Filter size={11} />
              <span>Threshold:</span>
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={e => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '52px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '3px 6px',
                  textAlign: 'center',
                  fontSize: '12px',
                  outline: 'none',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{rows.length} products</span>
        {nearExpiryTotal > 0 && (
          <span style={{ color: '#c2410c', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} /> {nearExpiryTotal} near expiry (&lt;30 days)
          </span>
        )}
        {lowStockTotal > 0 && (
          <span style={{ color: '#b91c1c', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingDown size={11} /> {lowStockTotal} below threshold ({threshold})
          </span>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <EmptyState
          icon={Package}
          iconColor="#94a3b8"
          title="No stock matches the current filters"
          subtitle="Try adjusting your search, location, or filter settings."
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th right>Available</Th>
              <Th right>Reserved</Th>
              <Th>Batches</Th>
              <Th>Oldest Expiry</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              if (!row.product) return null;
              const isExpanded = expandedIds.has(row.productId);
              const days = row.oldestExpiry ? daysUntil(row.oldestExpiry) : null;

              return (
                <Fragment key={row.productId}>
                  {/* Product row */}
                  <Tr
                    onClick={() => toggleExpand(row.productId)}
                  >
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '13px' }}>{row.product.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {row.product.sku}
                          </div>
                        </div>
                        {row.isLowStock && (
                          <Badge variant="red">Low</Badge>
                        )}
                      </div>
                    </Td>
                    <Td muted>{row.product.category}</Td>
                    <Td right>
                      <span style={{
                        fontWeight: 700,
                        color: row.isLowStock ? '#dc2626' : 'var(--text-primary)',
                      }}>
                        {row.totalAvail}
                      </span>
                      {' '}
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{row.product.unit}</span>
                    </Td>
                    <Td right>
                      {row.totalReserved > 0
                        ? <span style={{ color: '#d97706', fontWeight: 500 }}>{row.totalReserved}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px' }}>
                          {row.batches.length} batch{row.batches.length !== 1 ? 'es' : ''}
                        </span>
                        {row.hasNearExpiry && (
                          <span title={`${row.nearExpiryCount} batch(es) near expiry`}>
                            <AlertTriangle size={12} style={{ color: '#f97316' }} />
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      {row.oldestExpiry ? (
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: days !== null && days <= 30 ? '#c2410c' : 'var(--text-primary)',
                        }}>
                          {row.oldestExpiry}
                          {days !== null && days <= 30 && (
                            <span style={{ marginLeft: '4px', fontSize: '11px', color: '#f97316', fontWeight: 400 }}>
                              ({days}d)
                            </span>
                          )}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </Td>
                    <Td>
                      {row.hasNearExpiry
                        ? <Badge variant="amber">Near Expiry</Badge>
                        : row.isLowStock
                          ? <Badge variant="red">Low Stock</Badge>
                          : <Badge variant="green">OK</Badge>
                      }
                    </Td>
                    <Td>
                      {isExpanded
                        ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                        : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                      }
                    </Td>
                  </Tr>

                  {/* Expanded batch rows */}
                  {isExpanded && (
                    <tr key={`${row.productId}-expanded`}>
                      <td
                        colSpan={8}
                        style={{
                          padding: 0,
                          backgroundColor: '#f8fafc',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ padding: '8px 16px 12px' }}>
                          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 500 }}>Batch No.</th>
                                <th style={{ textAlign: 'right', padding: '6px 12px 6px 0', fontWeight: 500 }}>Avail.</th>
                                <th style={{ textAlign: 'right', padding: '6px 12px 6px 0', fontWeight: 500 }}>Reserved</th>
                                <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 500 }}>Mfg Date</th>
                                <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 500 }}>Expiry</th>
                                <th style={{ textAlign: 'left', padding: '6px 12px 6px 0', fontWeight: 500 }}>Location</th>
                                <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 500 }}>Purchase ₹</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.batches.map(b => {
                                const bDays = daysUntil(b.expiryDate);
                                const bNE   = b.expiryDate <= NEAR_EXPIRY_DATE;
                                const loc   = b.storeId
                                  ? mockStores.find(s => s.id === b.storeId)?.code ?? b.storeId
                                  : WAREHOUSE_NAMES[b.warehouseId ?? ''] ?? b.warehouseId ?? '—';
                                return (
                                  <tr
                                    key={b.id}
                                    style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(0,0,0,0.02)'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ''; }}
                                  >
                                    <td style={{ padding: '6px 12px 6px 0', fontFamily: 'monospace', fontWeight: 500, color: 'var(--text-primary)' }}>{b.batchNo}</td>
                                    <td style={{ padding: '6px 12px 6px 0', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{b.currentQty - b.reservedQty}</td>
                                    <td style={{ padding: '6px 12px 6px 0', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: b.reservedQty > 0 ? '#d97706' : 'var(--text-muted)' }}>
                                      {b.reservedQty > 0 ? b.reservedQty : '—'}
                                    </td>
                                    <td style={{ padding: '6px 12px 6px 0', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{b.mfgDate}</td>
                                    <td style={{ padding: '6px 12px 6px 0', color: bNE ? '#c2410c' : 'var(--text-secondary)', fontWeight: bNE ? 500 : 400 }}>
                                      {b.expiryDate}
                                      {bNE && <span style={{ marginLeft: '4px', color: '#f97316' }}>({bDays}d)</span>}
                                    </td>
                                    <td style={{ padding: '6px 12px 6px 0', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{loc}</td>
                                    <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>₹{b.purchasePricePerUnit.toLocaleString('en-IN')}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      {/* Footer */}
      {rows.length > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', paddingTop: '4px' }}>
          {rows.length} products · {rows.reduce((s, r) => s + r.batches.length, 0)} batches ·{' '}
          {ALL_LOCATIONS.find(l => l.id === locationId)?.name ?? 'All Locations'}
        </div>
      )}
    </div>
  );
}

export { ALL_LOCATIONS, STORE_LOCATIONS, WAREHOUSES, WAREHOUSE_NAMES };
export type { Location };
