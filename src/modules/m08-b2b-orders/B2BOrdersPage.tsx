import { useState } from 'react';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import { mockOrders } from '../../data/mockOrders';

const b2bOrders = mockOrders.filter((o) => o.orderType === 'B2B');

export default function B2BOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = b2bOrders.filter((o) => {
    const matchSearch =
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      o.farmerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paymentBadge = (mode: string) => {
    const map: Record<string, 'green' | 'blue' | 'orange' | 'purple' | 'gray'> = {
      Cash: 'green',
      UPI: 'blue',
      Credit: 'orange',
      BNPL: 'purple',
    };
    return map[mode] ?? 'gray';
  };

  return (
    <div className="p-6">
      <PageHeader
        title="B2B Orders"
        subtitle="Bulk agri-input orders from dealers and institutional buyers"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus size={15} />
            Create Order
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: b2bOrders.length },
          { label: 'Pending', value: b2bOrders.filter((o) => o.status === 'Pending').length },
          { label: 'Dispatched', value: b2bOrders.filter((o) => o.status === 'Dispatched').length },
          { label: 'Total Value', value: `₹${b2bOrders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-60">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order no. or buyer name..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        {['All', 'Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === s
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              {expandedId === order.id ? (
                <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1 grid grid-cols-5 items-center gap-4">
                <div>
                  <p className="font-mono text-xs font-semibold text-gray-800">{order.orderNo}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{order.farmerName}</p>
                  <p className="text-[11px] text-gray-400">{order.farmerPhone}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{order.items.length} line items</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</p>
                  <Badge label={order.paymentMode} variant={paymentBadge(order.paymentMode)} />
                </div>
                <div className="text-right">
                  <Badge label={order.status} variant={statusVariant(order.status)} />
                </div>
              </div>
            </button>

            {expandedId === order.id && (
              <div className="border-t border-gray-100 px-5 pb-4">
                <table className="w-full text-xs mt-3">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-semibold">Product</th>
                      <th className="text-right py-2 text-gray-500 font-semibold">Qty</th>
                      <th className="text-right py-2 text-gray-500 font-semibold">Unit Price</th>
                      <th className="text-right py-2 text-gray-500 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.productId} className="border-b border-gray-50">
                        <td className="py-2">
                          <p className="font-medium text-gray-800">{item.productName}</p>
                          <p className="text-gray-400 font-mono">{item.sku}</p>
                        </td>
                        <td className="py-2 text-right text-gray-700">{item.quantity} {item.unit}s</td>
                        <td className="py-2 text-right text-gray-700">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="py-2 text-right font-semibold text-gray-800">₹{item.total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="pt-3 text-right text-gray-500 font-medium">Discount</td>
                      <td className="pt-3 text-right text-green-600 font-semibold">- ₹{order.discount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-1 text-right font-bold text-gray-800">Total Payable</td>
                      <td className="py-1 text-right font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
