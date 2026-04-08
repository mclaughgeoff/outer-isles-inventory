import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  DashboardIcon, InventoryIcon, StockIcon, StockOverviewIcon, MenuIcon,
  OrdersIcon, VendorsIcon, CSAIcon, IntegrationsIcon, LogoutIcon,
} from './Icons';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', Icon: DashboardIcon },
    ],
  },
  {
    label: 'Products',
    items: [
      { to: '/inventory', label: 'Inventory', Icon: InventoryIcon },
      { to: '/stock-overview', label: 'Stock Overview', Icon: StockOverviewIcon },
      { to: '/stock', label: 'Stock Management', Icon: StockIcon },
      { to: '/menu', label: 'Menu Items', Icon: MenuIcon },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/purchase-orders', label: 'Purchase Orders', Icon: OrdersIcon },
      { to: '/vendors', label: 'Vendors', Icon: VendorsIcon },
      { to: '/csa', label: 'CSA Boxes', Icon: CSAIcon },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/integrations', label: 'Integrations', Icon: IntegrationsIcon },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <img src="/assets/outer-isles-logo-web.png" alt="Outer Isles" className="h-10 object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, Icon }) => {
                const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                    {label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
