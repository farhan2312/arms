import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './modules/login/LoginPage';
import NotFound from './components/NotFound';
import DashboardPage from './modules/dashboard/DashboardPage';
import POSScreen from './modules/m03-pos/POSScreen';
import InventoryPage from './modules/m04-inventory/InventoryPage';
import ProductsPage from './modules/m02-catalogue/ProductsPage';
import CRMPage from './modules/m06-crm/CRMPage';
import CouponsPage from './modules/m06-coupons/CouponsPage';
import FieldForcePage from './modules/m07-field-force/FieldForcePage';
import B2BOrderList from './modules/m13-b2b/B2BOrderList';
import B2BOrderForm from './modules/m13-b2b/B2BOrderForm';
import LoyaltyDashboard from './modules/m14-loyalty/LoyaltyDashboard';
import FarmerWalletView from './modules/m14-loyalty/FarmerWalletView';
import TierManagementPanel from './modules/m14-loyalty/TierManagementPanel';
import ReportsPage from './modules/m10-reports/ReportsPage';
import SettingsPage from './modules/m11-settings/SettingsPage';
import OperationsHeadDashboard from './modules/m12-analytics/OperationsHeadDashboard';
import BookkeepingPage from './modules/m09-bookkeeping/BookkeepingPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public — no shell */}
          <Route path="/login" element={<LoginPage />} />

          {/* App shell — sidebar + topbar */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />

            {/* Store Ops */}
            <Route path="pos"             element={<POSScreen />} />
            <Route path="inventory"       element={<InventoryPage />} />
            <Route path="farmers"         element={<CRMPage />} />
            <Route path="coupons"         element={<CouponsPage />} />
            <Route path="bookkeeping"     element={<BookkeepingPage />} />

            {/* Catalogue */}
            <Route path="products"        element={<ProductsPage />} />

            {/* Field Force */}
            <Route path="field-force"     element={<FieldForcePage />} />

            {/* B2B */}
            <Route path="b2b-orders"      element={<B2BOrderList />} />
            <Route path="b2b-new"         element={<B2BOrderForm />} />

            {/* Loyalty */}
            <Route path="loyalty"         element={<LoyaltyDashboard />} />
            <Route path="wallet-lookup"   element={<FarmerWalletView />} />
            <Route path="tier-management" element={<TierManagementPanel />} />

            {/* Reports & Analytics */}
            <Route path="reports"         element={<ReportsPage />} />
            <Route path="analytics"       element={<OperationsHeadDashboard />} />

            {/* Admin */}
            <Route path="settings"        element={<SettingsPage />} />

            {/* Catch-all: coming-soon stubs + true 404 */}
            <Route path="*"               element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
