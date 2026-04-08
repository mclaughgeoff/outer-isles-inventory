import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ItemDetail from './pages/ItemDetail';
import StockManagement from './pages/StockManagement';
import MenuItems from './pages/MenuItems';
import Vendors from './pages/Vendors';
import PurchaseOrders from './pages/PurchaseOrders';
import CSA from './pages/CSA';
import Integrations from './pages/Integrations';
import StockOverview from './pages/StockOverview';

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
      <Route path="/inventory/:id" element={<Layout><ItemDetail /></Layout>} />
      <Route path="/stock" element={<Layout><StockManagement /></Layout>} />
      <Route path="/stock-overview" element={<Layout><StockOverview /></Layout>} />
      <Route path="/menu" element={<Layout><MenuItems /></Layout>} />
      <Route path="/vendors" element={<Layout><Vendors /></Layout>} />
      <Route path="/purchase-orders" element={<Layout><PurchaseOrders /></Layout>} />
      <Route path="/csa" element={<Layout><CSA /></Layout>} />
      <Route path="/integrations" element={<Layout><Integrations /></Layout>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
