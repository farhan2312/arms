import {
  IndianRupee,
  Users,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import { Card, CardHeader } from '../../components/ui/Card';
import Badge, { getStatusVariant } from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import { mockOrders } from '../../data/mockOrders';
import { mockProducts } from '../../data/mockProducts';
import { mockProductStock } from '../../data/mockBatches';
import { mockFarmers } from '../../data/mockFarmers';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';

const lowStockProducts = mockProducts.filter(
  (p) => (mockProductStock[p.id] ?? 0) <= p.reorderLevel
);

export default function DashboardPage() {
  const todayStr = '2026-05-26';
  const todaySales = mockSaleTransactions.filter((t) => t.invoiceDate === todayStr);
  const totalSalesToday = todaySales.reduce((sum, t) => sum + t.totalAmt, 0);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Agri Retail overview for today"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Today's Sales"
          value={`₹${(totalSalesToday / 1000).toFixed(1)}k`}
          trend={`↑ 12.4% · ${todaySales.length} transactions`}
          trendUp={true}
          icon={IndianRupee}
          iconBg="#dcfce7"
          iconColor="#16a34a"
        />
        <KpiCard
          label="Active Farmers"
          value={String(mockFarmers.filter((f) => f.isActive).length)}
          trend="↑ 8.1% · 3 new this month"
          trendUp={true}
          icon={Users}
          iconBg="#dbeafe"
          iconColor="#1d4ed8"
        />
        <KpiCard
          label="Pending Orders"
          value="2"
          trend="1 B2B · 1 POS"
          icon={ShoppingBag}
          iconBg="#f3e8ff"
          iconColor="#7c3aed"
        />
        <KpiCard
          label="Low Stock Alerts"
          value={String(lowStockProducts.length)}
          trend="Items below reorder level"
          trendUp={false}
          icon={AlertTriangle}
          iconBg="#fee2e2"
          iconColor="#dc2626"
        />
      </div>

      {/* Main two-column section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="xl:col-span-2 space-y-3">
          <Card>
            <CardHeader
              title="Recent Orders"
              subtitle={`${mockOrders.length} orders`}
            />
          </Card>
          <TableWrap>
            <thead>
              <tr>
                <Th>Order No</Th>
                <Th>Farmer</Th>
                <Th>Type</Th>
                <Th right>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <Tr key={order.id}>
                  <Td mono>{order.orderNo}</Td>
                  <Td>
                    <div style={{ fontWeight: 500 }}>{order.farmerName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.farmerPhone}</div>
                  </Td>
                  <Td>
                    <Badge variant={order.orderType === 'POS' ? 'blue' : 'purple'}>
                      {order.orderType}
                    </Badge>
                  </Td>
                  <Td right bold>₹{order.total.toLocaleString('en-IN')}</Td>
                  <Td>
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Low Stock Alerts */}
          <Card padding="0">
            <div style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>
                Low Stock Alerts
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Products below reorder level
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {lowStockProducts.slice(0, 6).map((p) => {
                const stock = mockProductStock[p.id] ?? 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between"
                    style={{
                      padding: '10px 20px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {p.sku}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                        {stock} {p.unit}s
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min {p.reorderLevel}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Sales by Category */}
          <Card>
            <CardHeader
              title="Sales by Category"
              subtitle="Today's revenue breakdown"
            />
            {[
              { label: 'Fertilisers', pct: 68, color: '#22c55e' },
              { label: 'Seeds',       pct: 18, color: '#3b82f6' },
              { label: 'Pesticides',  pct: 9,  color: '#f97316' },
              { label: 'Others',      pct: 5,  color: '#cbd5e1' },
            ].map((cat) => (
              <div key={cat.label} className="mb-3 last:mb-0">
                <div
                  className="flex justify-between"
                  style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}
                >
                  <span>{cat.label}</span>
                  <span style={{ fontWeight: 600 }}>{cat.pct}%</span>
                </div>
                <div style={{
                  height: '6px',
                  backgroundColor: 'var(--border)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${cat.pct}%`,
                    backgroundColor: cat.color,
                    borderRadius: '9999px',
                  }} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Product Snapshot */}
      <div className="space-y-3">
        <Card>
          <CardHeader
            title="Product Snapshot"
            subtitle="Top products with stock status"
          />
        </Card>
        <TableWrap>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Brand</Th>
              <Th right>MRP</Th>
              <Th right>Stock</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {mockProducts.slice(0, 6).map((p) => {
              const stock = mockProductStock[p.id] ?? 0;
              const isLow = stock <= p.reorderLevel;
              return (
                <Tr key={p.id}>
                  <Td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</div>
                  </Td>
                  <Td muted>{p.category}</Td>
                  <Td muted>{p.brand}</Td>
                  <Td right>₹{p.mrp.toLocaleString('en-IN')}</Td>
                  <Td right>
                    <span style={{ fontWeight: 600, color: isLow ? '#dc2626' : 'var(--text-primary)' }}>
                      {stock} {p.unit}s
                    </span>
                  </Td>
                  <Td>
                    {isLow
                      ? <Badge variant="red">Low Stock</Badge>
                      : <Badge variant="green">In Stock</Badge>
                    }
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}
