// B2B Order Placement — Sales Executive mobile-app-style card form
// swap for API calls: POST /api/b2b/orders
// Auto-approval threshold: ₹25,000

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Building2, AlertCircle, CheckCircle2,
  Search, Plus, Minus, Trash2, ShieldCheck, Clock, X,
  CreditCard, FileText, Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockRetailers } from '../../data/mockRetailers';
import { mockProducts } from '../../data/mockProducts';
import { mockProductStock } from '../../data/mockBatches';
import { mockB2BOrders } from '../../data/mockB2BOrders';
import type { RetailerAccount, RetailerTier, B2BOrder, B2BOrderLine, B2BPaymentTerms } from '../../types/b2b';
import type { Product } from '../../types/entities';

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_DISCOUNT: Record<RetailerTier, number> = {
  Standard: 0,
  Silver: 2,
  Gold: 5,
  Preferred: 8,
};

const TIER_COLOR: Record<RetailerTier, string> = {
  Standard: 'bg-gray-100 text-gray-600',
  Silver:   'bg-slate-200 text-slate-700',
  Gold:     'bg-amber-100 text-amber-700',
  Preferred:'bg-purple-100 text-purple-700',
};

const AUTO_APPROVE_THRESHOLD = 25_000;

const CATEGORIES = ['All', 'Seed', 'Fertiliser', 'Micronutrient', 'Pesticide'] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface DraftLine {
  product: Product;
  qty: number;
}

