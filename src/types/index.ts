import type { ComponentType } from 'react';
import type { UserRole } from './roles';
export type { UserRole } from './roles';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeName: string;
  storeCode: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: 'Fertiliser' | 'Pesticide' | 'Seed' | 'Micronutrient' | 'Equipment';
  brand: string;
  unit: string;
  mrp: number;
  sellingPrice: number;
  stock: number;
  reorderLevel: number;
  isActive: boolean;
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  cropTypes: string[];
  landAcres: number;
  loyaltyPoints: number;
  registeredOn: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  orderNo: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode: 'Cash' | 'UPI' | 'Credit' | 'BNPL';
  status: 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
  createdAt: string;
  storeCode: string;
  orderType: 'POS' | 'B2B';
}

export interface InventoryBatch {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  batchNo: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  receivedOn: string;
  supplierName: string;
  purchasePrice: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'Flat' | 'Percentage';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  applicableCategories: string[];
  isActive: boolean;
}

export interface FieldAgent {
  id: string;
  name: string;
  phone: string;
  employeeCode: string;
  territory: string;
  district: string;
  state: string;
  managerId: string;
  managerName: string;
  targetFarmers: number;
  visitedFarmers: number;
  salesMTD: number;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
}

export interface LoyaltyTransaction {
  id: string;
  farmerId: string;
  farmerName: string;
  type: 'Earned' | 'Redeemed' | 'Expired';
  points: number;
  orderId?: string;
  orderNo?: string;
  createdAt: string;
  remarks: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  roles: UserRole[] | null; // null = visible to all roles
}
