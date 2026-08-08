import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/layouts/MainLayout';
import { Suspense, lazy } from 'react';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const CustomersList = lazy(() => import('@/pages/customers/CustomersList'));
const CustomerDetail = lazy(() => import('@/pages/customers/CustomerDetail'));
const FollowUpsList = lazy(() => import('@/pages/followups/FollowUpsList'));
const ProductsList = lazy(() => import('@/pages/products/ProductsList'));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'));
const StockMovements = lazy(() => import('@/pages/inventory/StockMovements'));
const ChallansList = lazy(() => import('@/pages/challans/ChallansList'));
const CreateChallan = lazy(() => import('@/pages/challans/CreateChallan'));
const ChallanDetail = lazy(() => import('@/pages/challans/ChallanDetail'));
const ReturnsList = lazy(() => import('@/pages/returns/ReturnsList'));
const InvoicesList = lazy(() => import('@/pages/invoices/InvoicesList'));
const InvoiceDetail = lazy(() => import('@/pages/invoices/InvoiceDetail'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const CopilotPage = lazy(() => import('@/pages/ai/CopilotPage'));
const UsersList = lazy(() => import('@/pages/admin/UsersList'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-graphite text-sm">Loading...</div>
    </div>
  );
}

function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function AdminRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomersList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/followups" element={<FollowUpsList />} />
          <Route path="/products" element={<ProductsList />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/movements" element={<StockMovements />} />
          <Route path="/challans" element={<ChallansList />} />
          <Route path="/challans/new" element={<CreateChallan />} />
          <Route path="/challans/:id" element={<ChallanDetail />} />
          <Route path="/returns" element={<ReturnsList />} />
          <Route path="/invoices" element={<InvoicesList />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/copilot" element={<CopilotPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<UsersList />} />
            <Route path="/admin/audit" element={<AuditLogsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
