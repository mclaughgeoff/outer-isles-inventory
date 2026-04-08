import { Link } from 'react-router-dom';
import { dashboard } from '../services/api';
import useFetch from '../hooks/useFetch';
import { InventoryIcon, AlertIcon, OrdersIcon, CSAIcon } from '../components/Icons';

const statCards = [
  { key: 'active_items', label: 'Active Items', Icon: InventoryIcon, color: 'bg-primary/10 text-primary', to: '/inventory' },
  { key: 'low_stock_count', label: 'Low Stock Alerts', Icon: AlertIcon, color: 'bg-red-50 text-red-500', to: '/inventory?stock_filter=low', danger: true },
  { key: 'pending_purchase_orders', label: 'Pending POs', Icon: OrdersIcon, color: 'bg-amber-50 text-amber-500', to: '/purchase-orders' },
  { key: 'active_csa_members', label: 'CSA Members', Icon: CSAIcon, color: 'bg-blue-50 text-blue-500', to: '/csa' },
];

export default function Dashboard() {
  const { data: summary, loading: summaryLoading } = useFetch(() => dashboard.summary());
  const { data: lowStockItems, loading: lowLoading } = useFetch(() => dashboard.lowStock());
  const { data: movements, loading: movLoading } = useFetch(() => dashboard.recentMovements());

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your inventory and operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))
        ) : (
          statCards.map(({ key, label, Icon, color, to, danger }) => {
            const value = summary?.[key] ?? 0;
            return (
              <Link key={key} to={to} className="stat-card group hover:shadow-md hover:border-gray-300 transition-all">
                <div className={`stat-icon ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="stat-label">{label}</div>
                <div className={`stat-value ${danger && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {value}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Low Stock Alerts</h2>
            <Link to="/inventory" className="text-sm text-primary font-medium hover:underline">View all</Link>
          </div>
          {lowLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex justify-between items-center py-2">
                  <div><div className="h-4 bg-gray-100 rounded w-36 mb-1" /><div className="h-3 bg-gray-50 rounded w-24" /></div>
                  <div className="h-6 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : lowStockItems?.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
              </div>
              <p className="text-sm font-medium text-gray-900">All stocked up</p>
              <p className="text-xs text-gray-500 mt-0.5">No items below reorder point</p>
            </div>
          ) : (
            <div className="space-y-1">
              {lowStockItems?.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  to={`/inventory/${item.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
                      {item.item_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{item.brand} · {item.category_name}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className={`font-mono text-sm font-semibold ${item.qty_available <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {item.qty_available}
                    </span>
                    {item.qty_in_transit > 0 && (
                      <span className="badge-info text-2xs">+{item.qty_in_transit}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Recent Activity</h2>
            <Link to="/stock" className="text-sm text-primary font-medium hover:underline">View all</Link>
          </div>
          {movLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex justify-between py-2">
                  <div><div className="h-4 bg-gray-100 rounded w-36 mb-1" /><div className="h-3 bg-gray-50 rounded w-24" /></div>
                  <div className="h-5 bg-gray-100 rounded w-10" />
                </div>
              ))}
            </div>
          ) : movements?.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <p className="text-sm font-medium text-gray-900">No activity yet</p>
              <p className="text-xs text-gray-500 mt-0.5">Stock movements will appear here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {movements?.slice(0, 8).map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.item_name}</div>
                    <div className="text-xs text-gray-500">
                      <span className="capitalize">{m.movement_type}</span>
                      {m.from_location && ` · ${m.from_location} → ${m.to_location}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm font-semibold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                    <div className="text-2xs text-gray-400 mt-0.5">
                      {new Date(m.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
