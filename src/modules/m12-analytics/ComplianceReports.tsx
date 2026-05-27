import { useState, useMemo } from 'react';
import { Download, FileText, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { mockSaleTransactions } from '../../data/mockSaleTransactions';
import { mockFarmers } from '../../data/mockFarmers';
import { mockProducts } from '../../data/mockProducts';
import { mockStores } from '../../data/mockStores';

// ── Constants ─────────────────────────────────────────────────────────────────

// Subsidised/regulated product IDs (Urea and DAP are controlled under govt scheme)
const SUBSIDISED_PRODUCTS = new Set(['prd-006', 'prd-007', 'prd-009']); // Urea, DAP, SSP

const farmerById  = new Map(mockFarmers.map((f) => [f.id, f]));
const productById = new Map(mockProducts.map((p) => [p.id, p]));
const storeById   = new Map(mockStores.map((s) => [s.id, s]));

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

type KycStatus = 'Verified' | 'Pending' | 'Rejected' | 'ManualFallback';

function kycStatusForTxn(farmerId: string): KycStatus {
  const farmer = farmerById.get(farmerId);
  if (!farmer) return 'Pending';
  if (farmer.kycStatus === 'Verified') return 'Verified';
  // Simulate some manual fallback for transactions with unverified farmers
  return 'ManualFallback';
}

const KYC_STYLE: Record<KycStatus, string> = {
  Verified:       'bg-emerald-100 text-emerald-700',
  Pending:        'bg-amber-100 text-amber-700',
  Rejected:       'bg-red-100 text-red-700',
  ManualFallback: 'bg-orange-100 text-orange-700',
};

// ── Export bar ────────────────────────────────────────────────────────────────

function ExportBar({ reportName }: { reportName: string }) {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <button onClick={() => console.log(`// GET /api/reports/${reportName}/csv`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white">
        <Download size={12} /> CSV
      </button>
      <button onClick={() => console.log(`// GET /api/reports/${reportName}/pdf`)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 bg-white">
        <FileText size={12} /> PDF
      </button>
      <button onClick={() => console.log('// POST /api/reports/schedule', { report: reportName })}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-50 bg-white">
        <Mail size={12} /> Schedule Email
      </button>
    </div>
  );
}

// ── Urea / DAP Daily Report ───────────────────────────────────────────────────

function UreaDAPReport() {
  const [date,    setDate]    = useState('2026-05-26');
  const [storeId, setStoreId] = useState('All');

  // Transactions on selected date that include a subsidised product
  const rows = useMemo(() => {
    return mockSaleTransactions
      .filter((txn) => {
        const matchDate  = txn.invoiceDate === date;
        const matchStore = storeId === 'All' || txn.storeId === storeId;
        const hasSubsidised = txn.lines.some((l) => SUBSIDISED_PRODUCTS.has(l.productId));
        return matchDate && matchStore && hasSubsidised;
      })
      .map((txn) => {
        const farmer    = farmerById.get(txn.farmerId);
        const store     = storeById.get(txn.storeId);
        const kycStatus = kycStatusForTxn(txn.farmerId);
        const subLines  = txn.lines.filter((l) => SUBSIDISED_PRODUCTS.has(l.productId));
        const products  = subLines.map((l) => `${l.productName} ×${l.qty}`).join(', ');
        return { txn, farmer, store, kycStatus, products, subLines };
      });
  }, [date, storeId]);

  const eKycVerified   = rows.filter((r) => r.kycStatus === 'Verified').length;
  const manualFallback = rows.filter((r) => r.kycStatus === 'ManualFallback').length;
  const pctVerified    = rows.length > 0 ? (eKycVerified / rows.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700" />
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700">
          <option value="All">All Stores</option>
          {mockStores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button
          onClick={() => console.log('// GET /api/reports/urea-dap/compliance-format', { date, storeId })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={12} />
          Export Compliance Format
        </button>
        <ExportBar reportName="urea-dap-daily" />
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Transactions</p>
          <p className="text-lg font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">e-KYC Verified</p>
          <p className="text-lg font-bold text-emerald-700">{eKycVerified} <span className="text-sm font-medium">({pctVerified.toFixed(0)}%)</span></p>
        </div>
        {manualFallback > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest">Manual Fallback</p>
            <p className="text-lg font-bold text-orange-700">{manualFallback}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Invoice No</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Store</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Farmer</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Aadhaar Last 4</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Products (Subsidised)</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">e-KYC Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(({ txn, farmer, store, kycStatus, products, subLines }) => {
              const subAmt = subLines.reduce((s, l) => s + l.lineTotal, 0);
              return (
                <tr key={txn.id} className={`hover:bg-gray-50 transition-colors ${kycStatus === 'ManualFallback' ? 'bg-orange-50/40' : ''}`}>
                  <td className="px-3 py-2 font-mono text-gray-700">{txn.invoiceNo}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{store?.name ?? txn.storeId}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-800">{farmer?.name ?? txn.farmerId}</p>
                    <p className="text-gray-400">{farmer?.address.village ?? '—'}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-600">
                    {farmer?.aadhaarLast4 ? `XXXX-${farmer.aadhaarLast4}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={products}>{products}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(subAmt)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${KYC_STYLE[kycStatus]}`}>
                      {kycStatus === 'Verified'
                        ? <CheckCircle2 size={10} />
                        : <AlertCircle size={10} />
                      }
                      {kycStatus === 'ManualFallback' ? 'Manual Fallback' : kycStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-gray-400">
                  No subsidised fertiliser transactions on {date}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Monthly Compliance Summary ────────────────────────────────────────────────

const MONTHLY_COMPLIANCE = [
  { month: '2026-04', label: 'April 2026',  transactions: 48, subsidisedKg: 4200, eKycPct: 85.4, manualPct: 14.6, totalSubsidisedAmt: 218400 },
  { month: '2026-03', label: 'March 2026',  transactions: 62, subsidisedKg: 5800, eKycPct: 88.7, manualPct: 11.3, totalSubsidisedAmt: 298600 },
  { month: '2026-02', label: 'February 2026', transactions: 31, subsidisedKg: 2400, eKycPct: 80.6, manualPct: 19.4, totalSubsidisedAmt: 128000 },
  { month: '2026-01', label: 'January 2026', transactions: 27, subsidisedKg: 1900, eKycPct: 92.6, manualPct: 7.4, totalSubsidisedAmt: 96200 },
];

// Derive May 2026 from actual transaction data
const may2026: typeof MONTHLY_COMPLIANCE[0] = (() => {
  const maySubs = mockSaleTransactions.filter((txn) =>
    txn.invoiceDate.startsWith('2026-05') &&
    txn.lines.some((l) => SUBSIDISED_PRODUCTS.has(l.productId)),
  );
  const totalSubAmt = maySubs.reduce((s, txn) =>
    s + txn.lines.filter((l) => SUBSIDISED_PRODUCTS.has(l.productId)).reduce((ls, l) => ls + l.lineTotal, 0), 0,
  );
  const verified    = maySubs.filter((txn) => kycStatusForTxn(txn.farmerId) === 'Verified').length;
  const eKycPct     = maySubs.length > 0 ? (verified / maySubs.length) * 100 : 0;
  return {
    month: '2026-05', label: 'May 2026 (MTD)',
    transactions: maySubs.length,
    subsidisedKg: 0,
    eKycPct: parseFloat(eKycPct.toFixed(1)),
    manualPct: parseFloat((100 - eKycPct).toFixed(1)),
    totalSubsidisedAmt: Math.round(totalSubAmt),
  };
})();

const ALL_MONTHLY = [may2026, ...MONTHLY_COMPLIANCE];

function MonthlyComplianceSummary() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle size={12} />
          <span>Benchmark: e-KYC verification rate must be ≥ 80% per DBTL norms. Flag stores below threshold.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => console.log('// GET /api/reports/compliance/monthly-export/government-format')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={12} />
            Export Govt. Format
          </button>
          <ExportBar reportName="monthly-compliance" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Month</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Transactions</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Subsidised Amt</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">e-KYC Verified</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Manual Fallback</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide">Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ALL_MONTHLY.map((row) => {
              const compliant = row.eKycPct >= 80;
              return (
                <tr key={row.month} className={`hover:bg-gray-50 transition-colors ${!compliant ? 'bg-red-50/40' : ''}`}>
                  <td className="px-3 py-2 font-medium text-gray-800">{row.label}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{row.transactions}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(row.totalSubsidisedAmt)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-semibold ${row.eKycPct >= 90 ? 'text-emerald-700' : row.eKycPct >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                      {row.eKycPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-orange-600 font-medium">{row.manualPct.toFixed(1)}%</td>
                  <td className="px-3 py-2">
                    {compliant ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={10} /> Compliant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                        <AlertCircle size={10} /> Below Threshold
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bar chart — e-KYC trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">e-KYC Verification Trend</h3>
        <div className="flex items-end gap-4 h-28">
          {[...ALL_MONTHLY].reverse().map((row) => {
            const barH = row.eKycPct;  // percentage as height %
            const color = row.eKycPct >= 90 ? 'bg-emerald-500' : row.eKycPct >= 80 ? 'bg-amber-400' : 'bg-red-500';
            return (
              <div key={row.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500 font-medium">{row.eKycPct.toFixed(0)}%</span>
                <div className="w-full relative rounded-t-md overflow-hidden" style={{ height: '80px' }}>
                  <div className={`absolute bottom-0 w-full ${color} rounded-t-md transition-all`} style={{ height: `${barH}%` }} />
                  {/* 80% threshold line */}
                  <div className="absolute w-full border-t-2 border-dashed border-red-300" style={{ bottom: '80%' }} />
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{row.label.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-red-400 mt-2">— 80% DBTL minimum threshold</p>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

type SubTab = 'daily' | 'monthly';

export default function ComplianceReports() {
  const [sub, setSub] = useState<SubTab>('daily');

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([['daily', 'Urea/DAP Daily Report'], ['monthly', 'Monthly Compliance Summary']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setSub(id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              sub === id ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}</button>
        ))}
      </div>

      {sub === 'daily'   && <UreaDAPReport />}
      {sub === 'monthly' && <MonthlyComplianceSummary />}
    </div>
  );
}
