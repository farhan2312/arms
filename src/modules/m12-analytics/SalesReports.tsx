import { useState, useMemo } from 'react';
import { Download, FileText, Mail } from 'lucide-react';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import { mockFarmers } from '../../data/mockFarmers';
import { mockRetailers } from '../../data/mockRetailers';
import { mockStores } from '../../data/mockStores';
import { MOCK_USERS } from '../../data/mockUsers';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const farmerById  = new Map(mockFarmers.map((f) => [f.id, f]));
const retailerById = new Map(mockRetailers.map((r) => [r.id, r]));
const storeById   = new Map(mockStores.map((s) => [s.id, s]));
const userById    = new Map(MOCK_USERS.map((u) => [u.id, u]));

// ── Types ─────────────────────────────────────────────────────────────────────

type SubTab = 'b2c' | 'b2b';

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Export bar ────────────────────────────────────────────────────────────────

function ExportBar({ reportName }: { reportName: string }) {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <button
        onClick={() => console.log(`// GET /api/reports/${reportName}/csv`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors bg-white"
      >
        <Download size={12} />
        CSV
      </button>
      <button
        onClick={() => console.log(`// GET /api/reports/${reportName}/pdf`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors bg-white"
      >
        <FileText size={12} />
        PDF
      </button>
      <button
        onClick={() => console.log('// POST /api/reports/schedule', { report: reportName })}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors bg-white"
      >
        <Mail size={12} />
        Schedule Email
      </button>
    </div>
  );
}

// ── B2C Sales Register ────────────────────────────────────────────────────────

function B2CSalesRegister() {
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo,   setDateTo]   = useState('2026-05-27');
  const [storeId,  setStoreId]  = useState('All');

  const rows = useMemo(() => {
    return mockSaleTransactions.filter((txn) => {
      const matchStore = storeId === 'All' || txn.storeId === storeId;
      const matchFrom  = !dateFrom || txn.invoiceDate >= dateFrom;
      const matchTo    = !dateTo   || txn.invoiceDate <= dateTo;
      return matchStore && matchFrom && matchTo;
    });
  }, [dateFrom, dateTo, storeId]);

  const totalTaxable = rows.reduce((s, t) => s + t.lines.reduce((ls, l) => ls + l.taxableAmt, 0), 0);
  const totalCgst    = rows.reduce((s, t) => s + t.lines.reduce((ls, l) => ls + l.cgstAmt, 0), 0);
  const totalSgst    = rows.reduce((s, t) => s + t.lines.reduce((ls, l) => ls + l.sgstAmt, 0), 0);
  const totalAmt     = rows.reduce((s, t) => s + t.totalAmt, 0);

  return (
    <div className="space-y-4">
      {/* Filters + export */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700">
          <option value="All">All Stores</option>
          {mockStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <ExportBar reportName="b2c-sales" />
      </div>

      {/* Summary cards */}
      <div className="flex flex-wrap gap-3">
        <SummaryCard label="Total Sales"        value={fmt(totalAmt)}     sub={`${rows.length} transactions`} />
        <SummaryCard label="Taxable Value"      value={fmt(totalTaxable)} />
        <SummaryCard label="GST Collected"      value={fmt(totalCgst + totalSgst)} sub={`CGST ${fmt(totalCgst)} + SGST ${fmt(totalSgst)}`} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Invoice No</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Store</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Farmer</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Products</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Taxable</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">CGST</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">SGST</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">IGST</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((txn) => {
                const farmer  = farmerById.get(txn.farmerId);
                const store   = storeById.get(txn.storeId);
                const taxable = txn.lines.reduce((s, l) => s + l.taxableAmt, 0);
                const cgst    = txn.lines.reduce((s, l) => s + l.cgstAmt, 0);
                const sgst    = txn.lines.reduce((s, l) => s + l.sgstAmt, 0);
                const products = txn.lines.map((l) => `${l.productName} ×${l.qty}`).join(', ');
                return (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-gray-700 whitespace-nowrap">{txn.invoiceNo}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{txn.invoiceDate}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{store?.name ?? txn.storeId}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{farmer?.name ?? txn.farmerId}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate" title={products}>{products}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{fmt(taxable)}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{fmt(cgst)}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{fmt(sgst)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">—</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(txn.totalAmt)}</td>
                    <td className="px-3 py-2 text-gray-600">{txn.paymentMode}</td>
                  </tr>
                );
              })}
              {/* Totals */}
              <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                <td colSpan={5} className="px-3 py-2.5 text-gray-600">Total ({rows.length} transactions)</td>
                <td className="px-3 py-2.5 text-right text-gray-800">{fmt(totalTaxable)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{fmt(totalCgst)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{fmt(totalSgst)}</td>
                <td className="px-3 py-2.5 text-right text-gray-400">—</td>
                <td className="px-3 py-2.5 text-right text-emerald-700">{fmt(totalAmt)}</td>
                <td />
              </tr>
              {rows.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-10 text-center text-gray-400">No transactions match the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── B2B Sales Register ────────────────────────────────────────────────────────

function B2BSalesRegister() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo,   setDateTo]   = useState('2026-05-27');

  const rows = useMemo(() => {
    return mockB2BOrders.filter((ord) => {
      const ordDate = ord.createdAt.slice(0, 10);
      const matchFrom = !dateFrom || ordDate >= dateFrom;
      const matchTo   = !dateTo   || ordDate <= dateTo;
      return matchFrom && matchTo && (ord.status === 'Invoiced' || ord.status === 'Delivered' || ord.status === 'Dispatched');
    });
  }, [dateFrom, dateTo]);

  const totalTaxable = rows.reduce((s, o) => s + (o.subtotalAmt - o.discountAmt), 0);
  const totalGst     = rows.reduce((s, o) => s + o.taxAmt, 0);
  const totalAmt     = rows.reduce((s, o) => s + o.totalAmt, 0);

  return (
    <div className="space-y-4">
      {/* Filters + export */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <span className="text-xs text-gray-400">to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <ExportBar reportName="b2b-sales" />
      </div>

      {/* Summary cards */}
      <div className="flex flex-wrap gap-3">
        <SummaryCard label="Total B2B Revenue"  value={fmt(totalAmt)}     sub={`${rows.length} orders`} />
        <SummaryCard label="Taxable Value"       value={fmt(totalTaxable)} />
        <SummaryCard label="GST Collected"       value={fmt(totalGst)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Order No</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Retailer</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Sales Exec</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Products</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Taxable</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">GST</th>
                <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((ord) => {
                const retailer = retailerById.get(ord.retailerId);
                const exec     = userById.get(ord.salesExecUserId ?? '');
                const products = ord.lines.map((l) => `${l.productName} ×${l.allocatedQty}`).join(', ');
                const taxable  = ord.subtotalAmt - ord.discountAmt;
                return (
                  <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-gray-700 whitespace-nowrap">{ord.orderNo}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{ord.createdAt.slice(0, 10)}</td>
                    <td className="px-3 py-2 text-gray-700">{retailer?.firmName ?? ord.retailerId}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{exec?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate" title={products}>{products}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{fmt(taxable)}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{fmt(ord.taxAmt)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(ord.totalAmt)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Totals */}
              <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                <td colSpan={5} className="px-3 py-2.5 text-gray-600">Total ({rows.length} orders)</td>
                <td className="px-3 py-2.5 text-right text-gray-800">{fmt(totalTaxable)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{fmt(totalGst)}</td>
                <td className="px-3 py-2.5 text-right text-emerald-700">{fmt(totalAmt)}</td>
                <td />
              </tr>
              {rows.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-gray-400">No B2B orders match the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function SalesReports() {
  const [sub, setSub] = useState<SubTab>('b2c');

  return (
    <div className="space-y-5">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([['b2c', 'B2C Sales Register'], ['b2b', 'B2B Sales Register']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              sub === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'b2c' && <B2CSalesRegister />}
      {sub === 'b2b' && <B2BSalesRegister />}
    </div>
  );
}
