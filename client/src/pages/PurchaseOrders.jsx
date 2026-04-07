import { purchaseOrders } from '../services/api';
import useFetch from '../hooks/useFetch';

const statusColors = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-600',
  shipped: 'bg-warning/10 text-warning',
  received: 'bg-success/10 text-success',
  partial: 'bg-secondary/10 text-secondary',
};

export default function PurchaseOrders() {
  const { data: orders, loading } = useFetch(() => purchaseOrders.list());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Purchase Orders</h1>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#6B6B6B]">Loading...</div>
      ) : orders?.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-[#6B6B6B]">No purchase orders yet</div>
          <p className="text-sm text-[#6B6B6B] mt-1">Purchase orders will appear here when created</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60 border-b border-border">
                <th className="text-left px-4 py-3 font-medium">PO #</th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Order Date</th>
                <th className="text-left px-4 py-3 font-medium">Expected</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Items</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((po, i) => (
                <tr key={po.id} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-cream/20'}`}>
                  <td className="px-4 py-3 font-mono">PO-{String(po.id).padStart(4, '0')}</td>
                  <td className="px-4 py-3">{po.vendor_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColors[po.status] || ''}`}>{po.status}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B]">{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-[#6B6B6B]">{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">{po.total_cost ? `$${Number(po.total_cost).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3 text-center font-mono">{po.item_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
