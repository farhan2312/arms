// CampaignForm — slide-over for creating a new coupon campaign

import { useState } from 'react';
import { X } from 'lucide-react';
import { mockProducts } from '../../data/mockProducts';
import { mockStores } from '../../data/mockStores';
import type { CouponCampaign, DiscountType } from '../../data/mockCouponCampaigns';

const TODAY = '2026-05-27';

interface Props {
  campaignCount: number;
  onSave: (campaign: CouponCampaign) => void;
  onClose: () => void;
}

export default function CampaignForm({ campaignCount, onSave, onClose }: Props) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate]     = useState(TODAY);
  const [endDate, setEndDate]         = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('Flat');
  const [discountValue, setDiscountValue]   = useState('');
  const [maxDiscountAmt, setMaxDiscountAmt] = useState('');
  const [minPurchaseValue, setMinPurchaseValue] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedStoreIds, setSelectedStoreIds]     = useState<string[]>([]);
  const [autoEnrollGoldPlatinum, setAutoEnrollGoldPlatinum] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Campaign name is required';
    if (!startDate)   errs.startDate = 'Start date is required';
    if (!endDate)     errs.endDate = 'End date is required';
    else if (endDate <= startDate) errs.endDate = 'End date must be after start date';
    if (discountType !== 'FreeProduct') {
      if (!discountValue || Number(discountValue) <= 0)
        errs.discountValue = 'Discount value must be > 0';
    }
    if (!minPurchaseValue || Number(minPurchaseValue) < 0)
      errs.minPurchaseValue = 'Min purchase value is required';
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const campaign: CouponCampaign = {
      id: `camp-${String(campaignCount + 1).padStart(3, '0')}`,
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      discountType,
      discountValue: discountType === 'FreeProduct' ? 0 : Number(discountValue),
      ...(discountType === 'Percentage' && maxDiscountAmt
        ? { maxDiscountAmt: Number(maxDiscountAmt) }
        : {}),
      minPurchaseValue: Number(minPurchaseValue),
      applicableProductIds: selectedProductIds,
      applicableStoreIds: selectedStoreIds,
      autoEnrollGoldPlatinum,
      createdAt: new Date().toISOString(),
    };
    console.log('// POST /api/coupon-campaigns', campaign);
    onSave(campaign);
  }

  function toggleProduct(id: string) {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function toggleStore(id: string) {
    setSelectedStoreIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function inputCls(field: string) {
    return `w-full border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
      errors[field] ? 'border-red-300' : 'border-gray-300'
    }`;
  }

  const DISCOUNT_TYPES: DiscountType[] = ['Flat', 'Percentage', 'FreeProduct'];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Slide-over */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Create Campaign</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls('name')}
              placeholder="e.g. Kharif 2026 Fertiliser Push"
            />
            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Short description for internal reference"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={inputCls('startDate')}
              />
              {errors.startDate && <p className="text-[11px] text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={inputCls('endDate')}
              />
              {errors.endDate && <p className="text-[11px] text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {DISCOUNT_TYPES.map(dt => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDiscountType(dt)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                    discountType === dt
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {dt === 'FreeProduct' ? 'Free Product' : dt}
                </button>
              ))}
            </div>
          </div>

          {/* Discount Value */}
          {discountType !== 'FreeProduct' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {discountType === 'Flat' ? 'Amount (₹)' : 'Percentage (%)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  className={inputCls('discountValue')}
                  placeholder={discountType === 'Flat' ? '200' : '10'}
                />
                {errors.discountValue && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.discountValue}</p>
                )}
              </div>
              {discountType === 'Percentage' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscountAmt}
                    onChange={e => setMaxDiscountAmt(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Min Purchase Value */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Min Purchase Value (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={minPurchaseValue}
              onChange={e => setMinPurchaseValue(e.target.value)}
              className={inputCls('minPurchaseValue')}
              placeholder="1500"
            />
            {errors.minPurchaseValue && (
              <p className="text-[11px] text-red-500 mt-1">{errors.minPurchaseValue}</p>
            )}
          </div>

          {/* Applicable Products */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Applicable Products
              <span className="ml-1 text-gray-400 font-normal text-[11px]">(blank = all products)</span>
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {mockProducts.filter(p => p.isActive).map(p => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-700 flex-1 truncate">{p.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{p.category}</span>
                </label>
              ))}
            </div>
            {selectedProductIds.length > 0 && (
              <p className="text-[11px] text-emerald-600 mt-1">
                {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Applicable Stores */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Applicable Stores
              <span className="ml-1 text-gray-400 font-normal text-[11px]">(blank = all stores)</span>
            </label>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {mockStores.map(s => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStoreIds.includes(s.id)}
                    onChange={() => toggleStore(s.id)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-700">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Auto-enroll */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <input
              type="checkbox"
              id="autoEnroll"
              checked={autoEnrollGoldPlatinum}
              onChange={e => setAutoEnrollGoldPlatinum(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="autoEnroll" className="text-xs text-amber-800 cursor-pointer">
              <span className="font-semibold">Auto-enroll Gold & Platinum farmers</span>
              <span className="block text-amber-600 mt-0.5">
                Coupons will be automatically issued to eligible Gold and Platinum tier farmers
                when the campaign starts.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </>
  );
}
