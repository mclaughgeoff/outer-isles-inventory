import { Link } from 'react-router-dom';
import { dashboard } from '../services/api';
import useFetch from '../hooks/useFetch';

function StatCard({ label, value, color = 'primary', to }) {
  const colorClasses = {
    primary: 'border-l-primary',
    warning: 'border-l-warning',
    danger: 'border-l-danger',
    secondary: 'border-l-secondary',
    success: 'border-l-success',
  };
  const content = (
    <div className={`card border-l-4 ${colorClasses[color]}`}>
      <div className="text-sm text-[#6B6B6B] font-medium">{label}</div>
      <div className="text-3xl font-semibold mt-1 font-mono">{value ?? '—'}</div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const { data: summary, loading: summaryLoading } = useFetch(() => dashboard.summary());
  const { data: lowStockItems, loading: lowLoading } = useFetch(() => dashboard.lowStock());
  const { data: movements, loading: movLoading } = useFetch(() => dashboard.recentMovements());

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryLoading ? (
          <div className="col-span-4 text-center text-[#6B6B6B] py-8">Loading...</div>
        ) : (
          <>
            <StatCard label="Active Items" value={summary?.active_items} color="primary" to="/inventory" />
            <StatCard label="Low Stock Alerts" value={summary?.low_stock_count} color={summary?.low_stock_count > 0 ? 'danger' : 'success'} to="/inventory?has_stock=false" />
            <StatCard label="Pending POs" value={summary?.pending_purchase_orders} color="warning" to="/purchase-orders" />
            <StatCard label="CSA Members" value={summary?.active_csa_members} color="secondary" to="/csa" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Low Stock Alerts</h2>
          {lowLoading ? (
            <p className="text-[#6B6B6B]">Loading...</p>
          ) : lowStockItems?.length === 0 ? (
            <p className="text-[#6B6B6B] text-sm">All items are well stocked!</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {lowStockItems?.map((item) => (
                <Link
                  key={item.id}
                  to={`/inventory/${item.id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-cream transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium">{item.item_name}</div>
                    <div className="text-xs text-[#6B6B6B]">{item.brand} · {item.category_name}</div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm font-medium ${item.qty_available <= 0 ? 'text-danger' : 'text-warning'}`}>
                      {item.qty_available} avail
                    </span>
                    {item.qty_in_transit > 0 && (
                      <div className="text-xs text-blue-600">+{item.qty_in_transit} incoming</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Stock Movements</h2>
          {movLoading ? (
            <p className="text-[#6B6B6B]">Loading...</p>
          ) : movements?.length === 0 ? (
            <p className="text-[#6B6B6B] text-sm">No recent movements</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {movements?.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-border/50">
                  <div>
                    <div className="text-sm font-medium">{m.item_name}</div>
                    <div className="text-xs text-[#6B6B6B]">
                      {m.movement_type} · {m.from_location && `${m.from_location} → `}{m.to_location}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm font-medium ${m.quantity > 0 ? 'text-success' : 'text-danger'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </span>
                    <div className="text-xs text-[#6B6B6B]">
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
