// Point of Sale — full billing screen
// swap for API calls: POST /api/sales/transactions, PATCH /api/loyalty/wallets/:id

import { useState, useMemo, useEffect, useRef } from 'react';
import type { ComponentType } from 'react';
import {
  Search, UserCheck, User, AlertTriangle, Trash2, Plus, Minus,
  ShoppingCart, Tag, ChevronRight, X, CheckCircle2, Banknote,
  Smartphone, CreditCard, ReceiptText, Gift,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockProducts } from '../../data/mockProducts';
import { mockBatches, mockProductStock } from '../../data/mockBatches';
import { mockFarmers } from '../../data/mockFarmers';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';
import type { Product, Batch, SaleTransaction, SaleLine, PaymentMode } from '../../types/entities';
import type { Farmer } from '../../types/entities';
import type { LoyaltyTier } from '../../types/loyalty';

// ── Constants ─────────────────────────────────────────────────────────────────

interface CouponDef {
  code: string;
  discountType: 'Flat' | 'Percentage';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number;
  description: string;
}

const COUPONS: CouponDef[] = [
  { code: 'KHARIF10', discountType: 'Percentage', discountValue: 10, minOrderValue: 1000, maxDiscount: 500, description: '10% off, max ₹500, orders above ₹1,000' },
  { code: 'FLAT200',  discountType: 'Flat',       discountValue: 200, minOrderValue: 2000, maxDiscount: 200, description: '₹200 off on orders above ₹2,000' },
  { code: 'KISAN150', discountType: 'Flat',       discountValue: 150, minOrderValue: 1500, maxDiscount: 150, description: '₹150 off on orders above ₹1,500' },
];

const TIER_EARN_RATE: Record<LoyaltyTier, number> = {
  Green: 1,      // 1 pt per ₹10 spent
  Silver: 1.5,
  Gold: 2,
  Platinum: 3,
};

const TIER_BADGE_CLS: Record<LoyaltyTier, string> = {
  Green:    'bg-green-100 text-green-700',
  Silver:   'bg-gray-200 text-gray-600',
  Gold:     'bg-yellow-100 text-yellow-700',
  Platinum: 'bg-purple-100 text-purple-700',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface CartItem {
  product: Product;
  batch: Batch;
  qty: number;
}

// ── Small UI helpers ──────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface PayBtn {
  mode: PaymentMode;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}
