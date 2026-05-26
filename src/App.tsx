import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './modules/dashboard/DashboardPage';
import POSScreen from './modules/m03-pos/POSScreen';
import InventoryPage from './modules/m04-inventory/InventoryPage';
import ProductsPage from './modules/m02-catalogue/ProductsPage';
import FarmersPage from './modules/m05-farmers/FarmersPage';
import CouponsPage from './modules/m06-coupons/CouponsPage';
import FieldForcePage from './modules/m07-field-force/FieldForcePage';
import B2BOrdersPage from './modules/m08-b2b-orders/B2BOrdersPage';
import LoyaltyPage from './modules/m09-loyalty/LoyaltyPage';
import ReportsPage from './modules/m10-reports/ReportsPage';
import SettingsPage from './modules/m11-settings/SettingsPage';
import OperationsHeadDashboard from './modules/m12-analytics/OperationsHeadDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="pos" element={<POSScreen />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="farmers" element={<FarmersPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="field-force" element={<FieldForcePage />} />
            <Route path="b2b-orders" element={<B2BOrdersPage />} />
            <Route path="loyalty" element={<LoyaltyPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="analytics" element={<OperationsHeadDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
