// B2B Order List — filterable table with expandable order detail panel
// swap for API calls: GET /api/b2b/orders

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, ChevronDown, ChevronUp, Filter,
  Package, Truck, CheckCircle2, Clock, FileText,
  Building2, User, Calendar, ExternalLink,
} from 'lucide-react';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import { retailerById } from '../../data/mockRetailers';
import { userById } from '../../data/mockUsers';
import { productById } from '../../data/mockProducts';
import type { B2BOrder, B2BOrderStatus } from '../../types/b2b';

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_STATUSES: B2BOrderStatus[] = [
  'Draft', 'Submitted', 'UnderReview', 'Approved',
  'Allocated', 'Dispatched', 'Delivered', 'Invoiced',
];

const STATUS_STYLE: Record<B2BOrderStatus, string> = {
  Draft:       'bg-gray-100 text-gray-600',
  Submitted:   'bg-blue-100 text-blue-700',
  UnderReview: 'bg-amber-100 text-amber-700',
  Approved:    'bg-emerald-100 text-emerald-700',
  Allocated:   'bg-teal-100 text-teal-700',
  Dispatched:  'bg-violet-100 text-violet-700',
  Delivered:   'bg-green-100 text-green-700',
  Invoiced:    'bg-slate-200 text-slate-700',
};

const STATUS_ICON: Record<B2BOrderStatus, typeof Clock> = {
  Draft:       FileText,
  Submitted:   Clock,
  UnderReview: Clock,
  Approved:    CheckCircle2,
  Allocated:   Package,
  Dispatched:  Truck,
  Delivered:   CheckCircle2,
  Invoiced:    FileText,
};

