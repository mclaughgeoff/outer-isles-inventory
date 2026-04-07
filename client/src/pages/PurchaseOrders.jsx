import { purchaseOrders } from '../services/api';
import useFetch from '../hooks/useFetch';
import { OrdersIcon } from '../components/Icons';

const statusBadge = {
  draft: 'badge-neutral',
  submitted: 'badge-info',
  shipped: 'badge-warning',
  received: 'badge-success',
  partial: 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/10',
};

export default function PurchaseOrders() {
  const { data: orders, loading } = useFetch(() => purchaseOrders.list());

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Track incoming inventory from vendors</p>
        </div>
      </div>

      {loading ? (
        <div className="table-wrapper"><table><thead><tr><th>PO #</th><th>Vendor</th><th>Status</th><th>Date</th><th>Total</th><th>Items</th></tr></thead>
          <tbody>{Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)}</tbody></table></div>
      ) : orders?.length === 0 ? (
        <div className="card empty-state">
          <OrdersIcon className="empty-icon mx-auto" />
          <h3>No purchase orders yet</h3>
          <p>Purchase orders will appear here when created. Use them to track incoming inventory from your vendors.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>PO #</th><th>Vendor</th><th>Status</th><th>Order Date</th><th>Expected</th><th className="text-right">Total</th><th className="text-center">Items</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((po) => (
                <tr key={po.id}>
                  <td className="font-mono font-medium">PO-{String(po.id).padStart(4, '0')}</td>
                  <td className="text-gray-700">{po.vendor_name || '—'}</td>
                  <td><span className={`badge ${statusBadge[po.status] || 'badge-neutral'}`}>{po.status}</span></td>
                  <td className="text-gray-500">{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</td>
                  <td className="text-gray-500">{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : '—'}</td>
                  <td className="text-right font-mono">{po.total_cost ? `$${Number(po.total_cost).toFixed(2)}` : '—'}</td>
                  <td className="text-center font-mono">{po.item_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
