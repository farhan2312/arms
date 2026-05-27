import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, ShoppingBag, Clock, Truck, IndianRupee } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/Input';
import KpiCard from '../../components/ui/KpiCard';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
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
          <Button variant="primary" iconLeft={Plus}>
            Create Order
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Orders"
          value={b2bOrders.length}
          icon={ShoppingBag}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
        <KpiCard
          label="Pending"
          value={b2bOrders.filter((o) => o.status === 'Pending').length}
          icon={Clock}
          iconBg="#fef9c3"
          iconColor="#ca8a04"
        />
        <KpiCard
          label="Dispatched"
          value={b2bOrders.filter((o) => o.status === 'Dispatched').length}
          icon={Truck}
          iconBg="#dbeafe"
          iconColor="#2563eb"
        />
        <KpiCard
          label="Total Value"
          value={`₹${b2bOrders.reduce((s, o) => s + o.total, 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by order no. or buyer name..."
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
          <div
            key={order.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
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
              <div className="border-t border-gray-100 px-5 pb-4 pt-3">
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th right>Qty</Th>
                      <Th right>Unit Price</Th>
                      <Th right>Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <Tr key={item.productId}>
                        <Td>
                          <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.productName}</p>
                          <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11px' }}>{item.sku}</p>
                        </Td>
                        <Td right>{item.quantity} {item.unit}s</Td>
                        <Td right>₹{item.unitPrice.toLocaleString('en-IN')}</Td>
                        <Td right bold>₹{item.total.toLocaleString('en-IN')}</Td>
                      </Tr>
                    ))}
                    <tr>
                      <td colSpan={3} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid #f8fafc' }}>Discount</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: 'var(--green-500)', fontWeight: 500, borderBottom: '1px solid #f8fafc' }}>- ₹{order.discount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Total Payable</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>₹{order.total.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </TableWrap>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
