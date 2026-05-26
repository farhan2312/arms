import { useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, UserCheck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { mockProducts } from '../../data/mockProducts';
import { mockProductStock } from '../../data/mockBatches';
import { mockFarmers } from '../../data/mockFarmers';
import { walletByFarmerId } from '../../data/mockLoyaltyWallets';
import type { Product } from '../../types/entities';
import type { Farmer } from '../../types/entities';

interface CartItem {
  product: Product;
  qty: number;
}

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Credit', 'BNPL'] as const;

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [couponCode, setCouponCode] = useState('');

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const filteredFarmers = mockFarmers.filter(
    (f) =>
      f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.mobile.includes(farmerSearch),
  );

  const addToCart = (product: Product) => {
    const available = mockProductStock[product.id] ?? 0;
    if (available === 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.product.id === productId ? { ...c, qty: Math.max(0, c.qty + delta) } : c)
        .filter((c) => c.qty > 0),
    );
  };

  const subtotal = cart.reduce((sum, c) => sum + c.product.b2cPrice * c.qty, 0);
  const discount = 0;
  const total = subtotal - discount;

  return (
    <div className="p-6 h-full">
      <PageHeader title="Point of Sale" subtitle="Retail billing for walk-in farmers" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-10rem)]">
        {/* Product grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Farmer selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Farmer</p>
            <div className="relative">
              <UserCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                placeholder="Search by name or mobile..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            {farmerSearch && !selectedFarmer && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                {filteredFarmers.map((f) => {
                  const wallet = walletByFarmerId.get(f.id);
                  const village = f.address.village ?? f.address.district;
                  return (
                    <button
                      key={f.id}
                      onClick={() => { setSelectedFarmer(f); setFarmerSearch(f.name); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-xs">{f.name}</p>
                        <p className="text-gray-400 text-[11px]">{f.mobile} · {village}, {f.address.district}</p>
                      </div>
                      <span className="ml-auto text-[11px] text-emerald-600 font-semibold">
                        {wallet ? `${wallet.currentPoints} pts` : 'No wallet'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedFarmer && (
              <div className="mt-2 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <UserCheck size={15} className="text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-800">{selectedFarmer.name}</p>
                  <p className="text-[11px] text-emerald-600">
                    {selectedFarmer.address.village ?? selectedFarmer.address.district}, {selectedFarmer.address.district}
                    {' · '}
                    {walletByFarmerId.get(selectedFarmer.id)?.currentPoints ?? 0} loyalty pts
                    {' · '}
                    {walletByFarmerId.get(selectedFarmer.id)?.tier ?? 'Green'}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedFarmer(null); setFarmerSearch(''); }}
                  className="text-emerald-600 hover:text-emerald-800 text-xs"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          {/* Product search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>

          {/* Products */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">
            {filteredProducts.map((p) => {
              const stock = mockProductStock[p.id] ?? 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={stock === 0}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-emerald-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{p.name}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.sku} · {p.packSize}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">₹{p.b2cPrice}</p>
                      {p.b2cPrice < p.mrp && (
                        <p className="text-[11px] text-gray-400 line-through">₹{p.mrp}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-[11px] font-medium ${stock <= p.reorderLevel ? 'text-red-500' : 'text-gray-500'}`}>
                        {stock} {p.unit}s
                      </p>
                      <p className="text-[10px] text-gray-400">{p.brand}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <ShoppingCart size={16} className="text-gray-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Cart</h2>
            <span className="ml-auto text-xs text-gray-400">{cart.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                <ShoppingCart size={32} className="mb-2 text-gray-200" />
                Add products to bill
              </div>
            )}
            {cart.map(({ product, qty }) => (
              <div key={product.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-medium text-gray-800 leading-tight">{product.name}</p>
                  <button
                    onClick={() => setCart((prev) => prev.filter((c) => c.product.id !== product.id))}
                    className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(product.id, -1)}
                      className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{qty}</span>
                    <button
                      onClick={() => updateQty(product.id, 1)}
                      className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    ₹{(product.b2cPrice * qty).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            {/* Coupon */}
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                Apply
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span className="text-green-600">- ₹{discount}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment mode */}
            <div className="grid grid-cols-5 gap-1">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                    paymentMode === mode
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              disabled={cart.length === 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Confirm Bill · ₹{total.toLocaleString('en-IN')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