const TIER_COLOR: Record<string, string> = {
  Standard: 'bg-gray-100 text-gray-600',
  Silver:   'bg-slate-200 text-slate-700',
  Gold:     'bg-amber-100 text-amber-700',
  Preferred:'bg-purple-100 text-purple-700',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function shortFirm(name: string): string {
  // "Vidarbha Agro Inputs Pvt Ltd" → "Vidarbha Agro Inputs"
  return name.replace(/ (Pvt Ltd|Pvt\. Ltd\.|Ltd\.|Ltd|LLP|& Co\.?)$/i, '').trim();
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function OrderDetailPanel({ order }: { order: B2BOrder }) {
  const retailer = retailerById.get(order.retailerId);
  const salesExec = userById.get(order.salesExecUserId);
  const approver  = order.approvedByUserId ? userById.get(order.approvedByUserId) : undefined;

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-5 py-4 space-y-4">
      {/* Meta row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
        <div>
          <p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Retailer</p>
          <p className="font-semibold text-gray-800">{retailer?.firmName ?? order.retailerId}</p>
          <p className="text-gray-500">{retailer?.address.district}, {retailer?.address.state}</p>
        </div>
        <div>
          <p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Sales Exec</p>
          <p className="font-semibold text-gray-800">{salesExec?.name ?? order.salesExecUserId}</p>
          <p className="text-gray-500">{salesExec?.employeeCode}</p>
        </div>
        <div>
          <p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Fulfillment</p>
          <p className="font-semibold text-gray-800">{order.fulfillmentStoreId === 'wh-ngp-001' ? 'Nagpur Warehouse' : order.fulfillmentStoreId}</p>
          <p className="text-gray-500">Payment: {order.paymentTerms}</p>
        </div>
        {approver && (
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Approved By</p>
            <p className="font-semibold text-gray-800">{approver.name}</p>
            <p className="text-gray-500">{order.approvedAt?.slice(0, 10)}</p>
          </div>
        )}
        {order.dispatchByDate && !approver && (
          <div>
            <p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Dispatch By</p>
            <p className="font-semibold text-gray-800">{order.dispatchByDate}</p>
          </div>
        )}
      </div>

      {/* Delivery address */}
      <div className="text-xs">
        <p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Delivery Address</p>
        <p className="text-gray-700">{order.deliveryAddress}</p>
      </div>

      {/* Order lines table */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Order Lines ({order.lines.length})
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="text-left px-3 py-2.5 font-medium">Product</th>
                <th className="text-center px-3 py-2.5 font-medium">Requested</th>
                <th className="text-center px-3 py-2.5 font-medium">Allocated</th>
                <th className="text-right px-3 py-2.5 font-medium">Unit Price</th>
                <th className="text-right px-3 py-2.5 font-medium">Disc %</th>
                <th className="text-right px-3 py-2.5 font-medium">GST</th>
                <th className="text-right px-3 py-2.5 font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {order.lines.map(line => {
                const product = productById.get(line.productId);
                const allocationShort = line.allocatedQty < line.requestedQty;
                return (
                  <tr key={line.id} className={allocationShort ? 'bg-amber-50' : ''}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-800 leading-snug">{line.productName}</p>
                      <p className="text-gray-400 font-mono">{line.sku}</p>
                      {product?.isSubsidised && (
                        <span className="text-[9px] bg-yellow-100 text-yellow-700 font-bold px-1 py-0.5 rounded">Subsidised</span>
                      )}
                    </td>
                    <td className="text-center px-3 py-2.5 text-gray-700">
                      {line.requestedQty} {line.unit}
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <span className={allocationShort ? 'text-amber-600 font-semibold' : 'text-gray-700'}>
                        {line.allocatedQty} {line.unit}
                      </span>
                    </td>
                    <td className="text-right px-3 py-2.5 text-gray-700">{fmt(line.unitPrice)}</td>
                    <td className="text-right px-3 py-2.5">
                      {line.lineDiscountPct > 0
                        ? <span className="text-emerald-600 font-medium">{line.lineDiscountPct}%</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="text-right px-3 py-2.5 text-gray-500">{fmt(line.taxAmt)}</td>
                    <td className="text-right px-3 py-2.5 font-semibold text-gray-900">{fmt(line.lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals row */}
      <div className="flex justify-end">
        <div className="text-xs space-y-1 w-52">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(order.subtotalAmt)}</span></div>
          {order.discountAmt > 0 && (
            <div className="flex justify-between text-emerald-600"><span>Discount</span><span>- {fmt(order.discountAmt)}</span></div>
          )}
          <div className="flex justify-between text-gray-500"><span>GST</span><span>+ {fmt(order.taxAmt)}</span></div>
          <div className="flex justify-between font-bold text-gray-900 text-sm border-t border-gray-200 pt-1.5">
            <span>Total</span><span>{fmt(order.totalAmt)}</span>
          </div>
        </div>
      </div>

      {/* Remarks */}
      {order.remarks && (
        <p className="text-xs text-gray-500 italic">"{order.remarks}"</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function B2BOrderList() {
  const navigate = useNavigate();

  // Local order list — in production, this would be fetched and refreshed from the API
  const [orders] = useState<B2BOrder[]>(() => [...mockB2BOrders].reverse());

  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState<B2BOrderStatus | 'All'>('All');
  const [retailerFilter, setRetailerFilter] = useState('All');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [showFilters, setShowFilters]     = useState(false);

  // ── Derived: unique retailers in the list ─────────────────────────────────
  const retailersInList = useMemo(() => {
    const ids = [...new Set(orders.map(o => o.retailerId))];
    return ids.map(id => retailerById.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof retailerById.get>>[];
  }, [orders]);

  // ── Filtered orders ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        o.orderNo.toLowerCase().includes(q) ||
        (retailerById.get(o.retailerId)?.firmName.toLowerCase().includes(q) ?? false);

      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      const matchRetailer = retailerFilter === 'All' || o.retailerId === retailerFilter;
      const matchFrom = !dateFrom || o.createdAt.slice(0, 10) >= dateFrom;
      const matchTo   = !dateTo   || o.createdAt.slice(0, 10) <= dateTo;

      return matchSearch && matchStatus && matchRetailer && matchFrom && matchTo;
    });
  }, [orders, searchQuery, statusFilter, retailerFilter, dateFrom, dateTo]);

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pending   = orders.filter(o => o.status === 'UnderReview' || o.status === 'Submitted').length;
    const pipeline  = orders.filter(o => ['Approved', 'Allocated', 'Dispatched'].includes(o.status))
                            .reduce((s, o) => s + o.totalAmt, 0);
    const thisMonth = orders.filter(o => o.createdAt.slice(0, 7) === '2026-05')
                            .reduce((s, o) => s + o.totalAmt, 0);
    return { pending, pipeline, thisMonth };
  }, [orders]);

  const activeFilterCount = [statusFilter !== 'All', retailerFilter !== 'All', !!dateFrom, !!dateTo].filter(Boolean).length;

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">B2B Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} orders · All zones</p>
        </div>
        <button
          onClick={() => navigate('/b2b-new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      {/* ── Stats cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-600 mt-0.5">{stats.pending}</p>
          <p className="text-[10px] text-gray-400">Submitted + Under Review</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">Pipeline Value</p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{fmt(stats.pipeline)}</p>
          <p className="text-[10px] text-gray-400">Approved–Dispatched</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-500">May 2026 Total</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{fmt(stats.thisMonth)}</p>
          <p className="text-[10px] text-gray-400">All statuses</p>
        </div>
      </div>

      {/* ── Search + filter row ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search order number or retailer…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Status */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as B2BOrderStatus | 'All')}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="All">All statuses</option>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Retailer */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Retailer</label>
              <select
                value={retailerFilter}
                onChange={e => setRetailerFilter(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="All">All retailers</option>
                {retailersInList.map(r => <option key={r.id} value={r.id}>{shortFirm(r.firmName)}</option>)}
              </select>
            </div>
            {/* Date from */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            {/* Date to */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            {activeFilterCount > 0 && (
              <div className="col-span-2 sm:col-span-4 flex justify-end">
                <button
                  onClick={() => { setStatusFilter('All'); setRetailerFilter('All'); setDateFrom(''); setDateTo(''); }}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Status filter pills ─────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['All', ...ALL_STATUSES] as const).map(s => {
          const count = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
          if (count === 0 && s !== 'All') return null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === s
                  ? s === 'All' ? 'bg-gray-800 text-white border-gray-800' : `${STATUS_STYLE[s as B2BOrderStatus]} border-current`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s}
              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                statusFilter === s ? 'bg-white/30' : 'bg-gray-100'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Table header */}
        <div className="grid grid-cols-[1.4fr_1.6fr_1fr_0.8fr_0.9fr_1fr_1fr_0.5fr] gap-x-3 px-4 py-3 border-b border-gray-100 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          <span>Order</span>
          <span>Retailer</span>
          <span>Sales Exec</span>
          <span>Date</span>
          <span className="text-right">Value</span>
          <span>Status</span>
          <span>Node</span>
          <span></span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No orders match the current filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(order => {
              const retailer  = retailerById.get(order.retailerId);
              const salesExec = userById.get(order.salesExecUserId);
              const isExpanded = expandedId === order.id;
              const StatusIcon = STATUS_ICON[order.status];

              return (
                <div key={order.id}>
                  {/* Main row */}
                  <div
                    className="grid grid-cols-[1.4fr_1.6fr_1fr_0.8fr_0.9fr_1fr_1fr_0.5fr] gap-x-3 px-4 py-3.5 items-center hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    {/* Order no */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 font-mono truncate">{order.orderNo}</p>
                      <p className="text-[10px] text-gray-400">{order.lines.length} SKU{order.lines.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Retailer */}
                    <div className="min-w-0 flex items-center gap-1.5">
                      <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {retailer ? shortFirm(retailer.firmName) : order.retailerId}
                        </p>
                        {retailer && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TIER_COLOR[retailer.tier] ?? 'bg-gray-100 text-gray-600'}`}>
                            {retailer.tier}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sales exec */}
                    <div className="min-w-0 flex items-center gap-1.5">
                      <User size={11} className="text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-700 truncate">{salesExec?.name ?? '—'}</p>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1">
                      <Calendar size={11} className="text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-600">{order.createdAt.slice(0, 10)}</p>
                    </div>

                    {/* Value */}
                    <p className="text-sm font-bold text-gray-900 text-right tabular-nums">{fmt(order.totalAmt)}</p>

                    {/* Status badge */}
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[order.status]}`}>
                        <StatusIcon size={10} />
                        {order.status}
                      </span>
                    </div>

                    {/* Fulfillment node */}
                    <p className="text-xs text-gray-500 truncate">
                      {order.fulfillmentStoreId === 'wh-ngp-001' ? 'NGP Warehouse' : order.fulfillmentStoreId}
                    </p>

                    {/* Expand toggle */}
                    <div className="flex justify-end">
                      {isExpanded
                        ? <ChevronUp size={14} className="text-gray-400" />
                        : <ChevronDown size={14} className="text-gray-400" />
                      }
                    </div>
                  </div>

                  {/* Dispatch date strip (when pending / in-flight) */}
                  {!isExpanded && ['Approved', 'Allocated', 'Dispatched'].includes(order.status) && order.dispatchByDate && (
                    <div className="px-4 pb-2 -mt-1 flex items-center gap-1.5">
                      <Truck size={10} className="text-violet-400" />
                      <p className="text-[10px] text-gray-400">
                        Dispatch by <span className="font-medium text-gray-600">{order.dispatchByDate}</span>
                      </p>
                    </div>
                  )}

                  {/* Expanded detail panel */}
                  {isExpanded && <OrderDetailPanel order={order} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {filtered.length} of {orders.length} orders
            {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active)`}
          </span>
          <button
            onClick={() => navigate('/b2b-new')}
            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-semibold transition-colors"
          >
            <ExternalLink size={11} />
            Place New Order
          </button>
        </div>
      </div>
    </div>
  );
}
