// ComplianceDashboard — subsidised fertiliser compliance tracking
// Covers urea and DAP sold with Aadhaar e-KYC or manual fallback

import { useState, useMemo } from 'react';
import { AlertTriangle, Download, FileText, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TableWrap, Th, Td, Tr } from '../../components/ui/Table';
import { Select } from '../../components/ui/Input';
import SlideOver from '../../components/ui/SlideOver';

// ── Types ──────────────────────────────────────────────────────────────────────

type VerificationMethod = 'eKYC' | 'Manual';
type ProductCategory    = 'Urea' | 'DAP';

interface ComplianceRecord {
  id: string;
  date: string;             // YYYY-MM-DD
  storeId: string;
  storeName: string;
  productName: string;
  productCategory: ProductCategory;
  qtyPacks: number;
  qtyKg: number;
  farmerName: string;
  farmerMobile: string;
  maskedAadhaar: string;    // XXXX-XXXX-1234
  verificationMethod: VerificationMethod;
  flagged: boolean;
  invoiceNo: string;
  physicalRef?: string;
  justificationNotes?: string;
}

// ── Mock Data (seed) ───────────────────────────────────────────────────────────
// Urea: 45 kg/bag · DAP: 50 kg/bag

const MOCK_RECORDS: ComplianceRecord[] = [
  {
    id: 'cmp-001',
    date: '2026-05-27',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    productName: 'Urea (Neem Coated) 45 Kg',
    productCategory: 'Urea',
    qtyPacks: 2,
    qtyKg: 90,
    farmerName: 'Suresh Vitthal Patil',
    farmerMobile: '+91 94220 11001',
    maskedAadhaar: 'XXXX-XXXX-4821',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-AKL-20260527-031',
  },
  {
    id: 'cmp-002',
    date: '2026-05-27',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    productName: 'DAP (Di-Ammonium Phosphate) 50 Kg',
    productCategory: 'DAP',
    qtyPacks: 1,
    qtyKg: 50,
    farmerName: 'Ramesh Narayan Yadav',
    farmerMobile: '+91 94220 11002',
    maskedAadhaar: 'XXXX-XXXX-7034',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-AKL-20260527-032',
  },
  {
    id: 'cmp-003',
    date: '2026-05-27',
    storeId: 'str-ngp-003',
    storeName: 'Bharat Agri Store – Nagpur',
    productName: 'Urea (Neem Coated) 45 Kg',
    productCategory: 'Urea',
    qtyPacks: 3,
    qtyKg: 135,
    farmerName: 'Moreshwar Vasant Thakare',
    farmerMobile: '+91 94220 11009',
    maskedAadhaar: 'XXXX-XXXX-2290',
    verificationMethod: 'Manual',
    flagged: true,
    invoiceNo: 'INV-NGP-20260527-018',
    physicalRef: '2290 8832 1147',
    justificationNotes: "Farmer's registered mobile not reachable — new SIM issued last week. Physical Aadhaar card verified in-store.",
  },
  {
    id: 'cmp-004',
    date: '2026-05-26',
    storeId: 'str-amr-002',
    storeName: 'Bharat Agri Store – Amravati',
    productName: 'DAP (Di-Ammonium Phosphate) 50 Kg',
    productCategory: 'DAP',
    qtyPacks: 2,
    qtyKg: 100,
    farmerName: 'Dilip Mahadeo Gawande',
    farmerMobile: '+91 94220 11006',
    maskedAadhaar: 'XXXX-XXXX-5509',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-AMR-20260526-009',
  },
  {
    id: 'cmp-005',
    date: '2026-05-26',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    productName: 'Urea (Neem Coated) 45 Kg',
    productCategory: 'Urea',
    qtyPacks: 5,
    qtyKg: 225,
    farmerName: 'Anand Bhimrao Shinde',
    farmerMobile: '+91 94220 11003',
    maskedAadhaar: 'XXXX-XXXX-3301',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-AKL-20260526-027',
  },
  {
    id: 'cmp-006',
    date: '2026-05-25',
    storeId: 'str-ngp-003',
    storeName: 'Bharat Agri Store – Nagpur',
    productName: 'DAP (Di-Ammonium Phosphate) 50 Kg',
    productCategory: 'DAP',
    qtyPacks: 4,
    qtyKg: 200,
    farmerName: 'Vitthal Shankar More',
    farmerMobile: '+91 94220 11005',
    maskedAadhaar: 'XXXX-XXXX-6612',
    verificationMethod: 'Manual',
    flagged: true,
    invoiceNo: 'INV-NGP-20260525-014',
    physicalRef: '6612 4401 9923',
    justificationNotes: 'OTP delivery failure — BSNL network issue in the area. Farmer provided Aadhaar card and PAN card for identity verification.',
  },
  {
    id: 'cmp-007',
    date: '2026-05-25',
    storeId: 'str-wrd-004',
    storeName: 'Bharat Agri Store – Wardha',
    productName: 'Urea (Neem Coated) 45 Kg',
    productCategory: 'Urea',
    qtyPacks: 2,
    qtyKg: 90,
    farmerName: 'Lata Suresh Nandankar',
    farmerMobile: '+91 94220 11010',
    maskedAadhaar: 'XXXX-XXXX-8874',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-WRD-20260525-006',
  },
  {
    id: 'cmp-008',
    date: '2026-05-24',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    productName: 'DAP (Di-Ammonium Phosphate) 50 Kg',
    productCategory: 'DAP',
    qtyPacks: 3,
    qtyKg: 150,
    farmerName: 'Suresh Vitthal Patil',
    farmerMobile: '+91 94220 11001',
    maskedAadhaar: 'XXXX-XXXX-4821',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-AKL-20260524-019',
  },
  {
    id: 'cmp-009',
    date: '2026-05-24',
    storeId: 'str-amr-002',
    storeName: 'Bharat Agri Store – Amravati',
    productName: 'Urea (Neem Coated) 45 Kg',
    productCategory: 'Urea',
    qtyPacks: 1,
    qtyKg: 45,
    farmerName: 'Annapurna Ramrao Bhagat',
    farmerMobile: '+91 94220 11007',
    maskedAadhaar: 'XXXX-XXXX-1108',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-AMR-20260524-011',
  },
  {
    id: 'cmp-010',
    date: '2026-05-23',
    storeId: 'str-ngp-003',
    storeName: 'Bharat Agri Store – Nagpur',
    productName: 'Urea (Neem Coated) 45 Kg',
    productCategory: 'Urea',
    qtyPacks: 2,
    qtyKg: 90,
    farmerName: 'Savita Arun Wankhede',
    farmerMobile: '+91 94220 11004',
    maskedAadhaar: 'XXXX-XXXX-2291',
    verificationMethod: 'Manual',
    flagged: true,
    invoiceNo: 'INV-NGP-20260523-010',
    physicalRef: '2291 7743 5501',
    justificationNotes: 'Farmer stated mobile linked to Aadhaar is of deceased spouse — updating registration separately. Physical Aadhaar matched facial biometric.',
  },
  {
    id: 'cmp-011',
    date: '2026-05-22',
    storeId: 'str-wgl-005',
    storeName: 'Bharat Agri Store – Warangal',
    productName: 'DAP (Di-Ammonium Phosphate) 50 Kg',
    productCategory: 'DAP',
    qtyPacks: 6,
    qtyKg: 300,
    farmerName: 'Prakash Tulshiram Ingole',
    farmerMobile: '+91 94220 11008',
    maskedAadhaar: 'XXXX-XXXX-0087',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-WGL-20260522-003',
  },
  {
    id: 'cmp-012',
    date: '2026-05-21',
    storeId: 'str-akl-001',
    storeName: 'Bharat Agri Store – Akola',
    productName: 'Urea (Neem Coated) 45 Kg',
    productCategory: 'Urea',
    qtyPacks: 3,
    qtyKg: 135,
    farmerName: 'Vitthal Shankar More',
    farmerMobile: '+91 94220 11005',
    maskedAadhaar: 'XXXX-XXXX-6612',
    verificationMethod: 'eKYC',
    flagged: false,
    invoiceNo: 'INV-AKL-20260521-014',
  },
];

