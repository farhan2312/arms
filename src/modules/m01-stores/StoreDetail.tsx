import { useState, useMemo } from 'react';
import { ArrowLeft, Pencil, MapPin, Phone, Mail, AlertTriangle } from 'lucide-react';
import type { Store } from '../../types/entities';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockBatches } from '../../data/mockBatches';
import { mockFarmers } from '../../data/mockFarmers';
import { mockProducts } from '../../data/mockProducts';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import { mockRetailers } from '../../data/mockRetailers';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY      = '2026-05-27';
const MTD_PREFIX = '2026-05';
const MS_PER_DAY = 86_400_000;
const NEAR_EXPIRY_DAYS = 60;

const productById  = new Map(mockProducts.map((p) => [p.id, p]));
const retailerById = new Map(mockRetailers.map((r) => [r.id, r]));
const farmerById   = new Map(mockFarmers.map((f) => [f.id, f]));
const userById     = new Map(MOCK_USERS.map((u) => [u.id, u]));

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - new Date(TODAY).getTime()) / MS_PER_DAY);
}

// ── Sub-components ────────────────────────────────────────────────────────────

type Tab = 'overview' | 'stock' | 'staff' | 'transactions' | 'b2b';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',     label: 'Overview'       },
  { id: 'stock',        label: 'Stock'          },
  { id: 'staff',        label: 'Staff'          },
  { id: 'transactions', label: 'Transactions'   },
  { id: 'b2b',          label: 'B2B Activity'   },
];

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ store }: { store: Store }) {
  const txns         = mockSaleTransactions.filter((t) => t.storeId === store.id);
  const todaySales   = txns.filter((t) => t.invoiceDate === TODAY).reduce((s, t) => s + t.totalAmt, 0);
  const mtdSales     = txns.filter((t) => t.invoiceDate.startsWith(MTD_PREFIX)).reduce((s, t) => s + t.totalAmt, 0);
  const storeBatches = mockBatches.filter((b) => b.storeId === store.id);
  const stockValue   = storeBatches.reduce((s, b) => s + b.currentQty * b.purchasePricePerUnit, 0);
  const activeFarmers = mockFarmers.filter((f) => f.registeredByStoreId === store.id && f.isActive).length;
  const pendingB2B   = mockB2BOrders.filter((o) =>
    o.fulfillmentStoreId === store.warehouseId &&
    ['Approved', 'Allocated'].includes(o.status),
  ).length;

  const kpis = [
    { label: "Today's B2C Sales",    value: todaySales > 0 ? fmt(todaySales) : '—',  color: 'text-gray-900' },
    { label: 'MTD Sales',            value: mtdSales   > 0 ? fmt(mtdSales)   : '—',  color: 'text-emerald-700' },
    { label: 'Total Stock Value',    value: fmt(stockValue),                           color: 'text-gray-900' },
    { label: 'Active Farmers',       value: String(activeFarmers),                    color: 'text-blue-700' },
    { label: 'Pending B2B Picklists', value: String(pendingB2B),                      color: pendingB2B > 0 ? 'text-amber-700' : 'text-gray-900' },
    { label: 'Last Bookkeeping',     value: '2026-05-26',                             color: 'text-gray-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Store details card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">GSTIN</p>
          <p className="font-mono text-gray-800 mt-0.5">{store.gstIn}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Zone</p>
          <p className="text-gray-800 mt-0.5">{store.zoneCode}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Warehouse</p>
          <p className="text-gray-800 mt-0.5">{store.warehouseId === 'wh-ngp-001' ? 'Nagpur Central' : 'Hyderabad Regional'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Active Since</p>
          <p className="text-gray-800 mt-0.5">{new Date(store.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}

// ── Stock Tab ─────────────────────────────────────────────────────────────────

function StockTab({ store }: { store: Store }) {
  const batches = mockBatches.filter((b) => b.storeId === store.id);

  // Group by product
  const grouped = useMemo(() => {
    const map = new Map<string, typeof batches>();
    for (const b of batches) {
      if (!map.has(b.productId)) map.set(b.productId, []);
      map.get(b.productId)!.push(b);
    }
    return [...map.entries()].map(([productId, bList]) => {
      const product    = productById.get(productId);
      const totalQty   = bList.reduce((s, b) => s + b.currentQty, 0);
      const oldestExpiry = bList.map((b) => b.expiryDate).sort()[0];
      const nearExpiry = bList.some((b) => daysUntil(b.expiryDate) <= NEAR_EXPIRY_DAYS);
      return { product, bList, totalQty, oldestExpiry, nearExpiry };
    }).sort((a, b) => (a.product?.name ?? '').localeCompare(b.product?.name ?? ''));
  }, [batches]);

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">No stock batches at this store.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Product</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Category</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Total Qty</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Batches</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Oldest Expiry</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {grouped.map(({ product, bList, totalQty, oldestExpiry, nearExpiry }) => (
            <tr key={product?.id} className={`hover:bg-gray-50 ${nearExpiry ? 'bg-amber-50/30' : ''}`}>
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800">{product?.name ?? '—'}</p>
                <p className="text-gray-400 font-mono">{product?.sku}</p>
              </td>
              <td className="px-4 py-3 text-gray-600">{product?.category ?? '—'}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">{totalQty}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  {bList.map((b) => (
                    <span key={b.id} className="text-[10px] font-mono text-gray-500">
                      {b.batchNo} ×{b.currentQty}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500">{oldestExpiry}</td>
              <td className="px-4 py-3">
                {nearExpiry && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    <AlertTriangle size={9} />
                    Near Expiry
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Staff Tab ─────────────────────────────────────────────────────────────────

function StaffTab({ store }: { store: Store }) {
  const staff = MOCK_USERS.filter((u) => u.assignedStoreIds.includes(store.id));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee Code</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {staff.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700">
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-gray-500 text-xs">{u.employeeCode}</td>
              <td className="px-4 py-3 text-gray-600">{u.mobile}</td>
              <td className="px-4 py-3">
                {u.isActive
                  ? <span className="text-[11px] font-medium text-emerald-600">Active</span>
                  : <span className="text-[11px] font-medium text-red-500">Inactive</span>
                }
              </td>
            </tr>
          ))}
          {staff.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                No staff assigned to this store.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Transactions Tab ──────────────────────────────────────────────────────────

function TransactionsTab({ store }: { store: Store }) {
  const txns = mockSaleTransactions
    .filter((t) => t.storeId === store.id)
    .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))
    .slice(0, 20);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last 20 B2C Transactions</p>
        <span className="text-xs text-gray-400">{txns.length} shown</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Date</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Farmer</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Products</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Value</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Mode</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {txns.map((txn) => {
            const farmer   = farmerById.get(txn.farmerId);
            const products = txn.lines.map((l) => `${l.productName} ×${l.qty}`).join(', ');
            return (
              <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{txn.invoiceDate}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{farmer?.name ?? txn.farmerId}</td>
                <td className="px-4 py-2.5 text-gray-500 max-w-[220px] truncate" title={products}>{products}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{fmt(txn.totalAmt)}</td>
                <td className="px-4 py-2.5 text-gray-600">{txn.paymentMode}</td>
              </tr>
            );
          })}
          {txns.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No transactions at this store yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── B2B Activity Tab ──────────────────────────────────────────────────────────

const B2B_STATUS_STYLE: Record<string, string> = {
  Pending:   'bg-gray-100 text-gray-600',
  Approved:  'bg-blue-100 text-blue-700',
  Allocated: 'bg-purple-100 text-purple-700',
  Dispatched:'bg-amber-100 text-amber-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Invoiced:  'bg-teal-100 text-teal-700',
  Cancelled: 'bg-red-100 text-red-600',
};

function B2BActivityTab({ store }: { store: Store }) {
  const orders = mockB2BOrders
    .filter((o) => o.fulfillmentStoreId === store.warehouseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">B2B Orders — {store.warehouseId === 'wh-ngp-001' ? 'Nagpur Warehouse' : 'Hyderabad Warehouse'}</p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Retailer</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Products</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Value</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Dispatch By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {orders.map((ord) => {
            const retailer = retailerById.get(ord.retailerId);
            const products = ord.lines.map((l) => `${l.productName} ×${l.allocatedQty}`).join(', ');
            const styleCls = B2B_STATUS_STYLE[ord.status] ?? 'bg-gray-100 text-gray-600';
            return (
              <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 font-mono text-gray-700 whitespace-nowrap">{ord.orderNo}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{retailer?.firmName ?? ord.retailerId}</td>
                <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate" title={products}>{products}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{fmt(ord.totalAmt)}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${styleCls}`}>
                    {ord.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-500">{ord.dispatchByDate ?? '—'}</td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No B2B orders for this warehouse.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  store: Store;
  onBack: () => void;
  onEdit: (store: Store) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoreDetail({ store, onBack, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const bdm     = userById.get(store.bdmUserId);
  const manager = userById.get(store.managerUserId);

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={15} />
          All Stores
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{store.name}</h2>
            <span className="text-[10px] font-bold font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded tracking-widest">
              {store.code}
            </span>
            {store.isActive
              ? <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Active</span>
              : <span className="text-[10px] font-medium text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Inactive</span>
            }
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1"><MapPin size={11} />{store.address.district}, {store.address.state} — {store.address.pincode}</span>
            <span className="flex items-center gap-1"><Phone size={11} />{store.phone}</span>
            {store.email && <span className="flex items-center gap-1"><Mail size={11} />{store.email}</span>}
            <span>BDM: <span className="font-medium text-gray-700">{bdm?.name ?? '—'}</span></span>
            <span>Incharge: <span className="font-medium text-gray-700">{manager?.name ?? '—'}</span></span>
            <span className="font-mono">{store.gstIn}</span>
          </div>
        </div>

        <button
          onClick={() => onEdit(store)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'     && <OverviewTab     store={store} />}
      {tab === 'stock'        && <StockTab         store={store} />}
      {tab === 'staff'        && <StaffTab         store={store} />}
      {tab === 'transactions' && <TransactionsTab  store={store} />}
      {tab === 'b2b'          && <B2BActivityTab   store={store} />}
    </div>
  );
}
