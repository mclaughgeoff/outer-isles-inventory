import { vendors } from '../services/api';
import useFetch from '../hooks/useFetch';

export default function Vendors() {
  const { data: vendorList, loading } = useFetch(() => vendors.list());

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Vendors</h1>
      {loading ? (
        <div className="text-center py-8 text-[#6B6B6B]">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendorList?.map(v => (
            <div key={v.id} className="card">
              <h2 className="text-lg font-semibold">{v.name}</h2>
              <div className="mt-3 space-y-2 text-sm">
                {v.delivery_minimum && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Delivery Minimum</span>
                    <span className="font-mono">${Number(v.delivery_minimum).toFixed(2)}</span>
                  </div>
                )}
                {v.shipping_policy && (
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Shipping</span>
                    <span>{v.shipping_policy}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">Items Supplied</span>
                  <span className="font-mono">{v.item_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
