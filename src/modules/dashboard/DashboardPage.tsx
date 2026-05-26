import {
  IndianRupee,
  Users,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Package,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Badge, { statusVariant } from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { mockOrders } from '../../data/mockOrders';
import { mockProducts } from '../../data/mockProducts';
import { mockProductStock } from '../../data/mockBatches';
import { mockFarmers } from '../../data/mockFarmers';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';

const lowStockProducts = mockProducts.filter((p) => (mockProductStock[p.id] ?? 0) <= p.reorderLevel);

export default function DashboardPage() {
  const todayStr = '2026-05-26';
  const todaySales = mockSaleTransactions.filter((t) => t.invoiceDate === todayStr);
  const totalSalesToday = todaySales.reduce((sum, t) => sum + t.totalAmt, 0);

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Agri Retail overview for today"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Today's Sales"
          value={`₹${(totalSalesToday / 1000).toFixed(1)}k`}
          sub={`${todaySales.length} transactions`}
          icon={<IndianRupee size={20} className="text-emerald-700" />}
          iconBg="bg-emerald-100"
          trend={{ value: '12.4%', positive: true }}
        />
        <StatCard
          label="Active Farmers"
          value={String(mockFarmers.filter((f) => f.isActive).length)}
          sub="3 registered this month"
          icon={<Users size={20} className="text-blue-700" />}
          iconBg="bg-blue-100"
          trend={{ value: '8.1%', positive: true }}
        />
        <StatCard
          label="Pending Orders"
          value="2"
          sub="1 B2B · 1 POS"
          icon={<ShoppingBag size={20} className="text-purple-700" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(lowStockProducts.length)}
          sub="Items below reorder level"
          icon={<AlertTriangle size={20} className="text-red-600" />}
          iconBg="bg-red-100"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm">Recent Orders</h2>
            <span className="text-xs text-gray-400">{mockOrders.length} orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Order No</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Farmer</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Type</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{order.orderNo}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 text-xs">{order.farmerName}</p>
                      <p className="text-gray-400 text-[11px]">{order.farmerPhone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        label={order.orderType}
                        variant={order.orderType === 'POS' ? 'blue' : 'purple'}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-800">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={order.status} variant={statusVariant(order.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock + Quick Stats */}
        <div className="flex flex-col gap-4">
          {/* Low Stock */}
          <div className="bg-white rounded-xl border border-gray-200 flex-1">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Low Stock Alerts</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {lowStockProducts.slice(0, 6).map((p) => {
                const stock = mockProductStock[p.id] ?? 0;
                return (
                  <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{p.sku}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-xs font-bold text-red-600">{stock} {p.unit}s</p>
                      <p className="text-[11px] text-gray-400">Min {p.reorderLevel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top categories */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-emerald-600" />
              <h2 className="font-semibold text-gray-800 text-sm">Sales by Category</h2>
            </div>
            {[
              { label: 'Fertilisers', pct: 68, color: 'bg-emerald-500' },
              { label: 'Seeds', pct: 18, color: 'bg-blue-500' },
              { label: 'Pesticides', pct: 9, color: 'bg-orange-400' },
              { label: 'Others', pct: 5, color: 'bg-gray-300' },
            ].map((cat) => (
              <div key={cat.label} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{cat.label}</span>
                  <span className="font-semibold">{cat.pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick inventory snapshot */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={14} className="text-gray-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Product Snapshot</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Brand</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">MRP</th>
                <th className="text-right px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Stock</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockProducts.slice(0, 6).map((p) => {
                const stock = mockProductStock[p.id] ?? 0;
                const isLow = stock <= p.reorderLevel;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 text-xs">{p.name}</p>
                      <p className="text-gray-400 text-[11px] font-mono">{p.sku}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{p.category}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{p.brand}</td>
                    <td className="px-5 py-3.5 text-right text-xs font-medium text-gray-700">
                      ₹{p.mrp.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-xs font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                        {stock} {p.unit}s
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {isLow ? (
                        <Badge label="Low Stock" variant="red" />
                      ) : (
                        <Badge label="In Stock" variant="green" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
