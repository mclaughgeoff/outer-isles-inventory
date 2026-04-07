import { vendors } from '../services/api';
import useFetch from '../hooks/useFetch';
import { VendorsIcon } from '../components/Icons';

export default function Vendors() {
  const { data: vendorList, loading } = useFetch(() => vendors.list());

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Vendors</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your suppliers and distributors</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse"><div className="h-5 bg-gray-100 rounded w-32 mb-3" /><div className="space-y-2">{Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-4 bg-gray-50 rounded" />)}</div></div>
          ))}
        </div>
      ) : vendorList?.length === 0 ? (
        <div className="card empty-state">
          <VendorsIcon className="empty-icon mx-auto" />
          <h3>No vendors yet</h3>
          <p>Vendors will appear here as items are imported.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendorList?.map(v => (
            <div key={v.id} className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <VendorsIcon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-semibold text-gray-900">{v.name}</h2>
                </div>
              </div>
              <div className="space-y-2.5 text-sm">
                {v.delivery_minimum && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery min.</span>
                    <span className="font-mono font-medium">${Number(v.delivery_minimum).toFixed(2)}</span>
                  </div>
                )}
                {v.shipping_policy && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-gray-700">{v.shipping_policy}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Items supplied</span>
                  <span className="badge-neutral">{v.item_count} items</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