interface LineCalc {
  basePrice: number;
  discountPct: number;
  discountAmt: number;
  taxableBase: number;
  taxAmt: number;
  lineTotal: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function calcLine(product: Product, qty: number, tier: RetailerTier): LineCalc {
  const basePrice    = product.b2bPrice;
  // Subsidised products cannot be discounted (govt-fixed MRP)
  const discountPct  = product.isSubsidised ? 0 : TIER_DISCOUNT[tier];
  const discountAmt  = parseFloat((basePrice * qty * discountPct / 100).toFixed(2));
  const taxableBase  = parseFloat((basePrice * qty - discountAmt).toFixed(2));
  const taxAmt       = parseFloat((taxableBase * product.taxSlabPct / 100).toFixed(2));
  const lineTotal    = parseFloat((taxableBase + taxAmt).toFixed(2));
  return { basePrice, discountPct, discountAmt, taxableBase, taxAmt, lineTotal };
}

function zoneTag(retailer: RetailerAccount): string {
  return retailer.address.state === 'Telangana' ? 'TRL' : 'VID';
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Retailer', 'Products', 'Review'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                done   ? 'bg-emerald-600 border-emerald-600 text-white'
                : active ? 'bg-white border-emerald-600 text-emerald-600'
                : 'bg-white border-gray-200 text-gray-400'
              }`}>
                {done ? <CheckCircle2 size={16} /> : idx}
              </div>
              <span className={`mt-1 text-[10px] font-medium ${active ? 'text-emerald-600' : done ? 'text-emerald-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${idx < current ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function B2BOrderForm() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [retailerQuery, setRetailerQuery] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerAccount | null>(null);
  const [paymentTerms, setPaymentTerms] = useState<B2BPaymentTerms>('Credit');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<typeof CATEGORIES[number]>('All');
  const [draftLines, setDraftLines] = useState<DraftLine[]>([]);
  const [orderNotes, setOrderNotes] = useState('');

  // ── Step 3 / submit state ─────────────────────────────────────────────────
  const [dispatchByDate, setDispatchByDate] = useState(() => {
    const d = new Date('2026-05-27');
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<B2BOrder | null>(null);

  // ── Retailer search ───────────────────────────────────────────────────────
  const retailerResults = useMemo(() => {
    if (!retailerQuery.trim() || selectedRetailer) return [];
    const q = retailerQuery.toLowerCase();
    return mockRetailers.filter(
      r => r.firmName.toLowerCase().includes(q) || r.ownerName.toLowerCase().includes(q) || r.address.district.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [retailerQuery, selectedRetailer]);

  // ── Bill calculations ─────────────────────────────────────────────────────
  const tier = selectedRetailer?.tier ?? 'Standard';

  const lineCalcs = useMemo(
    () => draftLines.map(l => ({ ...l, ...calcLine(l.product, l.qty, tier) })),
    [draftLines, tier],
  );

  const totals = useMemo(() => {
    const subtotalAmt = lineCalcs.reduce((s, l) => s + l.basePrice * l.qty, 0);
    const discountAmt = parseFloat(lineCalcs.reduce((s, l) => s + l.discountAmt, 0).toFixed(2));
    const taxAmt      = parseFloat(lineCalcs.reduce((s, l) => s + l.taxAmt, 0).toFixed(2));
    const totalAmt    = parseFloat((subtotalAmt - discountAmt + taxAmt).toFixed(2));
    return { subtotalAmt, discountAmt, taxAmt, totalAmt };
  }, [lineCalcs]);

  const availableCredit = selectedRetailer
    ? selectedRetailer.creditLimitAmt - selectedRetailer.outstandingAmt
    : 0;

  const creditBlocked = selectedRetailer !== null
    && paymentTerms === 'Credit'
    && (selectedRetailer.outstandingAmt + totals.totalAmt) > selectedRetailer.creditLimitAmt;

  const isAutoApproved = totals.totalAmt <= AUTO_APPROVE_THRESHOLD;

  // ── Product grid ──────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = productQuery.toLowerCase();
    return mockProducts.filter(p =>
      p.isActive &&
      (categoryFilter === 'All' || p.category === categoryFilter) &&
      (!productQuery || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    );
  }, [productQuery, categoryFilter]);

  function draftQty(productId: string): number {
    return draftLines.find(l => l.product.id === productId)?.qty ?? 0;
  }

  function setDraftQty(product: Product, qty: number) {
    if (qty <= 0) {
      setDraftLines(prev => prev.filter(l => l.product.id !== product.id));
    } else {
      setDraftLines(prev => {
        const exists = prev.find(l => l.product.id === product.id);
        if (exists) return prev.map(l => l.product.id === product.id ? { ...l, qty } : l);
        return [...prev, { product, qty }];
      });
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function submitOrder() {
    if (!selectedRetailer) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(mockB2BOrders.length + 1).padStart(3, '0');
    const orderId = `b2b-ord-new-${Date.now()}`;
    const orderNo = `B2B-${zoneTag(selectedRetailer)}-${dateStr}-${seq}`;

    const lines: B2BOrderLine[] = lineCalcs.map((lc, i) => ({
      id: `b2bl-new-${i}`,
      orderId,
      productId: lc.product.id,
      sku: lc.product.sku,
      productName: lc.product.name,
      requestedQty: lc.qty,
      allocatedQty: lc.qty,
      unit: lc.product.unit,
      unitPrice: lc.basePrice,
      lineDiscountPct: lc.discountPct,
      lineDiscountAmt: lc.discountAmt,
      taxPct: lc.product.taxSlabPct,
      taxAmt: lc.taxAmt,
      lineTotal: lc.lineTotal,
    }));

    const order: B2BOrder = {
      id: orderId,
      orderNo,
      retailerId: selectedRetailer.id,
      salesExecUserId: currentUser.id,
      bdmUserId: 'usr-005',
      fulfillmentStoreId: 'wh-ngp-001',
      status: isAutoApproved ? 'Approved' : 'Submitted',
      paymentTerms,
      lines,
      subtotalAmt: totals.subtotalAmt,
      discountAmt: totals.discountAmt,
      taxAmt: totals.taxAmt,
      totalAmt: totals.totalAmt,
      dispatchByDate,
      deliveryAddress: deliveryAddress.trim() || `${selectedRetailer.address.line1}, ${selectedRetailer.address.district} – ${selectedRetailer.address.pincode}`,
      remarks: orderNotes.trim() || undefined,
      approvedByUserId: isAutoApproved ? 'usr-005' : undefined,
      approvedAt: isAutoApproved ? now.toISOString() : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setSubmittedOrder(order);
    setSubmitted(true);
  }

  // ── Success modal ─────────────────────────────────────────────────────────
  if (submitted && submittedOrder) {
    const statusCls = submittedOrder.status === 'Approved'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-blue-50 border-blue-200 text-blue-800';

    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Order Placed!</h2>
          <p className="font-mono text-sm font-semibold text-gray-600">{submittedOrder.orderNo}</p>
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${statusCls}`}>
            {submittedOrder.status === 'Approved'
              ? '✓ Auto-approved — below ₹25,000 threshold'
              : 'Pending Sales Manager approval (order above ₹25,000)'}
          </div>
          <div className="text-left bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Retailer</span><span className="font-medium">{selectedRetailer?.firmName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900">{fmt(submittedOrder.totalAmt)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span>{submittedOrder.paymentTerms}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Dispatch by</span><span>{submittedOrder.dispatchByDate}</span></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/b2b-orders')}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              View All Orders
            </button>
            <button
              onClick={() => {
                setSubmitted(false); setSubmittedOrder(null);
                setStep(1); setSelectedRetailer(null); setRetailerQuery('');
                setDraftLines([]); setOrderNotes(''); setPaymentTerms('Credit');
              }}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white"
            >
              New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back + title */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => step === 1 ? navigate('/b2b-orders') : setStep(s => (s - 1) as 1 | 2 | 3)}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">New B2B Order</h1>
            <p className="text-xs text-gray-400">{currentUser.name} · {currentUser.employeeCode}</p>
          </div>
        </div>

        <StepBar current={step} />

        {/* ── Step 1: Retailer ────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">

            {/* Retailer search card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Building2 size={15} className="text-emerald-600" />
                Select Retailer
              </h2>

              {!selectedRetailer ? (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={retailerQuery}
                      onChange={e => setRetailerQuery(e.target.value)}
                      placeholder="Search by firm name, owner, or district…"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {retailerResults.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50">
                      {retailerResults.map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setSelectedRetailer(r);
                            setRetailerQuery('');
                            setDeliveryAddress(`${r.address.line1}, ${r.address.district} – ${r.address.pincode}`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{r.firmName}</p>
                            <p className="text-xs text-gray-500">{r.ownerName} · {r.address.district}, {r.address.state}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TIER_COLOR[r.tier]}`}>
                            {r.tier}
                          </span>
                          <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {!retailerQuery && (
                    <div className="grid grid-cols-2 gap-2">
                      {mockRetailers.map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setSelectedRetailer(r);
                            setDeliveryAddress(`${r.address.line1}, ${r.address.district} – ${r.address.pincode}`);
                          }}
                          className="flex items-start gap-2 p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-left transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 leading-snug truncate">{r.firmName}</p>
                            <p className="text-[10px] text-gray-500 truncate">{r.address.district}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${TIER_COLOR[r.tier]}`}>
                            {r.tier}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Selected retailer panel */
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                    <Building2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-emerald-900 truncate">{selectedRetailer.firmName}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TIER_COLOR[selectedRetailer.tier]}`}>
                          {selectedRetailer.tier}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700">{selectedRetailer.ownerName} · {selectedRetailer.mobile}</p>
                      <p className="text-xs text-emerald-600 mt-0.5">{selectedRetailer.address.district}, {selectedRetailer.address.state}</p>
                    </div>
                    <button onClick={() => setSelectedRetailer(null)} className="text-emerald-400 hover:text-emerald-700">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Credit panel */}
                  <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Credit Position</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Limit</p>
                        <p className="text-sm font-bold text-gray-800">{fmt(selectedRetailer.creditLimitAmt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Outstanding</p>
                        <p className="text-sm font-bold text-orange-600">{fmt(selectedRetailer.outstandingAmt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Available</p>
                        <p className={`text-sm font-bold ${availableCredit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fmt(availableCredit)}
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-orange-400"
                        style={{ width: `${Math.min(100, (selectedRetailer.outstandingAmt / selectedRetailer.creditLimitAmt) * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 text-right">
                      Credit terms: {selectedRetailer.creditDays} days · GST: {selectedRetailer.gstIn}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment terms */}
            {selectedRetailer && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CreditCard size={15} className="text-emerald-600" />
                  Payment Terms
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {(['Advance', 'Credit', 'BNPL'] as B2BPaymentTerms[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPaymentTerms(mode)}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                        paymentTerms === mode
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                {paymentTerms === 'Credit' && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={11} />
                    Due in {selectedRetailer.creditDays} days from invoice date
                  </p>
                )}
              </div>
            )}

            {/* Delivery address */}
            {selectedRetailer && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText size={15} className="text-emerald-600" />
                  Delivery Address
                </h2>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Credit block warning */}
            {creditBlocked && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Credit Limit Exceeded</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    This order ({fmt(totals.totalAmt)}) + outstanding ({fmt(selectedRetailer?.outstandingAmt ?? 0)}) exceeds the credit limit ({fmt(selectedRetailer?.creditLimitAmt ?? 0)}). Switch to Advance payment or reduce order value.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedRetailer || creditBlocked}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              Continue to Products
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 2: Products ────────────────────────────────────────── */}
        {step === 2 && selectedRetailer && (
          <div className="space-y-4">
            {/* Tier discount info */}
            {TIER_DISCOUNT[selectedRetailer.tier] > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm">
                <ShieldCheck size={15} className="text-amber-600 flex-shrink-0" />
                <span className="text-amber-800 font-medium">
                  {selectedRetailer.tier} tier — {TIER_DISCOUNT[selectedRetailer.tier]}% trade discount applied on B2B prices
                  <span className="text-amber-600 font-normal ml-1">(excl. subsidised products)</span>
                </span>
              </div>
            )}

            {/* Search + category filter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={productQuery}
                  onChange={e => setProductQuery(e.target.value)}
                  placeholder="Search products by name or SKU…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product cards */}
            <div className="space-y-2">
              {filteredProducts.map(product => {
                const stock     = mockProductStock[product.id] ?? 0;
                const qty       = draftQty(product.id);
                const discPct   = product.isSubsidised ? 0 : TIER_DISCOUNT[selectedRetailer.tier];
                const effPrice  = parseFloat((product.b2bPrice * (1 - discPct / 100)).toFixed(2));

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl border p-4 transition-all ${qty > 0 ? 'border-emerald-300 shadow-sm' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{product.name}</p>
                          {product.isSubsidised && (
                            <span className="text-[9px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Subsidised</span>
                          )}
                          {product.isRegulated && (
                            <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">CIB</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">{product.sku} · {product.packSize} · {product.brand}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div>
                            <p className="text-base font-bold text-gray-900">{fmt(effPrice)}</p>
                            {discPct > 0 && (
                              <p className="text-[10px] text-gray-400 line-through">{fmt(product.b2bPrice)}</p>
                            )}
                          </div>
                          <div>
                            {discPct > 0 && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                -{discPct}%
                              </span>
                            )}
                            <p className="text-[10px] text-gray-400 mt-0.5">+{product.taxSlabPct}% GST</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className={`text-[10px] font-medium ${stock <= product.reorderLevel ? 'text-orange-500' : 'text-gray-500'}`}>
                              {stock.toLocaleString('en-IN')} {product.unit}s avail.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {qty > 0 ? (
                          <>
                            <button
                              onClick={() => setDraftQty(product, qty - 1)}
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-700"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{qty}</span>
                            <button
                              onClick={() => setDraftQty(product, qty + 1)}
                              className="w-8 h-8 rounded-lg border border-emerald-300 bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 text-emerald-700"
                            >
                              <Plus size={13} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDraftQty(product, 1)}
                            disabled={stock === 0}
                            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Plus size={11} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order lines summary */}
            {draftLines.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Package size={14} className="text-emerald-600" />
                    Order Lines ({draftLines.length})
                  </h3>
                  <span className="text-sm font-bold text-gray-900">{fmt(totals.totalAmt)}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {lineCalcs.map(lc => (
                    <div key={lc.product.id} className="flex items-center gap-2 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{lc.product.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {lc.qty} × {fmt(lc.basePrice)}
                          {lc.discountPct > 0 && ` (-${lc.discountPct}%)`}
                          {' '}+{lc.product.taxSlabPct}% GST
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gray-900 flex-shrink-0">{fmt(lc.lineTotal)}</span>
                      <button
                        onClick={() => setDraftQty(lc.product, 0)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order notes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Order Notes</h3>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Special requirements, delivery instructions…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={draftLines.length === 0}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              Review Order · {fmt(totals.totalAmt)}
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Step 3: Review & Submit ──────────────────────────────────── */}
        {step === 3 && selectedRetailer && (
          <div className="space-y-4">
            {/* Retailer summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Retailer</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{selectedRetailer.firmName}</p>
                  <p className="text-xs text-gray-500">{selectedRetailer.address.district}, {selectedRetailer.address.state} · {paymentTerms}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TIER_COLOR[selectedRetailer.tier]}`}>
                  {selectedRetailer.tier}
                </span>
              </div>
            </div>

            {/* Order lines table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Order Lines</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">Product</th>
                      <th className="text-center pb-2 font-medium">Qty</th>
                      <th className="text-right pb-2 font-medium">Rate</th>
                      <th className="text-right pb-2 font-medium">Disc</th>
                      <th className="text-right pb-2 font-medium">GST</th>
                      <th className="text-right pb-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lineCalcs.map(lc => (
                      <tr key={lc.product.id}>
                        <td className="py-2 pr-3">
                          <p className="font-medium text-gray-800 leading-snug">{lc.product.name}</p>
                          <p className="text-gray-400 font-mono">{lc.product.sku}</p>
                        </td>
                        <td className="text-center py-2">{lc.qty} {lc.product.unit}</td>
                        <td className="text-right py-2">{fmt(lc.basePrice)}</td>
                        <td className="text-right py-2 text-emerald-600">
                          {lc.discountPct > 0 ? `-${fmt(lc.discountAmt)}` : '—'}
                        </td>
                        <td className="text-right py-2 text-gray-500">{fmt(lc.taxAmt)}</td>
                        <td className="text-right py-2 font-semibold text-gray-900">{fmt(lc.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Totals */}
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(totals.subtotalAmt)}</span></div>
                {totals.discountAmt > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Trade Discount ({selectedRetailer.tier})</span><span>- {fmt(totals.discountAmt)}</span></div>
                )}
                <div className="flex justify-between text-gray-500"><span>GST</span><span>+ {fmt(totals.taxAmt)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-sm border-t border-gray-100 pt-1.5 mt-1">
                  <span>Order Total</span>
                  <span>{fmt(totals.totalAmt)}</span>
                </div>
              </div>
            </div>

            {/* Approval status */}
            <div className={`flex items-center gap-3 rounded-2xl border p-4 ${
              isAutoApproved
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              {isAutoApproved
                ? <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0" />
                : <Clock size={20} className="text-blue-600 flex-shrink-0" />
              }
              <div>
                <p className={`text-sm font-semibold ${isAutoApproved ? 'text-emerald-800' : 'text-blue-800'}`}>
                  {isAutoApproved ? 'Will be auto-approved' : 'Requires Sales Manager approval'}
                </p>
                <p className={`text-xs ${isAutoApproved ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {isAutoApproved
                    ? `Order value (${fmt(totals.totalAmt)}) is below the ₹25,000 auto-approval threshold`
                    : `Order value (${fmt(totals.totalAmt)}) exceeds ₹25,000 — will move to UnderReview`
                  }
                </p>
              </div>
            </div>

            {/* Credit block */}
            {creditBlocked && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Cannot submit — Credit Limit Exceeded</p>
                  <p className="text-xs text-red-600 mt-0.5">Go back and change payment terms to Advance or reduce order value.</p>
                </div>
              </div>
            )}

            {/* Dispatch date + notes */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                  Requested Dispatch By
                </label>
                <input
                  type="date"
                  value={dispatchByDate}
                  onChange={e => setDispatchByDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                  Delivery Address
                </label>
                <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{deliveryAddress}</p>
              </div>
              {orderNotes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{orderNotes}</p>
                </div>
              )}
            </div>

            <button
              onClick={submitOrder}
              disabled={creditBlocked || draftLines.length === 0}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              Submit Order · {fmt(totals.totalAmt)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
