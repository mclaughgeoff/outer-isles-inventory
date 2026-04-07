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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-[#6B6B6B]">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-[#6B6B6B]">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/inventory/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
      <Route path="/menu" element={<ProtectedRoute><MenuItems /></ProtectedRoute>} />
      <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
      <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
      <Route path="/csa" element={<ProtectedRoute><CSA /></ProtectedRoute>} />
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