const TODAY = '2026-05-27';
const MONTH_PREFIX = '2026-05'; // May 2026

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('en-IN', { maximumFractionDigits: 0 }); }

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ComplianceDashboard() {
  const [filterStoreId, setFilterStoreId] = useState('');
  const [filterFrom, setFilterFrom]       = useState('');
  const [filterTo, setFilterTo]           = useState('');
  const [filterMethod, setFilterMethod]   = useState<VerificationMethod | ''>('');
  const [reviewRecord, setReviewRecord]   = useState<ComplianceRecord | null>(null);

  // ── Unique stores for filter dropdown ────────────────────────────────────────
  const allStores = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const r of MOCK_RECORDS) {
      if (!seen.has(r.storeId)) {
        seen.add(r.storeId);
        list.push({ id: r.storeId, name: r.storeName });
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // ── Filtered records ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return MOCK_RECORDS.filter(r => {
      if (filterStoreId && r.storeId !== filterStoreId) return false;
      if (filterFrom && r.date < filterFrom) return false;
      if (filterTo && r.date > filterTo)     return false;
      if (filterMethod && r.verificationMethod !== filterMethod) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [filterStoreId, filterFrom, filterTo, filterMethod]);

  // ── Today's KPIs ──────────────────────────────────────────────────────────────
  const todayRecords   = MOCK_RECORDS.filter(r => r.date === TODAY);
  const todayUreaKg    = todayRecords.filter(r => r.productCategory === 'Urea').reduce((s, r) => s + r.qtyKg, 0);
  const todayDAPKg     = todayRecords.filter(r => r.productCategory === 'DAP').reduce((s, r) => s + r.qtyKg, 0);
  const todayEKYC      = todayRecords.filter(r => r.verificationMethod === 'eKYC').length;
  const todayManual    = todayRecords.filter(r => r.verificationMethod === 'Manual').length;

  // ── Monthly summary ────────────────────────────────────────────────────────────
  const monthRecords   = MOCK_RECORDS.filter(r => r.date.startsWith(MONTH_PREFIX));
  const monthUreaKg    = monthRecords.filter(r => r.productCategory === 'Urea').reduce((s, r) => s + r.qtyKg, 0);
  const monthDAPKg     = monthRecords.filter(r => r.productCategory === 'DAP').reduce((s, r) => s + r.qtyKg, 0);
  const monthEKYCPct   = monthRecords.length > 0
    ? Math.round((monthRecords.filter(r => r.verificationMethod === 'eKYC').length / monthRecords.length) * 100)
    : 0;
  const monthManualPct = 100 - monthEKYCPct;

  const hasFilters = filterStoreId || filterFrom || filterTo || filterMethod;

  function clearFilters() {
    setFilterStoreId('');
    setFilterFrom('');
    setFilterTo('');
    setFilterMethod('');
  }

  function exportReport() {
    console.log('// Export in government-specified format — filtered records:', filtered.length);
  }

  const kpis = [
    { label: "Today's Urea Sales",    value: `${fmt(todayUreaKg)} kg`,  sub: `${todayRecords.filter(r => r.productCategory === 'Urea').length} transactions`,  color: 'bg-blue-50 border-blue-200',     icon: '🌾' },
    { label: "Today's DAP Sales",     value: `${fmt(todayDAPKg)} kg`,   sub: `${todayRecords.filter(r => r.productCategory === 'DAP').length} transactions`,   color: 'bg-purple-50 border-purple-200', icon: '💧' },
    { label: 'e-KYC Verified Today',  value: String(todayEKYC),         sub: 'transactions',                                                                    color: 'bg-emerald-50 border-emerald-200', icon: '✓' },
    { label: 'Manual Fallback Today', value: String(todayManual),        sub: 'flagged for review',                                                              color: 'bg-amber-50 border-amber-200',   icon: '⚠' },
  ];

  // ── SlideOver footer ───────────────────────────────────────────────────────────
  const slideOverFooter = reviewRecord ? (
    <div className="flex flex-col gap-2 w-full">
      <Button
        variant="primary"
        onClick={() => {
          console.log('// PATCH /api/compliance/records/' + reviewRecord.id + ' — mark reviewed');
          setReviewRecord(null);
        }}
        className="w-full justify-center"
      >
        Mark Reviewed — Approved
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          console.log('// PATCH /api/compliance/records/' + reviewRecord.id + ' — escalate');
          setReviewRecord(null);
        }}
        className="w-full justify-center"
      >
        Escalate to Compliance Officer
      </Button>
    </div>
  ) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Fertiliser Compliance"
        subtitle="Aadhaar e-KYC records for subsidised urea and DAP sales"
        actions={
          <Button variant="secondary" iconLeft={Download} size="sm" onClick={exportReport}>
            Export Compliance Report
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`rounded-xl border ${kpi.color} px-5 py-4`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
              <span className="text-base">{kpi.icon}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 font-mono">{kpi.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      <Card padding="24px">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={15} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Monthly Summary — May 2026</h3>
          <span className="text-[10px] text-gray-400 ml-1">({monthRecords.length} records)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Total Urea Sold</p>
            <p className="text-gray-900 font-bold text-lg mt-1 font-mono">{fmt(monthUreaKg)} kg</p>
          </div>
          <div>
            <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Total DAP Sold</p>
            <p className="text-gray-900 font-bold text-lg mt-1 font-mono">{fmt(monthDAPKg)} kg</p>
          </div>
          <div>
            <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">e-KYC Verified</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-emerald-700 font-bold text-lg">{monthEKYCPct}%</p>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${monthEKYCPct}%` }} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Manual Fallback</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-amber-700 font-bold text-lg">{monthManualPct}%</p>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${monthManualPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card padding="16px">
        <p className="text-xs font-semibold text-gray-700 mb-3">Filters</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select value={filterStoreId} onChange={setFilterStoreId}>
            <option value="">All stores</option>
            {allStores.map(s => (
              <option key={s.id} value={s.id}>{s.name.replace('Bharat Agri Store – ', '')}</option>
            ))}
          </Select>
          <input
            type="date"
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="From date"
          />
          <input
            type="date"
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="To date"
          />
          <Select value={filterMethod} onChange={(v) => setFilterMethod(v as VerificationMethod | '')}>
            <option value="">All methods</option>
            <option value="eKYC">e-KYC</option>
            <option value="Manual">Manual (Flagged)</option>
          </Select>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="mt-2 text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors">
            Clear all filters
          </button>
        )}
      </Card>

      {/* Records Table */}
      <TableWrap>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Store</Th>
            <Th>Product</Th>
            <Th>Qty</Th>
            <Th>Farmer</Th>
            <Th>Masked Aadhaar</Th>
            <Th>Method</Th>
            <Th>Invoice</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {filtered.map(rec => (
            <Tr key={rec.id} className={rec.flagged ? 'bg-amber-50/60' : ''}>
              <Td muted>{fmtDate(rec.date)}</Td>
              <Td muted>{rec.storeName.replace('Bharat Agri Store – ', '')}</Td>
              <Td>
                <p className="font-medium text-gray-800 text-xs">{rec.productName}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  rec.productCategory === 'Urea' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>{rec.productCategory}</span>
              </Td>
              <Td mono>
                {rec.qtyPacks} packs<br />
                <span className="text-gray-400 text-xs">{rec.qtyKg} kg</span>
              </Td>
              <Td>
                <p className="font-medium text-gray-800 text-xs">{rec.farmerName}</p>
                <p className="text-[10px] text-gray-400">{rec.farmerMobile}</p>
              </Td>
              <Td mono muted>{rec.maskedAadhaar}</Td>
              <Td>
                {rec.verificationMethod === 'eKYC' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={9} /> e-KYC
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    <AlertTriangle size={9} /> Manual
                  </span>
                )}
              </Td>
              <Td mono muted>{rec.invoiceNo}</Td>
              <Td>
                {rec.flagged && (
                  <button
                    onClick={() => setReviewRecord(rec)}
                    className="text-[11px] font-semibold px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors whitespace-nowrap"
                  >
                    Review
                  </button>
                )}
              </Td>
            </Tr>
          ))}

          {filtered.length === 0 && (
            <Tr>
              <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                No compliance records match the selected filters.
              </td>
            </Tr>
          )}
        </tbody>
      </TableWrap>

      {/* ── Review SlideOver ──────────────────────────────────────────────────── */}
      <SlideOver
        open={!!reviewRecord}
        title="Compliance Review"
        subtitle="Manual verification — flagged"
        onClose={() => setReviewRecord(null)}
        width={440}
        footer={slideOverFooter}
      >
        {reviewRecord && (
          <div className="space-y-5">
            {/* Amber flag banner */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-3 text-xs text-amber-800">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">Manual Aadhaar fallback used</p>
                <p className="mt-0.5">This transaction was processed without successful e-KYC. Compliance review required.</p>
              </div>
            </div>

            {/* Transaction details */}
            <div className="space-y-3 text-xs">
              <Field label="Invoice No"     value={reviewRecord.invoiceNo} mono />
              <Field label="Date"           value={fmtDate(reviewRecord.date)} />
              <Field label="Store"          value={reviewRecord.storeName} />
              <Field label="Product"        value={`${reviewRecord.productName} · ${reviewRecord.qtyPacks} packs (${reviewRecord.qtyKg} kg)`} />
              <Field label="Farmer"         value={`${reviewRecord.farmerName} — ${reviewRecord.farmerMobile}`} />
              <Field label="Masked Aadhaar" value={reviewRecord.maskedAadhaar} mono />
              <Field label="Physical Ref"   value={reviewRecord.physicalRef ?? '—'} mono />
            </div>

            {/* Justification notes */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Justification Notes</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-700 leading-relaxed">
                {reviewRecord.justificationNotes ?? '—'}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400 font-semibold shrink-0">{label}</span>
      <span className={`text-gray-800 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
