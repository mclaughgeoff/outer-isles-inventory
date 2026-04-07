import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/stock', label: 'Stock Management', icon: '🔄' },
  { to: '/menu', label: 'Menu Items', icon: '🍽️' },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: '📋' },
  { to: '/vendors', label: 'Vendors', icon: '🚚' },
  { to: '/csa', label: 'CSA Boxes', icon: '🥬' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <img src="/assets/outer-isles-logo-web.png" alt="Outer Isles" className="h-12 object-contain" />
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-[#6B6B6B] hover:bg-cream hover:text-[#2D2D2D]'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="text-sm font-medium text-[#2D2D2D]">{user?.name}</div>
        <div className="text-xs text-[#6B6B6B]">{user?.email}</div>
        <button onClick={logout} className="mt-2 text-xs text-danger hover:underline">
          Sign out
        </button>
      </div>
    </aside>
  );
}
