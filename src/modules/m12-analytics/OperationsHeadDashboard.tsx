// Operations Head dashboard — platform-wide KPIs, store comparison, near-expiry alerts,
// and pending action items. StoreIncharge is redirected to the store dashboard.
// swap for API calls: GET /api/analytics/ops-head-summary

import { useEffect, useMemo } from 'react';
import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Users,
  Truck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import { mockBatches, nearExpiryBatches } from '../../data/mockBatches';
import { productById } from '../../data/mockProducts';
import { mockFarmers } from '../../data/mockFarmers';
import { mockStores } from '../../data/mockStores';
import { MOCK_USERS } from '../../data/mockUsers';

const TODAY = '2026-05-26';
const MTD_START = '2026-05-01';

// ── Formatting helpers ────────────────────────────────────────────────────────

function shortRupees(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent: string;
}

function KpiCard({ label, value, sub, icon: Icon, accent }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex gap-4 items-start shadow-sm">
      <div className={`rounded-lg p-2.5 flex-shrink-0 ${accent}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900 leading-tight truncate">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OperationsHeadDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser.role === 'StoreIncharge') {
      navigate('/', { replace: true });
    }
  }, [currentUser.role, navigate]);

  // ── KPI: Today's B2C Sales ─────────────────────────────────────────────────
  const todayB2CSales = useMemo(
    () =>
      mockSaleTransactions
        .filter((t) => t.invoiceDate === TODAY)
        .reduce((s, t) => s + t.totalAmt, 0),
    [],
  );

  // ── KPI: B2B Pipeline (Approved + Allocated) ───────────────────────────────
  const b2bPipelineValue = useMemo(
    () =>
      mockB2BOrders
        .filter((o) => o.status === 'Approved' || o.status === 'Allocated')
        .reduce((s, o) => s + o.totalAmt, 0),
    [],
  );

  // ── KPI: Total Stock Value (purchase cost × available qty) ─────────────────
  const totalStockValue = useMemo(
    () =>
      mockBatches.reduce(
        (s, b) => s + (b.currentQty - b.reservedQty) * b.purchasePricePerUnit,
        0,
      ),
    [],
  );

  // ── KPI: Pending Approvals (B2B orders needing Ops Head sign-off) ──────────
  const pendingApprovalsCount = useMemo(
    () =>
      mockB2BOrders.filter(
        (o) => o.status === 'UnderReview' || o.status === 'Submitted',
      ).length,
    [],
  );

  // ── KPI: Active Farmers in loyalty programme ───────────────────────────────
  const activeFarmers = mockFarmers.length;

  // ── KPI: Field Force active (FieldAgent users marked isActive) ─────────────
  const fieldForceActive = useMemo(
    () => MOCK_USERS.filter((u) => u.role === 'FieldAgent' && u.isActive).length,
    [],
  );

  // ── Store comparison table ─────────────────────────────────────────────────
  const storeStats = useMemo(() => {
    const allocatedCount = mockB2BOrders.filter((o) => o.status === 'Allocated').length;
    return mockStores.map((store) => {
      const txns = mockSaleTransactions.filter((t) => t.storeId === store.id);
      const todaySales = txns
        .filter((t) => t.invoiceDate === TODAY)
        .reduce((s, t) => s + t.totalAmt, 0);
      const mtdSales = txns
        .filter((t) => t.invoiceDate >= MTD_START)
        .reduce((s, t) => s + t.totalAmt, 0);

      const storeQty: Record<string, number> = {};
      mockBatches
        .filter((b) => b.storeId === store.id)
        .forEach((b) => {
          storeQty[b.productId] = (storeQty[b.productId] ?? 0) + (b.currentQty - b.reservedQty);
        });
      const lowStockItems = Object.entries(storeQty).filter(([pid, qty]) => {
        const p = productById.get(pid);
        return p !== undefined && qty <= p.reorderLevel;
      }).length;

      return { store, todaySales, mtdSales, lowStockItems, allocatedCount };
    });
  }, []);

  // ── Pending actions ────────────────────────────────────────────────────────
  const pendingB2BOrders = useMemo(
    () =>
      mockB2BOrders.filter(
        (o) => o.status === 'UnderReview' || o.status === 'Submitted',
      ),
    [],
  );

  const overdueInvoices = useMemo(
    () =>
      mockB2BOrders.filter(
        (o) => o.status === 'Invoiced' && o.createdAt < '2026-04-26T00:00:00Z',
      ),
    [],
  );

  // ── Near-expiry enriched list ──────────────────────────────────────────────
  const nearExpiryItems = useMemo(
    () =>
      nearExpiryBatches
        .map((b) => {
          const product = productById.get(b.productId);
          const location = b.storeId
            ? (mockStores.find((s) => s.id === b.storeId)?.name.replace('Bharat Agri Store – ', '') ?? b.storeId)
            : `Warehouse (${b.warehouseId ?? '—'})`;
          const daysLeft = Math.round(
            (new Date(b.expiryDate).getTime() - new Date(TODAY).getTime()) / 86_400_000,
          );
          return { batch: b, productName: product?.name ?? b.productId, location, daysLeft };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={26} className="text-emerald-600" />
          Operations Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Platform-wide view · As of {TODAY} · All amounts include GST
        </p>
      </div>

      {/* KPI Cards */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Today's B2C Sales"
            value={shortRupees(todayB2CSales)}
            sub="All stores combined"
            icon={TrendingUp}
            accent="bg-emerald-50 text-emerald-600"
          />
          <KpiCard
            label="B2B Pipeline"
            value={shortRupees(b2bPipelineValue)}
            sub="Approved + Allocated orders"
            icon={Truck}
            accent="bg-blue-50 text-blue-600"
          />
          <KpiCard
            label="Total Stock Value"
            value={shortRupees(totalStockValue)}
            sub="Purchase cost · all locations"
            icon={Package}
            accent="bg-violet-50 text-violet-600"
          />
          <KpiCard
            label="Pending Approvals"
            value={String(pendingApprovalsCount)}
            sub="B2B orders awaiting review"
            icon={Clock}
            accent={
              pendingApprovalsCount > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-gray-100 text-gray-400'
            }
          />
          <KpiCard
            label="Active Farmers"
            value={String(activeFarmers)}
            sub="Enrolled in loyalty programme"
            icon={Users}
            accent="bg-teal-50 text-teal-600"
          />
          <KpiCard
            label="Field Force Active"
            value={String(fieldForceActive)}
            sub="Agents in active status"
            icon={ShoppingBag}
            accent="bg-orange-50 text-orange-600"
          />
        </div>
      </section>

      {/* Store Comparison Table */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Store Comparison
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Store
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Today Sales
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  MTD Sales
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Low Stock SKUs
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  B2B Allocated Picks ¹
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {storeStats.map(({ store, todaySales, mtdSales, lowStockItems, allocatedCount }) => (
                <tr
                  key={store.id}
                  className="bg-white hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {store.name.replace('Bharat Agri Store – ', '')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {store.code} · {store.address.state}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">
                    {todaySales > 0 ? (
                      shortRupees(todaySales)
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">
                    {mtdSales > 0 ? (
                      shortRupees(mtdSales)
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {lowStockItems > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                        <AlertTriangle size={10} />
                        {lowStockItems}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {allocatedCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600">
                        {allocatedCount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
            ¹ All B2B fulfilment is centralised at Nagpur Warehouse (wh-ngp-001). Allocated count is platform-wide.
          </p>
        </div>
      </section>

      {/* Bottom two panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Near Expiry Stock */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Near Expiry Stock
            <span className="ml-auto font-bold text-amber-500">{nearExpiryItems.length}</span>
          </h2>
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-amber-400 overflow-hidden shadow-sm">
            {nearExpiryItems.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm bg-white">
                No batches expiring within 30 days.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {nearExpiryItems.map(({ batch, productName, location, daysLeft }) => (
                  <li
                    key={batch.id}
                    className="flex items-start gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`mt-1.5 flex-shrink-0 rounded-full w-2 h-2 ${daysLeft <= 15 ? 'bg-red-500' : 'bg-amber-400'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{productName}</p>
                      <p className="text-xs text-gray-400">
                        {batch.batchNo} · {location}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-sm font-bold ${daysLeft <= 15 ? 'text-red-500' : 'text-amber-500'}`}
                      >
                        {daysLeft}d
                      </p>
                      <p className="text-xs text-gray-400">
                        {(batch.currentQty - batch.reservedQty).toLocaleString('en-IN')} units
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Pending Actions */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-blue-500" />
            Pending Actions
          </h2>
          <div className="rounded-xl border border-gray-200 border-l-4 border-l-blue-400 overflow-hidden divide-y divide-gray-100 shadow-sm">

            {/* B2B orders needing approval */}
            <div className="bg-white">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                B2B Orders — Awaiting Approval
              </p>
              {pendingB2BOrders.length === 0 ? (
                <p className="px-4 pb-3 text-sm text-gray-400">All clear.</p>
              ) : (
                <ul className="pb-1">
                  {pendingB2BOrders.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{o.orderNo}</p>
                        <p className="text-xs text-gray-400">
                          {o.status === 'UnderReview' ? 'Under Review' : 'Submitted'} ·{' '}
                          Dispatch by {o.dispatchByDate ?? 'TBD'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{shortRupees(o.totalAmt)}</p>
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            o.status === 'UnderReview'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Overdue B2B invoices */}
            <div className="bg-white">
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Overdue B2B Invoices (&gt;30 days unpaid)
              </p>
              {overdueInvoices.length === 0 ? (
                <p className="px-4 pb-3 text-sm text-gray-400">No overdue invoices.</p>
              ) : (
                <ul className="pb-1">
                  {overdueInvoices.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{o.orderNo}</p>
                        <p className="text-xs text-gray-400">
                          Invoiced · Created {o.createdAt.slice(0, 10)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-red-500 flex-shrink-0">
                        {shortRupees(o.totalAmt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* TA/DA claims — placeholder until backend */}
            <div className="bg-white px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                TA / DA Claims Pending
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Field agent travel reimbursements awaiting approval
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-600">
                  2 pending
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                TA/DA module pending — claims visible once backend is connected.
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
