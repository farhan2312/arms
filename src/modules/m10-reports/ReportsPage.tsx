import { useState } from 'react';
import { Download, BarChart3, TrendingUp, IndianRupee, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { mockOrders } from '../../data/mockOrders';

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Summary', icon: IndianRupee, description: 'Revenue, discounts, and payment mode breakdown' },
  { id: 'inventory', label: 'Inventory Valuation', icon: BarChart3, description: 'Stock-at-hand value by category and SKU' },
  { id: 'farmer', label: 'Farmer Activity', icon: Users, description: 'Purchasing frequency, crop-wise spend, and KYC status' },
  { id: 'b2b', label: 'B2B Performance', icon: TrendingUp, description: 'Channel-wise order volume and outstanding credit' },
];

const MONTHLY_SALES = [
  { month: 'Jan', sales: 182000 },
  { month: 'Feb', sales: 214000 },
  { month: 'Mar', sales: 298000 },
  { month: 'Apr', sales: 342000 },
  { month: 'May', sales: 289000 },
];

const maxSales = Math.max(...MONTHLY_SALES.map((m) => m.sales));

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('mtd');

  const totalSales = mockOrders.reduce((s, o) => s + o.total, 0);
  const totalDiscount = mockOrders.reduce((s, o) => s + o.discount, 0);
  const posRevenue = mockOrders.filter((o) => o.orderType === 'POS').reduce((s, o) => s + o.total, 0);
  const b2bRevenue = mockOrders.filter((o) => o.orderType === 'B2B').reduce((s, o) => s + o.total, 0);

  return (
    <div className="p-6">
      <PageHeader
        title="Reports"
        subtitle="Operational analytics and exportable data summaries"
        actions={
          <Button variant="secondary" iconLeft={Download} size="sm">
            Export CSV
          </Button>
        }
      />

      {/* Report selector */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {REPORT_TYPES.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                selectedReport === r.id
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedReport === r.id ? 'bg-emerald-600' : 'bg-gray-100'}`}>
                <Icon size={15} className={selectedReport === r.id ? 'text-white' : 'text-gray-600'} />
              </div>
              <div>
                <p className={`text-xs font-semibold ${selectedReport === r.id ? 'text-emerald-800' : 'text-gray-800'}`}>{r.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{r.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Date range */}
      <div className="flex gap-1.5 mb-6">
        {[
          { id: 'today', label: 'Today' },
          { id: 'wtd', label: 'This Week' },
          { id: 'mtd', label: 'This Month' },
          { id: 'ytd', label: 'This Year' },
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => setDateRange(d.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              dateRange === d.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Report content */}
      {selectedReport === 'sales' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* KPIs */}
          <div className="xl:col-span-1 space-y-4">
            {[
              { label: 'Gross Revenue', value: `₹${totalSales.toLocaleString('en-IN')}`, color: 'text-gray-900' },
              { label: 'Total Discounts Given', value: `₹${totalDiscount.toLocaleString('en-IN')}`, color: 'text-red-600' },
              { label: 'POS Revenue', value: `₹${posRevenue.toLocaleString('en-IN')}`, color: 'text-blue-600' },
              { label: 'B2B Revenue', value: `₹${b2bRevenue.toLocaleString('en-IN')}`, color: 'text-purple-600' },
              { label: 'Transactions', value: `${mockOrders.length}`, color: 'text-gray-900' },
            ].map((kpi) => (
              <Card key={kpi.label} padding="16px">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </Card>
            ))}
          </div>

          {/* Chart + table */}
          <div className="xl:col-span-2 space-y-4">
            {/* Bar chart */}
            <Card padding="20px">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Monthly Revenue Trend (₹)</h3>
              <div className="flex items-end gap-3 h-40">
                {MONTHLY_SALES.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 font-medium">
                      ₹{(m.sales / 1000).toFixed(0)}k
                    </span>
                    <div
                      className="w-full bg-emerald-500 rounded-t-md transition-all"
                      style={{ height: `${(m.sales / maxSales) * 100}%` }}
                    />
                    <span className="text-[10px] text-gray-400">{m.month}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment mode breakdown */}
            <Card padding="20px">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Payment Mode Distribution</h3>
              <div className="space-y-3">
                {[
                  { mode: 'UPI', count: 2, pct: 40 },
                  { mode: 'Cash', count: 1, pct: 20 },
                  { mode: 'Credit', count: 1, pct: 20 },
                  { mode: 'BNPL', count: 1, pct: 20 },
                ].map((p) => (
                  <div key={p.mode}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{p.mode}</span>
                      <span className="font-semibold">{p.count} orders ({p.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {selectedReport !== 'sales' && (
        <Card padding="20px">
          <EmptyState
            icon={BarChart3}
            title={`${REPORT_TYPES.find((r) => r.id === selectedReport)?.label ?? ''} report`}
            subtitle="Connect to live API to populate this report"
          />
        </Card>
      )}
    </div>
  );
}
