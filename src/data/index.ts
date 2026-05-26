// MOCK DATA LAYER — swap these imports for API calls when PostgreSQL backend is ready

export { MOCK_USERS, userById } from './mockUsers';
export { mockStores, storeById } from './mockStores';
export { mockProducts, productById } from './mockProducts';
export { mockBatches, batchById, nearExpiryBatches, mockProductStock } from './mockBatches';
export { mockFarmers, farmerById } from './mockFarmers';
export { mockLoyaltyWallets, walletById, walletByFarmerId } from './mockLoyaltyWallets';
export { mockRetailers, retailerById } from './mockRetailers';
export { mockB2BOrders, b2bOrderById } from './mockB2BOrders';
export { mockSaleTransactions, saleTransactionById } from './mockSaleTransactions';

import { MOCK_USERS } from './mockUsers';
import { mockStores } from './mockStores';
import { mockProducts } from './mockProducts';
import { mockBatches, mockProductStock } from './mockBatches';
import { mockFarmers } from './mockFarmers';
import { mockLoyaltyWallets } from './mockLoyaltyWallets';
import { mockRetailers } from './mockRetailers';
import { mockB2BOrders } from './mockB2BOrders';
import { mockSaleTransactions } from './mockSaleTransactions';

/**
 * Aggregated mock database object.
 * Replace individual property accessors with API calls as each endpoint is built.
 */
export const mockDB = {
  users: MOCK_USERS,
  stores: mockStores,
  products: mockProducts,
  productStock: mockProductStock,
  batches: mockBatches,
  farmers: mockFarmers,
  loyaltyWallets: mockLoyaltyWallets,
  retailers: mockRetailers,
  b2bOrders: mockB2BOrders,
  saleTransactions: mockSaleTransactions,
} as const;