const PAY_BTNS: PayBtn[] = [
  { mode: 'Cash',   label: 'Cash',   icon: Banknote },
  { mode: 'UPI',    label: 'UPI',    icon: Smartphone },
  { mode: 'Credit', label: 'Credit', icon: CreditCard },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function POSScreen() {
  const { currentUser, currentStore } = useAuth();
  const storeId = currentStore?.id;

  // ── Farmer state ──────────────────────────────────────────────────────────
  const [farmerQuery, setFarmerQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInMobile, setWalkInMobile] = useState('');

  // ── Products / cart ───────────────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // ── Coupon ────────────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDef | null>(null);
  const [couponError, setCouponError] = useState('');

  // ── Loyalty ───────────────────────────────────────────────────────────────
  const [redeemPoints, setRedeemPoints] = useState(false);

  // ── Payment ───────────────────────────────────────────────────────────────
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentRef, setPaymentRef] = useState('');

  // ── Confirmation modal ────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }

  // ── Local session transaction log ─────────────────────────────────────────
  const [sessionCount, setSessionCount] = useState(0);

  // ── Local wallet overrides (applied within session) ───────────────────────
  const [pointsOverride, setPointsOverride] = useState<Record<string, number>>({});

  // Clean up timer on unmount
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // ── Derived: farmer search results ────────────────────────────────────────
  const farmerResults = useMemo(() => {
    if (!farmerQuery.trim() || selectedFarmer || isWalkIn) return [];
    const q = farmerQuery.toLowerCase();
    return mockFarmers
      .filter(f => f.mobile.includes(farmerQuery) || f.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [farmerQuery, selectedFarmer, isWalkIn]);

  // ── Derived: current farmer's wallet ─────────────────────────────────────
  const wallet = useMemo(
    () => (selectedFarmer ? (walletByFarmerId.get(selectedFarmer.id) ?? null) : null),
    [selectedFarmer],
  );

  const currentPoints = useMemo(() => {
    if (!selectedFarmer || !wallet) return 0;
    return pointsOverride[selectedFarmer.id] ?? wallet.currentPoints;
  }, [selectedFarmer, wallet, pointsOverride]);

  // ── Derived: filtered products ────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const q = productQuery.toLowerCase();
    return mockProducts.filter(
      p => p.isActive && (!productQuery || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    );
  }, [productQuery]);

  // ── Derived: bill computations ────────────────────────────────────────────
  const subtotalAmt = useMemo(
    () => cart.reduce((s, c) => s + c.product.b2cPrice * c.qty, 0),
    [cart],
  );

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || subtotalAmt < appliedCoupon.minOrderValue) return 0;
    const raw =
      appliedCoupon.discountType === 'Flat'
        ? appliedCoupon.discountValue
        : (subtotalAmt * appliedCoupon.discountValue) / 100;
    return Math.min(raw, appliedCoupon.maxDiscount);
  }, [appliedCoupon, subtotalAmt]);

  // Per-line: taxable amount and GST split after proportional coupon allocation
  const lineCalc = useMemo(() =>
    cart.map(c => {
      const gross = c.product.b2cPrice * c.qty;
      const proportion = subtotalAmt > 0 ? gross / subtotalAmt : 0;
      const couponAmt = parseFloat((couponDiscount * proportion).toFixed(2));
      const taxable = parseFloat((gross - couponAmt).toFixed(2));
      const halfRate = c.product.taxSlabPct / 2 / 100;
      const cgst = parseFloat((taxable * halfRate).toFixed(2));
      const sgst = cgst;
      const lineTotal = parseFloat((taxable + cgst + sgst).toFixed(2));
      return { gross, couponAmt, taxable, cgst, sgst, lineTotal };
    }),
  [cart, subtotalAmt, couponDiscount]);

  const totals = useMemo(() => {
    const taxableTotal  = lineCalc.reduce((s, l) => s + l.taxable, 0);
    const totalCgst     = parseFloat(lineCalc.reduce((s, l) => s + l.cgst, 0).toFixed(2));
    const totalSgst     = parseFloat(lineCalc.reduce((s, l) => s + l.sgst, 0).toFixed(2));
    const totalGst      = parseFloat((totalCgst + totalSgst).toFixed(2));

    // Redemption: 10 pts = ₹1; max 10 % of taxable total
    const maxRedeemAmt     = Math.floor(taxableTotal * 0.1);
    const redeemablePts    = Math.min(currentPoints, maxRedeemAmt * 10);
    const redemptionAmt    = redeemPoints && wallet ? parseFloat((redeemablePts / 10).toFixed(2)) : 0;
    const pointsToRedeem   = redeemPoints && wallet ? redeemablePts : 0;

    const grandTotal = parseFloat((taxableTotal + totalGst - redemptionAmt).toFixed(2));

    // Earn calculation — only loyaltyEligible lines; tier multiplier
    const eligibleBase  = lineCalc.reduce((s, l, i) => cart[i].product.loyaltyEligible ? s + l.taxable : s, 0);
    const tierMult      = wallet ? TIER_EARN_RATE[wallet.tier] : 1;
    const pointsToEarn  = wallet ? Math.floor((eligibleBase / 10) * tierMult) : 0;

    return { taxableTotal, totalCgst, totalSgst, totalGst, redemptionAmt, pointsToRedeem, redeemablePts, grandTotal, pointsToEarn };
  }, [lineCalc, cart, wallet, redeemPoints, currentPoints]);

  // ── Cart actions ──────────────────────────────────────────────────────────

  function pickFifoBatch(product: Product): Batch | null {
    // Qty already committed to this product's batches in the current cart
    const cartQty: Record<string, number> = {};
    for (const item of cart) {
      if (item.product.id === product.id) {
        cartQty[item.batch.id] = (cartQty[item.batch.id] ?? 0) + item.qty;
      }
    }
    return (
      mockBatches
        .filter(b => {
          if (b.productId !== product.id) return false;
          const free = b.currentQty - b.reservedQty - (cartQty[b.id] ?? 0);
          return free > 0;
        })
        .sort((a, b) => {
          // Prefer same-store batches, then sort by expiry asc (FIFO)
          const aStore = storeId && a.storeId === storeId ? 0 : 1;
          const bStore = storeId && b.storeId === storeId ? 0 : 1;
          return aStore !== bStore ? aStore - bStore : a.expiryDate.localeCompare(b.expiryDate);
        })[0] ?? null
    );
  }

  function addToCart(product: Product) {
    const batch = pickFifoBatch(product);
    if (!batch) return;

    const existing = cart.find(c => c.product.id === product.id && c.batch.id === batch.id);
    if (existing) {
      const totalInCart = cart.filter(c => c.batch.id === batch.id).reduce((s, c) => s + c.qty, 0);
      const maxFree = batch.currentQty - batch.reservedQty;
      if (totalInCart >= maxFree) return;
      setCart(prev =>
        prev.map(c =>
          c.product.id === product.id && c.batch.id === batch.id ? { ...c, qty: c.qty + 1 } : c,
        ),
      );
    } else {
      setCart(prev => [...prev, { product, batch, qty: 1 }]);
    }
  }

  function updateQty(productId: string, batchId: string, delta: number) {
    setCart(prev =>
      prev
        .map(c => {
          if (c.product.id !== productId || c.batch.id !== batchId) return c;
          const maxFree = c.batch.currentQty - c.batch.reservedQty;
          return { ...c, qty: Math.min(maxFree, Math.max(0, c.qty + delta)) };
        })
        .filter(c => c.qty > 0),
    );
  }

  function removeFromCart(productId: string, batchId: string) {
    setCart(prev => prev.filter(c => !(c.product.id === productId && c.batch.id === batchId)));
  }

  // ── Coupon ────────────────────────────────────────────────────────────────
  function applyCoupon() {
    const c = COUPONS.find(c => c.code === couponInput.trim().toUpperCase());
    if (!c) { setCouponError('Coupon code not found.'); return; }
    if (subtotalAmt < c.minOrderValue) {
      setCouponError(`Minimum order ${fmt(c.minOrderValue)} required.`);
      return;
    }
    setAppliedCoupon(c);
    setCouponError('');
  }

  // ── Complete sale ─────────────────────────────────────────────────────────
  function completeSale() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const txnId = `txn-ses-${Date.now()}`;
    const invoiceNo = `INV-${currentStore?.code ?? 'STR'}-${dateStr}-S${String(sessionCount + 1).padStart(3, '0')}`;
    const farmerId = selectedFarmer?.id ?? 'walk-in';

    const lines: SaleLine[] = cart.map((c, i) => {
      const lc = lineCalc[i];
      return {
        id: `sl-${txnId}-${i}`,
        transactionId: txnId,
        productId: c.product.id,
        batchId: c.batch.id,
        sku: c.product.sku,
        productName: c.product.name,
        qty: c.qty,
        unit: c.product.unit,
        mrp: c.product.mrp,
        unitSellingPrice: c.product.b2cPrice,
        lineDiscountAmt: 0,
        couponDiscountAmt: lc.couponAmt,
        taxableAmt: lc.taxable,
        cgstAmt: lc.cgst,
        sgstAmt: lc.sgst,
        igstAmt: 0,
        lineTotal: lc.lineTotal,
      };
    });

    const txn: SaleTransaction = {
      id: txnId,
      invoiceNo,
      invoiceDate: now.toISOString().slice(0, 10),
      storeId: storeId ?? 'str-akl-001',
      farmerId,
      cashierUserId: currentUser.id,
      couponId: appliedCoupon?.code,
      lines,
      subtotalAmt,
      lineDiscountAmt: 0,
      couponDiscountAmt: couponDiscount,
      totalTaxAmt: totals.totalGst,
      roundOff: 0,
      totalAmt: totals.grandTotal,
      paymentMode,
      paymentRef: paymentRef.trim() || undefined,
      loyaltyPointsEarned: totals.pointsToEarn,
      loyaltyPointsRedeemed: totals.pointsToRedeem,
      loyaltyRedemptionAmt: totals.redemptionAmt,
      status: 'Confirmed',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // ── Persist wallet changes in local state ─────────────────────────────
    if (selectedFarmer) {
      setPointsOverride(prev => ({
        ...prev,
        [selectedFarmer.id]: currentPoints + totals.pointsToEarn - totals.pointsToRedeem,
      }));
    }

    // ── Record to session log ─────────────────────────────────────────────
    // In production: POST /api/sales/transactions with `txn`
    setSessionCount(n => n + 1);
    void txn; // acknowledged

    // ── Toast ─────────────────────────────────────────────────────────────
    const name = selectedFarmer?.name ?? (walkInName.trim() || 'Walk-in Customer');
    showToast(
      totals.pointsToEarn > 0
        ? `Sale recorded. ${totals.pointsToEarn.toLocaleString('en-IN')} pts credited to ${name}'s wallet.`
        : `Sale recorded — ${invoiceNo}.`,
    );

    // ── Reset ─────────────────────────────────────────────────────────────
    setCart([]);
    setSelectedFarmer(null);
    setFarmerQuery('');
    setIsWalkIn(false);
    setWalkInName('');
    setWalkInMobile('');
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    setRedeemPoints(false);
    setPaymentMode('Cash');
    setPaymentRef('');
    setShowModal(false);
  }

  // ── Flags ─────────────────────────────────────────────────────────────────
  const hasSubsidised    = cart.some(c => c.product.isSubsidised);
  const hasValidCustomer = selectedFarmer !== null || (isWalkIn && walkInName.trim() !== '');
  const canCheckout      = cart.length > 0 && hasValidCustomer;
  const customerName     = selectedFarmer?.name ?? (isWalkIn && walkInName.trim() ? walkInName.trim() : null);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <ReceiptText size={20} className="text-emerald-600" />
          <div>
            <h1 className="font-bold text-gray-900 text-base leading-tight">Point of Sale</h1>
            <p className="text-xs text-gray-400">{currentStore?.name ?? 'Bharat Agri Platform'} · {currentUser.name}</p>
          </div>
        </div>
        {sessionCount > 0 && (
          <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
            {sessionCount} sale{sessionCount !== 1 ? 's' : ''} this session
          </span>
        )}
      </div>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══ LEFT PANEL: farmer + products ════════════════════════════════ */}
        <div className="flex-[3] flex flex-col overflow-hidden border-r border-gray-200">

          {/* Farmer section */}
          <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-100 flex-shrink-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Customer</p>

            {/* Farmer selected */}
            {selectedFarmer && (() => {
              const w = walletByFarmerId.get(selectedFarmer.id);
              const pts = pointsOverride[selectedFarmer.id] ?? w?.currentPoints ?? 0;
              const tier = w?.tier ?? 'Green';
              const village = selectedFarmer.address.village ?? selectedFarmer.address.district;
              return (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <UserCheck size={16} className="text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-900 truncate">{selectedFarmer.name}</p>
                    <p className="text-[11px] text-emerald-700">
                      {selectedFarmer.mobile} · {village}, {selectedFarmer.address.district}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_BADGE_CLS[tier]}`}>
                    {tier}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 flex-shrink-0">
                    {pts.toLocaleString('en-IN')} pts
                  </span>
                  <button
                    onClick={() => { setSelectedFarmer(null); setFarmerQuery(''); setRedeemPoints(false); }}
                    className="text-emerald-400 hover:text-emerald-700 flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })()}

            {/* Walk-in confirmed */}
            {isWalkIn && !selectedFarmer && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <User size={16} className="text-amber-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900">{walkInName || 'Walk-in Customer'}</p>
                  {walkInMobile && <p className="text-[11px] text-amber-700">{walkInMobile}</p>}
                </div>
                <span className="text-[10px] font-medium bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Walk-in</span>
                <button onClick={() => { setIsWalkIn(false); setWalkInName(''); setWalkInMobile(''); }} className="text-amber-400 hover:text-amber-700">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Search / walk-in form */}
            {!selectedFarmer && !isWalkIn && (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={farmerQuery}
                    onChange={e => setFarmerQuery(e.target.value)}
                    placeholder="Search by mobile number or name…"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Dropdown results */}
                {farmerResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {farmerResults.map(f => {
                      const w = walletByFarmerId.get(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => { setSelectedFarmer(f); setFarmerQuery(''); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-emerald-50 border-b border-gray-50 last:border-0 bg-white transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{f.name}</p>
                            <p className="text-[10px] text-gray-500">{f.mobile} · {f.address.village ?? f.address.district}, {f.address.district}</p>
                          </div>
                          {w && (
                            <div className="text-right flex-shrink-0">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TIER_BADGE_CLS[w.tier]}`}>{w.tier}</span>
                              <p className="text-[10px] text-gray-500 mt-0.5">{w.currentPoints.toLocaleString('en-IN')} pts</p>
                            </div>
                          )}
                          <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No results / walk-in prompt */}
                {farmerQuery.length >= 3 && farmerResults.length === 0 && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
                    <span>No farmer found for "{farmerQuery}"</span>
                    <button
                      onClick={() => setIsWalkIn(true)}
                      className="text-emerald-600 font-semibold hover:underline"
                    >
                      Add as Walk-in →
                    </button>
                  </div>
                )}

                {/* Walk-in empty search */}
                {farmerQuery.length === 0 && (
                  <button
                    onClick={() => setIsWalkIn(true)}
                    className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    + Proceed as walk-in customer
                  </button>
                )}
              </div>
            )}

            {/* Walk-in form (name + mobile) */}
            {isWalkIn && !selectedFarmer && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  placeholder="Customer name *"
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  value={walkInMobile}
                  onChange={e => setWalkInMobile(e.target.value)}
                  placeholder="Mobile (optional)"
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Subsidised product warning */}
          {hasSubsidised && (
            <div className="mx-4 mt-3 flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2 flex-shrink-0">
              <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0" />
              <p className="text-xs font-medium text-yellow-800">
                Aadhaar e-KYC verification required at checkout for subsidised fertiliser
              </p>
            </div>
          )}

          {/* Product search */}
          <div className="px-4 py-3 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={productQuery}
                onChange={e => setProductQuery(e.target.value)}
                placeholder="Search products by name or SKU…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
              {filteredProducts.map(p => {
                const stock = mockProductStock[p.id] ?? 0;
                const inCart = cart.filter(c => c.product.id === p.id).reduce((s, c) => s + c.qty, 0);
                const isOutOfStock = stock === 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={[
                      'bg-white rounded-xl border text-left p-3 transition-all',
                      isOutOfStock
                        ? 'border-gray-100 opacity-40 cursor-not-allowed'
                        : 'border-gray-200 hover:border-emerald-400 hover:shadow-sm active:scale-[0.98]',
                      inCart > 0 ? 'ring-2 ring-emerald-400 border-emerald-300' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <p className="text-xs font-semibold text-gray-800 leading-snug flex-1">{p.name}</p>
                      {inCart > 0 && (
                        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">
                          {inCart}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono">{p.sku} · {p.packSize}</p>
                    <p className="text-[10px] text-gray-400 mb-2">{p.brand}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{fmt(p.b2cPrice)}</p>
                        <p className="text-[10px] text-gray-400">+{p.taxSlabPct}% GST</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-medium ${stock <= p.reorderLevel ? 'text-red-500' : 'text-gray-500'}`}>
                          {isOutOfStock ? 'Out of stock' : `${stock} ${p.unit}s`}
                        </p>
                        {p.isSubsidised && (
                          <span className="text-[9px] font-medium text-yellow-600">Subsidised</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL: bill ════════════════════════════════════════════ */}
        <div className="flex-[2] flex flex-col bg-white min-w-0">

          {/* Cart header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
            <ShoppingCart size={15} className="text-gray-500" />
            <span className="font-semibold text-gray-800 text-sm">Bill</span>
            <span className="ml-auto text-xs text-gray-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 py-12">
                <ShoppingCart size={36} />
                <p className="text-sm">Add products to start billing</p>
              </div>
            ) : (
              cart.map((item, i) => {
                const lc = lineCalc[i];
                const batchAvail = item.batch.currentQty - item.batch.reservedQty;
                const nearExp = item.batch.expiryDate < '2026-06-25';
                return (
                  <div key={`${item.product.id}-${item.batch.id}`} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-snug truncate">{item.product.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{item.product.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.batch.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {/* Batch info */}
                    <div className={`flex items-center gap-1.5 mb-2 px-2 py-1 rounded text-[10px] ${nearExp ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
                      {nearExp && <AlertTriangle size={10} className="text-amber-500 flex-shrink-0" />}
                      <span className="font-mono">{item.batch.batchNo}</span>
                      <span>·</span>
                      <span>Exp {item.batch.expiryDate}</span>
                      <span>·</span>
                      <span>{batchAvail - item.qty} left</span>
                    </div>
                    {/* Qty controls + line total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.product.id, item.batch.id, -1)}
                          className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-sm font-bold w-7 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.product.id, item.batch.id, 1)}
                          disabled={item.qty >= batchAvail}
                          className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-600 disabled:opacity-30"
                        >
                          <Plus size={10} />
                        </button>
                        <span className="text-[10px] text-gray-400">× {fmt(item.product.b2cPrice)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{fmt(lc.lineTotal)}</p>
                        <p className="text-[10px] text-gray-400">GST {item.product.taxSlabPct}% incl.</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Bill footer ─────────────────────────────────────────────── */}
          <div className="border-t border-gray-100 px-4 py-3 space-y-3 flex-shrink-0">

            {/* Coupon */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs">
                  <Tag size={12} className="text-emerald-600" />
                  <span className="font-semibold text-emerald-800">{appliedCoupon.code}</span>
                  <span className="text-emerald-600">{appliedCoupon.description}</span>
                  <button onClick={() => setAppliedCoupon(null)} className="ml-auto text-emerald-400 hover:text-emerald-700">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={!couponInput.trim()}
                      className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-lg font-medium transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-500">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Loyalty redemption */}
            {wallet && currentPoints > 0 && (
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Gift size={13} className="text-purple-600" />
                  <div>
                    <p className="text-xs font-semibold text-purple-900">Redeem loyalty points</p>
                    <p className="text-[10px] text-purple-600">
                      {totals.redeemablePts.toLocaleString('en-IN')} pts available → saves {fmt(totals.redeemablePts / 10)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRedeemPoints(v => !v)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${redeemPoints ? 'bg-purple-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${redeemPoints ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            )}

            {/* Bill summary */}
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} items)</span>
                <span>{fmt(subtotalAmt)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>− {fmt(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>CGST</span>
                <span>{fmt(totals.totalCgst)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>SGST</span>
                <span>{fmt(totals.totalSgst)}</span>
              </div>
              {totals.redemptionAmt > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>Loyalty redemption ({totals.pointsToRedeem} pts)</span>
                  <span>− {fmt(totals.redemptionAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-sm border-t border-gray-100 pt-1.5 mt-1">
                <span>Grand Total</span>
                <span>{fmt(totals.grandTotal)}</span>
              </div>
              {wallet && totals.pointsToEarn > 0 && (
                <p className="text-[10px] text-emerald-600 text-right">
                  + {totals.pointsToEarn.toLocaleString('en-IN')} pts will be credited ({wallet.tier} {TIER_EARN_RATE[wallet.tier]}× rate)
                </p>
              )}
            </div>

            {/* Payment mode */}
            <div className="grid grid-cols-3 gap-1.5">
              {PAY_BTNS.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    paymentMode === mode
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* UPI / Credit ref field */}
            {(paymentMode === 'UPI' || paymentMode === 'Credit') && (
              <input
                value={paymentRef}
                onChange={e => setPaymentRef(e.target.value)}
                placeholder={paymentMode === 'UPI' ? 'UPI transaction ID' : 'Credit reference / ledger no.'}
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            )}

            {/* Complete sale */}
            <button
              onClick={() => setShowModal(true)}
              disabled={!canCheckout}
              className="w-full py-3 rounded-xl text-sm font-bold transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 text-white"
            >
              {canCheckout ? `Complete Sale · ${fmt(totals.grandTotal)}` : 'Add items & customer to proceed'}
            </button>

            {!hasValidCustomer && cart.length > 0 && (
              <p className="text-[10px] text-center text-amber-600">
                Select a farmer or enter walk-in customer details above
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h2 className="font-bold text-gray-900">Confirm Sale</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Customer */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-sm font-semibold text-gray-800">
                  {customerName ?? 'Walk-in Customer'}
                  {isWalkIn && <span className="ml-2 text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">Walk-in</span>}
                </p>
                {selectedFarmer && (
                  <p className="text-xs text-gray-500">{selectedFarmer.mobile} · {selectedFarmer.address.district}</p>
                )}
              </div>

              {/* Line items */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Items</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-1 font-medium">Product</th>
                      <th className="text-center pb-1 font-medium">Qty</th>
                      <th className="text-right pb-1 font-medium">Rate</th>
                      <th className="text-right pb-1 font-medium">GST</th>
                      <th className="text-right pb-1 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cart.map((item, i) => {
                      const lc = lineCalc[i];
                      return (
                        <tr key={`${item.product.id}-${item.batch.id}`}>
                          <td className="py-1.5 pr-2">
                            <p className="font-medium text-gray-800 leading-snug">{item.product.name}</p>
                            <p className="text-gray-400 font-mono text-[10px]">{item.batch.batchNo} · exp {item.batch.expiryDate}</p>
                          </td>
                          <td className="text-center py-1.5">{item.qty}</td>
                          <td className="text-right py-1.5">{fmt(item.product.b2cPrice)}</td>
                          <td className="text-right py-1.5 text-gray-500">{item.product.taxSlabPct}%</td>
                          <td className="text-right py-1.5 font-semibold text-gray-900">{fmt(lc.lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{fmt(subtotalAmt)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon ({appliedCoupon?.code})</span><span>− {fmt(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>CGST + SGST</span><span>{fmt(totals.totalGst)}</span>
                </div>
                {totals.redemptionAmt > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>Loyalty ({totals.pointsToRedeem} pts)</span><span>− {fmt(totals.redemptionAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-sm border-t border-gray-200 pt-1.5 mt-1">
                  <span>Grand Total</span><span>{fmt(totals.grandTotal)}</span>
                </div>
              </div>

              {/* Payment + points */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Payment: <strong className="text-gray-900">{paymentMode}</strong>
                  {paymentRef && <span className="ml-1 font-mono text-gray-400">{paymentRef}</span>}
                </span>
                {wallet && totals.pointsToEarn > 0 && (
                  <span className="text-emerald-600 font-semibold">
                    + {totals.pointsToEarn.toLocaleString('en-IN')} pts will be credited
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={completeSale}
                className="flex-[2] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
              >
                Confirm &amp; Record Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl max-w-sm">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-gray-400 hover:text-white ml-1">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
